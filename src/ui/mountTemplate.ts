export function mountTemplate(markup: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  const node = template.content.firstElementChild;
  if (!(node instanceof HTMLElement)) throw new Error('Template needs an element root');
  return node;
}

export function queryElement<T extends Element>(
  root: ParentNode,
  selector: string,
  guard: (node: Element) => node is T,
): T {
  const node = root.querySelector(selector);
  if (!node || !guard(node)) throw new Error(`Missing ${selector}`);
  return node;
}

export function isButton(node: Element): node is HTMLButtonElement {
  return node instanceof HTMLButtonElement;
}

export function isInput(node: Element): node is HTMLInputElement {
  return node instanceof HTMLInputElement;
}

export function isCanvas(node: Element): node is HTMLCanvasElement {
  return node instanceof HTMLCanvasElement;
}

export function isElement(node: Element): node is HTMLElement {
  return node instanceof HTMLElement;
}
