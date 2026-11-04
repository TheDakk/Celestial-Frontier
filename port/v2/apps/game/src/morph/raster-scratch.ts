/** Synchronous render-owned storage. Never register caller inputs or the published raster.
 * Detach completed scratch backing stores on engines with ArrayBuffer.transfer (zero-byte target);
 * older engines retain ordinary GC semantics. Pixel output does not depend on this optimization. */
export class RasterScratch {
  private readonly buffers = new Set<ArrayBuffer>();
  own(pixels: Uint8Array): Uint8Array {
    // All call sites register fresh Uint8Array allocations. Refuse a future shared/view ownership mistake.
    if (!(pixels.buffer instanceof ArrayBuffer) || pixels.byteOffset !== 0 || pixels.byteLength !== pixels.buffer.byteLength) throw new TypeError('raster scratch: whole owned ArrayBuffer required');
    this.buffers.add(pixels.buffer); return pixels;
  }
  release(keep?: Uint8Array): void {
    for (const buffer of this.buffers) {
      if (buffer === keep?.buffer || buffer.byteLength === 0) continue;
      const transfer = (buffer as ArrayBuffer & { transfer?: (newByteLength: number) => ArrayBuffer }).transfer;
      if (typeof transfer === 'function') transfer.call(buffer, 0);
    }
    this.buffers.clear();
  }
}
