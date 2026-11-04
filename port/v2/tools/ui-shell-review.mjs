#!/usr/bin/env node
/* U1-only review diagnostic. Normal game build, isolated raw CDP, no player
 * profile or evidence hooks. Golden raster differences are HUMAN review data;
 * CSS-pixel deltas, live mutations and restoration establish scoped geometry. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {acquireWorkspaceLock} from './workspacelock.mjs';
import { openChromiumCdp } from './browsercdp.mjs';
import { createReviewTrailDebugger } from './ui-review-trail-debugger.mjs';
import { createReviewEvaluator, reviewFrameSettlement, readReviewFrameSettlements, assessReviewFrameSettlement } from './ui-review-evaluation.mjs';

/** Serialized into the owned document by Slice, Glass and U1 review. This
 * independent oracle intentionally names the approved metrics, not product
 * token values. It is the adapted phone inventory outcome, not a U4 gate. */
export function readU1PhoneShell(training = false) {
  const errors = [], expected = ['docksurvey', 'dockcodex', 'primechip', 'dockshipyard', 'dockatlas',
    'dockrecords', 'docknotifications', 'dockguide', 'docksets'];
  const roots = ['dock', 'topbar', 'sceneactions', 'raillft'].map(id => document.getElementById(id)).filter(Boolean);
  const prior = roots.map(node => ({ node, style: node.getAttribute('style'), inert: node.getAttribute('inert') }));
  const box = node => {
    if (!node) return null;
    const r = node.getBoundingClientRect(), s = getComputedStyle(node);
    return { id: node.id, left: r.left, top: r.top, right: r.right, bottom: r.bottom,
      width: r.width, height: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2,
      visible: s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 };
  };
  const available = node => {
    const r = box(node), hit = r?.visible ? document.elementFromPoint(r.cx, r.cy) : null;
    return { id: node?.id ?? null, rect: r, native: node?.tagName==='BUTTON'&&!node.disabled&&!node.closest('[inert]'), named: !!(node?.getAttribute('aria-label') || node?.textContent || '').trim(),
      hit: !!hit && (hit === node || node.contains(hit)), parent: node?.parentElement?.id ?? null };
  };
  try {
    if (training) for (const { node } of prior) { node.style.setProperty('pointer-events', 'auto', 'important'); node.removeAttribute('inert'); }
    const dock = document.getElementById('dock'), rect = box(dock), display = dock ? getComputedStyle(dock).display : null;
    const rootStyle=getComputedStyle(document.documentElement),safeLeft=parseFloat(rootStyle.getPropertyValue('--safe-left'))||0,
      safeRight=parseFloat(rootStyle.getPropertyValue('--safe-right'))||0,landscapePanel=innerWidth<=900&&innerWidth>innerHeight&&document.body.classList.contains('panel-open'),
      expectedWidth=Math.min(320,landscapePanel?(innerWidth-safeLeft-safeRight-36)/2:innerWidth-safeLeft-safeRight-20),pitch=expectedWidth/5;
    const buttons = dock ? [...dock.querySelectorAll(':scope > button, :scope > #raillft > button, :scope > #sceneactions > button')].filter(button => box(button)?.visible) : [];
    const ids = buttons.map(button => button.id), centres = buttons.map(available), rows = [];
    if (JSON.stringify(ids) !== JSON.stringify(expected)) errors.push('dock button identity/order drifted: ' + JSON.stringify(ids));
    for (const [index, button] of buttons.entries()) {
      const r = box(button); let row = rows.find(candidate => Math.abs(candidate.top - r.top) < 2);
      if (!row) { row = { top: r.top, height: r.height, ids: [], centres: [] }; rows.push(row); }
      row.height = Math.max(row.height, r.height); row.ids.push(button.id); row.centres.push(r.cx);
      const board = expected.indexOf(button.id) < 5 && expected.includes(button.id), width = board ? pitch-4 : 44;
      if (Math.abs(r.width - width) > 1 || r.width < 44 || r.height < 44 || (!board && Math.abs(r.height - 44) > 1))
        errors.push(button.id + ' does not retain its ' + width + 'px width and 44px touch floor');
      if (!centres[index].hit) errors.push(button.id + ' is not hit-testable at its centre');
      if (!centres[index].named || !centres[index].native) errors.push(button.id + ' is not a named native button');
      for (const label of button.querySelectorAll('.lbl')) if (box(label)?.visible)
        errors.push(button.id + ' retains a visible label in the icon-only phone dock');
      if (button.id === 'primechip') {
        const count = button.querySelector('.prime-count');
        if (!box(count)?.visible || !/^\d+\/9$/.test(count.textContent.trim())) errors.push('Prime count is missing or hidden');
      }
      if (!board) {
        const face = button.querySelector('.utility-face'), f = box(face);
        if (!f || Math.abs(f.width - 36) > 1 || Math.abs(f.height - 36) > 1)
          errors.push(button.id + ' utility face is not 36px inside its target');
      }
    }
    rows.sort((a, b) => a.top - b.top);
    if (rows.length !== 2 || rows[0]?.ids.length !== 5 || rows[1]?.ids.length !== 4)
      errors.push('dock is not two rows (5+4): ' + JSON.stringify(rows.map(row => row.ids.length)));
    for (const [index,row] of rows.entries()) {
      if(JSON.stringify(row.ids)!==JSON.stringify(index===0?expected.slice(0,5):expected.slice(5)))errors.push('dock row membership drifted: '+JSON.stringify(row.ids));
      for(let i=0;i<row.centres.length;i++)if(Math.abs(row.centres[i]-(rect.left+pitch*(i+(index === 0 ? .5 : 1))))>1)errors.push('dock responsive slot drifted: '+row.ids[i]);
    }
    if (display !== 'grid' || !rect || Math.abs(rect.width - expectedWidth) > 1) errors.push('phone dock is not its safe-inset responsive grid');
    if (rows.length === 2 && (Math.abs(rows[1].top - rows[0].top - rows[0].height - 4) > 1
      || Math.abs(rect.height - rows[0].height - 48) > 1)) errors.push('phone dock row gap or measured height drifted');
    const inventoryNode = document.getElementById('dockinventory'), relocatedInventory = available(inventoryNode);
    if (!inventoryNode?.closest('#topbar') || !relocatedInventory.rect?.visible || !relocatedInventory.hit
      || !relocatedInventory.named || relocatedInventory.rect.width < 44 || relocatedInventory.rect.height < 44)
      errors.push('relocated Inventory is missing or not actionable in topbar');
    const sceneactions = ['docksurvey', 'dockcharts'].map(id => available(document.getElementById(id)));
    const [survey, charts] = sceneactions, group = document.getElementById('sceneactions'),left=document.getElementById('raillft');
    if (group?.parentElement !== dock || getComputedStyle(group).display !== 'contents' || left?.parentElement!==dock || getComputedStyle(left).display!=='contents') errors.push('phone scene groups are not owned by the dock');
    if (survey.parent !== 'raillft' || !survey.rect?.visible || !survey.hit || !survey.named
      || survey.rect.width < 44 || survey.rect.height < 44 || survey.rect.left < rect.left || survey.rect.right > rect.right
      || Math.abs(survey.rect.top-rect.top)>1 || Math.abs(survey.rect.width-(pitch-4))>1
      || document.getElementById('docksurvey')?.querySelector('.utility-face')) errors.push('Survey is not a44px-floor native top-row scene action');
    if (charts.rect?.visible) errors.push('phone Charts shortcut must yield to its existing Settings control');
    const charter=available(document.getElementById('objchip')),overlay=document.body.matches('.panel-open,.card-open');
    if(document.querySelector('#dockcharters,#railcharters')||charter.parent!=='topbar'||!charter.named||(!overlay&&(!charter.native||!charter.hit||!charter.rect?.visible||charter.rect.width<44||charter.rect.height<44)))errors.push('objective is not the sole reachable44px Charters opener');
    return { ok: errors.length === 0, errors, display, ids, expected, rows, rect, expectedWidth, pitch, centres, relocatedInventory, sceneactions, charter };
  } finally {
    if (training) for (const { node, style, inert } of prior) {
      if (style === null) { node.setAttribute('style', ''); node.removeAttribute('style'); } else node.setAttribute('style', style);
      if (inert === null) node.removeAttribute('inert'); else node.setAttribute('inert', inert);
    }
  }
}

