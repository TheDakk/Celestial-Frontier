/* What the tests of a system's small bodies share: Sol's map on a page, a view come in on a body, and a press. */
import { expect, it } from 'vitest';
import { descentCamera, entryZoom, smallBodies, toScreen, zoomAbout, zoomLimits, type Camera, type MapBody } from '../src/space';
import { canvas, cardTitle, fire, rest, tap } from './screen-map-support';
import { bootPage } from './shell-support';

export const VIEW = { w: 800, h: 600 };
/** The view a system opens on: under 1/420 of the shorter side a unit, so no name of a moon is drawn. */
export const FAR = descentCamera('system', 600).to;

/** Sol's map on a page 800 by 600, every clock of it held at its start. */
export async function atSystem() {
  const page = await bootPage({ width: 800, height: 600 });
  page.live.motionMode = 1;
  rest(page);
  return page;
}
/** Six wheel steps in about a screen point, come to rest: the camera the view then has, over 1/420 of the shorter side. */
export function zoomedIn(page: Awaited<ReturnType<typeof atSystem>>, at: { x: number; y: number }): Camera {
  let cam = FAR;
  for (let i = 0; i < 6; i++) {
    fire(canvas(), 'wheel', { deltaY: -120, clientX: at.x, clientY: at.y });
    cam = zoomAbout(cam, 1.14, at.x - VIEW.w / 2, at.y - VIEW.h / 2, zoomLimits('system', 600, entryZoom('system', 600)));
  }
  rest(page);
  expect(cam.z).toBeGreaterThan(600 / 420);
  return cam;
}
export const small = (page: Awaited<ReturnType<typeof atSystem>>, _cam: Camera, time = 0, orbit = 0): MapBody[] => smallBodies(page.nav.nav, time, orbit);
export const placeOf = (cam: Camera, body: MapBody): { x: number; y: number } => toScreen(cam, VIEW, body.wx, body.wy);
/** The title of the card open after a press by mouse, or null: a press on nothing closes the card that was open. */
export const pressed = (x: number, y: number): string | null => {
  tap(x, y);
  return cardTitle();
};
