// RENDER AUDIT (v1.6): the determinism fingerprint only exercises PROCEDURAL
// species, so a throw inside an Earth-gated rig (_rigGastropod, _rigCeph, the
// coral architectures, cat sub-rigs, cetacean heads, ...) would slip past
// validate.js. This boots the game in jsdom (fake 2D context) and actually
// RENDERS every Earth fauna name via speciesPortrait, plus a set of synthetic
// names that force each new shape variant, asserting none throw or return empty.
//
// Usage: node tools/render-audit.js
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { makeFake2D } = require('./fake2d.js');
const t = (f) => path.join(__dirname, f);

// roster (bare object body) + synthetic names that force new shape variants
const raw = fs.readFileSync(t('_earthnames.js'), 'utf8').trim().replace(/,\s*$/, '');
const ROSTER = eval('({' + raw + '})');   // eslint-disable-line no-eval
const SYNTH = [
  // coral architectures
  'Brain Coral', 'Staghorn Coral', 'Elkhorn Coral', 'Table Coral', 'Fan Coral',
  'Sea Whip', 'Gorgonian', 'Bubble Coral',
  // cephalopod split
  'Common Octopus', 'Reef Squid', 'Broadclub Cuttlefish', 'Chambered Nautilus',
  // gastropod shapes
  'Garden Snail', 'Giant Conch', 'Common Limpet', 'Sea Slug',
  // cat sub-rigs
  'Cheetah', 'Cougar', 'Puma', 'Mountain Lion', 'Bobcat', 'Caracal', 'Canada Lynx',
  // cetacean heads/dorsals
  'Sperm Whale', 'Beluga Whale', 'Pilot Whale', "Killer Whale", 'Bottlenose Dolphin',
  // sessile cone
  'Acorn Barnacle',
];
const NAMES = (ROSTER.fauna || []).concat(SYNTH);
const FLORA = (ROSTER.flora || []).concat([
  'Willow', 'Baobab', 'Acacia', 'Redwood', 'Sequoia', 'Sunflower', 'Orchid', 'Lavender',
  'Cattail', 'Aloe', 'Agave', 'Duckweed', 'Spanish Moss', 'Reindeer Lichen', 'Lotus', 'Water Lily',
]);

const html = fs.readFileSync(t('probe-build.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e && e.message)));

const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true,
  url: 'file:///game/celestial-frontier.html', virtualConsole: vc,
  beforeParse(window) {
    const proto = window.HTMLCanvasElement.prototype;
    proto.getContext = function (kind) {
      if (kind !== '2d') return null;
      if (!this.__fake2d) this.__fake2d = makeFake2D(this);
      return this.__fake2d;
    };
    proto.toDataURL = function () { return 'data:image/png;base64,'; };
    window.addEventListener('error', (ev) => errors.push('window.onerror: ' + (ev.message || String(ev.error))));
    window.__NAMES__ = NAMES;
    window.__FLORA__ = FLORA;
  },
});
const { window } = dom;

setTimeout(() => {
  try {
    const probe = `(function(){
      var H=window.__PROBE_HOOK__, out={fails:[],count:0};
      if(!H||!H.makeGenome||!H.speciesPortrait){ out.fails.push('no probe hook'); window.__RENDER_AUDIT__=out; return; }
      var seed=100000;
      (window.__NAMES__||[]).forEach(function(nm){
        try{
          var g=H.makeGenome(seed++, 'fauna', 0.4);
          g._earthName=nm; g.name=nm;
          var url=H.speciesPortrait(g);
          out.count++;
          if(!url) out.fails.push(nm+': empty');
        }catch(e){ out.fails.push(nm+': '+(e&&e.message)); }
      });
      (window.__FLORA__||[]).forEach(function(nm){
        try{
          var g=H.makeGenome(seed++, 'flora', 0.4);
          g._earthName=nm; g.name=nm;
          var url=H.speciesPortrait(g);
          out.count++;
          if(!url) out.fails.push('[flora] '+nm+': empty');
        }catch(e){ out.fails.push('[flora] '+nm+': '+(e&&e.message)); }
      });
      window.__RENDER_AUDIT__=out;
    })();`;
    const s = window.document.createElement('script');
    s.textContent = probe;
    window.document.body.appendChild(s);
  } catch (e) { errors.push('probe-inject: ' + e.message); }

  setTimeout(() => {
    const ra = window.__RENDER_AUDIT__ || { fails: ['no result'], count: 0 };
    console.log('boot errors:', errors.length);
    if (errors.length) console.log(errors.slice(0, 10).join('\n'));
    console.log('rendered:', ra.count, ' render fails:', ra.fails.length);
    if (ra.fails.length) console.log('  ' + ra.fails.slice(0, 30).join('\n  '));
    window.close();
    const bad = errors.length || ra.fails.length;
    if (!bad) console.log('PASS  render audit  — ' + ra.count + ' Earth species rendered clean (incl. new rigs)');
    process.exit(bad ? 1 : 0);
  }, 500);
}, 400);