function shellGeometry() {
  const selectors = { hpLabel: '#hpbar .hp-label', hpText: '#hpbar .txt', hpIcon: '#hpbar .hp-icon', primeCount: '#primechip .prime-count' };
  const r = id => { const node = selectors[id] ? document.querySelector(selectors[id]) : document.getElementById(id); if (!node) return null;
    const b = node.getBoundingClientRect(), s = getComputedStyle(node);
    return { id, left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height,
      visible: s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0,
      overflowX: node.scrollWidth > node.clientWidth + 1, overflowY: node.scrollHeight > node.clientHeight + 1 }; };
  const compact = innerWidth <= 700 || (innerWidth <= 900 && innerWidth > innerHeight);
  const ids = ['topbar', 'playerchip', 'hpbar', 'searchbox', 'dock', 'primechip', 'objchip', 'trail', 'ctxbar', 'hintpill',
    'sceneactions', 'dockinventory', 'shelfnotifications', 'raillft', 'railrgt', 'docksurvey', 'dockcharts', 'setpanel',
    'railcodex', 'railatlas', 'railshipyard', 'railinventory', 'railrecords', 'docksets', 'hpLabel', 'hpText', 'hpIcon', 'primeCount'];
  const styles = getComputedStyle(document.documentElement), trail = document.getElementById('trail'), player = document.getElementById('playerchip');
  const available = id => {
    const node = document.getElementById(id), rect = r(id), face = node?.querySelector('.utility-face'), f = face?.getBoundingClientRect();
    const hit = rect?.visible ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
    return { ...rect, id, native: node?.tagName === 'BUTTON' && !node.disabled && !node.closest('[inert]'),
      named: !!(node?.getAttribute('aria-label') || node?.textContent || '').trim(),
      hit: !!hit && (hit === node || node.contains(hit)), face: f ? { width: f.width, height: f.height } : null,
      labelsVisible: [...(node?.querySelectorAll('.lbl') ?? [])].some(label => { const b = label.getBoundingClientRect(), s = getComputedStyle(label); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0; }) };
  };
  const logical = ['objchip', 'dockcodex', 'primechip', 'dockshipyard', 'dockatlas', 'dockrecords', 'docknotifications', 'dockguide', 'docksets'];
  const railMap = { dockcodex: 'railcodex', dockshipyard: 'railshipyard', dockatlas: 'railatlas' };
  const openers = logical.map(id => ({ ...available(compact ? id : railMap[id] ?? id), logicalId: id }));
  const dock = [...document.querySelectorAll(compact ? '#dock > button, #dock > #raillft > button, #dock > #sceneactions > button' : '#dock > button')].map(node => available(node.id)).filter(button => button.visible && (compact || button.id !== 'primechip'));
  const first = dock[0], second = dock[1], gapPoint = first && second ? { x: (first.right + second.left) / 2, y: first.top + first.height / 2 } : null;
  const gapHit = gapPoint ? document.elementFromPoint(gapPoint.x, gapPoint.y) : null;
  const stack = r('sceneactions'), centralPoint = { x: innerWidth / 2, y: Math.min(innerHeight - 1, (compact ? r('topbar').bottom : stack.top) + 22) };
  const centralHit = document.elementFromPoint(centralPoint.x, centralPoint.y), hp = document.getElementById('hpbar');
  const paint = id => { const s = getComputedStyle(document.getElementById(id)); return { background: s.backgroundColor, backgroundImage: s.backgroundImage,
    border: ['Top','Right','Bottom','Left'].map(side => parseFloat(s['border' + side + 'Width'])), padding: ['Top','Right','Bottom','Left'].map(side => parseFloat(s['padding' + side])),
    pointerEvents: s.pointerEvents, radius: parseFloat(s.borderTopLeftRadius) }; };
  return { viewport: { width: innerWidth, height: innerHeight }, compact, rects: Object.fromEntries(ids.map(id => [id, r(id)])),
    dockGap: { point: gapPoint, owned: gapHit === document.getElementById('dock'), hit: gapHit?.id || gapHit?.tagName || null },
    topLeftActions: (compact ? ['dockinventory', 'docksurvey'] : ['dockinventory', 'docksurvey', 'dockcharts']).map(available), openers, dock,
    sceneGroup: { parentId: document.getElementById('sceneactions').parentElement?.id, display: getComputedStyle(document.getElementById('sceneactions')).display, leftParentId:document.getElementById('raillft').parentElement?.id, leftDisplay:getComputedStyle(document.getElementById('raillft')).display },
    charter:available('objchip'),
    textPills: compact ? [] : ['playerchip','railcodex','railatlas','railshipyard','docksurvey','dockcharts'].map(id => {
      const node=document.getElementById(id), range=document.createRange(), style=getComputedStyle(node);range.selectNodeContents(node);
      const content=range.getBoundingClientRect(), sides=['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth'].map(key=>parseFloat(style[key])||0);
      return{id,width:node.getBoundingClientRect().width,contentWidth:content.width,expectedWidth:Math.max(44,content.width+sides.reduce((a,b)=>a+b,0))}; }),
    canonicalTrail: { parentId: trail?.parentElement?.id, display: getComputedStyle(trail).display, tabIndex: trail?.tabIndex,
      interactive: !!trail?.matches('button,input,a[href],[role="button"]'), text: [...trail.querySelectorAll('.seg')].map(node => node.textContent) },
    playerName: { text: player.textContent.trim(), textOverflow: getComputedStyle(player).textOverflow,
      visibleMetadata: [...player.querySelectorAll('.player-rank,.player-worlds')].some(node => { const b=node.getBoundingClientRect(); return b.width > 0 && b.height > 0; }) },
    health: { label: hp.querySelector('.hp-label')?.textContent.trim(), text: hp.querySelector('.txt')?.textContent.trim(),
      icon: hp.querySelector('.hp-icon')?.textContent.trim(), value: hp.getAttribute('aria-valuenow'), max: hp.getAttribute('aria-valuemax') },
    paint: Object.fromEntries(['hintpill','ctxbar','playerchip','hpbar'].map(id => [id, paint(id)])),
    centralSpace: { point: centralPoint, canvas: centralHit === document.querySelector('canvas'), ownerId: centralHit?.closest('button')?.id ?? null, hit: centralHit?.id || centralHit?.tagName || null },
    font: getComputedStyle(document.body).fontFamily, fontSize: getComputedStyle(document.body).fontSize,
    topbarPublished: parseFloat(styles.getPropertyValue('--topbar-h')), row1Published: parseFloat(styles.getPropertyValue('--row1-h')),
    safeBottom: parseFloat(styles.getPropertyValue('--safe-bottom')) || 0, safeRight: parseFloat(styles.getPropertyValue('--safe-right')) || 0,
    safeLeft: parseFloat(styles.getPropertyValue('--safe-left')) || 0, safeTop: parseFloat(styles.getPropertyValue('--safe-top')) || 0,
    hintHeight: document.getElementById('hintpill')?.offsetHeight ?? 0,
    dockDisplay: getComputedStyle(document.getElementById('dock')).display,
    dockPointerEvents: getComputedStyle(document.getElementById('dock')).pointerEvents,
    bodyClasses: document.body.className, horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
}
function metricDeltas(state) {
  const { rects: r, viewport: v, safeBottom, safeRight, safeLeft, compact } = state, rows = [];
  const add = (name, actual, expected, scope = 'production layout with explicit v2 amendments', tolerance = 1) => rows.push({ name, actual, expected, delta: actual - expected,
    pass: Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, scope, tolerance });
  add('topbar published height', state.topbarPublished, r.topbar.height, 'measured sync');
  add('hidden canonical trail', r.trail.visible ? 1 : 0, 0, 'retained scene text, no visible Cosmos control', 0);
  add('header first-row alignment', r.dockinventory.top - r.searchbox.top, 0);
  add('header second-row alignment', r.hpbar.top - r.objchip.top, 0);
  add('health/nameplate left alignment', r.hpbar.left - r.dockinventory.left, 0);
  add('Objective/Search alignment', r.objchip.right - r.searchbox.right, 0, 'shared upper-right edge on phone and wide screens');
  add('header row gap', r.hpbar.top - r.dockinventory.bottom, 8);
  add('clear central scene', state.centralSpace.canvas ? 1 : 0, 1, 'actual canvas beside context actions', 0);
  for (const id of ['railinventory','railrecords']) add(id + ' duplicate hidden', r[id].visible ? 1 : 0, 0, 'no duplicate visible owner', 0);
  for (const id of ['hintpill','ctxbar']) {
    const p=state.paint[id], transparent = p.background === 'transparent' || /rgba\([^)]*,\s*0\s*\)$/.test(p.background);
    add(id === 'hintpill' ? 'hintpill plain text chrome' : 'ctxbar flat caption chrome', (id !== 'hintpill' || transparent) && p.backgroundImage === 'none' && p.border.every(n=>n===0) && p.padding.every(n=>n===0) && p.radius === 0 ? 1 : 0, 1, id === 'hintpill' ? 'plain hint without pill paint' : 'flat caption retains its contrast backing', 0);
  }
  if (compact) {
    for (const id of ['raillft','railrgt']) add(id + ' hidden', r[id].visible ? 1 : 0, 0, 'compact phone layout', 0);
    add('phone scene group dock owner', state.sceneGroup.parentId === 'dock' && state.sceneGroup.display === 'contents' && state.sceneGroup.leftParentId==='dock' && state.sceneGroup.leftDisplay==='contents' ? 1 : 0, 1, 'no separate upper scene stack', 0);
    add('phone Charts shortcut hidden', r.dockcharts.visible ? 1 : 0, 0, 'preference remains in Settings', 0);
    add('phone Survey dock placement', r.docksurvey.visible && r.docksurvey.left >= r.dock.left && r.docksurvey.right <= r.dock.right && r.docksurvey.bottom <= r.dock.bottom && Math.abs(r.docksurvey.top-r.dock.top)<=1 ? 1 : 0, 1, 'first top-row native scene owner', 0);
    add('phone dock bottom', v.height - r.dock.bottom - safeBottom, 12);
    add('phone dock width', r.dock.width, Math.min(320,v.width-safeLeft-safeRight-20), 'five responsive scene slots within safe side insets');
    add('phone dock height (default text)', r.dock.height, 92, '44px rows plus4px gap; count text may grow with preferences');
    add('phone hint bottom', v.height - r.hintpill.bottom - safeBottom, 124);
    add('phone caption bottom', v.height - r.ctxbar.bottom - safeBottom, Math.max(164,124+state.hintHeight+8));
    add('phone Search width', r.searchbox.width, Math.min(v.width * .37, v.width - safeLeft - safeRight - 30 - Math.min(176,Math.max(128,v.width*.36))));
    for (const [group, buttons] of [['boards', state.dock.slice(0,5)],['utilities',state.dock.slice(5)]])
      for (let i=1;i<buttons.length;i++) add(group + ' centre pitch ' + i, buttons[i].left+buttons[i].width/2-buttons[i-1].left-buttons[i-1].width/2,Math.min(320,v.width-safeLeft-safeRight-20)/5);
  } else {
    add('scene action left alignment', r.sceneactions.left - r.dockinventory.left, 0);
    add('Survey/Compendium gap', r.railcodex.top - r.docksurvey.bottom, 8);
    for (const pill of state.textPills) add(pill.id + ' text-fit width', pill.width, pill.expectedWidth, 'visible label plus padding/border and44px minimum');
    for (const id of ['raillft','railrgt']) add(id + ' visible', r[id].visible ? 1 : 0, 1, 'production side-control arrangement', 0);
    add('left rail top gap', r.raillft.top-r.topbar.bottom,8);
    add('right rail top gap', r.railrgt.top-r.topbar.bottom,8);
    add('left rail inset',r.raillft.left-safeLeft,18);
    add('right rail inset',v.width-r.railrgt.right-safeRight,18);
    add('Survey left rail placement',r.docksurvey.top-r.raillft.top,0,'Survey replaces Charters');
    add('Atlas/Shipyard gap',r.railshipyard.top-r.railatlas.bottom,8,'44px native targets plus8px gap');
    add('left stack below rail gap',r.sceneactions.top-r.raillft.bottom,8);
    add('Prime top centre',r.primechip.left+r.primechip.width/2,v.width/2);
    add('Prime top',r.primechip.top,Math.max(10,state.safeTop));
    add('Search width',r.searchbox.width,236);
    add('utility dock width',r.dock.width,200,'four44px targets plus three8px gaps');
    add('utility dock height',r.dock.height,44);
    add('utility dock right inset',v.width-r.dock.right-safeRight,16);
    add('utility dock bottom',v.height-r.dock.bottom-safeBottom,12);
    add('utility dock gap owner',state.dockGap.owned?1:0,1,'dock retains native ownership of internal gaps',0);
    add('wide hint bottom',v.height-r.hintpill.bottom-safeBottom,18);
    add('wide caption bottom',v.height-r.ctxbar.bottom-safeBottom,Math.max(64,18+state.hintHeight+8));
    for (const [i,button] of state.dock.entries()) {
      add(button.id+' utility width',button.width,44);add(button.id+' utility height',button.height,44);
      add(button.id+' utility face width',button.face?.width,36);add(button.id+' utility face height',button.face?.height,36);
      if(i)add('utility centre pitch '+i,button.left+button.width/2-state.dock[i-1].left-state.dock[i-1].width/2,52);
    }
  }
  return rows;
}
function topLeftOutcome(state, narrowPanel = false) {
  const r=state.rects,v=state.viewport,errors=[],viewport={left:0,top:0,right:v.width,bottom:v.height};
  const inside=(box,parent)=>box?.visible&&box.left>=parent.left-1&&box.top>=parent.top-1&&box.right<=parent.right+1&&box.bottom<=parent.bottom+1;
  if(!inside(r.topbar,viewport)||(!state.compact&&!inside(r.sceneactions,viewport)))errors.push('header or context actions leave the viewport');
  if(state.compact&&(!inside(r.docksurvey,r.dock)||r.dockcharts.visible||state.sceneGroup.parentId!=='dock'||state.sceneGroup.display!=='contents'||state.sceneGroup.leftParentId!=='dock'||state.sceneGroup.leftDisplay!=='contents'))errors.push('phone Survey/Charts ownership is incorrect');
  if(Math.abs(state.topbarPublished-r.topbar.height)>1)errors.push('published header height does not match rendered content');
  for(const action of state.topLeftActions){
    if(!inside(action,viewport)||!action.native||!action.named||!action.hit||action.width<44||action.height<44)errors.push(action.id+' is not a bounded named native44px action');
    if(narrowPanel&&action.left<v.width/2)errors.push(action.id+' is outside the panel-safe right column');
  }
  for(const id of ['dockinventory','searchbox'])if(!inside(r[id],r.topbar))errors.push(id+' leaves the header');
  if(r.searchbox.width<44||r.searchbox.height<44)errors.push('Search loses its44px floor');
  const trail=state.canonicalTrail;
  if(r.trail.visible||trail.display!=='none'||trail.parentId!=='topbar'||trail.interactive||trail.tabIndex>=0)errors.push('canonical trail must remain a hidden noninteractive direct header child');
  if(!state.playerName.text||state.playerName.visibleMetadata||r.playerchip.overflowX||r.playerchip.overflowY)errors.push('name-only Inventory nameplate is empty or truncates');
  if(!inside(r.playerchip,r.dockinventory))errors.push('nameplate paint leaves its native Inventory target');
  if(narrowPanel){
    if(r.hpbar.visible||r.objchip.visible)errors.push('status chrome did not yield to the narrow panel');
    if(r.searchbox.left<v.width/2||r.topbar.bottom>r.dock.top-8)errors.push('right-column controls collide with the launcher');
  }else{
    if(!state.charter.native||!state.charter.named||!state.charter.hit||state.charter.width<44||state.charter.height<44)errors.push('objective is not a reachable native Charters opener');
    for(const id of ['hpbar','objchip'])if(!inside(r[id],r.topbar))errors.push(id+' is not contained in the header');
    if(r.objchip.overflowX||r.objchip.overflowY)errors.push('Objective clips its header lane');
    for(const id of ['hpLabel','hpText','hpIcon'])if(!inside(r[id],r.hpbar))errors.push(id+' clips its health gauge');
    if(state.health.label!=='Health'||state.health.icon?.replace(/\uFE0F/g,'')!=='❤'||state.health.text!==state.health.value+'/'+state.health.max)errors.push('Health does not retain its heart, caption and exact numeric meter');
    if(Math.abs(r.hpbar.left-r.dockinventory.left)>1||Math.abs(r.hpbar.top-r.objchip.top)>1)errors.push('name/Health/Objective header lanes lost alignment');
    if((!state.compact&&r.sceneactions.right>=v.width/2)||!state.centralSpace.canvas)errors.push('context actions obstruct the central scene');
    if(!state.compact&&r.sceneactions.bottom>Math.min(r.ctxbar.top,r.hintpill.top,r.dock.top)-8)errors.push('context actions collide with a bottom lane');
  }
  return{pass:errors.length===0,errors};
}
const LAUNCHER_PANELS = [
  ['objchip', 'chpanel'], ['dockcodex', 'codexpanel'], ['primechip', 'primepanel'],
  ['dockshipyard', 'shipyardpanel'], ['dockatlas', 'atlaspanel'], ['dockrecords', 'recpanel'],
  ['docknotifications', 'notificationpanel'], ['dockguide', 'guidepanel'], ['docksets', 'setpanel'],
];
function launcherOutcome(state) {
  const expected=state.compact?['objchip','dockcodex','primechip','dockshipyard','dockatlas','dockrecords','docknotifications','dockguide','docksets']:
    ['objchip','railcodex','primechip','railshipyard','railatlas','dockrecords','docknotifications','dockguide','docksets'];
  const ids=state.openers.map(button=>button.id),errors=[];
  if(JSON.stringify(ids)!==JSON.stringify(expected))errors.push('visible native opener identity/order drifted: '+JSON.stringify(ids));
  for(const button of state.openers)if(!button.visible||!button.native||!button.named||!button.hit||button.width<44||button.height<44)errors.push(button.id+' is not a named native44px center-hit-testable opener');
  const dockExpected=state.compact?['docksurvey',...expected.slice(1)]:['dockrecords','docknotifications','dockguide','docksets'];
  if(JSON.stringify(state.dock.map(button=>button.id))!==JSON.stringify(dockExpected))errors.push('visible dock membership drifted');
  if(state.dockDisplay!==(state.compact?'grid':'flex'))errors.push('dock display does not match compact grid / wide utility flex layout');
  if(!state.compact&&(state.dockPointerEvents!=='auto'||!state.dockGap.owned))errors.push('wide utility dock loses native ownership of its internal gaps');
  if(state.compact&&state.dock.some(button=>button.labelsVisible))errors.push('phone dock retains visible board labels');
  if(!state.rects.primeCount?.visible)errors.push('Prime count is hidden');
  return{pass:errors.length===0,ids,expected,errors};
}
/** Passive review-owned observations of public DOM/input only. No product
 * evidence hook, navigation write, event cancellation or recovery action. */
