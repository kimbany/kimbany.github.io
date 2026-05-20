/* 랜덤픽! — 데이터 + 로직 (단일 파일, vanilla JS)
 * 데이터 추가/수정은 아래 data / idData 객체만 손대면 됩니다.
 * 코드 수정 후 배포 시 sw.js의 CACHE_NAME 버전을 꼭 올리세요.
 */

/* ===================== 데이터 ===================== */
const data = {
  // 1) 할일 — 부담 없이 바로 할 수 있는 일상 할일 (서브 필터 없음)
  todo: [
    { main: "책상 위 정리하기", sub: "10분만 투자해도 머리가 맑아져요" },
    { main: "밖에 나가 10분 산책", sub: "햇빛 보면서 천천히 걸어보기" },
    { main: "스트레칭 5분", sub: "목·어깨부터 천천히 풀기" },
    { main: "물 한 컵 마시기", sub: "지금 바로, 시원하게" },
    { main: "안 읽은 책 1챕터 읽기", sub: "딱 한 챕터만" },
    { main: "방 환기시키기", sub: "창문 활짝 열고 공기 갈아주기" },
    { main: "오늘 사진 정리", sub: "흐릿한 사진 10장 지우기" },
    { main: "좋아하는 노래 한 곡 듣기", sub: "눈 감고 가만히" },
    { main: "설거지 끝내기", sub: "쌓아둔 거 지금 해치우기" },
    { main: "친구에게 안부 메시지", sub: "오랜만에 연락해보기" },
    { main: "할 일 3가지 적기", sub: "내일 할 일 미리 메모" },
    { main: "10분 명상", sub: "호흡에만 집중해보기" },
    { main: "냉장고 정리", sub: "유통기한 지난 것 비우기" },
    { main: "휴대폰 멀리 두고 15분", sub: "디지털 디톡스" },
    { main: "식물에 물 주기", sub: "초록이도 챙겨주기" },
    { main: "오늘 감사한 일 3가지 적기", sub: "작은 것이라도 좋아요" },
    { main: "이불 정리하고 침대 펴기", sub: "기분 좋은 리셋" },
    { main: "안 쓰는 앱 3개 삭제", sub: "폰도 가볍게" },
    { main: "따뜻한 차 한 잔", sub: "천천히 음미하기" },
    { main: "10분 청소기 돌리기", sub: "바닥만 후딱" },
    { main: "오늘 입을 옷 미리 골라두기", sub: "내일 아침이 편해져요" },
    { main: "좋아하는 영상 1개만 보기", sub: "딱 하나만, 약속" },
    { main: "손글씨로 일기 한 줄", sub: "오늘 기분 적어두기" },
    { main: "계단으로 한 층 오르기", sub: "엘리베이터 대신" },
    { main: "지갑·가방 속 영수증 정리", sub: "묵은 것 비우기" },
    { main: "거울 보고 한 번 웃기", sub: "기분 전환 끝" },
    { main: "5분 눈 감고 쉬기", sub: "화면에서 잠깐 벗어나기" },
  ],

  // 2) 게임 — 싱글/멀티/모바일
  game: {
    single: [
      { main: "젤다의 전설: 야생의 숨결", sub: "광활한 오픈월드 어드벤처" },
      { main: "엘든 링", sub: "탁 트인 다크판타지, 도전적인 난이도" },
      { main: "하데스", sub: "중독성 강한 로그라이크 액션" },
      { main: "스타듀 밸리", sub: "힐링 농장 경영 시뮬레이션" },
      { main: "할로우 나이트", sub: "감성적인 메트로배니아" },
      { main: "더 위쳐 3", sub: "깊이 있는 스토리의 RPG 명작" },
      { main: "다크 소울 3", sub: "정통 소울라이크" },
      { main: "디스코 엘리시움", sub: "텍스트 중심의 독특한 RPG" },
      { main: "셀레스트", sub: "감동적인 정밀 플랫포머" },
    ],
    multi: [
      { main: "이터널 리턴", sub: "국산 배틀로얄 AOS" },
      { main: "로스트아크", sub: "화려한 액션의 MMORPG" },
      { main: "리그 오브 레전드", sub: "대표 AOS, 5대5 전략" },
      { main: "오버워치 2", sub: "팀 기반 히어로 슈터" },
      { main: "발로란트", sub: "전술 FPS" },
      { main: "스팀 좀보이드", sub: "협동 좀비 서바이벌" },
      { main: "It Takes Two", sub: "2인 협동 전용 어드벤처" },
      { main: "배틀그라운드", sub: "원조 배틀로얄" },
      { main: "마인크래프트", sub: "친구와 함께 짓는 샌드박스" },
    ],
    mobile: [
      { main: "원신", sub: "오픈월드 가챠 RPG" },
      { main: "메이플스토리 M", sub: "추억의 횡스크롤 MMORPG" },
      { main: "브롤스타즈", sub: "짧고 굵은 3대3 대전" },
      { main: "쿠키런: 킹덤", sub: "쿠키 수집 + 왕국 건설" },
      { main: "붕괴: 스타레일", sub: "턴제 전략 RPG" },
      { main: "클래시 로얄", sub: "실시간 카드 대전" },
      { main: "프린세스 커넥트", sub: "캐릭터 수집 RPG" },
      { main: "발라트로", sub: "포커 로그라이크 (모바일판)" },
    ],
  },

  // 3) 메뉴 — 한식/아시안/양식/카페 (메뉴 + 메뉴 조합 형태)
  menu: {
    korean: [
      { main: "김치찌개 + 계란말이", sub: "든든한 국룰 조합" },
      { main: "제육볶음 + 된장찌개", sub: "밥 두 공기 각" },
      { main: "비빔밥 + 미역국", sub: "건강하게 한 끼" },
      { main: "순두부찌개 + 공기밥", sub: "뜨끈하게 속 풀기" },
      { main: "불고기 + 잡채", sub: "잔칫집 분위기" },
      { main: "냉면 + 만두", sub: "여름엔 역시 이 조합" },
      { main: "삼겹살 + 된장찌개", sub: "고기 먹는 날" },
      { main: "김치볶음밥 + 계란후라이", sub: "혼밥 최강자" },
    ],
    asian: [
      { main: "마라탕 + 꿔바로우", sub: "마라 입문 황금조합" },
      { main: "팟타이 + 똠얌꿍", sub: "태국 정통 한 상" },
      { main: "쌀국수 + 짜조", sub: "베트남식 가벼운 한 끼" },
      { main: "텐동 + 우동", sub: "일식 튀김의 정석" },
      { main: "탄탄면 + 군만두", sub: "얼큰 고소 조합" },
      { main: "나시고렝 + 사테", sub: "동남아 길거리 무드" },
      { main: "마파두부 + 공기밥", sub: "매콤 부드러운 밥도둑" },
    ],
    western: [
      { main: "토마토 파스타 + 갈릭브레드", sub: "정석 양식 조합" },
      { main: "스테이크 + 매시드포테이토", sub: "특별한 날 메뉴" },
      { main: "마르게리타 피자 + 콜라", sub: "기본에 충실" },
      { main: "치즈버거 + 감자튀김", sub: "치팅데이 단골" },
      { main: "크림 리조또 + 샐러드", sub: "부드럽고 든든하게" },
      { main: "BLT 샌드위치 + 수프", sub: "가벼운 브런치" },
      { main: "오므라이스 + 양송이수프", sub: "경양식 무드" },
    ],
    cafe: [
      { main: "아메리카노 + 크로플", sub: "카페 국룰" },
      { main: "카페라떼 + 당근케이크", sub: "달콤 고소 밸런스" },
      { main: "바닐라라떼 + 휘낭시에", sub: "디저트 페어링" },
      { main: "콜드브루 + 스콘", sub: "산뜻하게 한 잔" },
      { main: "딸기라떼 + 마들렌", sub: "기분 좋아지는 분홍" },
      { main: "녹차라떼 + 치즈케이크", sub: "은은한 단맛" },
      { main: "에스프레소 + 티라미수", sub: "찐 커피러버용" },
    ],
  },

  // 4) 책 — 소설/비문학/만화·라노벨
  book: {
    novel: [
      { main: "달러구트 꿈 백화점", sub: "이미예 · 따뜻한 판타지" },
      { main: "불편한 편의점", sub: "김호연 · 마음 데우는 이야기" },
      { main: "아몬드", sub: "손원평 · 감정을 못 느끼는 소년" },
      { main: "파친코", sub: "이민진 · 재일조선인 4대 서사" },
      { main: "여름의 잔향", sub: "잔잔한 청춘 소설" },
      { main: "미드나잇 라이브러리", sub: "매트 헤이그 · 다른 삶의 가능성" },
    ],
    nonfiction: [
      { main: "사피엔스", sub: "유발 하라리 · 인류의 빅히스토리" },
      { main: "총, 균, 쇠", sub: "재레드 다이아몬드 · 문명의 운명" },
      { main: "아주 작은 습관의 힘", sub: "제임스 클리어 · 1% 변화의 복리" },
      { main: "팩트풀니스", sub: "한스 로슬링 · 데이터로 보는 세상" },
      { main: "코스모스", sub: "칼 세이건 · 우주를 향한 시" },
      { main: "역행자", sub: "자청 · 자기계발 실전서" },
    ],
    comic: [
      { main: "체인소맨", sub: "후지모토 타츠키 · 광기의 액션" },
      { main: "슬레이어즈 (라노벨)", sub: "칸자카 하지메 · 정통 판타지" },
      { main: "주술회전", sub: "저주를 둘러싼 배틀물" },
      { main: "스파이 패밀리", sub: "위장가족 코미디" },
      { main: "전생했더니 슬라임", sub: "이세계 전생 라노벨" },
      { main: "장송의 프리렌", sub: "여운 깊은 여정의 판타지" },
    ],
  },

  // 5) 영화 — 액션/드라마/애니/스릴러/로맨스
  movie: {
    action: [
      { main: "매드맥스: 분노의 도로", sub: "쉴 틈 없는 추격 액션" },
      { main: "존 윅", sub: "스타일리시 건 액션" },
      { main: "범죄도시", sub: "통쾌한 한국형 액션" },
      { main: "탑건: 매버릭", sub: "압도적인 항공 액션" },
      { main: "다크 나이트", sub: "조커가 있는 명작 액션" },
    ],
    drama: [
      { main: "기생충", sub: "봉준호 · 계급을 비추는 블랙코미디" },
      { main: "쇼생크 탈출", sub: "희망에 관한 명작" },
      { main: "포레스트 검프", sub: "한 사람의 인생 여정" },
      { main: "벌새", sub: "1994년, 소녀의 성장" },
      { main: "어바웃 타임", sub: "시간여행으로 보는 일상의 소중함" },
    ],
    anime: [
      { main: "센과 치히로의 행방불명", sub: "지브리 대표작" },
      { main: "너의 이름은", sub: "신카이 마코토 · 인연의 이야기" },
      { main: "스파이더맨: 어크로스 더 유니버스", sub: "비주얼 끝판왕" },
      { main: "코코", sub: "가족과 기억에 관한 픽사" },
      { main: "귀멸의 칼날: 무한열차편", sub: "압도적 작화의 극장판" },
    ],
    thriller: [
      { main: "셔터 아일랜드", sub: "반전의 심리 스릴러" },
      { main: "곡성", sub: "오싹한 한국 미스터리" },
      { main: "프리즈너스", sub: "긴장감 가득한 추적극" },
      { main: "세븐", sub: "데이비드 핀처 · 7가지 죄악" },
      { main: "추격자", sub: "숨 막히는 범죄 스릴러" },
    ],
    romance: [
      { main: "라라랜드", sub: "꿈과 사랑의 뮤지컬" },
      { main: "이터널 선샤인", sub: "기억을 지우는 사랑" },
      { main: "건축학개론", sub: "첫사랑의 기억" },
      { main: "노트북", sub: "변하지 않는 사랑" },
      { main: "비포 선라이즈", sub: "하룻밤의 운명적 대화" },
    ],
  },

  // 6) 간식 — 단맛/짠맛/건강/음료
  snack: {
    sweet: [
      { main: "초코칩 쿠키", sub: "우유랑 먹으면 완벽" },
      { main: "마카롱", sub: "한 입 사이즈 달콤함" },
      { main: "붕어빵", sub: "겨울 길거리 간식" },
      { main: "딸기 생크림 케이크", sub: "기분 내고 싶을 때" },
      { main: "초콜릿 한 조각", sub: "당 충전 즉효약" },
      { main: "도넛", sub: "글레이즈드 한 입" },
    ],
    salty: [
      { main: "감자칩", sub: "한 번 뜯으면 멈출 수 없음" },
      { main: "팝콘", sub: "영화엔 역시" },
      { main: "나초 + 치즈딥", sub: "짭짤 고소" },
      { main: "치즈볼", sub: "겉바속촉" },
      { main: "쥐포·먹태", sub: "맥주 부르는 맛" },
      { main: "프레첼", sub: "소금기 가득한 빵과자" },
    ],
    healthy: [
      { main: "그릭요거트 + 그래놀라", sub: "든든한 건강 간식" },
      { main: "방울토마토", sub: "상큼하게 한 줌" },
      { main: "삶은 계란", sub: "단백질 보충" },
      { main: "견과류 한 줌", sub: "아몬드·호두 믹스" },
      { main: "바나나", sub: "간편한 에너지원" },
      { main: "고구마", sub: "포만감 최고" },
    ],
    drink: [
      { main: "아이스 아메리카노", sub: "얼죽아의 영원한 친구" },
      { main: "딸기 스무디", sub: "상큼 달콤" },
      { main: "버블티", sub: "쫀득한 펄 가득" },
      { main: "레몬에이드", sub: "톡 쏘는 청량감" },
      { main: "핫초코", sub: "추운 날 마음까지 따뜻" },
      { main: "콤부차", sub: "상큼한 발효 음료" },
    ],
  },

  // 7) 노래 — 각 항목에 q(YouTube 검색어) 필수
  music: {
    kpop: [
      { main: "Magnetic", sub: "ILLIT", q: "ILLIT Magnetic" },
      { main: "Super Shy", sub: "NewJeans", q: "NewJeans Super Shy" },
      { main: "Smart", sub: "LE SSERAFIM", q: "LE SSERAFIM Smart" },
      { main: "Drama", sub: "aespa", q: "aespa Drama" },
      { main: "Spicy", sub: "aespa", q: "aespa Spicy" },
      { main: "Love wins all", sub: "IU", q: "IU Love wins all" },
    ],
    ballad: [
      { main: "사건의 지평선", sub: "윤하", q: "윤하 사건의 지평선" },
      { main: "밤편지", sub: "아이유", q: "아이유 밤편지" },
      { main: "이별택시", sub: "김연우", q: "김연우 이별택시" },
      { main: "취중진담", sub: "김동률", q: "김동률 취중진담" },
      { main: "너의 의미", sub: "아이유 (feat. 김창완)", q: "아이유 너의 의미" },
      { main: "거짓말", sub: "god", q: "god 거짓말" },
    ],
    chill: [
      { main: "Drowning", sub: "WOODZ", q: "WOODZ Drowning" },
      { main: "오늘만 I LOVE YOU", sub: "볼빨간사춘기", q: "볼빨간사춘기 오늘만 아이러브유" },
      { main: "잘 지내자, 우리", sub: "최유리", q: "최유리 잘 지내자 우리" },
      { main: "주저하는 연인들을 위해", sub: "잔나비", q: "잔나비 주저하는 연인들을 위해" },
      { main: "Antifreeze", sub: "검정치마", q: "검정치마 Antifreeze" },
      { main: "한 페이지가 될 수 있게", sub: "DAY6", q: "DAY6 한 페이지가 될 수 있게" },
    ],
    global: [
      { main: "As It Was", sub: "Harry Styles", q: "Harry Styles As It Was" },
      { main: "Flowers", sub: "Miley Cyrus", q: "Miley Cyrus Flowers" },
      { main: "Anti-Hero", sub: "Taylor Swift", q: "Taylor Swift Anti-Hero" },
      { main: "Blinding Lights", sub: "The Weeknd", q: "The Weeknd Blinding Lights" },
      { main: "Espresso", sub: "Sabrina Carpenter", q: "Sabrina Carpenter Espresso" },
      { main: "Cruel Summer", sub: "Taylor Swift", q: "Taylor Swift Cruel Summer" },
    ],
    hiphop: [
      { main: "낭만적이게", sub: "릴러말즈", q: "릴러말즈 낭만적이게" },
      { main: "Polaroid", sub: "릴러말즈", q: "릴러말즈 Polaroid" },
      { main: "What You Want", sub: "비오 (BE'O)", q: "비오 What You Want" },
      { main: "사이렌", sub: "호미들", q: "호미들 사이렌" },
      { main: "리무진", sub: "BE'O (feat. MINO)", q: "비오 리무진" },
      { main: "GOD'S MENU", sub: "Stray Kids", q: "Stray Kids God's Menu" },
    ],
  },
};

