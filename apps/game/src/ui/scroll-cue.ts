/* The cue that a sheet scrolls: while content lies below the foot of a scroll area it carries `data-more-below`,
   and the stylesheet draws a shadow along its foot. An improvement on the current game, which shows nothing. */

/** Content within this many pixels of the foot is at the foot. */
const SLACK = 1;

/** Keeps `data-more-below` on a scroll area true to what lies below its window: as it is scrolled, as its content
 *  is drawn again, as it is shown, and as the view changes size. Returns the call that gives it up. */
export function mountScrollCue(el: HTMLElement): () => void {
  const view = el.ownerDocument.defaultView!;
  const update = (): void => { el.toggleAttribute('data-more-below', el.scrollHeight - el.clientHeight - el.scrollTop > SLACK); };
  const observer = new view.MutationObserver(update);
  observer.observe(el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
  el.addEventListener('scroll', update, { passive: true });
  view.addEventListener('resize', update);
  update();
  return () => {
    observer.disconnect();
    el.removeEventListener('scroll', update);
    view.removeEventListener('resize', update);
  };
}
