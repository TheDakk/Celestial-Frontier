import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const sliceSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);
const mainSource = readFileSync(
  new URL('../apps/game/src/main.ts', import.meta.url),
  'utf8',
);
const atlasPanelSource = readFileSync(
  new URL('../apps/game/src/star-atlas-panel.ts', import.meta.url),
  'utf8',
);
const indexSource = readFileSync(
  new URL('../apps/game/index.html', import.meta.url),
  'utf8',
);

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  expect(at, `missing section start: ${start}`).toBeGreaterThanOrEqual(0);
  expect(stop, `missing section end: ${end}`).toBeGreaterThan(at);
  return source.slice(at, stop);
}

function executableDeclaration<T>(name: string, nextDeclaration: string): T {
  const prefix = `const ${name} = `;
  const owner = section(sliceSource, prefix, nextDeclaration);
  const expression = owner.slice(prefix.length).trim().replace(/;\s*$/u, '');
  return Function(`return (${expression});`)() as T;
}

interface AtlasTravelObservation {
  settled: boolean;
  panelOpen: string | null;
  panelScrollTop: number | null;
  row: {
    exists: boolean;
    id: string | null;
    tag: string | null;
    interactive: boolean | null;
    travelCount: number;
    favoriteCount: number;
  };
  travel: {
    exists: boolean;
    id: string | null;
    tag: string | null;
    type: string | null;
    disabled: boolean | null;
    ariaDisabled: string | null;
    ariaLabel: string | null;
    rendered: boolean;
    width: number;
    height: number;
    x: number | null;
    y: number | null;
    hit: boolean;
    focus: boolean;
  };
}

interface AtlasTravelAssessment {
  readonly ok: boolean;
  readonly checks: Readonly<Record<string, boolean>>;
}

type AssessAtlasTravelTarget = (
  observation: AtlasTravelObservation | null,
  options?: {
    atlasId?: string;
    enabled?: boolean;
    focus?: boolean;
    panelOpen?: string;
    requireHit?: boolean;
  },
) => AtlasTravelAssessment;

type AssessAtlasKeyReceipt = (
  receipt: Record<string, unknown> | null,
  options: { atlasId: string; key: string; code: string },
) => AtlasTravelAssessment;

type AssessAtlasPointerPress = (
  press: Record<string, any> | null,
  options: { atlasId: string },
) => AtlasTravelAssessment;

type AssessAtlasOpenerPress = (
  press: Record<string, any> | null,
  options?: { ids?: string[] },
) => AtlasTravelAssessment;

type AtlasTravelTargetExpression = (
  atlasId: string,
  options?: { scroll?: boolean; focus?: boolean },
) => string;

const assessAtlasTravelTarget = executableDeclaration<AssessAtlasTravelTarget>(
  'assessAtlasTravelTarget',
  'const assessAtlasKeyReceipt = (',
);
const assessAtlasKeyReceipt = executableDeclaration<AssessAtlasKeyReceipt>(
  'assessAtlasKeyReceipt',
  'const assessAtlasPointerPress = (',
);
const assessAtlasPointerPress = executableDeclaration<AssessAtlasPointerPress>(
  'assessAtlasPointerPress',
  'const assessAtlasOpenerPress = (',
);
const assessAtlasOpenerPress = executableDeclaration<AssessAtlasOpenerPress>(
  'assessAtlasOpenerPress',
  'const assessArc2InventoryReload = (',
);
const atlasTravelTargetExpression = executableDeclaration<AtlasTravelTargetExpression>(
  'atlasTravelTargetExpression',
  'const assessAtlasTravelTarget = (',
);

function greenAtlasTravelObservation(): AtlasTravelObservation {
  return {
    settled: true,
    panelOpen: 'atlas',
    panelScrollTop: 244,
    row: {
      exists: true,
      id: 'p133',
      tag: 'DIV',
      interactive: false,
      travelCount: 1,
      favoriteCount: 1,
    },
    travel: {
      exists: true,
      id: 'p133',
      tag: 'BUTTON',
      type: 'button',
      disabled: false,
      ariaDisabled: null,
      ariaLabel: 'Travel to Homeworld',
      rendered: true,
      width: 96,
      height: 44,
      x: 280,
      y: 420,
      hit: true,
      focus: true,
    },
  };
}