// 8) 아이디/닉네임 — 형용사 + 명사 랜덤 조합
const idData = {
  adj: ["몽글한", "용감한", "포근한", "엉뚱한", "졸린", "반짝이는", "느긋한", "수줍은",
        "씩씩한", "달콤한", "촉촉한", "보송한", "따뜻한", "상큼한", "고요한", "당당한",
        "말랑한", "초롱한", "보들한", "산뜻한", "노곤한", "오동통한", "새침한", "포실한", "둥글둥글한"],
  noun: ["감자", "구름", "고양이", "토끼", "달팽이", "복숭아", "수달", "별",
         "라쿤", "햄스터", "고슴도치", "단풍", "젤리", "방울", "다람쥐", "물범",
         "참새", "두부", "도토리", "버섯", "고래", "펭귄", "솜사탕", "너구리", "병아리"],
  eng: ["mellow", "sunny", "cozy", "fluffy", "sleepy", "shiny", "calm", "lucky",
        "breezy", "snug", "dreamy", "fuzzy", "merry", "bubbly", "gentle", "swift",
        "misty", "jolly", "velvety", "peachy", "frosty", "starry"],
  engNoun: ["fox", "moss", "willow", "otter", "cloud", "pebble", "maple", "panda",
            "comet", "bean", "leaf", "berry", "koala", "lemon", "puffin", "ferret",
            "cocoa", "robin", "acorn", "wave", "ember", "lynx"],
};

