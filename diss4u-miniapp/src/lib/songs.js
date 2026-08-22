/*
 * 곡 저장·조회 (Firestore).
 *
 * 컬렉션과 필드는 웹과 완전히 동일하다. 스키마도 보안 규칙도 바꾸지 않는 게 이식의
 * 전제라서, 필드를 추가하거나 이름을 바꾸지 않았다.
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { getUser } from './auth.js';

const PAGE_SIZE = 100;
const CACHE_TTL = 30_000;

let cache = { uid: null, at: 0, data: null };

export function invalidateCache() {
  cache = { uid: null, at: 0, data: null };
}

export async function save(song) {
  const user = getUser();
  if (!user) return null;
  try {
    const ref = await addDoc(collection(db, 'songs'), {
      uid: user.uid,
      title: song.title || '',
      lyrics: song.lyrics || '',
      name: song.name || '',
      relationship: song.relationship || '',
      keywords: song.keywords || '',
      mustInclude: song.mustInclude || '',
      genre: song.genre || '',
      gender: song.gender || '',
      lang: song.lang || '',
      audioUrl: song.audioUrl || '',
      // kie 단어별 타임스탬프. 미니앱에서는 아직 안 쓰지만 웹과 데이터를 맞춰 저장한다.
      timestampedLyrics: song.timestampedLyrics || null,
      createdAt: serverTimestamp(),
    });
    invalidateCache();
    return ref.id;
  } catch {
    // 저장 실패가 곡 재생을 막지는 않는다. 결과 화면은 그대로 보여준다.
    return null;
  }
}

export async function listMine({ force = false } = {}) {
  const user = getUser();
  if (!user) return [];

  const fresh = cache.uid === user.uid && Date.now() - cache.at < CACHE_TTL && cache.data;
  if (fresh && !force) return cache.data;

  const q = query(
    collection(db, 'songs'),
    where('uid', '==', user.uid),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE),
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      // serverTimestamp 는 쓰기 직후 null 로 읽힐 수 있다. 호출부가 늘 Date 를 보게 맞춘다.
      createdAt: data.createdAt?.toDate?.() ?? null,
    };
  });

  cache = { uid: user.uid, at: Date.now(), data: rows };
  return rows;
}
