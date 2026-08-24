import coupang from './coupang.js';
import smartstore from './smartstore.js';
import elevenst from './elevenst.js';
import cafe24 from './cafe24.js';
import esm from './esm.js';
import toss from './toss.js';

/** 연동 가능한 채널. API 직연동이 막힌 채널(카카오쇼핑·알리·SSG·NS)은 여기 없다 — README 참고. */
export const adapters = [coupang, smartstore, elevenst, cafe24, esm, toss];

export const byName = Object.fromEntries(adapters.map((a) => [a.channel, a]));