/* ===================== 카테고리 메타 ===================== */
const CATS = [
  { key: "todo",  emoji: "✅", label: "할일",     color: "mint" },
  { key: "game",  emoji: "🎮", label: "게임",     color: "purple",
    subs: [["all","전체"],["single","싱글"],["multi","멀티"],["mobile","모바일"]] },
  { key: "menu",  emoji: "🍚", label: "메뉴",     color: "orange",
    subs: [["all","전체"],["korean","한식"],["asian","아시안"],["western","양식"],["cafe","카페"]] },
  { key: "book",  emoji: "📚", label: "책",       color: "blue",
    subs: [["all","전체"],["novel","소설"],["nonfiction","비문학"],["comic","만화·라노벨"]] },
  { key: "movie", emoji: "🎬", label: "영화",     color: "pink",
    subs: [["all","전체"],["action","액션"],["drama","드라마"],["anime","애니"],["thriller","스릴러"],["romance","로맨스"]] },
  { key: "snack", emoji: "🍪", label: "간식",     color: "yellow",
    subs: [["all","전체"],["sweet","단맛"],["salty","짠맛"],["healthy","건강"],["drink","음료"]] },
  { key: "music", emoji: "🎵", label: "노래",     color: "pink",
    subs: [["all","전체"],["kpop","K-POP"],["ballad","발라드"],["chill","칠·인디"],["global","글로벌"],["hiphop","힙합"]] },
  { key: "id",    emoji: "🆔", label: "아이디",   color: "purple",
    subs: [["ko","한글"],["en","영문"],["mix","조합"]] },
];
const CAT_MAP = Object.fromEntries(CATS.map((c) => [c.key, c]));

