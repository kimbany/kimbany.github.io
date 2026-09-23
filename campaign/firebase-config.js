// ============================================================
// 파이어베이스 설정 (dajoeuna-survey 프로젝트 재사용)
// 콘솔 → 설정 ⚙️ → 일반 → 내 앱 에서 확인할 수 있어요.
// ============================================================
window.firebaseConfig = {
  apiKey: "AIzaSyApn5AZnWQlbsBzCaZ8WR3bsYPsxbUMofk",
  authDomain: "dajoeuna-survey.firebaseapp.com",
  projectId: "dajoeuna-survey",
  storageBucket: "dajoeuna-survey.firebasestorage.app",
  messagingSenderId: "913326329728",
  appId: "1:913326329728:web:cda1f25d912f1a4644bb65"
};

// ============================================================
// 관리자 계정 이메일 — 여기에 적힌 계정만 관리자 페이지에 들어갈 수 있어요.
// 관리자를 추가하려면 아래 목록에 이메일을 넣고,
// SETUP.md의 보안 규칙에도 똑같이 넣어 주세요. (둘 다 바꿔야 해요)
// ============================================================
window.ADMIN_EMAILS = [
  "dajoeuna.official@gmail.com"
];

// 사이트 이름 (상단에 표시돼요)
window.SITE_NAME = "몽프루이 체험단";
