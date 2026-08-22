import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { decryptField } from '../server-patch/toss-auth.js';

/*
 * 토스 실서버 없이 복호화 구현을 검증한다.
 *
 * 확인하려는 것은 세 가지다.
 *   - 암호문 레이아웃을 맞게 잘라내는가: base64( IV(12B) || ciphertext || tag(16B) )
 *   - AAD 'TOSS' 를 붙여서 인증하는가
 *   - 변조된 암호문을 조용히 통과시키지 않는가
 */

const AAD = 'TOSS';

/** 토스가 만드는 것과 같은 형식으로 암호문을 만든다. */
function encrypt(plain, key, aad) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, body, cipher.getAuthTag()]).toString('base64');
}

const key = crypto.randomBytes(32);
const keyBase64 = key.toString('base64');

test('AAD 를 붙인 암호문을 복호화한다', () => {
  for (const plain of ['gimbany@gmail.com', '김바니', 'a', '한글 English 123 !@#']) {
    assert.equal(decryptField(encrypt(plain, key, AAD), keyBase64, AAD), plain);
  }
});

test('AAD 가 틀리면 실패한다 — 조용히 통과하면 안 된다', () => {
  const encrypted = encrypt('gimbany@gmail.com', key, AAD);
  assert.throws(() => decryptField(encrypted, keyBase64, 'WRONG'));
  assert.throws(() => decryptField(encrypted, keyBase64, null));
});

test('키가 틀리면 실패한다', () => {
  const encrypted = encrypt('gimbany@gmail.com', key, AAD);
  const otherKey = crypto.randomBytes(32).toString('base64');
  assert.throws(() => decryptField(encrypted, otherKey, AAD));
});

test('변조된 암호문은 실패한다', () => {
  const raw = Buffer.from(encrypt('gimbany@gmail.com', key, AAD), 'base64');
  raw[20] ^= 0xff; // 본문 한 바이트 뒤집기
  assert.throws(() => decryptField(raw.toString('base64'), keyBase64, AAD));
});

test('빈 값과 너무 짧은 암호문을 안전하게 처리한다', () => {
  assert.equal(decryptField(null, keyBase64, AAD), null);
  assert.equal(decryptField('', keyBase64, AAD), null);
  assert.throws(
    () => decryptField(Buffer.alloc(10).toString('base64'), keyBase64, AAD),
    /너무 짧아요/,
  );
});
