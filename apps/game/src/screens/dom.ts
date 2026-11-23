type Child = Node | string | null;

/** An element with attributes and children. An attribute given as null or false is left out; true sets it empty. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Readonly<Record<string, string | boolean | null>> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === null || value === false) continue;
    node.setAttribute(name, value === true ? '' : value);
  }
  node.append(...children.filter((child): child is Node | string => child !== null));
  return node;
}

/** A row of a panel: a label and its control. */
export function row(label: string, ...controls: Child[]): HTMLElement {
  return el('div', { class: 'row' }, el('span', { class: 'row-label' }, label), ...controls);
}