/* ===================== 상태 ===================== */
let state = { cat: null, sub: null, last: null };

/* ===================== DOM ===================== */
const $ = (sel) => document.querySelector(sel);
const catGrid = $("#catGrid");
const subBar = $("#subBar");
const result = $("#result");

/* ===================== 헬퍼 ===================== */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
// 같은 결과 연속 방지
function pickDifferent(arr, prevKey) {
  if (arr.length <= 1) return arr[0];
  let item;
  do { item = pick(arr); } while ((item.main || item) === prevKey);
  return item;
}

// 현재 카테고리/서브에 해당하는 추천 풀
function poolFor(catKey, subKey) {
  if (catKey === "todo") return data.todo;
  const bucket = data[catKey];
  if (subKey === "all" || !subKey) {
    return Object.values(bucket).flat();
  }
  return bucket[subKey] || [];
}

/* ===================== 렌더 ===================== */
function renderCats() {
  catGrid.innerHTML = "";
  CATS.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn";
    btn.dataset.color = c.color;
    btn.dataset.key = c.key;
    btn.innerHTML = `<span class="cat-emoji">${c.emoji}</span><span class="cat-label">${c.label}</span>`;
    btn.addEventListener("click", () => selectCat(c.key));
    catGrid.appendChild(btn);
  });
}

