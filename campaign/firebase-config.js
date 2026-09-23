// ============================================================
// 파이어베이스 설정 (dajoeuna-survey 프로젝트)
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
// 관리자 로그인 (핀번호)
//
//  · 처음 핀번호는 1021 이에요.
//    관리자 페이지 → 설정 에서 언제든지 바꿀 수 있어요.
//
//  · 아래 주소는 실제로 메일을 보내는 주소가 아니라,
//    핀번호를 안전하게 검사하기 위한 내부용 계정 이름이에요.
//    한 번 정하면 바꾸지 마세요. (바꾸면 핀번호가 초기화돼요)
// ============================================================
window.ADMIN_LOGIN_EMAIL = "admin@mongfruit.local";
window.ADMIN_INITIAL_PIN = "1021";

// 사이트 이름 (상단에 표시돼요)
window.SITE_NAME = "몽프루이 체험단";
