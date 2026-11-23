import type { ContentRegistry } from '@cf/persistence';
import REGISTRY_JSON from '../../../../fixtures/v1/content-registry.json';

/** The content limits a save is validated against when it is read or written. */
export const REGISTRY = REGISTRY_JSON as unknown as ContentRegistry;
