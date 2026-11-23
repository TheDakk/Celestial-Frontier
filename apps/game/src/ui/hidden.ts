/** Takes an element out of sight while a reader still reads it. */
export function hideVisually(el: HTMLElement): void {
  Object.assign(el.style, { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' });
}
