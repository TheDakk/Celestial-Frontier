/**
 * Lightweight release identity shared by boot and the authored bulletin archive.
 *
 * Keep the full Guide/release copy out of the initial browser graph: boot needs
 * only the development label and the separately authorized production pointer.
 */
import VERSION_DATA from '../../../version.json';

export const V2_DEVELOPMENT_VERSION = VERSION_DATA.version;

/** No v2 production release has been authorized or shipped. */
export const V2_CURRENT_RELEASE_VERSION: string | null = null;
