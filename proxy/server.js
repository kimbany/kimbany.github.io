// 친놀송 프록시 (Node/Render 버전) v6.0
// Cloudflare Worker -> Node http 서버로 이전. 출구 IP가 미국(Render)이라 Claude/Gemini 차단 없음.
// 환경변수: ANTHROPIC_API_KEY, SOLAR_API_KEY, GEMINI_API_KEY, APIFRAME_API_KEY
import http from 'node:http';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

function send(res, status, obj) {
  res.writeHead(status, CORS);
  res.end(typeof obj === 'string' ? obj : JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); } });
  });
}

function buildPrompt(params) {
  const { name, relationship, keywords, genre, lang, gender, mustInclude } = params;
  const genderText = { male: '남자', female: '여자', pet: '반려동물' }[gender] || '미지정';
  const langText = { ko: '한글', en: '영어', mix: '섞기' }[lang] || '한글';
  const fixed = (mustInclude && mustInclude.trim()) ? mustInclude.trim() : '(없음)';
  const rel = (relationship && relationship.trim()) ? relationship.trim() : '친구';

  return `너는 최고의 작사가이고 사용자에 빙의한 작곡 작사가이다

이 가사의 목적은:
친구·지인·가족·반려동물을 웃기고 킹받게 놀리는 것이다.

핵심은:
- 실제 친구 놀리는 느낌
- 듣자마자 대상이 떠오르는 캐릭터성
- 약오르는데 웃긴 느낌
- 밈처럼 중독되는 Hook
- 자연스럽게 이어지는 상황극

이다.

--------------------------------------------------

가사에서 가장 중요한 것은:
1. 문장 간 자연스러운 연결
2. 하나의 상황(scene)이 이어지는 흐름
3. 키워드로 대상의 캐릭터를 살리는 것
4. 실제 친구를 놀리는 현실감
5. "킹받는 포인트"를 제대로 살리는 것

절대: 키워드 나열 / 설명문 / 의미없는 라임 / 뜬금없는 감정변화 / 맥락없는 영어 / 멋대로 만든 설정 추가 금지.

--------------------------------------------------

[대상 이름]
${name}

[성별]
${genderText}

[나와의 관계]
${rel}

[키워드]
${keywords}

[꼭 넣고 싶은 문장]
${fixed}

[가사 언어]
${langText}

[장르]
${genre}

--------------------------------------------------

관계에 맞는 말투로 작성:
- 친구→편하게 장난 / 형·오빠→친근하게 / 언니·누나→친밀한 장난 / 윗사람→무례하지 않게 장난 / 후배→귀엽게 / 반려동물→귀엽고 애정.
관계와 안 어울리는 말투 금지.

--------------------------------------------------

구성: Intro(2~4줄) / Verse(6~8줄) / Hook(4~6줄). 약 50초. 2절·브릿지·엔딩 금지. 틱톡/릴스서 반복재생될 중독성.

--------------------------------------------------

★ 가장 중요 ★ [키워드]는 대상의 약점·특징·습관·외모·행동·밈·놀림 포인트다.
"이 특징을 어떻게 놀리면 킹받을까"를 먼저 생각하고, 키워드를 행동·상황·장면·핀잔·과장으로 표현해라.
억지로 끼워넣지 말고, 키워드로 캐릭터를 살려라. 그대로 안 써도 됨(의미를 웃긴 표현으로 바꿔도 됨).
모든 키워드를 다 쓸 필요 없음 — 제일 놀리기 좋은 것 몇 개를 깊게 파라.
입력 안 된 새 설정(없는 외형·사실)은 절대 창작 금지. 과장은 OK, 새 사실 생성은 금지.

--------------------------------------------------

[꼭 넣고 싶은 문장]이 "(없음)"이 아니면 문장을 수정 말고 흐름 안에 자연스럽게 삽입. "(없음)"이면 무시.

--------------------------------------------------

언어: 한글=전체 한국어 / 영어=영어중심 / 섞기=한국어기본+영어는 포인트만(40% 초과 금지, 맥락없는 영어 금지).

--------------------------------------------------

친한 사이 장난 톤. 가벼운 표현(바보·멍청이·허당·덤벙이·장꾸) OK. 강한 욕설/혐오/비하(씨발·시발·병신·미친놈·미친년·개새끼·좆) 절대 금지. "약오르는데 웃긴 느낌" 유지.

--------------------------------------------------

맥락 유지: 각 줄이 이어져 하나의 장면. 뜬금/억지라임/설명체/키워드나열 금지.

★★ 절대 규칙 ★★
- 위 예시 단어(올챙이배·꼬집기·후드집업·솜뭉치·늦잠/커피·라면 등)는 작성법 예시일 뿐. [키워드]에 없으면 가사에 절대 쓰지 마라. 오직 [키워드] 소재만.
- Intro 1 / Verse 1 / Hook 1. 같은 섹션 반복 금지. 전체 12~18줄 이내.

설명 없이 아래 JSON만 응답:
{
  "title": "짧고 웃긴 노래 제목",
  "style": "Suno AI 스타일 영어 설명 (예: playful korean hiphop, funny kpop chant)",
  "lyrics": "[Intro]\\n...\\n\\n[Verse]\\n...\\n\\n[Hook]\\n..."
}`;
}

