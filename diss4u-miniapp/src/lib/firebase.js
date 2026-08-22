/* Firebase 초기화. 웹과 같은 프로젝트를 그대로 쓴다 — Firestore 스키마·보안 규칙 무변경. */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config.js';

export const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);