export function installNativeReviewTrace(viewport) {
  const snapshot = () => ({ at: performance.now(), timeOrigin: performance.timeOrigin, trail: [...document.querySelectorAll('#trail .seg')].map(node => node.textContent),
    context: document.getElementById('ctxbar')?.textContent ?? null, focusedId: document.activeElement?.id ?? null,
    bodyClasses: document.body.className, viewport: { width: innerWidth, height: innerHeight },
    visualViewport: window.visualViewport ? { width: visualViewport.width, height: visualViewport.height,
      scale: visualViewport.scale, offsetLeft: visualViewport.offsetLeft, offsetTop: visualViewport.offsetTop } : null,
    trailVisible: (() => { const t=document.getElementById('trail'),r=t.getBoundingClientRect(),s=getComputedStyle(t);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; })() });
  const describe = node => node instanceof Element ? { tag: node.tagName, id: node.id || null,
    sel: node.getAttribute('data-sel'), close: node.getAttribute('data-pnx') } : { tag: node === document ? '#document' : '#window' };
  const trace = { viewport, events: [], keys: [], changes: [], active: null, activeKey: null, nextId: 0, nextKeyId: 0, overflow: false, snapshot };
  const append = (list, entry) => { if (list.length >= 1000) trace.overflow = true; else list.push(entry); };
  for (const type of ['pointerdown', 'pointerup', 'click']) document.addEventListener(type, event => {
    const path = event.composedPath(), requested = trace.active;
    append(trace.events, { ...snapshot(), type, eventTime: event.timeStamp, trusted: event.isTrusted,
      x: event.clientX, y: event.clientY, pointerType: event.pointerType || null, pressId: requested?.id ?? null,
      selector: requested?.selector ?? null, requestedControlInPath: !!requested && path.includes(requested.node),
      requestedControlConnected: requested?.node.isConnected ?? false, target: describe(event.target), path: path.map(describe) });
  }, { capture: true, passive: true });
  const windowResize = () => append(trace.changes, { ...snapshot(), kind: 'window-resize', pressId: trace.active?.id ?? null });
  const visualResize = () => append(trace.changes, { ...snapshot(), kind: 'visual-viewport-resize', pressId: trace.active?.id ?? null });
  window.addEventListener('resize', windowResize, { passive: true });
  window.visualViewport?.addEventListener('resize', visualResize, { passive: true });
  for (const type of ['keydown', 'keyup']) document.addEventListener(type, event => {
    append(trace.keys, { type, key: event.key, code: event.code, trusted: event.isTrusted, repeat: event.repeat,
      at: performance.now(), eventTime: event.timeStamp, keyId: trace.activeKey?.id ?? null,
      target: describe(event.target), viewport: trace.viewport });
  }, { capture: true, passive: true });
  let priorTrail = JSON.stringify(snapshot().trail);
  const observer = new MutationObserver(() => {
    const next = snapshot(), serialized = JSON.stringify(next.trail);
    if (serialized !== priorTrail) { append(trace.changes, { ...next, kind: 'trail-change', pressId: trace.active?.id ?? null }); priorTrail = serialized; }
  });
  observer.observe(document.getElementById('trail'), { childList: true, subtree: true, characterData: true });
  trace.changes.push({ ...snapshot(), kind: 'initial', pressId: null, initial: true });
  Object.defineProperty(window, '__cfU1ReviewNativeTrace', { value: trace, configurable: true });
  return snapshot();
}
export function assessNativeReviewDelivery(proof) {
  const expectedTypes = ['pointerdown', 'pointerup', 'click'], events = proof.events ?? [];
  const exactTypes = JSON.stringify(events.map(event => event.type)) === JSON.stringify(expectedTypes);
  const exactOwner = events.every(event => event.pressId === proof.id && event.selector === proof.selector
    && event.trusted === true && event.requestedControlInPath === true && event.requestedControlConnected === true);
  return { pass: !proof.dispatchError && !proof.overflow && exactTypes && exactOwner, exactTypes, exactOwner };
}
export function assessNativeReviewKeyboardDelivery(proof) {
  const events = proof.events ?? [], expectedTypes = ['keydown', 'keyup'];
  const exactTypes = JSON.stringify(events.map(event => event.type)) === JSON.stringify(expectedTypes);
  const exactKeys = events.every(event => event.keyId === proof.id && event.key === 'Escape' && event.code === 'Escape'
    && event.trusted === true && event.repeat === false);
  return { pass: !proof.dispatchError && !proof.overflow && exactTypes && exactKeys, exactTypes, exactKeys };
}
function assessProgrammaticSettingsDelivery(receipts) {
  const expected = ['#docksets', '#setpanel [data-motion="-1"]', '#setpanel [data-pnx]'];
  const exactCount = Array.isArray(receipts) && receipts.length === 3;
  const exactOwners = exactCount && receipts.every((event, index) => event.index === index && event.selector === expected[index]
    && event.type === 'click' && event.trusted === false && event.targetMatches === true && event.currentTargetMatches === true
    && event.connected === true && event.target?.tag === 'BUTTON'
    && (index === 0 ? event.target.id === 'docksets' : index === 1 ? event.target.motion === '-1' : event.target.close === 'set'));
  return { pass: exactCount && exactOwners, exactCount, exactOwners, expected, receipts };
}
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export async function runUiShellReview(buildArgument, outputArgument, options = {}) {
  const release=acquireWorkspaceLock('UI shell review', {inheritFromParent:true});
  try { return await runLockedUiShellReview(buildArgument, outputArgument, options); } finally { release(); }
}
async function runLockedUiShellReview(buildArgument, outputArgument, options = {}) {
  assert(options.scope === undefined || options.scope === 'phone-restoration', 'unknown U1 review scope');
  const phoneRestorationOnly = options.scope === 'phone-restoration';
  assert(buildArgument && outputArgument, 'usage: node tools/ui-shell-review.mjs BUILD_DIRECTORY NEW_OUTPUT_DIRECTORY');
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const git = args => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  const source = git(['rev-parse', 'HEAD']); assert.equal(git(['diff', '--name-only', 'HEAD']), '', 'review source must be committed');
  const build = fs.realpathSync(buildArgument), output = path.resolve(outputArgument);
  assert(!fs.existsSync(output), 'review output must be new; never overwrite previous/red evidence');
  fs.mkdirSync(output, { recursive: true });
  const index = fs.readFileSync(path.join(build, 'index.html'), 'utf8');
  assert(/name="cf-build-mode" content="distributable"/.test(index), 'review requires a normal distributable build, not evidence mode');
  const workerBytes = fs.readFileSync(path.join(build, 'service-worker.js'));
  const assetMatch = /const ASSETS=Object\.freeze\((\[[^\n]+\])\);/u.exec(workerBytes.toString());
  assert(assetMatch, 'normal build has no asset inventory');
  const assets = JSON.parse(assetMatch[1]).map(row => { const file = path.resolve(build, '.' + row.path);
    assert(file.startsWith(build + path.sep) && fs.lstatSync(file).isFile(), 'unsafe asset carrier');
    const bytes = fs.readFileSync(file); assert.equal(sha(bytes), row.sha256, 'build asset digest'); return { ...row, bytes: bytes.length }; });
  const goldenRoot = path.join(repo, 'port/baseline-v1.8.9/screens');
  const goldenManifest = JSON.parse(fs.readFileSync(path.join(goldenRoot, 'MANIFEST.json'))).shots;
  const cases = phoneRestorationOnly ? [['phone', 390, 844, true]] : [['phone', 390, 844, true], ['desktop', 1440, 900, false], ['tablet', 834, 1112, true]];
  const report = { schema: 'cf-u1-shell-review/v1', certification: false, scope: phoneRestorationOnly ? 'phone-restoration' : 'full', source, startedAt: new Date().toISOString(),
    build: { indexSha256: sha(Buffer.from(index)), serviceWorkerSha256: sha(workerBytes), assets },
    status: 'RUNNING', rows: [], journeys: [], nativeInputs: [], nativeKeys: [], nativeTraces: [], evaluationEvidence: {}, frameSettlements: [], navigationDebug: {}, images: [], errors: [], limitations: [
      'Phone-restoration scope retains the complete original phone predecessor and stops after its viewport restoration and trace. It omits comparison sheets, tablet/desktop and all downstream certificates. UAT layout acceptance is separate from technical gate completion.',
      'Auto-resuming DOM breakpoints capture trail writers between intentional controls. Debugger instrumentation perturbs scheduling; a nonrecurrence cannot close the retained navigation blocker. Same-text rebuild stacks are not navigation, and public DOM readiness does not prove travel settlement.',
      'U1 geometry diagnostic only, not U4, full Glass, real iPhone or HUMAN visual acceptance.',
      'Golden raster differences reflect scene/save/browser/font differences as well as design; no pixel-equality verdict.',
      'New game uses native Skip then bounded Escape ascent to Cosmos, read from retained hidden canonical trail DOM. The trace records its visibility honestly; no visible breadcrumb or legacy import is claimed. Camera, progression and save differences remain in comparisons.',
      'Notification screenshots use only naturally available messages; this diagnostic does not certify cross-session persistence.',
      'Phone has five scene buttons, with Survey replacing Charters, above four utility icons; the objective opens Charters and Charts remains in Settings. Wide views use existing side rails, top-centerPrime and four bottom-right utilities with44px targets/8px gaps. Breakpoint701 and44px targets are explicit v2 amendments; production goldens remain human comparison data.',
      'Three default-text screenshot views are supplemented by one numeric phone fs-xl probe and one844x390 Settings-open probe; these remain bounded diagnostics, not a U4 matrix.',
      'One same-task Settings/Motion Auto/Close replay temporarily widens the first writable review document to1440x900. Three per-button untrusted click receipts and the separate global trace are retained, followed by the existing font/two-frame boundary and original viewport restoration. No desktop persistence or extra trusted-native delivery is claimed.',
    ] };
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.webp': 'image/webp', '.wav': 'audio/wav', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
  const server = http.createServer((request, response) => {
    try { const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = path.resolve(build, '.' + (name === '/' ? '/index.html' : name));
      assert(file.startsWith(build + path.sep) && fs.statSync(file).isFile());
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(response);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  let browser, collectNativeTrace, collectFrameSettlements, trailDebugger;
  const writeReport = () => fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify(report, null, 2) + '\n');
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await openChromiumCdp({ label: 'U1 isolated normal-game review', userDataPrefix: 'cf-u1-review',
      onEvent: event => { trailDebugger?.onEvent(event); if (event.method === 'Runtime.exceptionThrown') report.errors.push(event.params.exceptionDetails.exception?.description ?? event.params.exceptionDetails.text); } });
    report.browser = browser.browser;
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params = {}) => browser.send(method, params, sessionId);
    await send('Runtime.enable'); await send('Page.enable');
    trailDebugger = createReviewTrailDebugger({ send, sessionId, evidence: report.navigationDebug, onRecord: writeReport });
    const evaluate = createReviewEvaluator({ send, ready: () => trailDebugger.ready(), evidence: report.evaluationEvidence, onRecord: writeReport });
    const wait = condition => evaluate(`new Promise((resolve,reject)=>{const end=performance.now()+25000;const tick=()=>{if(${condition})resolve(true);else if(performance.now()>end)reject(new Error('U1 readiness deadline'));else setTimeout(tick,50)};tick()})`);
    const capture = async (file, clip) => { const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, ...(clip ? { clip } : {}) });
      const bytes = Buffer.from(data, 'base64'); fs.writeFileSync(path.join(output, file), bytes);
      report.images.push({ file, bytes: bytes.length, sha256: sha(bytes) }); return bytes; };
    const frames = (label = 'review.fonts-two-frames') => evaluate(`(${reviewFrameSettlement.toString()})(${JSON.stringify(label)})`, label);
    const scene = () => evaluate(`({trail:[...document.querySelectorAll('#trail .seg')].map(node=>node.textContent),trailVisible:window.__cfU1ReviewNativeTrace.snapshot().trailVisible,context:document.getElementById('ctxbar')?.textContent,bodyClasses:document.body.className})`);
    collectFrameSettlements = async (verifyPortrait = false) => {
      const state = await evaluate(`(${readReviewFrameSettlements.toString()})()`, 'cleanup.read-frame-settlements');
      if (state) { report.frameSettlements.push(state); writeReport(); }
      if (verifyPortrait) {
        const matches = state?.invocations?.filter(row => row.label === 'phone.portrait-restore.fonts-two-frames') ?? [];
        const assessment = assessReviewFrameSettlement(matches[0], { width: 390, height: 844 });
        report.restorationSettlement = { count: matches.length, overflow: state?.overflow ?? true, assessment,
          pass: matches.length === 1 && state?.overflow === false && assessment.pass };
        writeReport(); assert(report.restorationSettlement.pass, 'portrait frame settlement is absent or incomplete: ' + JSON.stringify(report.restorationSettlement));
      }
    };
    collectNativeTrace = async () => {
      const trace = await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace;return t?{viewport:t.viewport,events:t.events,keys:t.keys,changes:t.changes,overflow:t.overflow,final:t.snapshot()}:null;})()`);
      assert(trace && Array.isArray(trace.keys) && Array.isArray(trace.events) && Array.isArray(trace.changes),
        'native review trace is missing or malformed');
      if (trace) {
        const previous = report.nativeTraces.findIndex(row => row.viewport === trace.viewport);
        if (previous < 0) report.nativeTraces.push(trace); else report.nativeTraces[previous] = trace;
        const expectedKeys = report.nativeKeys.filter(proof => proof.viewport === trace.viewport).flatMap(proof => proof.events ?? []);
        trace.keyboardComplete = !trace.overflow && JSON.stringify(trace.keys) === JSON.stringify(expectedKeys)
          && report.nativeKeys.filter(proof => proof.viewport === trace.viewport).every(proof => proof.delivery?.pass);
        writeReport();
        assert(trace.keyboardComplete, 'native keyboard trace contains missing, unowned or unexpected key events');
      }
    };
    const escapeNative = async () => {
      const proof = await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace,id=++t.nextKeyId;t.activeKey={id};
        return{id,viewport:t.viewport,eventStart:t.keys.length,before:t.snapshot()};})()`, 'ascent.prepare-native-Escape');
      report.nativeKeys.push(proof); writeReport();
      let dispatchError;
      try {
        // Windows VK is portable; nativeVirtualKeyCode is host-specific (see Slice's key owner).
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      } catch (error) { dispatchError = error; proof.dispatchError = String(error); }
      Object.assign(proof, await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace;t.activeKey=null;
        return{events:t.keys.slice(${proof.eventStart}),overflow:t.overflow,after:t.snapshot()};})()`, 'ascent.native-Escape-receipt'));
      proof.delivery = assessNativeReviewKeyboardDelivery(proof); writeReport();
      if (dispatchError) throw dispatchError;
      assert(proof.delivery.pass, 'native Escape did not receive exactly two trusted key edges');
    };
    const clickNative = async (selector, expectedTrail = ['Cosmos']) => {
      const traceWasArmed = await trailDebugger.disarm();
      const proof = await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace,e=document.querySelector(${JSON.stringify(selector)});if(!t||!e)throw new Error('Native control/trace missing');
        const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);
        if(e.tagName!=='BUTTON'||e.disabled||e.closest('[inert]')||r.width<=0||r.height<=0||!(h===e||e.contains(h)))throw new Error('Native control unavailable: '+${JSON.stringify(selector)});
        const id=++t.nextId;t.active={id,selector:${JSON.stringify(selector)},node:e};
        return{id,selector:${JSON.stringify(selector)},viewport:t.viewport,point:{x,y},eventStart:t.events.length,changeStart:t.changes.length,beforePress:t.snapshot()};})()`);
      report.nativeInputs.push(proof); writeReport();
      if (expectedTrail) assert.deepEqual(proof.beforePress.trail, expectedTrail, selector + ' native input predecessor changed scope');
      let dispatchError;
      try {
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...proof.point, button: 'left', clickCount: 1 });
        proof.afterDown = await evaluate('window.__cfU1ReviewNativeTrace.snapshot()');
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...proof.point, button: 'left', clickCount: 1 });
        proof.afterUp = await evaluate('window.__cfU1ReviewNativeTrace.snapshot()');
      } catch (error) { dispatchError = error; proof.dispatchError = String(error); }
      const observed = await evaluate(`(()=>{const t=window.__cfU1ReviewNativeTrace,events=t.events.slice(${proof.eventStart}),changes=t.changes.slice(${proof.changeStart});
        t.active=null;return{events,changes,overflow:t.overflow};})()`);
      Object.assign(proof, observed); proof.delivery = assessNativeReviewDelivery(proof); writeReport();
      if (dispatchError) throw dispatchError;
      assert(proof.delivery.pass, selector + ' did not receive the exact trusted native pointer sequence: ' + JSON.stringify(proof));
      if (traceWasArmed) await trailDebugger.arm(proof.viewport);
    };
    for (const [name, width, height, mobile] of cases) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
      await send('Page.navigate', { url: origin + '/' });
      await wait(`document.querySelector('canvas') && document.getElementById('primechip')?.textContent.includes('/9')`);
      await evaluate(`(${installNativeReviewTrace.toString()})(${JSON.stringify(name)})`);
      if (await evaluate(`!!document.querySelector('[data-sel=tutskip]')`)) await clickNative('[data-sel=tutskip]', null);
      await wait(`!document.body.classList.contains('training') && !document.querySelector('[data-sel=tutskip]')`);
      await frames();
      const journey = { name, before: await scene(), steps: [], after: null };
      report.journeys.push(journey); writeReport();
      let currentScene = journey.before;
      for (let presses = 0; JSON.stringify(currentScene.trail) !== '["Cosmos"]' && presses < 6; presses++) {
        await escapeNative();
        await frames(); currentScene = await scene(); journey.steps.push({ input: 'Escape', after: currentScene }); writeReport();
      }
      journey.after = currentScene; writeReport();
      assert.deepEqual(currentScene.trail, ['Cosmos'], name + ' native ascent did not reach Cosmos within six Escape presses');
      await trailDebugger.arm(name);
      const state = await evaluate(`(${shellGeometry.toString()})()`), deltas = metricDeltas(state);
      const phone = width <= 700 ? await evaluate(`(${readU1PhoneShell.toString()})(false)`) : null;
      const candidate = await capture(`u1-main-${name}.png`);
      const goldenFile = `ui-main-${name}.png`, golden = fs.readFileSync(path.join(goldenRoot, goldenFile));
      assert.equal(sha(golden), goldenManifest.find(row => row.file === goldenFile)?.sha256, 'golden integrity');
      const launcher = launcherOutcome(state), topLeft = topLeftOutcome(state);
      const row = { name, scene: currentScene, state, deltas, phone, launcher, topLeft, golden: { file: goldenFile, sha256: sha(golden) },
        pass: deltas.every(delta => delta.pass) && launcher.pass && topLeft.pass && !state.horizontalOverflow && (!phone || phone.ok), controls: [] };
      report.rows.push(row); writeReport();
      assert(row.pass, name + ' U1 geometry: ' + JSON.stringify({ deltas: deltas.filter(d => !d.pass), phone: phone?.errors, launcher: launcher.errors, topLeft: topLeft.errors }));
      // Open and close the visible production-positioned bell, retaining the same native journey.
      await clickNative('#docknotifications');
      await wait(`getComputedStyle(document.getElementById('notificationpanel')).display !== 'none'`);
      await frames();
      const notification = await evaluate(`(()=>{const panel=document.getElementById('notificationpanel'),close=panel.querySelector('[data-pnx]');
        const box=node=>{if(!node)return null;const r=node.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
        const p=box(panel),c=box(close),hit=c?document.elementFromPoint(c.left+c.width/2,c.top+c.height/2):null;
        return{panel:p,close:c,closeNamed:!!close?.getAttribute('aria-label'),closeNative:close?.tagName==='BUTTON'&&!close.disabled&&!close.closest('[inert]'),closeHit:!!hit&&(hit===close||close.contains(hit)),historyRows:panel.querySelectorAll('.notification-entry').length,emptyState:!!panel.querySelector('.notification-empty'),viewport:{width:innerWidth,height:innerHeight}};})()`);
      row.notifications = notification;
      await capture(`u1-notifications-${name}.png`); writeReport();
      const notificationBoundsPass = proof => !!proof.panel && !!proof.close
        && proof.panel.left >= -1 && proof.panel.top >= -1
        && proof.panel.right <= proof.viewport.width + 1 && proof.panel.bottom <= proof.viewport.height + 1
        && proof.close.left >= Math.max(0, proof.panel.left) - 1 && proof.close.top >= Math.max(0, proof.panel.top) - 1
        && proof.close.right <= Math.min(proof.viewport.width, proof.panel.right) + 1
        && proof.close.bottom <= Math.min(proof.viewport.height, proof.panel.bottom) + 1
        && proof.close.width >= 44 && proof.close.height >= 44 && proof.closeNamed && proof.closeNative && proof.closeHit;
      notification.pass = notificationBoundsPass(notification); writeReport();
      assert(notification.pass, name + ' native Notifications panel/Close is not bounded and actionable: ' + JSON.stringify(notification));
      notification.controls = [
        ['panel outside viewport', { ...notification, panel: { ...notification.panel, left: -2 } }],
        ['Close below touch floor', { ...notification, close: { ...notification.close, height: 43 } }],
        ['Close covered', { ...notification, closeHit: false }],
        ['Close unnamed', { ...notification, closeNamed: false }],
      ].map(([controlName, proof]) => ({ name: controlName, rejected: !notificationBoundsPass(proof) }));
      assert(notification.controls.every(control => control.rejected), 'Notifications geometry oracle accepted a malformed observation');
      await clickNative('#notificationpanel [data-pnx]');
      await wait(`getComputedStyle(document.getElementById('notificationpanel')).display === 'none'`);
      await frames();
      const restoredState = await evaluate(`(${shellGeometry.toString()})()`);
      notification.closed = { focusedId: await evaluate(`document.activeElement?.id`), scene: await scene(),
        deltas: metricDeltas(restoredState), phone: width <= 700 ? await evaluate(`(${readU1PhoneShell.toString()})(false)`) : null };
      writeReport();
      assert.equal(notification.closed.focusedId, 'docknotifications', name + ' Notifications Close did not restore its exact native opener');
      assert.deepEqual(notification.closed.scene.trail, ['Cosmos']);
      assert(notification.closed.deltas.every(delta => delta.pass) && launcherOutcome(restoredState).pass && topLeftOutcome(restoredState).pass && !restoredState.horizontalOverflow
        && (!notification.closed.phone || notification.closed.phone.ok), name + ' main shell did not restore after Notifications Close');
      // Every launcher owner must reach its own real panel and return focus to
      // that same button. This is shell reachability, not a U2 panel redesign.
      row.launcherJourneys = [];
      for (const [logicalId, panelId] of LAUNCHER_PANELS) {
        const openerId = state.openers.find(button => button.logicalId === logicalId).id;
        const action = { logicalId, openerId, panelId }; row.launcherJourneys.push(action); writeReport();
        assert.equal(await evaluate(`document.getElementById(${JSON.stringify(openerId)})?.getAttribute('aria-controls')`),
          panelId, name + ' launcher opener is wired to a different panel: ' + openerId);
        await clickNative('#' + openerId);
        await wait(`getComputedStyle(document.getElementById(${JSON.stringify(panelId)})).display !== 'none'`);
        await frames();
        action.opened = await evaluate(`(()=>{const opener=document.getElementById(${JSON.stringify(openerId)}),panel=document.getElementById(${JSON.stringify(panelId)}),close=panel.querySelector('[data-pnx]');
          const r=panel.getBoundingClientRect(),c=close?.getBoundingClientRect(),h=c?document.elementFromPoint(c.left+c.width/2,c.top+c.height/2):null;
          return{expanded:opener.getAttribute('aria-expanded'),panelHidden:panel.getAttribute('aria-hidden'),panelVisible:getComputedStyle(panel).visibility!=='hidden'&&r.width>0&&r.height>0,
            closeNamed:!!(close?.getAttribute('aria-label')||close?.textContent||'').trim(),closeNative:close?.tagName==='BUTTON'&&!close.disabled&&!close.closest('[inert]'),
            closeHit:!!h&&(h===close||close.contains(h)),closeWidth:c?.width??0,closeHeight:c?.height??0,focusedClose:document.activeElement===close};})()`);
        const opened = action.opened;
        action.openPass = opened.expanded === 'true' && opened.panelHidden === 'false' && opened.panelVisible
          && opened.closeNamed && opened.closeNative && opened.closeHit && opened.closeWidth >= 44 && opened.closeHeight >= 44 && opened.focusedClose;
        writeReport(); assert(action.openPass, name + ' native launcher open failed: ' + JSON.stringify(action));
        await clickNative('#' + panelId + ' [data-pnx]');
        await wait(`getComputedStyle(document.getElementById(${JSON.stringify(panelId)})).display === 'none'`);
        await frames();
        const closedState = await evaluate(`(${shellGeometry.toString()})()`);
        action.closed = { focusedId: await evaluate('document.activeElement?.id'),
          expanded: await evaluate(`document.getElementById(${JSON.stringify(openerId)}).getAttribute('aria-expanded')`),
          scene: await scene(), deltas: metricDeltas(closedState), launcher: launcherOutcome(closedState),
          phone: width <= 700 ? await evaluate(`(${readU1PhoneShell.toString()})(false)`) : null };
        action.closePass = action.closed.focusedId === openerId && action.closed.expanded === 'false'
          && JSON.stringify(action.closed.scene.trail) === '["Cosmos"]' && action.closed.deltas.every(delta => delta.pass)
          && action.closed.launcher.pass && topLeftOutcome(closedState).pass && !closedState.horizontalOverflow && (!action.closed.phone || action.closed.phone.ok);
        writeReport(); assert(action.closePass, name + ' native launcher Close did not restore its exact opener and shell: ' + JSON.stringify(action));
      }
      // Slice's same-task Settings -> Motion Auto -> Close sequence can publish
      // an intermediate hidden-Objective height. Reproduce it in the first
      // writable review document: later reloads can be legitimately read-only.
      // This is programmatic, separate from the63 trusted native deliveries.
      if (name === 'phone') {
        const probe = { name: 'same-task Settings / Motion Auto / Close; wide geometry in first writable review document',
          inputMode: 'programmatic', persistenceScope: 'first review document only; no desktop persistence claim',
          sequence: ['#docksets', '#setpanel [data-motion="-1"]', '#setpanel [data-pnx]'],
          original: await evaluate(`(${shellGeometry.toString()})()`) };
        row.programmaticSettingsChrome = probe; writeReport();
        try {
          await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
          await send('Emulation.setTouchEmulationEnabled', { enabled: false, maxTouchPoints: 5 }); await frames();
          probe.before = await evaluate(`(${shellGeometry.toString()})()`);
          await trailDebugger.disarm();
          probe.immediate = await evaluate(`(()=>{const trace=window.__cfU1ReviewNativeTrace,start=trace.events.length,sequence=${JSON.stringify(probe.sequence)},receipts=[];
            for(const [index,selector] of sequence.entries()){
              const node=document.querySelector(selector);if(!(node instanceof HTMLButtonElement)||node.disabled)throw new Error('Programmatic Settings control missing: '+selector);
              const receipt=event=>receipts.push({index,selector,type:event.type,trusted:event.isTrusted,targetMatches:event.target===node,currentTargetMatches:event.currentTarget===node,
                connected:node.isConnected,target:{tag:node.tagName,id:node.id||null,motion:node.getAttribute('data-motion'),close:node.getAttribute('data-pnx')}});
              node.addEventListener('click',receipt,{capture:true,passive:true});
              try{node.click();}finally{node.removeEventListener('click',receipt,true);}
            }
            return{state:(${shellGeometry.toString()})(),receipts,globalEvents:trace.events.slice(start),
              closed:getComputedStyle(document.getElementById('setpanel')).display==='none',
              autoSelected:document.querySelector('#setpanel [data-motion="-1"]')?.getAttribute('aria-pressed')==='true'};})()`);
          await trailDebugger.arm(name);
          probe.delivery = assessProgrammaticSettingsDelivery(probe.immediate.receipts);
          writeReport();
          assert(probe.immediate.closed && probe.immediate.autoSelected, 'same-task programmatic Settings sequence did not complete');
          assert(probe.delivery.pass, 'Settings diagnostic requires exactly three untrusted clicks at the resolved button owners: ' + JSON.stringify(probe.delivery));
          // Use the existing font/two-render-frame boundary. Never invoke an
          // application sync method, bypass read-only guards or poll for green.
          await frames();
          probe.boundary = 'document.fonts.ready followed by two requestAnimationFrame callbacks';
          probe.settled = await evaluate(`(${shellGeometry.toString()})()`);
          probe.checks = metricDeltas(probe.settled).filter(delta => ['topbar published height', 'left rail top gap', 'right rail top gap'].includes(delta.name));
          probe.scene = await scene();
          probe.pass = probe.checks.length === 3 && probe.checks.every(delta => delta.pass);
          writeReport();
          assert.deepEqual(probe.scene.trail, ['Cosmos'], 'programmatic Settings sequence changed canonical scene');
          assert(probe.pass, 'settled Settings chrome height/rail mismatch: ' + JSON.stringify(probe));
        } finally {
          await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
          await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 }); await frames();
          probe.restored = { state: await evaluate(`(${shellGeometry.toString()})()`), scene: await scene() };
          probe.restored.phone = await evaluate(`(${readU1PhoneShell.toString()})(false)`);
          probe.restored.pass = probe.restored.state.viewport.width === width && probe.restored.state.viewport.height === height
            && metricDeltas(probe.restored.state).every(delta => delta.pass) && topLeftOutcome(probe.restored.state).pass
            && launcherOutcome(probe.restored.state).pass && probe.restored.phone.ok && !probe.restored.state.horizontalOverflow;
          writeReport();
          assert.deepEqual(probe.restored.scene.trail, ['Cosmos'], 'programmatic Settings probe failed to restore the original scene');
          assert(probe.restored.pass, 'programmatic Settings probe failed to restore original viewport and shell');
        }
      }
      // Break a measured anchor in the live document, require red, restore and re-observe green.
      const control = await evaluate(`(()=>{const e=document.getElementById('objchip'),prior={present:e.hasAttribute('style'),value:e.getAttribute('style')};
        let broken;try{e.style.setProperty('transform','translateX(100px)','important');broken=(${shellGeometry.toString()})();}
        finally{e.setAttribute('style','');e.removeAttribute('style');if(prior.present)e.setAttribute('style',prior.value);}
        return{broken,restored:(${shellGeometry.toString()})(),styleRestored:e.hasAttribute('style')===prior.present&&e.getAttribute('style')===prior.value};})()`);
      assert(metricDeltas(control.broken).some(d => d.name === 'Objective/Search alignment' && !d.pass));
      assert(control.styleRestored && metricDeltas(control.restored).every(d => d.pass) && launcherOutcome(control.restored).pass);
      row.controls.push({ name: 'live objective displaced100px; exact style restored', brokenDeltas: metricDeltas(control.broken), styleRestored: control.styleRestored, restored: true });
      if (state.compact) {
        const proof = await evaluate(`(()=>{const n=document.getElementById('docksurvey'),prior={present:n.hasAttribute('style'),value:n.getAttribute('style')},before=(${shellGeometry.toString()})(),r=n.getBoundingClientRect(),point=before.centralSpace.point;let broken;
          try{n.style.setProperty('transform','translate('+(point.x-r.left-r.width/2)+'px,'+(point.y-r.top-r.height/2)+'px)','important');broken=(${shellGeometry.toString()})();}
          finally{n.setAttribute('style','');n.removeAttribute('style');if(prior.present)n.setAttribute('style',prior.value);}
          return{broken,restored:(${shellGeometry.toString()})(),styleRestored:n.hasAttribute('style')===prior.present&&n.getAttribute('style')===prior.value};})()`);
        assert(!proof.broken.centralSpace.canvas && proof.broken.centralSpace.ownerId === 'docksurvey', 'Survey fault did not obstruct the observed central point');
        assert(proof.styleRestored && metricDeltas(proof.restored).every(delta=>delta.pass), 'Survey fault did not restore exact style and shell');
        row.controls.push({name:'clear central scene — Survey moved to actual observed centre',...proof});writeReport();
      }
      const metricMutations = [
        ['topbar published height', ':root', '--topbar-h', '321px'],
        ['hidden canonical trail', '#trail', 'display', 'block'],
        ['header first-row alignment', '#dockinventory', 'transform', 'translateY(10px)'],
        ['header second-row alignment', '#hpbar', 'transform', 'translateY(10px)'],
        ['health/nameplate left alignment', '#hpbar', 'transform', 'translateX(10px)'],
        ['Objective/Search alignment', '#objchip', 'transform', 'translateX(10px)'],
        ['header row gap', '#hpbar', 'transform', 'translateY(10px)'],
        ...(!state.compact ? [['clear central scene', '#sceneactions', 'left', '50%']] : []),
        ['hintpill plain text chrome', '#hintpill', 'background-color', 'rgb(0,0,0)'],
        ['ctxbar flat caption chrome', '#ctxbar', 'border', '1px solid white'],
        ...(state.compact ? [
          ['raillft hidden', '#raillft', 'display', 'flex'],
          ['railrgt hidden', '#railrgt', 'display', 'flex'],
          ['phone scene group dock owner', '#sceneactions', 'display', 'block'],
          ['phone Charts shortcut hidden', '#dockcharts', 'display', 'flex'],
          ['phone Survey dock placement', '#docksurvey', 'transform', 'translateY(-60px)'],
          ['phone dock bottom', '#dock', 'bottom', '1px'],
          ['phone dock width', '#dock', 'width', '280px'],
          ['phone dock height (default text)', '#dock', 'height', '120px'],
          ['phone hint bottom', '#hintpill', 'bottom', '1px'],
          ['phone caption bottom', '#ctxbar', 'bottom', '1px'],
          ['phone Search width', '#searchbox', 'width', '100px'],
          ...state.dock.slice(1, 5).map((button, i) => ['boards centre pitch ' + (i + 1), '#' + button.id, 'transform', 'translateX(10px)']),
          ...state.dock.slice(6).map((button, i) => ['utilities centre pitch ' + (i + 1), '#' + button.id, 'transform', 'translateX(10px)']),
        ] : [
          ['scene action left alignment', '#sceneactions', 'transform', 'translateX(10px)'],
          ['Survey/Compendium gap', '#railcodex', 'transform', 'translateY(10px)'],
          ...state.textPills.map(pill => [pill.id + ' text-fit width', pill.id === 'playerchip' ? '#dockinventory' : '#' + pill.id, 'width', '236px']),
          ['raillft visible', '#raillft', 'display', 'none'],
          ['railrgt visible', '#railrgt', 'display', 'none'],
          ['left rail top gap', '#raillft', 'transform', 'translateY(10px)'],
          ['right rail top gap', '#railrgt', 'transform', 'translateY(10px)'],
          ['left rail inset', '#raillft', 'transform', 'translateX(10px)'],
          ['right rail inset', '#railrgt', 'transform', 'translateX(10px)'],
          ['Survey left rail placement', '#docksurvey', 'transform', 'translateY(10px)'],
          ['Atlas/Shipyard gap', '#railshipyard', 'transform', 'translateY(10px)'],
          ['left stack below rail gap', '#sceneactions', 'transform', 'translateY(10px)'],
          ['Prime top centre', '#primechip', 'transform', 'translateX(-40%)'],
          ['Prime top', '#primechip', 'top', '80px'],
          ['Search width', '#searchbox', 'width', '100px'],
          ['utility dock width', '#dock', 'width', '260px'],
          ['utility dock height', '#dock', 'height', '100px'],
          ['utility dock right inset', '#dock', 'right', '1px'],
          ['utility dock bottom', '#dock', 'bottom', '1px'],
          ['utility dock gap owner', '#dock', 'pointer-events', 'none'],
          ['wide hint bottom', '#hintpill', 'bottom', '1px'],
          ['wide caption bottom', '#ctxbar', 'bottom', '1px'],
          ...state.dock.slice(1).map((button, i) => ['utility centre pitch ' + (i + 1), '#' + button.id, 'transform', 'translateX(10px)']),
          ['dockrecords utility width', '#dockrecords', 'width', '100px'],
          ['dockrecords utility height', '#dockrecords', 'height', '100px'],
          ['dockrecords utility face width', '#dockrecords .utility-face', 'width', '30px'],
          ['dockrecords utility face height', '#dockrecords .utility-face', 'height', '30px'],
        ]),
      ];
      for (const [metric, selector, property, value] of metricMutations) {
        const proof = await evaluate(`(()=>{const node=document.querySelector(${JSON.stringify(selector)}),property=${JSON.stringify(property)},
          prior={present:node.hasAttribute('style'),value:node.getAttribute('style')},propertyValue=node.style.getPropertyValue(property),priority=node.style.getPropertyPriority(property);let broken;
          try{node.style.setProperty(property,${JSON.stringify(value)},'important');broken=(${shellGeometry.toString()})();}
          finally{node.setAttribute('style','');node.removeAttribute('style');if(prior.present)node.setAttribute('style',prior.value);}
          return{broken,restored:(${shellGeometry.toString()})(),styleRestored:node.hasAttribute('style')===prior.present&&node.getAttribute('style')===prior.value,
            propertyRestored:node.style.getPropertyValue(property)===propertyValue&&node.style.getPropertyPriority(property)===priority};})()`);
        const brokenDelta = metricDeltas(proof.broken).find(delta => delta.name === metric), restoredDeltas = metricDeltas(proof.restored);
        row.controls.push({ name: metric, selector, property, value, brokenDelta, broken: proof.broken, restoredObservation: proof.restored,
          styleRestored: proof.styleRestored, propertyRestored: proof.propertyRestored,
          restored: restoredDeltas.every(delta => delta.pass) && launcherOutcome(proof.restored).pass });
        writeReport();
        assert(brokenDelta && !brokenDelta.pass && proof.styleRestored && proof.propertyRestored && row.controls.at(-1).restored,
          name + ' geometry control failed: ' + JSON.stringify(row.controls.at(-1)));
      }
      for (const [controlName, selector, property, value] of [
        ['missing native Prime opener', '#primechip', 'display', 'none'],
        ['Settings opener cannot receive a native pointer', '#docksets', 'pointer-events', 'none'],
      ]) {
        const proof = await evaluate(`(()=>{const node=document.querySelector(${JSON.stringify(selector)}),prior={present:node.hasAttribute('style'),value:node.getAttribute('style')};let broken;
          try{node.style.setProperty(${JSON.stringify(property)},${JSON.stringify(value)},'important');broken=(${shellGeometry.toString()})();}
          finally{node.setAttribute('style','');node.removeAttribute('style');if(prior.present)node.setAttribute('style',prior.value);}
          return{broken,restored:(${shellGeometry.toString()})(),styleRestored:node.hasAttribute('style')===prior.present&&node.getAttribute('style')===prior.value};})()`);
        const broken = launcherOutcome(proof.broken), restored = launcherOutcome(proof.restored);
        row.controls.push({ name: controlName, selector, property, value, broken, brokenObservation: proof.broken,
          styleRestored: proof.styleRestored, restoredObservation: proof.restored, restored: restored.pass && metricDeltas(proof.restored).every(delta => delta.pass) });
        writeReport();
        assert(!broken.pass && proof.styleRestored && row.controls.at(-1).restored,
          name + ' native launcher control failed: ' + JSON.stringify(row.controls.at(-1)));
      }
      for (const [attribute, value] of [['tabindex', '0'], ['role', 'button']]) {
        const proof = await evaluate(`(()=>{const n=document.getElementById('trail'),attribute=${JSON.stringify(attribute)},prior={present:n.hasAttribute(attribute),value:n.getAttribute(attribute)};let broken;
          try{n.setAttribute(attribute,${JSON.stringify(value)});broken=(${shellGeometry.toString()})();}
          finally{n.removeAttribute(attribute);if(prior.present)n.setAttribute(attribute,prior.value);}
          return{broken,restored:(${shellGeometry.toString()})(),attributeRestored:n.hasAttribute(attribute)===prior.present&&n.getAttribute(attribute)===prior.value};})()`);
        const broken = topLeftOutcome(proof.broken), restored = topLeftOutcome(proof.restored);
        row.controls.push({ name: 'hidden canonical trail rejects ' + attribute + '=' + value, broken, brokenObservation: proof.broken,
          attributeRestored: proof.attributeRestored, restoredObservation: proof.restored, restored: proof.attributeRestored && restored.pass });
        writeReport(); assert(!broken.pass && row.controls.at(-1).restored, 'hidden canonical trail accepted interactive metadata');
      }
      // Keep the enlarged-text/short-landscape check bounded to two numeric
      // observations in this same document; no fourth screenshot or save write.
      if (name === 'phone') {
        row.extraProbes = [];
        const priorClass = await evaluate(`({present:document.body.hasAttribute('class'),value:document.body.getAttribute('class')})`);
        const enlarged = { name: 'phone fs-xl top/left fit' }; row.extraProbes.push(enlarged);
        try {
          await evaluate(`(()=>{document.body.classList.remove('fs-lg');document.body.classList.add('fs-xl');return true;})()`); await frames();
          enlarged.state = await evaluate(`(${shellGeometry.toString()})()`);
          enlarged.topLeft = topLeftOutcome(enlarged.state);
          enlarged.phone = await evaluate(`(${readU1PhoneShell.toString()})(false)`);
          enlarged.pass = enlarged.topLeft.pass && enlarged.phone.ok && !enlarged.state.horizontalOverflow;
          writeReport(); assert(enlarged.pass, 'phone fs-xl top/left fit: ' + JSON.stringify(enlarged));
        } finally {
          enlarged.classRestored = await evaluate(`(()=>{const p=${JSON.stringify(priorClass)};document.body.removeAttribute('class');if(p.present)document.body.setAttribute('class',p.value);
            return document.body.hasAttribute('class')===p.present&&document.body.getAttribute('class')===p.value;})()`); await frames();
          writeReport();
        }
        const normal = await evaluate(`(${shellGeometry.toString()})()`);
        assert(enlarged.classRestored && topLeftOutcome(normal).pass && metricDeltas(normal).every(delta => delta.pass), 'phone fs-xl probe did not restore exact classes and default geometry');
        const narrow = { name: '844x390 native Settings-open top/left fit' }; row.extraProbes.push(narrow);
        try {
          await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true }); await frames();
          await clickNative('#docksets'); await wait(`getComputedStyle(document.getElementById('setpanel')).display !== 'none'`); await frames();
          narrow.state = await evaluate(`(${shellGeometry.toString()})()`);
          narrow.topLeft = topLeftOutcome(narrow.state, true);
          narrow.phone = await evaluate(`(${readU1PhoneShell.toString()})(false)`);
          narrow.pass = narrow.topLeft.pass && narrow.phone.ok && !narrow.state.horizontalOverflow;
          writeReport(); assert(narrow.pass, 'narrow panel-open top/left fit: ' + JSON.stringify(narrow));
          const collision=await evaluate(`(()=>{const n=document.getElementById('topbar'),prior={present:n.hasAttribute('style'),value:n.getAttribute('style')};let broken;
            try{n.style.setProperty('min-height','390px','important');broken=(${shellGeometry.toString()})();}
            finally{n.removeAttribute('style');if(prior.present)n.setAttribute('style',prior.value);}
            return{broken,restored:(${shellGeometry.toString()})(),styleRestored:n.hasAttribute('style')===prior.present&&n.getAttribute('style')===prior.value};})()`);
          narrow.collisionControl={...collision,brokenOutcome:topLeftOutcome(collision.broken,true),restoredOutcome:topLeftOutcome(collision.restored,true)};
          writeReport();assert(narrow.collisionControl.brokenOutcome.errors.includes('right-column controls collide with the launcher')
            &&collision.styleRestored&&narrow.collisionControl.restoredOutcome.pass,'short-landscape header/dock collision control failed');
          await clickNative('#setpanel [data-pnx]'); await wait(`getComputedStyle(document.getElementById('setpanel')).display === 'none'`); await frames();
          narrow.closed = { focusedId: await evaluate('document.activeElement?.id'), scene: await scene() }; writeReport();
          assert.equal(narrow.closed.focusedId, 'docksets'); assert.deepEqual(narrow.closed.scene.trail, ['Cosmos']);
        } finally {
          narrow.portraitRestore = { requestedViewport: { width, height, mobile }, phase: 'metrics-override-pending', startedAt: new Date().toISOString() };
          writeReport();
          await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
          Object.assign(narrow.portraitRestore, { phase: 'metrics-acknowledged', acknowledgedAt: new Date().toISOString() }); writeReport();
          await frames('phone.portrait-restore.fonts-two-frames');
          narrow.portraitRestore.phase = 'frames-settled'; writeReport();
        }
        const restored = await evaluate(`(${shellGeometry.toString()})()`, 'phone.portrait-restore.shell-geometry');
        narrow.portraitRestore.phase = 'geometry-read'; writeReport();
        narrow.restored = restored.viewport.width === width && restored.viewport.height === height
          && topLeftOutcome(restored).pass && metricDeltas(restored).every(delta => delta.pass) && launcherOutcome(restored).pass;
        writeReport(); assert(narrow.restored, 'narrow Settings probe did not restore the original viewport and shell');
      }
      await trailDebugger.disarm();
      await collectFrameSettlements(name === 'phone');
      await collectNativeTrace();
      if (phoneRestorationOnly) continue;
      // Use an isolated generated proof page for exact-sized originals, raster difference and contact sheet.
      const imageData = [golden, candidate].map(bytes => 'data:image/png;base64,' + bytes.toString('base64'));
      await send('Page.navigate', { url: 'about:blank' });
      await evaluate(`(async()=>{document.body.style.cssText='margin:0;background:#101624;color:#edf2fa;font:16px system-ui';
        const sources=${JSON.stringify(imageData)},labels=['Production v1.8.9 golden','U1 candidate','Raster difference — review only'];
        const images=await Promise.all(sources.map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;})));
        const grid=document.createElement('div');grid.style.cssText='display:flex;gap:16px;padding:16px;width:max-content';
        const canvases=images.map(i=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);return c});
        const diff=document.createElement('canvas');diff.width=${width};diff.height=${height};const a=canvases[0].getContext('2d').getImageData(0,0,${width},${height}),b=canvases[1].getContext('2d').getImageData(0,0,${width},${height}),ctx=diff.getContext('2d'),d=ctx.createImageData(${width},${height});
        for(let i=0;i<d.data.length;i+=4){for(let c=0;c<3;c++)d.data[i+c]=Math.abs(a.data[i+c]-b.data[i+c]);d.data[i+3]=255;}ctx.putImageData(d,0,0);canvases.push(diff);
        canvases.forEach((canvas,i)=>{const col=document.createElement('section'),label=document.createElement('div');label.textContent=labels[i];label.style.cssText='height:32px';col.append(label,canvas);grid.append(col)});document.body.append(grid);return true;})()`);
      await send('Emulation.setDeviceMetricsOverride', { width: width * 3 + 64, height: height + 64, deviceScaleFactor: 1, mobile: false });
      await capture(`u1-main-${name}-comparison.png`, { x: 0, y: 0, width: width * 3 + 64, height: height + 64, scale: 1 });
    }
    assert.equal(report.errors.length, 0, report.errors.join('\n'));
    assert.equal(git(['rev-parse', 'HEAD']), source, 'source changed during review');
    assert.equal(git(['diff', '--name-only', 'HEAD']), '', 'source became dirty during review');
    await trailDebugger.dispose();
    report.status = 'PASS';
  } catch (error) {
    report.status = 'FAIL'; report.failure = String(error);
    try { await trailDebugger?.disarm(); } catch (debugError) { report.navigationDebugCleanupError = String(debugError); }
    try { await collectFrameSettlements?.(); } catch (settlementError) { report.frameSettlementCollectionError = String(settlementError); }
    try { await collectNativeTrace?.(); } catch (traceError) { report.nativeTraceCollectionError = String(traceError); }
    throw error;
  } finally {
    try { await trailDebugger?.dispose(); } catch (debugError) {
      report.status = 'FAIL'; report.navigationDebugCleanupError = String(debugError);
    }
    await browser?.close(); if (server.listening) await new Promise(resolve => server.close(resolve)); report.endedAt = new Date().toISOString(); writeReport(); }
  console.log(`U1 ${phoneRestorationOnly ? 'PHONE RESTORATION' : 'REVIEW'} PASS: ${report.rows.length} scoped viewports; ${report.images.length} PNGs; ${source}`);
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.length <= 5 && (process.argv[4] === undefined || process.argv[4] === '--phone-restoration-only'), 'usage: ui-shell-review.mjs BUILD NEW_OUTPUT [--phone-restoration-only]');
  await runUiShellReview(process.argv[2], process.argv[3], { scope: process.argv[4] ? 'phone-restoration' : undefined });
}
