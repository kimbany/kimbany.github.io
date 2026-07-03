// Firebase 클라이언트 설정 템플릿.
//
// 사용법:
//   1. 이 파일을 같은 폴더에 `firebase-config.js` 로 복사
//   2. Firebase Console > 프로젝트 설정 > 내 앱 > SDK 설정에서 값 복사
//   3. firebase-config.js 는 .gitignore 에 있어 커밋되지 않음
//
// 이 값들은 비밀이 아니며(클라이언트에 노출되어도 됨) Firestore 보안 규칙으로
// 보호됩니다. 다만 레포에 박아두지 않으려고 분리했습니다.

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "deskmemo.firebaseapp.com",
  projectId: "deskmemo",
  storageBucket: "deskmemo.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
