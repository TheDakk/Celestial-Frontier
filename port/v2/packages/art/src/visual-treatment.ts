/* Pure visual grading identity shared by the live universe, biome, species
   and ship finishers. It declares finite appearance tokens only; renderer
   allocation and product preferences remain with their owning consumers. */

export const VISUAL_TREATMENT_SCOPES_V1 = Object.freeze([
  'galaxy', 'system', 'planet', 'biome', 'species', 'ship',
] as const);
export type VisualTreatmentScopeV1 = typeof VISUAL_TREATMENT_SCOPES_V1[number];

export const VISUAL_TREATMENT_LEVELS_V1 = Object.freeze(['identity', 'polished'] as const);
export type VisualTreatmentLevelV1 = typeof VISUAL_TREATMENT_LEVELS_V1[number];

export const VISUAL_TREATMENT_AXES_V1 = Object.freeze([
  'color', 'contrast', 'lighting', 'material', 'atmosphere',
] as const);
export type VisualTreatmentAxisV1 = typeof VISUAL_TREATMENT_AXES_V1[number];
export type VisualTreatmentGradeV1 = Readonly<Record<VisualTreatmentAxisV1, VisualTreatmentLevelV1>>;

export interface VisualTreatmentIdentityV1 {
  readonly scope: VisualTreatmentScopeV1;
  readonly key: string;
}

export interface VisualTreatmentV1 {
  readonly schema: 'cf.art.visual-treatment.v1';
  readonly identity: VisualTreatmentIdentityV1;
  readonly grade: VisualTreatmentGradeV1;
}

export type VisualTreatmentGradeInputV1 = Partial<Record<VisualTreatmentAxisV1, VisualTreatmentLevelV1>>;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export const IDENTITY_VISUAL_TREATMENT_GRADE_V1: VisualTreatmentGradeV1 = deepFreeze({
  color: 'identity',
  contrast: 'identity',
  lighting: 'identity',
  material: 'identity',
  atmosphere: 'identity',
});

function checkedScope(value: unknown): VisualTreatmentScopeV1 {
  if (typeof value !== 'string' || !VISUAL_TREATMENT_SCOPES_V1.includes(value as VisualTreatmentScopeV1)) {
    throw new TypeError('visual treatment: invalid scope');
  }
  return value as VisualTreatmentScopeV1;
}

function checkedKey(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512
    || value.trim() !== value || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError('visual treatment: identity key must be one exact nonblank token');
  }
  return value;
}

function checkedGrade(value: unknown): VisualTreatmentGradeV1 {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('visual treatment: grade input must be an object');
  }
  const source = value as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    if (!VISUAL_TREATMENT_AXES_V1.includes(key as VisualTreatmentAxisV1)) {
      throw new TypeError(`visual treatment: unexpected grade axis ${key}`);
    }
  }
  const grade = Object.fromEntries(VISUAL_TREATMENT_AXES_V1.map((axis) => {
    const level = source[axis] ?? IDENTITY_VISUAL_TREATMENT_GRADE_V1[axis];
    if (typeof level !== 'string' || !VISUAL_TREATMENT_LEVELS_V1.includes(level as VisualTreatmentLevelV1)) {
      throw new TypeError(`visual treatment: invalid ${axis} level`);
    }
    return [axis, level];
  })) as Record<VisualTreatmentAxisV1, VisualTreatmentLevelV1>;
  return deepFreeze(grade);
}

/** Every output variation is owned by the explicit arguments. Omitting an
 * appearance axis selects the recursively immutable identity/no-op default. */
export function createVisualTreatmentV1(
  identity: Readonly<{ scope: VisualTreatmentScopeV1; key: string }>,
  grade: VisualTreatmentGradeInputV1 = IDENTITY_VISUAL_TREATMENT_GRADE_V1,
): VisualTreatmentV1 {
  if (identity === null || typeof identity !== 'object' || Array.isArray(identity)) {
    throw new TypeError('visual treatment: identity input must be an object');
  }
  const identityFields = Object.keys(identity).sort();
  if (JSON.stringify(identityFields) !== JSON.stringify(['key', 'scope'])) {
    throw new TypeError('visual treatment: identity input has the wrong fields');
  }
  return deepFreeze({
    schema: 'cf.art.visual-treatment.v1' as const,
    identity: { scope: checkedScope(identity.scope), key: checkedKey(identity.key) },
    grade: checkedGrade(grade),
  });
}
