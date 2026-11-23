/** Reads the bytes at an address, never from the browser's own cache. Gives null when the server answers that
 *  nothing is there; throws when the server cannot be reached or answers with any other failure. */
export async function readBytes(url: string, fetcher: (url: string, init: RequestInit) => Promise<Response> = fetch): Promise<Uint8Array | null> {
  const response = await fetcher(url, { cache: 'no-store' });
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok) throw new Error(`${url}: status ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}
