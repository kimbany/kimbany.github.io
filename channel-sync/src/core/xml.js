/**
 * 11번가 등 XML 로만 응답하는 채널용 최소 파서.
 * 의존성 없이 돌리려고 직접 만든 것이라, 속성(attribute)과 네임스페이스는 무시하고
 * 엘리먼트 트리와 텍스트/CDATA 만 뽑는다. 채널 응답이 그 이상 쓰지 않아서 충분하다.
 */
export function parseXml(xml) {
  const src = String(xml)
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const stack = [{ tag: '#root', children: {}, text: '' }];
  // CDATA 를 태그보다 먼저 잡아야 안쪽의 <, & 가 마크업으로 오해받지 않는다.
  const re = /<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([A-Za-z_][\w.:-]*)([^>]*?)(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const [, cdata, close, tag, , selfClose, text] = m;
    if (cdata !== undefined) {
      stack[stack.length - 1].text += cdata;
      continue;
    }
    if (text !== undefined) {
      stack[stack.length - 1].text += decode(text);
      continue;
    }
    if (close) {
      const node = stack.pop();
      attach(stack[stack.length - 1], node);
    } else if (selfClose) {
      attach(stack[stack.length - 1], { tag, children: {}, text: '' });
    } else {
      stack.push({ tag, children: {}, text: '' });
    }
  }
  while (stack.length > 1) attach(stack[stack.length - 2], stack.pop());
  return simplify(stack[0]);
}

function attach(parent, node) {
  const value = simplify(node);
  const bag = parent.children;
  if (bag[node.tag] === undefined) bag[node.tag] = value;
  else if (Array.isArray(bag[node.tag])) bag[node.tag].push(value);
  else bag[node.tag] = [bag[node.tag], value];
}

function simplify(node) {
  const keys = Object.keys(node.children);
  if (keys.length === 0) return node.text.trim();
  return node.children;
}

function decode(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, '&');
}

/** 단건이 올 때와 목록이 올 때 모양이 달라지는 XML 특성을 흡수한다. */
export const asArray = (v) => (v === undefined || v === '' ? [] : Array.isArray(v) ? v : [v]);
