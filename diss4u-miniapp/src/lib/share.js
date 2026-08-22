/*
 * 공유.
 *
 * 웹은 Kakao SDK 로 공유했다. 미니앱에서는 Share API 를 쓴다.
 * 주의: Share.sendMessage 는 { message: string } 만 받는다. 인스타·틱톡·유튜브를
 * 각각 겨냥하는 API 는 없고, 네이티브 공유 시트가 뜬 뒤 사용자가 앱을 고른다.
 *
 * getTossShareLink() 는 SDK 3.0.2 에서 deprecated 라 Share.createLink 를 쓴다.
 * path 는 intoss:// 로 시작하는 딥링크여야 한다.
 */

import { Share } from '@apps-in-toss/web-framework';

export function isSupported() {
  return typeof Share?.sendMessage === 'function';
}

/**
 * 곡 하나를 여는 딥링크를 만든다. 실패하면 null — 호출부는 링크 없이 공유한다.
 */
export async function songLink(songId) {
  if (typeof Share?.createLink !== 'function') return null;
  try {
    return await Share.createLink({ path: `intoss://diss4u/song/${encodeURIComponent(songId)}` });
  } catch {
    return null;
  }
}

/**
 * 초대 링크를 만든다. 실패하면 null — 호출부는 코드만 공유한다.
 * 이 링크로 들어오면 lib/deeplink.js 가 ref 를 읽어 /claim-referral 로 보낸다.
 */
export async function inviteLink(refCode) {
  if (typeof Share?.createLink !== 'function' || !refCode) return null;
  try {
    return await Share.createLink({
      path: `intoss://diss4u?ref=${encodeURIComponent(refCode)}`,
    });
  } catch {
    return null;
  }
}

/**
 * 네이티브 공유 시트를 연다.
 * @returns {Promise<boolean>} 시트를 띄웠으면 true
 */
export async function sendMessage(text) {
  if (!isSupported()) return false;
  try {
    await Share.sendMessage({ message: text });
    return true;
  } catch {
    return false;
  }
}

/** 곡 제목 + 딥링크로 공유 문구를 만들어 공유 시트를 연다. */
export async function shareSong(song) {
  const link = song?.id ? await songLink(song.id) : null;
  const title = song?.title || '친놀송으로 만든 노래';
  const text = link ? `${title}\n${link}` : title;
  return sendMessage(text);
}
