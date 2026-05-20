// =====================================================================
// veil.js - 위장 시스템 (메시지 ↔ 계산식 변환)
// ---------------------------------------------------------------------
// 책임: 채팅 메시지를 "계산식 시리즈"로 위장.
//   - 같은 메시지는 항상 같은 계산식으로 (결정성 → 새로고침/재진입 일관)
//   - 채팅방별 진행 상태(currentSeriesId, currentStepIndex) 관리
//   - 시리즈 끝나면 다음 시리즈로 자동 전환 (직전 중복 방지)
//   - 매핑은 사용자 디바이스 로컬에만 저장 (store.js)
//
// 핵심: 위장은 "사용자별 + 채팅방별" 로컬 상태. 상대방과 다른 위장을 봐도 무관.
// =====================================================================

import * as store from "./store.js";
import { getSeriesList, getSeriesById } from "./series-pool.js";

export class Veil {
  constructor(styleId) {
    this.styleId = styleId || "office";
    // roomId → { map: { messageId: {seriesId, step} }, cursor: {seriesId, step}, used: {seriesId:true} }
    this.rooms = {};
  }

  async loadRoom(roomId) {
    if (this.rooms[roomId]) return;
    const saved = await store.get(`veil.${this.styleId}.${roomId}`, null);
    this.rooms[roomId] = saved || { map: {}, cursor: null, used: {} };
  }

  async _persist(roomId) {
    await store.set(`veil.${this.styleId}.${roomId}`, this.rooms[roomId]);
  }

  // 메시지ID에 위장 계산식 할당(없으면 새로) → 계산식 문자열 반환
  async disguise(roomId, messageId) {
    await this.loadRoom(roomId);
    const room = this.rooms[roomId];

    if (room.map[messageId]) {
      const { seriesId, step } = room.map[messageId];
      return this._stepText(seriesId, step);
    }

    const next = this._advanceCursor(room);
    room.map[messageId] = next;
    room.cursor = next;
    room.used[next.seriesId] = true;
    await this._persist(roomId);
    return this._stepText(next.seriesId, next.step);
  }

  // 다음 (seriesId, step) 계산. 시리즈 끝나면 새 시리즈로 전환.
  _advanceCursor(room) {
    const list = getSeriesList(this.styleId);
    if (!room.cursor) {
      const first = this._pickSeries(room, null);
      return { seriesId: first.id, step: 0 };
    }
    const cur = getSeriesById(this.styleId, room.cursor.seriesId);
    const nextStep = room.cursor.step + 1;
    if (cur && nextStep < cur.steps.length) {
      return { seriesId: cur.id, step: nextStep };
    }
    // 시리즈 소진 → 새 시리즈
    const picked = this._pickSeries(room, room.cursor.seriesId);
    return { seriesId: picked.id, step: 0 };
  }

  // 직전 시리즈가 아닌 시리즈를 고름. 다 썼으면 used 초기화(직전만 회피).
  _pickSeries(room, avoidId) {
    const list = getSeriesList(this.styleId);
    let candidates = list.filter((s) => !room.used[s.id] && s.id !== avoidId);
    if (candidates.length === 0) {
      room.used = {};
      candidates = list.filter((s) => s.id !== avoidId);
      if (candidates.length === 0) candidates = list;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  _stepText(seriesId, step) {
    const s = getSeriesById(this.styleId, seriesId);
    if (!s || !s.steps[step]) return "0 = 0";
    return s.steps[step];
  }

  // 스타일 변경 시 호출 (개인 단위 설정)
  setStyle(styleId) { this.styleId = styleId; this.rooms = {}; }
}