function selectCat(catKey) {
  state.cat = catKey;
  state.last = null;
  const cat = CAT_MAP[catKey];
  state.sub = cat.subs ? cat.subs[0][0] : null;

  // 활성 카테고리 표시
  document.querySelectorAll(".cat-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.key === catKey);
  });

  renderSubs(cat);
  draw();
}

function renderSubs(cat) {
  subBar.innerHTML = "";
  if (!cat.subs) { subBar.hidden = true; return; }
  subBar.hidden = false;
  cat.subs.forEach(([key, label]) => {
    const chip = document.createElement("button");
    chip.className = "sub-chip";
    chip.textContent = label;
    chip.classList.toggle("active", key === state.sub);
    chip.addEventListener("click", () => {
      state.sub = key;
      state.last = null;
      subBar.querySelectorAll(".sub-chip").forEach((s) => s.classList.remove("active"));
      chip.classList.add("active");
      draw();
    });
    subBar.appendChild(chip);
  });
}

// 아이디/닉네임 생성
function makeId(subKey) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  if (subKey === "ko") {
    return { main: pick(idData.adj) + pick(idData.noun), sub: "한글 닉네임" };
  }
  if (subKey === "en") {
    const sep = pick(["_", "", "."]);
    return { main: pick(idData.eng) + sep + pick(idData.engNoun), sub: "영문 아이디" };
  }
  // 조합: 한글 형용사 + 영문 명사
  return { main: pick(idData.adj) + cap(pick(idData.engNoun)), sub: "한글+영문 조합" };
}

