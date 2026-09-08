export interface EarthLayeredLayoutInputV1 {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  /** All boundaries use the canvas's local CSS coordinate space. */
  readonly topChromeBottom: number;
  readonly rosterTop: number;
}

export interface EarthLayeredMountBoxV1 {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly scale: number;
}

/** Fit the complete 960×430 background/resident pair into the measured free
 * scene band. This changes only the artwork; neither UI boundary is moved. */
export function earthLayeredMountLayoutV1(
  input: EarthLayeredLayoutInputV1,
): EarthLayeredMountBoxV1 | null {
  const { viewportWidth, viewportHeight, topChromeBottom, rosterTop } = input;
  if (![viewportWidth, viewportHeight, topChromeBottom, rosterTop].every(Number.isFinite)
    || viewportWidth <= 0 || viewportHeight <= 0
    || topChromeBottom < 0 || topChromeBottom > viewportHeight
    || rosterTop < 0 || rosterTop > viewportHeight) return null;
  const availableWidth = viewportWidth - 24;
  const bandTop = topChromeBottom + 12, bandBottom = rosterTop - 12;
  const availableHeight = bandBottom - bandTop;
  if (availableWidth <= 0 || availableHeight <= 0) return null;
  const scale = Math.min(availableWidth / 960, availableHeight / 430);
  if (!Number.isFinite(scale) || scale <= 0) return null;
  const width = 960 * scale, height = 430 * scale;
  const centerX = viewportWidth / 2, centerY = bandTop + availableHeight / 2;
  return Object.freeze({
    left: centerX - width / 2, top: centerY - height / 2,
    width, height, centerX, centerY, scale,
  });
}
