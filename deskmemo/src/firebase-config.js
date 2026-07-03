// Firebase 클라이언트 설정 (deskmemo-b4274).
//
// 이 값들은 비밀이 아니며 웹앱에선 어차피 브라우저에 공개됩니다. 실제 보안은
// Firestore 보안 규칙(로그인한 본인만 접근)이 담당합니다. 웹(GitHub Pages)
// 배포를 위해 의도적으로 커밋합니다.
//
// analytics(measurementId)는 사용하지 않습니다. (CLAUDE.md §10: 불필요한
// 백그라운드 트래픽 금지) — initializeApp 만 하고 getAnalytics 는 호출 안 함.

export const firebaseConfig = {
  apiKey: "AIzaSyAz1zA0MWFAKKlQvZlf2s4L-h2yGItaF2w",
  authDomain: "deskmemo-b4274.firebaseapp.com",
  projectId: "deskmemo-b4274",
  storageBucket: "deskmemo-b4274.firebasestorage.app",
  messagingSenderId: "1070940954440",
  appId: "1:1070940954440:web:1078b327569b7940689d7d",
  measurementId: "G-MZHNB7KW99",
};
