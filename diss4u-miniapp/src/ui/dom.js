/* 작은 DOM 도우미. 프레임워크를 안 쓰기로 했으니 이 정도만 둔다. */

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function frag(children) {
  const f = document.createDocumentFragment();
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    f.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return f;
}

export function $(selector, scope = document) {
  return scope.querySelector(selector);
}
