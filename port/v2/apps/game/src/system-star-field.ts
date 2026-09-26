import { Container, Graphics } from 'pixi.js';

/** Static magnetar field strokes from the canonical system renderer.
 * The caller mounts this after the beams and before the white-hot core.
 * The scene owns and destroys this container and its graphics contexts.
 */
export function createSystemStarField(kind: string): Container | null {
  if (kind !== 'MAG') return null;

  const field = new Container();
  field.label = 'system-magnetar-field';
  field.eventMode = 'none';
  for (const rotation of [0.5, -0.5]) {
    const arc = new Graphics()
      .ellipse(0, 0, 24, 10)
      .stroke({ width: 1.2, color: 0x96c8ff, alpha: 0.45 });
    arc.rotation = rotation;
    arc.eventMode = 'none';
    field.addChild(arc);
  }
  return field;
}
