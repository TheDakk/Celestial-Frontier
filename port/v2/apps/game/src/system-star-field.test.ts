import { Graphics, Point } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { createSystemStarField } from './system-star-field.js';

function magnetarField() {
  const field = createSystemStarField('MAG');
  if (!field) throw new Error('Canonical magnetar field is missing');
  return field;
}

describe('canonical system magnetar field', () => {
  it.each(['NS', 'G', 'PROTO', 'BH', 'WD', 'mag', ''])('leaves %s without magnetar geometry', (kind) => {
    expect(createSystemStarField(kind)).toBeNull();
  });

  it('builds two real elliptical strokes with the canonical bounds, appearance and passive input mode', () => {
    const field = magnetarField();
    try {
      expect(field.eventMode).toBe('none');
      expect(field.children).toHaveLength(2);
      expect(field.children.map((child) => child.rotation)).toEqual([0.5, -0.5]);
      for (const arc of field.children) {
        expect(arc).toBeInstanceOf(Graphics);
        if (!(arc instanceof Graphics)) throw new Error('Field child is not Pixi geometry');
        expect(arc.eventMode).toBe('none');
        expect(arc.position.x).toBe(0);
        expect(arc.position.y).toBe(0);
        expect(arc.scale.x).toBe(1);
        expect(arc.scale.y).toBe(1);
        expect(arc.alpha).toBe(1);
        expect(arc.context.instructions).toHaveLength(1);
        const stroke = arc.context.instructions[0];
        if (stroke?.action !== 'stroke') throw new Error('Field must remain a hollow stroke');
        expect(stroke.data.style).toMatchObject({ width: 1.2, color: 0x96c8ff, alpha: 0.45 });
        const bounds = arc.getLocalBounds();
        expect(bounds.minX).toBeCloseTo(-24.6, 10);
        expect(bounds.maxX).toBeCloseTo(24.6, 10);
        expect(bounds.minY).toBeCloseTo(-10.6, 10);
        expect(bounds.maxY).toBeCloseTo(10.6, 10);
        // Exercise Pixi's built ellipse geometry, not just its recorded draw command.
        expect(arc.containsPoint(new Point(24.5, 0))).toBe(true);
        expect(arc.containsPoint(new Point(0, 10.5))).toBe(true);
        expect(arc.containsPoint(new Point(24 / Math.SQRT2, 10 / Math.SQRT2))).toBe(true);
        expect(arc.containsPoint(new Point(24.7, 0))).toBe(false);
        expect(arc.containsPoint(new Point(0, 10.7))).toBe(false);
        expect(arc.containsPoint(new Point(22, 8))).toBe(false);
        expect(arc.containsPoint(new Point(0, 0))).toBe(false);
      }
    } finally {
      field.destroy({ children: true, context: true });
    }
  });

  it('remains static without scheduling deferred work', () => {
    vi.useFakeTimers();
    const field = magnetarField();
    try {
      const children = [...field.children];
      const before = children.map((child) => ({
        rotation: child.rotation, x: child.x, y: child.y, alpha: child.alpha,
      }));
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(60_000);
      expect(field.children).toEqual(children);
      expect(children.map((child) => ({
        rotation: child.rotation, x: child.x, y: child.y, alpha: child.alpha,
      }))).toEqual(before);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      field.destroy({ children: true, context: true });
      vi.useRealTimers();
    }
  });

  it('ordinary scene destruction releases both contexts while another field remains usable', () => {
    const retired = magnetarField();
    const retained = magnetarField();
    const arcs = retired.children.map((child) => {
      if (!(child instanceof Graphics)) throw new Error('Field child is not Pixi geometry');
      return child;
    });
    const contexts = arcs.map((arc) => arc.context);
    try {
      expect(contexts).toHaveLength(2);
      expect(contexts[0]).not.toBe(contexts[1]);
      expect(contexts.every((context) => !context.destroyed)).toBe(true);
      retired.destroy({ children: true, context: true });
      expect(retired.destroyed).toBe(true);
      expect(arcs.every((arc) => arc.destroyed)).toBe(true);
      expect(contexts.every((context) => context.destroyed)).toBe(true);
      expect(contexts.every((context) => context.instructions === null)).toBe(true);
      expect(retained.destroyed).toBe(false);
      for (const child of retained.children) {
        if (!(child instanceof Graphics)) throw new Error('Retained field child is not Pixi geometry');
        expect(child.context.destroyed).toBe(false);
        expect(child.containsPoint(new Point(24, 0))).toBe(true);
      }
    } finally {
      if (!retired.destroyed) retired.destroy({ children: true, context: true });
      retained.destroy({ children: true, context: true });
    }
  });
});
