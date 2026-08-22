/*
 * 파일 저장.
 *
 * 웹은 <a download> 로 MP3 를 내려받게 했는데 토스 웹뷰에서는 동작하지 않는다.
 * File.saveBase64 로 기기에 직접 저장한다.
 *
 * 음원은 원격 URL(kie/Apiframe)로 오므로 한 번 받아서 base64 로 바꿔 넘긴다.
 * 곡 하나가 수 MB 라 메모리에 통째로 올린다는 점은 감수한다 — 번들에 넣는 게 아니라
 * 런타임에 잠깐 들고 있는 것이라 100MB 번들 제한과는 무관하다.
 */

import { File } from '@apps-in-toss/web-framework';

export function isSupported() {
  try {
    return typeof File?.saveBase64?.isSupported === 'function' && File.saveBase64.isSupported();
  } catch {
    return false;
  }
}

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요.'));
    reader.onload = () => {
      const result = String(reader.result || '');
      // data:audio/mpeg;base64,XXXX → XXXX
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

/** 원격 URL 의 파일을 기기에 저장한다. */
export async function saveFromUrl(url, fileName, mimeType) {
  if (!isSupported()) throw new Error('이 버전의 토스 앱에서는 저장을 지원하지 않아요.');

  const res = await fetch(url);
  if (!res.ok) throw new Error('음원을 받아오지 못했어요.');
  const blob = await res.blob();
  const data = await toBase64(blob);

  await File.saveBase64({
    data,
    fileName,
    mimeType: mimeType || blob.type || 'application/octet-stream',
  });
}

/** 곡 제목을 파일명으로 쓸 수 있게 다듬는다. */
export function safeFileName(title, ext) {
  const base = String(title || 'diss4u')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .slice(0, 60) || 'diss4u';
  return `${base}.${ext}`;
}
