/** A PNG transform owns both sides until the native producer has closed.
 * Readable EOF alone does not prove the writer released its input buffers. */
export async function completePngStream(stream: ReadableWritablePair<Uint8Array, BufferSource>, input: Uint8Array): Promise<Uint8Array> {
  const writer = stream.writable.getWriter(), reader = stream.readable.getReader();
  const produce = async (): Promise<void> => { await writer.write(new Uint8Array(input)); await writer.close(); };
  const consume = async (): Promise<Uint8Array[]> => {
    const chunks: Uint8Array[] = [];
    for (;;) { const { done, value } = await reader.read(); if (done) return chunks; chunks.push(value); }
  };
  try {
    const [chunks] = await Promise.all([consume(), produce()]);
    let length = 0; for (const chunk of chunks) length += chunk.length;
    const out = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }
    return out;
  } catch (error) {
    await Promise.allSettled([reader.cancel(error), writer.abort(error)]);
    throw error;
  } finally { reader.releaseLock(); writer.releaseLock(); }
}
