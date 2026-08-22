# 서버 패치 — `proxy/server.js` 에 붙이는 모듈

미니앱이 쓰는 서버 엔드포인트 2개와, 강화한 비속어 필터가 여기 있다.

**이 파일들이 왜 여기 있나:** 운영 중인 프록시 정본은 `kimbany/diss4u` 저장소의
`proxy/server.js`(165KB)다. 이 세션은 `kimbany.github.io` 에만 push 할 수 있어서
바로 고치지 못한다. 그래서 드롭인 가능한 모듈로 만들어 두었다.

> 참고: `kimbany.github.io/proxy/server.js` 는 24KB 짜리 옛 사본이다. 운영본이 아니다.
> 인수인계 문서에 "운영본은 kimbany.github.io 의 proxy/" 라고 적혀 있는데 사실과 다르다.

## 붙이는 방법

1. 이 폴더의 `toss-auth.js`, `toss-iap.js`, `profanity.js` 를 `diss4u/proxy/` 로 복사한다.
2. `proxy/server.js` 상단 import 에 추가한다.

```js
import { createTossLoginHandler } from './toss-auth.js';
import { createTossIapVerifyHandler } from './toss-iap.js';
import { maskProfanity, maskResult, containsProfanity } from './profanity.js';
```

3. 기존 `maskProfanity` / `maskResult` 함수 정의(2044줄 근처)를 **지운다.**
   이름이 같아서 import 와 충돌한다.

4. SKU 표를 정한다. 콘솔에 등록한 인앱 상품과 값이 맞아야 한다.

```js
const TOSS_IAP_SKUS = {
  diss4u_credit_10:  { credits: 10,  price: 990 },
  diss4u_credit_60:  { credits: 60,  price: 4900 },
  diss4u_credit_150: { credits: 150, price: 9900 },
};
```

5. 라우팅 분기(다른 `if (path === ...)` 들 사이)에 두 줄을 넣는다.

```js
const tossLogin = createTossLoginHandler({
  send, readBody, admin, getOrCreateUser,
  creditsEnabled: () => CREDITS_ENABLED,
});
const tossIapVerify = createTossIapVerifyHandler({
  send, readBody, verifyAuth, creditPaymentOnce, logCredit, markLastGrant,
  creditsEnabled: () => CREDITS_ENABLED,
  skuTable: TOSS_IAP_SKUS,
});

if (path === '/toss/login' && req.method === 'POST') return tossLogin(req, res);
if (path === '/toss/iap/verify' && req.method === 'POST') return tossIapVerify(req, res);
```

6. CORS 헤더에 이미 `Authorization` 이 들어 있어 그대로 동작한다.

## Render 환경변수

| 변수 | 용도 | 발급처 |
|---|---|---|
| `TOSS_CLIENT_ID` | 토스 로그인 | 앱인토스 콘솔 |
| `TOSS_CLIENT_SECRET` | 토스 로그인 | 앱인토스 콘솔 |
| `TOSS_LOGIN_DECRYPT_KEY` | 개인정보 복호화(base64) | 신청 후 **이메일**로 수령 |
| `TOSS_LOGIN_DECRYPT_AAD` | (선택) 복호화 AAD | 값은 `TOSS`. 코드 기본값이라 안 넣어도 됨 |
| `TOSS_IAP_CERT_PATH` | mTLS 클라이언트 인증서 | 앱인토스 콘솔 |
| `TOSS_IAP_KEY_PATH` | mTLS 클라이언트 키 | 앱인토스 콘솔 |
| `TOSS_IAP_CA_PATH` | (선택) CA 체인 | 앱인토스 콘솔 |

## 복호화 AAD

값은 **`TOSS`** 다. 복호화 키 발급 메일에 키와 나란히 적혀 온다. 공개 문서에는
안 나와 있어서 한동안 미상이었다. 비밀이 아니라 상수라 `DEFAULT_AAD` 로 코드에
박아뒀고, 환경변수는 토스가 값을 바꿀 때를 위한 덮어쓰기 용도로만 남겼다.

구현이 맞는지는 왕복 테스트로 확인했다(`test/toss-decrypt.test.js`).
암호문 레이아웃(IV 12B + 본문 + tag 16B), AAD 인증, 변조 검출까지 본다.

## ⚠️ 아직 확인이 필요한 것

**토큰 발급 API 의 인증 헤더 이름.** `X-Toss-Client-Id` / `X-Toss-Client-Secret`
으로 적어두었다. 콘솔에서 `client_id`/`client_secret` 을 받을 때 실제 헤더 이름을
대조할 것. 여기가 틀리면 토큰 교환에서 401 이 난다.

## 크레딧 적립 규칙을 건드리지 않은 이유

크레딧 풀이 무료/유료로 나뉘어 있고(`freeCredits`/`paidCredits`), 차감은 무료 먼저,
환불은 역순이다. 이 규칙은 기존 `creditPaymentOnce` 안에 들어 있다. IAP 적립도
그 함수를 그대로 부르고, `orderId` 를 결제 식별자로 넘겨 중복 적립만 막았다.
따로 더하는 코드를 새로 쓰면 규칙이 갈라진다.

## 비속어 필터

`profanity.js` 는 기존 `maskProfanity`(정규식 2개 + 16단어)를 대체한다. 테스트는
미니앱 쪽에 있다.

```
cd diss4u-miniapp && npm test
```
