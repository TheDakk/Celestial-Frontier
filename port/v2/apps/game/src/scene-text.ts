import { Text, TextStyle } from 'pixi.js';

/**
 * Creates a scene label whose subscription to a shared document-owned style
 * ends with the label. Pixi 8.19 nulls Text._style during destroy without
 * removing this listener, so the style would otherwise retain the old Text.
 */
export function createSceneText(text: string, style: TextStyle): Text {
  const label = new Text({ text, style });
  label.once('destroyed', () => {
    style.off('update', label.onViewUpdate, label);
  });
  return label;
}