function draw() {
  const cat = CAT_MAP[state.cat];
  let item;
  if (state.cat === "id") {
    item = makeId(state.sub);
  } else {
    const pool = poolFor(state.cat, state.sub);
    if (!pool.length) { result.innerHTML = ""; return; }
    item = pickDifferent(pool, state.last);
  }
  state.last = item.main;
  renderResult(cat, item);
}

function renderResult(cat, item) {
  const ytBtn = (state.cat === "music" && item.q)
    ? `<a class="yt-btn" target="_blank" rel="noopener"
         href="https://www.youtube.com/results?search_query=${encodeURIComponent(item.q)}">
         ▶ YouTube에서 재생</a>`
    : "";

  result.innerHTML = `
    <div class="card" data-color="${cat.color}">
      <span class="deco deco-y"></span>
      <span class="deco deco-p"></span>
      <div class="card-tag">${cat.emoji} ${cat.label} 추천</div>
      <div class="card-main">${item.main}</div>
      ${item.sub ? `<div class="card-sub">${item.sub}</div>` : ""}
      ${ytBtn}
      <button class="redraw" type="button">🎲 다시 뽑기</button>
    </div>`;

  // pop 애니메이션 재시작
  const card = result.querySelector(".card");
  card.classList.remove("pop");
  void card.offsetWidth;
  card.classList.add("pop");

  result.querySelector(".redraw").addEventListener("click", draw);
}

/* ===================== 설치 배너 ===================== */
function setupInstallBanner() {
  const banner = $("#installBanner");
  const installBtn = $("#installBtn");
  const closeBtn = $("#installClose");
  let deferredPrompt = null;

  if (localStorage.getItem("rp_install_dismissed") === "1") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    banner.hidden = false;
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner.hidden = true;
  });

  closeBtn.addEventListener("click", () => {
    banner.hidden = true;
    localStorage.setItem("rp_install_dismissed", "1");
  });

  window.addEventListener("appinstalled", () => {
    banner.hidden = true;
    localStorage.setItem("rp_install_dismissed", "1");
  });
}

/* ===================== Service Worker ===================== */
function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then((reg) => console.log("[랜덤픽] Service Worker 등록 완료:", reg.scope))
      .catch((err) => console.error("[랜덤픽] Service Worker 등록 실패:", err));
  });
}

/* ===================== 초기화 ===================== */
renderCats();
setupInstallBanner();
registerSW();