describe('Slice Atlas native Travel contract', () => {
  it('requires the intended native Records control at all three collision panel boundaries', () => {
    const press = {
      target: { settled: true, tag: 'BUTTON', type: 'button', id: 'dockrecords', hit: true,
        width: 44, height: 44, x: 634, y: 566 },
      pointer: { trusted: true, pointerType: 'mouse', tag: 'BUTTON', id: 'dockrecords',
        atlasTravelId: null, atlasRowId: null, x: 634, y: 566 },
    };
    const assess = (value: typeof press | null) => assessAtlasOpenerPress(value, { ids: ['dockrecords'] }).ok;
    expect(assess(press)).toBe(true);
    expect(assess(null)).toBe(false);
    expect(assess({ ...press, target: { ...press.target, id: 'railrecords' },
      pointer: { ...press.pointer, id: 'railrecords' } })).toBe(false);
    expect(assess({ ...press, target: { ...press.target, hit: false } })).toBe(false);
    expect(assess({ ...press, pointer: { ...press.pointer, trusted: false } })).toBe(false);
    expect(assess({ ...press, pointer: { ...press.pointer, id: 'docksets' } })).toBe(false);
    expect(assess({ ...press, pointer: { ...press.pointer, x: 650 } })).toBe(false);
    expect(assess(press)).toBe(true);
    const owner = section(sliceSource, '  const collisionSetup = collisionFixtureReady.state;',
      '  const collisionAssessment = assessCollisionWorldOutcome(collisionBundle);');
    expect(owner).toContain("nativeControlClick(collisionTarget.session, '#dockrecords')");
    expect(owner).toContain("assessAtlasOpenerPress(press, { ids: ['dockrecords'] })");
    expect(owner).toContain('if (!assessment.ok)');
    expect(owner).toContain('collisionRecordsPresses.push({ label, ...press })');
    for (const label of ['baseline open', 'baseline close', 'reload open']) {
      expect(owner.split(`pressCollisionRecords('${label}')`)).toHaveLength(2);
    }
    expect(owner).toContain('window.__CF_SLICE__.api.state().panelOpen===null');
    expect(owner).toContain('native Records close ${JSON.stringify(collisionRecordsClosePress)}');
    expect(owner).toContain('recordsPresses: collisionRecordsPresses');
    expect(owner).not.toContain("'#railrecords,#dockrecords'");
  });

  it('observes hidden duplicate rail copies and rejects each painted copy before exact restoration', () => {
    const assess = executableDeclaration<(rows: unknown) => boolean>(
      'collisionRailCopiesHidden', '  const collisionRailCopiesExpression =');
    const baseline = ['railinventory', 'railrecords'].map((id) => ({ id, exists: true,
      parentId: 'railrgt', display: 'none', rectCount: 0, width: 0, height: 0, painted: false }));
    expect(assess(baseline)).toBe(true);
    expect(assess([])).toBe(false);
    expect(assess(null)).toBe(false);
    expect(assess([baseline[0], baseline[0]])).toBe(false);
    for (const index of [0, 1]) {
      const exposed = structuredClone(baseline);
      exposed[index] = { ...exposed[index]!, display: 'flex', rectCount: 1, width: 92, height: 44, painted: true };
      expect(assess(exposed)).toBe(false);
      expect(assess(baseline)).toBe(true);
      for (const [key, value] of [['exists', false], ['parentId', 'dock'], ['width', 44],
        ['rectCount', 1], ['painted', true]] as const) {
        const mutant = structuredClone(baseline);
        Object.assign(mutant[index]!, { [key]: value });
        expect(assess(mutant), `${index}/${key}`).toBe(false);
      }
    }
    const read = section(sliceSource, '  const collisionRailCopiesExpression =',
      '  /* Outcome-level collision proof.');
    expect(read).toContain('getComputedStyle(element)');
    expect(read).toContain('element?.getBoundingClientRect()');
    expect(read).toContain('element?.getClientRects().length');
    const control = section(sliceSource, '  const collisionRailBaseline =',
      '  const collisionRecordsPresses = [];');
    expect(control).toContain('if (!collisionRailCopiesHidden(collisionRailBaseline))');
    expect(control).toContain("for (const id of ['railinventory', 'railrecords'])");
    expect(control).toContain("element.style.setProperty('display','flex','important')");
    expect(control).toContain("finally{element.setAttribute('style','');element.removeAttribute('style');if(priorStyle.present)element.setAttribute('style',priorStyle.value);}");
    expect(control).toContain('styleRestored:restoredStyle.present===priorStyle.present&&restoredStyle.value===priorStyle.value');
    expect(control).toContain("shown?.painted !== true || shown.display !== 'flex'");
    expect(control).toContain('!collisionRailCopiesHidden(control.restored)');
    expect(control).toContain('JSON.stringify(control.restored) !== JSON.stringify(collisionRailBaseline)');
  });

  it('restores the complete absent, empty or nonempty rail style carrier after showing one copy', () => {
    const require = createRequire(import.meta.url);
    const { JSDOM } = require('jsdom') as {
      JSDOM: new (html: string, options: Record<string, unknown>) => {
        window: { document: Document; eval(source: string): unknown; close(): void };
      };
    };
    const readOwner = section(sliceSource, '  const collisionRailCopiesExpression =',
      '  /* Outcome-level collision proof.');
    const read = Function(`${readOwner}; return collisionRailCopiesExpression;`)() as string;
    const controlOwner = section(sliceSource,
      '    const control = await evalF4Control(collisionTarget.session, `(()=>{',
      '    const shown = control.shown.find');
    for (const value of [null, '', 'color: red; --u1-probe: 7; ', 'display: none !important;']) {
      const dom = new JSDOM('<style>#railrgt button{display:none}</style><nav id="railrgt"><button id="railinventory">Inventory</button><button id="railrecords">Records</button></nav>',
        { runScripts: 'outside-only' });
      const element = dom.window.document.getElementById('railinventory')!;
      if (value !== null) element.setAttribute('style', value);
      const prior = { present: value !== null, value };
      // The browser control is synchronous inside Runtime.evaluate; replacing
      // its await wrapper here lets this test exercise that exact DOM body.
      const body = controlOwner.slice(controlOwner.indexOf('`') + 1, controlOwner.lastIndexOf('`'));
      const expression = Function('id', 'collisionRailCopiesExpression', `return \`${body}\`;`)(
        'railinventory', read) as string;
      try {
        const control = dom.window.eval(expression) as {
          priorStyle: typeof prior; restoredStyle: typeof prior; styleRestored: boolean;
          shown: Array<{ id: string; display: string }>; restored: Array<{ id: string; display: string }>;
        };
        expect(control.priorStyle).toEqual(prior);
        expect(control.restoredStyle).toEqual(prior);
        expect(control.styleRestored).toBe(true);
        expect(element.hasAttribute('style')).toBe(prior.present);
        expect(element.getAttribute('style')).toBe(value);
        expect(control.shown.find((row) => row.id === 'railinventory')?.display).toBe('flex');
        expect(control.shown.find((row) => row.id === 'railrecords')?.display).toBe('none');
        expect(control.restored.every((row) => row.display === 'none')).toBe(true);
        element.style.setProperty('display', 'flex', 'important');
        expect(element.getAttribute('style')).not.toBe(value);
      } finally { dom.window.close(); }
    }
  });

  it('requires a native Survey close with unchanged document and selected route before each collision Atlas open', () => {
    const closeOwner = section(sliceSource, '  const assessCollisionSurveyClosure =',
      '  const collisionSurveyStateExpression =');
    const assess = Function('assessAtlasOpenerPress', `${closeOwner};return assessCollisionSurveyClosure;`)(
      assessAtlasOpenerPress) as (evidence: unknown) => boolean;
    const before = { documentToken: 'collision-document', cardOpen: true, display: 'block',
      ariaHidden: 'false', expanded: 'true', route: { mode: 'system', gal: 3, star: 4, planet: null,
        planetOrdinal: null, navGalaxyKey: 'galaxy-3', navStarKey: 'exact-star-4', navWorldKey: null,
        galX: 90, galY: -60, starX: 100, starY: 200, cardTitle: 'Alpha world', panelOpen: null } };
    const after = { ...before, cardOpen: false, display: 'none', ariaHidden: 'true', expanded: 'false' };
    const press = { target: { settled: true, tag: 'BUTTON', type: 'button', id: 'docksurvey',
      hit: true, width: 82, height: 44, x: 520, y: 270 },
    pointer: { trusted: true, pointerType: 'mouse', tag: 'BUTTON', id: 'docksurvey',
      atlasTravelId: null, atlasRowId: null, x: 520, y: 270 } };
    const evidence = { before, after, press };
    expect(assess(evidence)).toBe(true);
    expect(assess({ before: after, after, press: null })).toBe(true);
    expect(assess({ before: after, after, press })).toBe(false);
    expect(assess({ ...evidence, press: null })).toBe(false);
    expect(assess({ ...evidence, press: { ...press,
      pointer: { ...press.pointer, trusted: false } } })).toBe(false);
    expect(assess({ ...evidence, press: { ...press,
      target: { ...press.target, hit: false } } })).toBe(false);
    expect(assess({ ...evidence, press: { ...press,
      pointer: { ...press.pointer, id: 'dockcharts' } } })).toBe(false);
    expect(assess({ ...evidence, press: { ...press,
      pointer: { ...press.pointer, x: press.pointer.x + 2 } } })).toBe(false);
    expect(assess({ ...evidence, after: { ...after, documentToken: 'replacement-document' } })).toBe(false);
    expect(assess({ ...evidence, after: { ...after, cardOpen: true } })).toBe(false);
    expect(assess({ ...evidence, after: { ...after, display: 'block' } })).toBe(false);
    expect(assess({ ...evidence, after: { ...after, expanded: 'true' } })).toBe(false);
    expect(assess({ ...evidence, after: { ...after, ariaHidden: 'false' } })).toBe(false);
    for (const key of Object.keys(before.route)) {
      expect(assess({ ...evidence, after: { ...after, route: { ...after.route, [key]: 'changed' } } }), key).toBe(false);
    }
    expect(assess({ ...evidence, before: { ...before, route: {} }, after: { ...after, route: {} } })).toBe(false);
    expect(assess(evidence)).toBe(true);
    const owner = section(sliceSource, '  const collisionAtlasOpeners = [];',
      '  const collisionReloadSearches = [];');
    expect(owner).toContain("nativeControlClick(collisionTarget.session, '#docksurvey')");
    expect(owner).toContain("assessAtlasOpenerPress(press, { ids: ['docksurvey'] })");
    expect(owner).toContain('if (before.cardOpen === true)');
    expect(owner).toContain('if (!assessment.ok)');
    expect(owner).toContain('if (!assessCollisionSurveyClosure(evidence))');
    expect(owner).toContain('collisionSurveyCloses.push(evidence)');
    expect(owner).not.toContain('.click()');
    expect(owner.indexOf("await closeCollisionSurveyForAtlas('initial open')"))
      .toBeLessThan(owner.indexOf('const collisionAtlasOpening = await nativeControlClick('));
    expect(owner.indexOf('await closeCollisionSurveyForAtlas(`reopen ${index}`)'))
      .toBeLessThan(owner.indexOf('const reopen = await nativeControlClick('));
    expect(owner.indexOf('const reopenAssessment = assessAtlasOpenerPress(reopen)'))
      .toBeLessThan(owner.indexOf('const pressAssessment = assessAtlasPointerPress(press, { atlasId })'));
    expect(sliceSource).toContain('surveyCloses: collisionSurveyCloses');
  });

  it('declares both native Atlas openers as non-submit buttons', () => {
    const markupErrors = (source: string): string[] => ['railatlas', 'dockatlas'].filter((id) => (
      source.split(`<button id="${id}" type="button"`).length - 1 !== 1
    ));
    expect(markupErrors(indexSource)).toEqual([]);
    for (const id of ['railatlas', 'dockatlas']) {
      const mutant = indexSource.replace(
        `<button id="${id}" type="button"`,
        `<button id="${id}"`,
      );
      expect(markupErrors(mutant)).toContain(id);
    }
  });

  it('keeps row identity separate from the exact enabled or disabled Travel action', () => {
    const green = greenAtlasTravelObservation();
    expect(assessAtlasTravelTarget(green, { atlasId: 'p133', focus: true })).toMatchObject({
      ok: true,
    });

    const disabled = structuredClone(green);
    disabled.travel.disabled = true;
    disabled.travel.ariaDisabled = 'true';
    disabled.travel.focus = false;
    expect(assessAtlasTravelTarget(disabled, {
      atlasId: 'p133', enabled: false,
    })).toMatchObject({ ok: true });
    expect(assessAtlasTravelTarget(disabled, { atlasId: 'p133' }).ok).toBe(false);
    expect(assessAtlasTravelTarget(green, { atlasId: 'p133', enabled: false }).ok).toBe(false);

    const mutations: ReadonlyArray<readonly [string, (value: AtlasTravelObservation) => void]> = [
      ['unsettled', (value) => { value.settled = false; }],
      ['wrong panel', (value) => { value.panelOpen = 'inventory'; }],
      ['missing row', (value) => { value.row.exists = false; }],
      ['wrong row identity', (value) => { value.row.id = 'outer-galaxy'; }],
      ['interactive row', (value) => { value.row.interactive = true; }],
      ['button row', (value) => { value.row.tag = 'BUTTON'; }],
      ['duplicate Travel action', (value) => { value.row.travelCount = 2; }],
      ['missing Favorite sibling', (value) => { value.row.favoriteCount = 0; }],
      ['missing Travel action', (value) => { value.travel.exists = false; }],
      ['wrong Travel identity', (value) => { value.travel.id = 'outer-galaxy'; }],
      ['non-native Travel action', (value) => { value.travel.tag = 'DIV'; }],
      ['submit Travel action', (value) => { value.travel.type = 'submit'; }],
      ['disabled enabled-route action', (value) => { value.travel.disabled = true; }],
      ['ARIA-disabled enabled route', (value) => { value.travel.ariaDisabled = 'true'; }],
      ['missing accessible name', (value) => { value.travel.ariaLabel = 'Homeworld'; }],
      ['unrendered Travel action', (value) => { value.travel.rendered = false; }],
      ['zero-width Travel action', (value) => { value.travel.width = 0; }],
      ['undersized Travel action', (value) => { value.travel.height = 43; }],
      ['non-finite x coordinate', (value) => { value.travel.x = null; }],
      ['non-finite y coordinate', (value) => { value.travel.y = null; }],
      ['failed native hit-test', (value) => { value.travel.hit = false; }],
      ['lost keyboard focus', (value) => { value.travel.focus = false; }],
    ];
    for (const [label, mutate] of mutations) {
      const mutant = structuredClone(green);
      mutate(mutant);
      expect(
        assessAtlasTravelTarget(mutant, { atlasId: 'p133', focus: true }).ok,
        label,
      ).toBe(false);
      expect(
        assessAtlasTravelTarget(green, { atlasId: 'p133', focus: true }).ok,
        `${label} restoration`,
      ).toBe(true);
    }
    const hitOptional = structuredClone(green);
    hitOptional.travel.hit = false;
    expect(assessAtlasTravelTarget(hitOptional, {
      atlasId: 'p133', focus: true, requireHit: false,
    }).ok).toBe(true);
  });

  it('binds trusted keyboard and pointer receipts to the exact child action and parent row', () => {
    const keyReceipt = {
      trusted: true, key: 'Enter', code: 'Enter', repeat: false,
      tag: 'BUTTON', atlasTravelId: 'p133', atlasRowId: 'p133',
    };
    expect(assessAtlasKeyReceipt(keyReceipt, {
      atlasId: 'p133', key: 'Enter', code: 'Enter',
    }).ok).toBe(true);
    for (const [label, field, value] of [
      ['untrusted', 'trusted', false],
      ['wrong key', 'key', 'Space'],
      ['wrong code', 'code', 'Space'],
      ['repeat', 'repeat', true],
      ['wrapper role', 'tag', 'DIV'],
      ['wrong action', 'atlasTravelId', 'outer-galaxy'],
      ['wrong row', 'atlasRowId', 'outer-galaxy'],
    ] as const) {
      expect(assessAtlasKeyReceipt({ ...keyReceipt, [field]: value }, {
        atlasId: 'p133', key: 'Enter', code: 'Enter',
      }).ok, label).toBe(false);
    }
    expect(assessAtlasKeyReceipt(null, {
      atlasId: 'p133', key: 'Enter', code: 'Enter',
    }).ok).toBe(false);

    const atlasPress = {
      target: {
        settled: true, x: 200, y: 300, width: 96, height: 44,
        id: null, tag: 'BUTTON', type: 'button', atlasTravelId: 'p133',
        atlasRowId: 'p133', hit: true,
      },
      pointer: {
        trusted: true, pointerType: 'mouse', tag: 'BUTTON', id: 'p133',
        atlasTravelId: 'p133', atlasRowId: 'p133', x: 200, y: 300,
      },
    };
    expect(assessAtlasPointerPress(atlasPress, { atlasId: 'p133' }).ok).toBe(true);
    for (const mutate of [
      (value: typeof atlasPress) => { value.target.tag = 'DIV'; },
      (value: typeof atlasPress) => { value.target.type = 'submit'; },
      (value: typeof atlasPress) => { value.target.atlasTravelId = 'outer-galaxy'; },
      (value: typeof atlasPress) => { value.target.atlasRowId = 'outer-galaxy'; },
      (value: typeof atlasPress) => { value.target.height = 43; },
      (value: typeof atlasPress) => { value.target.hit = false; },
      (value: typeof atlasPress) => { value.pointer.trusted = false; },
      (value: typeof atlasPress) => { value.pointer.id = 'outer-galaxy'; },
      (value: typeof atlasPress) => { value.pointer.atlasTravelId = 'outer-galaxy'; },
      (value: typeof atlasPress) => { value.pointer.atlasRowId = 'outer-galaxy'; },
      (value: typeof atlasPress) => { value.pointer.x += 2; },
    ]) {
      const mutant = structuredClone(atlasPress);
      mutate(mutant);
      expect(assessAtlasPointerPress(mutant, { atlasId: 'p133' }).ok).toBe(false);
    }

    const openerPress = {
      target: {
        settled: true, x: 80, y: 240, width: 48, height: 48,
        id: 'railatlas', tag: 'BUTTON', type: 'button',
        atlasTravelId: null, atlasRowId: null, hit: true,
      },
      pointer: {
        trusted: true, pointerType: 'mouse', tag: 'BUTTON', id: 'railatlas',
        atlasTravelId: null, atlasRowId: null, x: 80, y: 240,
      },
    };
    expect(assessAtlasOpenerPress(openerPress).ok).toBe(true);
    expect(assessAtlasOpenerPress({ ...openerPress,
      pointer: { ...openerPress.pointer, id: 'railrecords' },
    }).ok).toBe(false);
    expect(assessAtlasOpenerPress({ ...openerPress,
      target: { ...openerPress.target, id: 'railrecords' },
    }).ok).toBe(false);
  });

  it('emits an exact child-action query with scroll settlement, hit-test, and optional focus', () => {
    const expression = atlasTravelTargetExpression('w|galaxy:7|star:9|planet:11', { focus: true });
    expect(expression).toContain('#atlaspanel [data-sel="atlas-entry"][data-aid]');
    expect(expression).toContain(':scope > .atlas-entry-actions > [data-atlas-travel]');
    expect(expression).toContain("candidate.getAttribute('data-aid')===\"w|galaxy:7|star:9|planet:11\"");
    expect(expression).toContain("candidate.getAttribute('data-atlas-travel')===\"w|galaxy:7|star:9|planet:11\"");
    expect(expression).toContain("scrollIntoView({block:'center',inline:'nearest',behavior:'auto'})");
    expect(expression).toContain('requestAnimationFrame(()=>setTimeout(resolve,0))');
    expect(expression).toContain('document.elementFromPoint(x,y)');
    expect(expression).toContain('travel?.focus();');
    expect(() => Function(`return (${expression});`)).not.toThrow();

    const escaped = atlasTravelTargetExpression('quoted " route', { scroll: false });
    expect(escaped).not.toContain('scrollIntoView');
    expect(escaped).not.toContain('travel?.focus();');
    expect(() => Function(`return (${escaped});`)).not.toThrow();
  });

  it('binds every repaired Atlas path to the native child action and rejects stale wrapper activation', () => {
    const rowMarkup = section(
      atlasPanelSource,
      '      return `<div class="centry atlas-entry',
      '\n        + `<div class="atlas-entry-copy"',
    );
    expect(rowMarkup).toContain('role="listitem"');
    expect(rowMarkup).toContain('data-sel="atlas-entry"');
    expect(rowMarkup).toContain('data-aid="${escapeHtml(row.id)}"');
    expect(rowMarkup).toContain('data-atlas-id="${escapeHtml(row.id)}"');
    expect(atlasPanelSource).toContain('<button type="button" data-atlas-travel="${escapeHtml(row.id)}"');
    expect(mainSource).toContain("fillPanel('atlas', renderStarAtlasV1(projection, {");
    expect(mainSource).toContain("const travelButton = event.target.closest<HTMLButtonElement>(\n    '[data-atlas-travel],[data-atlas-travel-home]',\n  );");

    const authorization = section(
      sliceSource,
      "  await evalIn(`document.getElementById('railatlas')?.click()`);",
      '  if (outerAtlasAfter.panelOpen === \'atlas\') await closeDesktopPanel();',
    );
    expect(authorization).toContain("atlasTravelTargetExpression('outer-galaxy')");
    expect(authorization).toContain("pointer.atlasTravelId === 'outer-galaxy'");
    expect(authorization).toContain("pointer.atlasRowId === 'outer-galaxy'");
    expect(authorization).toContain('wrapperBecomesAction: atlasAuthControl');
    expect(authorization).toContain('unhitTarget: atlasAuthControl');
    expect(authorization).toContain('coordinateDrift: atlasAuthControl');
    expect(authorization).toContain('if (outerAtlasTargetAssessment.ok && !outerAtlasAuthorization.ok)');
    expect(authorization).not.toContain('outerAtlasSetup.row');

    const inventoryReload = section(
      sliceSource,
      "      const atlasPreClick = await evalIn(railButtonPoint('railatlas'));",
      '  const inventorySuccessorBoundary = assessArc2InventorySuccessorBoundary({',
    );
    expect(inventoryReload).toContain("atlasTarget: await evalIn(atlasTravelTargetExpression('p133'))");
    expect(inventoryReload).toContain('surface.atlasTarget.settled = false');
    expect(inventoryReload).toContain('surface.atlasTarget.row.tag = \'BUTTON\'');
    expect(inventoryReload).toContain('surface.atlasTarget.travel.tag = \'DIV\'');
    expect(inventoryReload).toContain("surface.atlasTarget.travel.ariaDisabled = 'true'");
    expect(inventoryReload).toContain('surface.atlasTarget.travel.hit = false');
    expect(inventoryReload).not.toContain('surface.atlasRow');

    const dtrain = section(
      sliceSource,
      '  /* The restored checkpoint Earth row must be bound to the final-import entry,',
      '  /* Opposite arbitration direction: Import claims first while waiting on an',
    );
    expect(dtrain).toContain('atlasTravelTargetExpression(dtrainAtlasId, { focus: true })');
    expect(dtrain).toContain('assessAtlasTravelTarget(atlasSetup, {');
    expect(dtrain).toContain('D-TRAIN EARTH ATLAS SETUP: red exact Travel target stopped keyboard travel and Land');
    expect(dtrain).toContain('await armDesktopAtlasKeyReceipt();');
    expect(dtrain).toContain('assessAtlasKeyReceipt(atlasKeyReceipt, {');
    expect(dtrain).toContain('.catch(() => null);');
    const dtrainSetupGuardAt = dtrain.indexOf('D-TRAIN EARTH ATLAS SETUP: red exact Travel target stopped keyboard travel and Land');
    const dtrainArmAt = dtrain.indexOf('await armDesktopAtlasKeyReceipt();');
    const dtrainDispatchAt = dtrain.indexOf("await dispatchKeyPress(sess, 'Enter', 'Enter');");
    const dtrainTakeAt = dtrain.indexOf('const atlasKeyReceipt = await takeDesktopAtlasKeyReceipt();');
    const dtrainWaitAt = dtrain.indexOf("waitDesktopValue('D-TRAIN canonical Earth Atlas travel'");
    expect([
      dtrainSetupGuardAt, dtrainArmAt, dtrainDispatchAt, dtrainTakeAt, dtrainWaitAt,
    ]).not.toContain(-1);
    expect(dtrainSetupGuardAt).toBeLessThan(dtrainArmAt);
    expect(dtrainArmAt).toBeLessThan(dtrainDispatchAt);
    expect(dtrainDispatchAt).toBeLessThan(dtrainTakeAt);
    expect(dtrainTakeAt).toBeLessThan(dtrainWaitAt);
    expect(dtrain).not.toContain("querySelector('#atlaspanel [data-aid=");

    const keyboard = section(
      sliceSource,
      '  /* The Star Atlas uses the same native contract, but its outcome is travel:',
      '  /* 4c-records. Records over the real save:',
    );
    expect(keyboard).toContain("atlasTravelTargetExpression('p133', { focus: true })");
    expect(keyboard).toContain("atlasTravelTargetExpression(id)");
    expect(keyboard).toContain('data-atlas-travel="p133"');
    expect(keyboard).toContain("row.pointer.atlasTravelId !== row.id");
    expect(keyboard).toContain('ATLAS KEYBOARD SETUP: red exact Travel target stopped disabled-route and keyboard judgments');
    expect(keyboard).toContain('ATLAS SPACE SETUP: red restored Travel target stopped key dispatch and dependent Enter');
    expect(keyboard).toContain('ATLAS ENTER SETUP: red restored Travel target stopped key dispatch');
    expect(keyboard.match(/await armDesktopAtlasKeyReceipt\(\);/gu)).toHaveLength(2);
    expect(keyboard).toContain('assessAtlasKeyReceipt(atlasSpaceKeyReceipt, {');
    expect(keyboard).toContain('assessAtlasKeyReceipt(atlasEnterKeyReceipt, {');
    expect(keyboard).toContain('atlasKeyReceiptControls.some((control) => control.ok)');
    const initialGuardAt = keyboard.indexOf('ATLAS KEYBOARD SETUP: red exact Travel target stopped disabled-route and keyboard judgments');
    const disabledScopeAt = keyboard.indexOf('const unavailableAtlasRawBefore');
    const spaceSetupGuardAt = keyboard.indexOf('ATLAS SPACE SETUP: red restored Travel target stopped key dispatch and dependent Enter');
    const spaceArmAt = keyboard.indexOf('await armDesktopAtlasKeyReceipt();');
    const spaceDispatchAt = keyboard.indexOf("await keyIn(' ', 'Space');");
    const spaceTakeAt = keyboard.indexOf('const atlasSpaceKeyReceipt = await takeDesktopAtlasKeyReceipt();');
    const spaceWaitAt = keyboard.indexOf("waitDesktopValue('Atlas Space travel'");
    const spaceOutcomeGuardAt = keyboard.indexOf('ATLAS SPACE TRAVEL: red exact key receipt/outcome stopped dependent Enter');
    const enterReopenAt = keyboard.indexOf("const opener=document.getElementById('railatlas')", spaceOutcomeGuardAt);
    const enterSetupGuardAt = keyboard.indexOf('ATLAS ENTER SETUP: red restored Travel target stopped key dispatch');
    const enterArmAt = keyboard.indexOf('await armDesktopAtlasKeyReceipt();', spaceArmAt + 1);
    const enterDispatchAt = keyboard.indexOf("await keyIn('Enter', 'Enter');", enterArmAt);
    const enterTakeAt = keyboard.indexOf('const atlasEnterKeyReceipt = await takeDesktopAtlasKeyReceipt();');
    const enterWaitAt = keyboard.indexOf("waitDesktopValue('Atlas Enter travel'");
    expect([
      initialGuardAt, disabledScopeAt, spaceSetupGuardAt, spaceArmAt, spaceDispatchAt,
      spaceTakeAt, spaceWaitAt, spaceOutcomeGuardAt, enterReopenAt, enterSetupGuardAt,
      enterArmAt, enterDispatchAt, enterTakeAt, enterWaitAt,
    ]).not.toContain(-1);
    expect(initialGuardAt).toBeLessThan(disabledScopeAt);
    expect(spaceSetupGuardAt).toBeLessThan(spaceArmAt);
    expect(spaceArmAt).toBeLessThan(spaceDispatchAt);
    expect(spaceDispatchAt).toBeLessThan(spaceTakeAt);
    expect(spaceTakeAt).toBeLessThan(spaceWaitAt);
    expect(spaceOutcomeGuardAt).toBeLessThan(enterReopenAt);
    expect(enterSetupGuardAt).toBeLessThan(enterArmAt);
    expect(enterArmAt).toBeLessThan(enterDispatchAt);
    expect(enterDispatchAt).toBeLessThan(enterTakeAt);
    expect(enterTakeAt).toBeLessThan(enterWaitAt);
    expect(keyboard).not.toContain('atlasRowCheck');
    expect(keyboard).not.toContain("row?.tagName==='BUTTON'");
    expect(keyboard).not.toContain('row?.click()');

    const nativeClick = section(
      sliceSource,
      '  const nativeControlClick = async (session, selector) => {',
      '  const openF4WritableShipyard = async (session, label) => {',
    );
    expect(nativeClick).toContain("event.target.closest('[data-atlas-travel]')");
    expect(nativeClick).toContain("scrollIntoView({block:'center',inline:'nearest',behavior:'auto'})");
    expect(nativeClick).toContain('requestAnimationFrame(()=>setTimeout(resolve,0))');
    expect(nativeClick).toContain('return {settled:true,x,y,width:rect.width,height:rect.height,id:control.id||null,tag:control.tagName');
    expect(nativeClick).toContain('type:control instanceof HTMLButtonElement?control.type:null');
    expect(nativeClick).toContain("atlasTravelId:control.getAttribute('data-atlas-travel')");
    expect(nativeClick).toContain('x:event.clientX,y:event.clientY');

    const collision = section(
      sliceSource,
      '  const collisionAtlasOpeners = [];',
      '  /* F4 app-level storage failure.',
    );
    expect(collision).toContain("travel=row.querySelector(':scope > .atlas-entry-actions > [data-atlas-travel]')");
    expect(collision).toContain('> .atlas-entry-actions > [data-atlas-travel=');
    expect(collision).toContain('atlasPointerIdentityDrift: collisionControl');
    expect(collision).toContain('atlasPointerCoordinateDrift: collisionControl');
    expect(collision).toContain('candidate.atlasTravel[1]?.pointer?.atlasTravelId');
    expect(collision).toContain('pointer identity mutant lacked two distinct measured Travel receipts');
    expect(collision).not.toContain('candidate.atlasTravel[0].pointer.atlasTravelId = candidate.atlas.rows[1].travelId');
    expect(collision).toContain("failSliceWithoutCascade('WORLD IDENTITY COLLISION:");
    expect(collision).toContain('assessAtlasOpenerPress(collisionAtlasOpening)');
    expect(collision).toContain('assessAtlasOpenerPress(reopen)');
    expect(collision).toContain('assessAtlasPointerPress(press, { atlasId })');
    expect(collision).toContain('red before navigation wait');
    expect(collision).toContain('collisionAtlasTravel.push({ target: press.target, pointer: press.pointer, state });');
    expect(collision).toContain('atlasTargetHitLost: collisionControl');
    expect(collision).toContain('atlasTargetUndersized: collisionControl');
    expect(collision).toContain('atlasOpenerRoleDrift: collisionControl');
    expect(collision).toContain('atlasOpenerPointerDrift: collisionControl');
    expect(collision.indexOf('assessAtlasOpenerPress(collisionAtlasOpening)'))
      .toBeLessThan(collision.indexOf("collision Atlas rows',"));
    const collisionTravelPredecessorAt = collision.indexOf(
      'collision Atlas travel ${index} predecessor F4 authority',
    );
    const collisionTravelPressAt = collision.indexOf('assessAtlasPointerPress(press, { atlasId })');
    const collisionTravelRouteAt = collision.indexOf(
      'await waitControlValue(collisionTarget.session, `collision Atlas travel ${index}`',
    );
    const collisionTravelFixedPointAt = collision.indexOf(
      'label: `collision Atlas travel ${index}`',
    );
    const collisionTravelReceiptAt = collision.indexOf(
      "expectedKinds: ['arc9-galaxy-arrival-v1']",
      collisionTravelFixedPointAt,
    );
    const collisionTravelPublicationAt = collision.indexOf(
      'collisionAtlasTravel.push({ target: press.target, pointer: press.pointer, state });',
    );
    expect([
      collisionTravelPredecessorAt, collisionTravelPressAt, collisionTravelRouteAt,
      collisionTravelFixedPointAt, collisionTravelReceiptAt, collisionTravelPublicationAt,
    ]).not.toContain(-1);
    expect(collisionTravelPredecessorAt).toBeLessThan(collisionTravelPressAt);
    expect(collisionTravelPressAt).toBeLessThan(collisionTravelRouteAt);
    expect(collisionTravelRouteAt).toBeLessThan(collisionTravelFixedPointAt);
    expect(collisionTravelFixedPointAt).toBeLessThan(collisionTravelReceiptAt);
    expect(collisionTravelReceiptAt).toBeLessThan(collisionTravelPublicationAt);
    expect(collision).not.toContain('disabled:row.disabled===true');

    expect(sliceSource.match(/atlasTravelTargetExpression\(/gu)).toHaveLength(7);
  });

  it('derives the collision pointer-identity mutant from the distinct measured sibling receipt', () => {
    const prefix = '    atlasPointerIdentityDrift: collisionControl(';
    const mutationOwner = section(
      sliceSource,
      prefix,
      '    atlasPointerCoordinateDrift: collisionControl(',
    );
    const mutationSource = mutationOwner.slice(prefix.length).trim().replace(/\),\s*$/u, '');
    const mutate = Function(`return (${mutationSource});`)() as (
      candidate: Record<string, any>,
    ) => void;
    const press = (atlasId: string): Record<string, any> => ({
      target: {
        settled: true, x: 200, y: 300, width: 96, height: 44,
        id: null, tag: 'BUTTON', type: 'button', atlasTravelId: atlasId,
        atlasRowId: atlasId, hit: true,
      },
      pointer: {
        trusted: true, pointerType: 'mouse', tag: 'BUTTON', id: atlasId,
        atlasTravelId: atlasId, atlasRowId: atlasId, x: 200, y: 300,
      },
    });
    const alpha = 'w|alpha';
    const beta = 'w|beta';
    const reversedDisplayOrder = {
      atlas: { rows: [{ travelId: beta }, { travelId: alpha }] },
      atlasTravel: [press(alpha), press(beta)],
    };
    expect(assessAtlasPointerPress(reversedDisplayOrder.atlasTravel[0]!, { atlasId: alpha }).ok)
      .toBe(true);
    mutate(reversedDisplayOrder);
    expect(reversedDisplayOrder.atlasTravel[0]!.pointer.atlasTravelId).toBe(beta);
    expect(reversedDisplayOrder.atlas.rows).toEqual([
      { travelId: beta }, { travelId: alpha },
    ]);
    expect(assessAtlasPointerPress(reversedDisplayOrder.atlasTravel[0]!, { atlasId: alpha }).ok)
      .toBe(false);

    const inert = {
      atlas: { rows: [{ travelId: beta }, { travelId: alpha }] },
      atlasTravel: [press(alpha), press(alpha)],
    };
    expect(() => mutate(inert)).toThrow(/two distinct measured Travel receipts/u);
  });
});