function maskProfanity(text) {
  if (!text) return text;
  let out = text;
  out = out.replace(/[씨시ㅆ][\s\-_.0-9]*[발팔밤]/g, '삐-');
  out = out.replace(/[좆좇][\s\-_.]*같?/g, '삐-');
  const words = ['존나', '존내', '개새끼', '개새기', '병신', '븅신', '지랄', '니미', 'ㅅㅂ', 'ㅈㄴ', 'ㅄ', 'ㅂㅅ', 'fuck', 'shit'];
  for (const w of words) out = out.split(w).join('삐-');
  return out;
}
function maskResult(data) {
  if (data && typeof data === 'object') {
    if (data.lyrics) data.lyrics = maskProfanity(data.lyrics);
    if (data.title) data.title = maskProfanity(data.title);
  }
  return data;
}
function extractLyricsJson(text) {
  if (!text) return null;
  let t = text.replace(/```json|```/g, '').trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (m) t = m[0];
  try { const p = JSON.parse(t); if (p.lyrics && p.title) return p; } catch {}
  return null;
}

async function tryClaude(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { success: false, error: 'no_key' };
  const models = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  const errors = [];
  for (const model of models) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
      });
      if (r.ok) {
        const d = await r.json();
        const text = (d.content || []).map(b => b.text || '').join('');
        const p = extractLyricsJson(text);
        if (p) return { success: true, data: p };
        errors.push(`${model}: 200 bad JSON`); break;
      }
      const e = await r.text();
      errors.push(`${model}: HTTP ${r.status} ${e.slice(0, 120)}`);
      if (r.status === 404) continue;
      break;
    } catch (e) { errors.push(`${model}: ${e.message}`); }
  }
  return { success: false, error: errors.join(' | ') };
}

async function trySolar(prompt) {
  const key = process.env.SOLAR_API_KEY;
  if (!key) return { success: false, error: 'no_key' };
  const models = ['solar-pro3', 'solar-pro2'];
  const errors = [];
  for (const model of models) {
    let me = '';
    for (let a = 0; a < 2; a++) {
      try {
        const r = await fetch('https://api.upstage.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.9, max_tokens: 1500 })
        });
        if (r.ok) {
          const d = await r.json();
          const p = extractLyricsJson(d.choices?.[0]?.message?.content || '');
          if (p) return { success: true, data: p };
          me = `${model}: 200 bad JSON`; break;
        }
        const e = await r.text();
        me = `${model}: HTTP ${r.status} ${e.slice(0, 150)}`;
        if (r.status === 429 || r.status === 503) { await new Promise(z => setTimeout(z, (a + 1) * 1000)); continue; }
        break;
      } catch (e) { me = `${model}: ${e.message}`; }
    }
    errors.push(me);
  }
  return { success: false, error: errors.join(' | ') };
}

async function tryGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { success: false, error: 'no_key' };
  const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
  const errors = [];
  for (const model of models) {
    let me = '';
    for (let a = 0; a < 2; a++) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 1.0, maxOutputTokens: 1500, responseMimeType: 'application/json' } })
        });
        if (r.ok) {
          const d = await r.json();
          const text = d.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
          const p = extractLyricsJson(text);
          if (p) return { success: true, data: p };
          me = `${model}: 200 bad JSON`; break;
        }
        const e = await r.text();
        me = `${model}: HTTP ${r.status} ${e.slice(0, 100)}`;
        if (r.status === 503 || r.status === 429) { await new Promise(z => setTimeout(z, (a + 1) * 1000)); continue; }
        break;
      } catch (e) { me = `${model}: ${e.message}`; }
    }
    errors.push(me);
  }
  return { success: false, error: errors.join(' | ') };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = url.pathname;

  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  if (path === '/' || path === '/health') {
    return send(res, 200, {
      status: 'OK', service: 'chinolsong-proxy-node', version: '6.0',
      providers: ['claude', 'solar', 'gemini'],
      has_anthropic_key: !!process.env.ANTHROPIC_API_KEY,
      has_solar_key: !!process.env.SOLAR_API_KEY,
      has_gemini_key: !!process.env.GEMINI_API_KEY,
      has_apiframe_key: !!process.env.APIFRAME_API_KEY
    });
  }

  if (path === '/claude-test') {
    const key = process.env.ANTHROPIC_API_KEY;
    const out = { has_key: !!key, key_prefix: key ? key.slice(0, 14) : null };
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 30, messages: [{ role: 'user', content: 'ping' }] })
      });
      out.status = r.status;
      out.body = (await r.text()).slice(0, 300);
    } catch (e) { out.error = e.message; }
    return send(res, 200, out);
  }

  if (path === '/generate-lyrics' && req.method === 'POST') {
    const params = await readBody(req);
    if (!params.name || !params.keywords) return send(res, 400, { error: '필수 항목 누락' });
    const prompt = buildPrompt(params);

    let r = await tryClaude(prompt);
    if (r.success) { r.data._via = 'claude'; return send(res, 200, maskResult(r.data)); }
    const cErr = r.error;
    r = await trySolar(prompt);
    if (r.success) { r.data._via = 'solar'; return send(res, 200, maskResult(r.data)); }
    const sErr = r.error;
    r = await tryGemini(prompt);
    if (r.success) { r.data._via = 'gemini'; return send(res, 200, maskResult(r.data)); }
    return send(res, 503, { error: 'lyrics_failed', message: 'AI 서버가 지금 바빠요. 잠시 후 다시 시도해주세요.', debug: `claude[${cErr}] solar[${sErr}] gemini[${r.error}]` });
  }

  if (path === '/generate-song' && req.method === 'POST') {
    const { lyrics, title, style } = await readBody(req);
    if (!lyrics || !title || !style) return send(res, 400, { error: '필수 항목 누락' });
    const r = await fetch('https://api.apiframe.ai/v2/music/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.APIFRAME_API_KEY },
      body: JSON.stringify({ model: 'suno', prompt: lyrics, sunoParams: { custom_mode: true, title, style, model_version: 'V5' } })
    });
    return send(res, r.status, await r.text());
  }

  if (path.startsWith('/song-status/')) {
    const jobId = path.replace('/song-status/', '');
    const r = await fetch(`https://api.apiframe.ai/v2/jobs/${jobId}`, { headers: { 'X-API-Key': process.env.APIFRAME_API_KEY } });
    return send(res, r.status, await r.text());
  }

  return send(res, 404, { error: 'Invalid path' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('chinolsong-proxy listening on', PORT));
