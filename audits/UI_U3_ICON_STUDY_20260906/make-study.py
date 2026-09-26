#!/usr/bin/env python3
"""Original review art only; no game files are modified."""
from pathlib import Path
from html import escape
import hashlib, json, subprocess
ROOT=Path(__file__).resolve().parent
ICONS=[
('survey','Survey','🔭','Reopen the selected object or landed world.', '<path d="m4 9 11-6 3 5-11 6zM3 9l2-1 3 5-2 1M16 2l3 5M12 12v3m0 0-5 7m5-7 5 7m-5-7v7"/>'),
('compendium','Compendium','📖','Browse the species catalogue.', '<path d="M12 5C9 3 5 3 2.5 4v15C6 18 9 18 12 20c3-2 6-2 9.5-1V4C19 3 15 3 12 5Zm0 0v15M6 7l3 .5M6 11l3 .5m6-4 3-.5m-3 4 3-.5"/>'),
('prime','Prime','✦','Track nine Prime signatures; keep the visible count.', '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/><path d="m19 3 .7 1.3L21 5l-1.3.7L19 7l-.7-1.3L17 5l1.3-.7Z" stroke-width="1.2"/>'),
('shipyard','Shipyard','🛠','Build, equip and manage ships.', '<path d="m5 3 4 4-2 2-4-4-1 4 4 4 4-1 9 9 3-3-9-9 1-4-4-4ZM15 14l-7 7-3-3 7-7"/>'),
('atlas','Atlas','🌍','Explore the star map.', '<circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="3.5" ry="8"/><path d="M4 12h16M6 7h12M6 17h12"/>'),
('records','Records','🏆','Review records and achievements.', '<path d="M7 3h10v5c0 4-2 6-5 6s-5-2-5-6V3ZM7 5H3v3c0 3 2 4 5 4m9-7h4v3c0 3-2 4-5 4M12 14v5m-4 2h8m-6-2h4"/>'),
('notifications','Notifications','🔔','Read saved alerts and updates.', '<path d="M5 17c2-2 2-4 2-7a5 5 0 0 1 10 0c0 3 0 5 2 7H5ZM10 20a2.2 2.2 0 0 0 4 0M12 3V2"/>'),
('guide','Guide','?','Open instructions and reference information.', '<circle cx="12" cy="12" r="9"/><path d="M9.2 8a3 3 0 0 1 5.6 1c0 2-2.8 2-2.8 4M12 17h.01"/>'),
('settings','Settings','⚙','Adjust display, sound and preferences.', '<path d="m10 2-.5 3-2 .9-2.5-1.4-2 3.5 2 1.8v2.4l-2 1.8 2 3.5L7.5 16l2 .9.5 3h4l.5-3 2-.9 2.5 1.5 2-3.5-2-1.8V9.8l2-1.8-2-3.5-2.5 1.4-2-.9-.5-3Z"/><circle cx="12" cy="11.5" r="3"/>'),
('objective','Objective / Charters','⬆ / 📜','Open Charters; keep objective text and progress.', '<path d="M6 3h12v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2h12v2M6 3a2 2 0 0 0-2 2v2h4V5a2 2 0 0 0-2-2Zm4 7 3-3 3 3m-3-3v7"/>'),
]
def svg(id,label,paths):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" role="img" aria-labelledby="{id}-title"><title id="{id}-title">{escape(label)}</title>{paths}</svg>'
def write_new(name,text):
    p=ROOT/name
    assert not p.exists(), f'Refuse overwrite: {p}'
    p.write_text(text,encoding='utf8')
for id,label,emoji,meaning,paths in ICONS:write_new(id+'.svg',svg(id,label,paths)+'\n')
rows=[]
for id,label,emoji,meaning,paths in ICONS:
    count='<span class="count">0/9</span>' if id=='prime' else ''
    rows.append(f'<article class="card"><div class="card-head"><h2>{escape(label)}</h2><span>{escape(meaning)}</span></div><div class="comparison"><div><span class="column-label">CURRENT</span><div class="sample"><span class="emoji">{emoji}</span>{count}</div></div><div><span class="column-label">ORBIT LINE · STUDY</span><div class="sample proposed">{svg(id+"-sample",label,paths)}{count}</div></div><span class="size-note">24px symbol<br>44px target</span></div></article>')
phone=''.join(f'<div class="phone-key" title="{escape(label)}">{svg(id+"-dock",label,paths)}'+('<small>0/9</small>' if id=='prime' else '')+'</div>' for id,label,emoji,meaning,paths in ICONS[:5])
utility=''.join(f'<div class="phone-key utility" title="{escape(label)}">{svg(id+"-utility",label,paths)}</div>' for id,label,emoji,meaning,paths in ICONS[5:9])
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Celestial Frontier · Icon study</title><style>
:root{color-scheme:dark;--bg:#080f1b;--surface:#111e30;--line:#294059;--ink:#e8f0f8;--muted:#a3b5c8;--gold:#dab97b;--accent:#a5d8e8;--icon:24px}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:1160px;margin:auto;padding:48px 28px 36px}header{border-bottom:1px solid var(--line);padding-bottom:24px}.eyebrow{letter-spacing:.18em;color:var(--gold);font-size:12px}h1{font-size:40px;line-height:1.14;font-weight:600;letter-spacing:-.035em;margin:14px 0}p{max-width:800px;margin:12px 0;color:var(--muted)}.toolbar{display:flex;gap:24px;flex-wrap:wrap;align-items:center;margin:24px 0;color:var(--muted)}label{display:flex;gap:9px;align-items:center;min-height:44px}input{accent-color:var(--gold)}input[type=range]{width:120px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card{border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:20px}.card-head h2{font-size:17px;font-weight:550;margin:0 0 2px}.card-head>span{font-size:12px;color:var(--muted)}.comparison{display:grid;grid-template-columns:1fr 1fr 80px;align-items:end;gap:12px;margin-top:17px}.column-label{font-size:10px;letter-spacing:.08em;color:var(--muted);display:block;margin-bottom:9px}.sample{height:44px;min-width:60px;width:max-content;padding:2px 12px;display:flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--line);border-radius:24px;background:#0d1928}.emoji{font-family:"Apple Color Emoji","Segoe UI Emoji",sans-serif;font-size:var(--icon);line-height:1}.sample svg,.phone-key svg{width:var(--icon);height:var(--icon);color:var(--accent)}.count{font-size:12px;color:var(--ink)}.size-note{font-size:11px;color:var(--muted);align-self:center}.selected .proposed{background:#332b20;border-color:#ae8a4f}.selected .proposed svg{color:var(--gold)}.bottom{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px;padding:28px 0;border-top:1px solid var(--line)}h3{font-size:16px;font-weight:550;margin:0 0 8px}.phone{width:320px;max-width:100%;display:grid;grid-template-columns:repeat(10,1fr);row-gap:4px;margin:12px 0}.phone-key{grid-column:span 2;height:44px;width:calc(100% - 4px);display:flex;align-items:center;justify-content:center;gap:3px;background:#102235;border:1px solid #31516c;border-radius:23px}.phone-key svg{width:22px;height:22px}.phone-key small{font-size:11px}.phone-key.utility{width:36px;height:36px;justify-self:center;margin:4px 0;background:#101c2b;border-color:#2a3c50}.utility:nth-child(6){grid-column:2/4}.utility:nth-child(7){grid-column:4/6}.utility:nth-child(8){grid-column:6/8}.utility:nth-child(9){grid-column:8/10}.bottom p,footer{font-size:12px}footer{color:#8398af;border-top:1px solid var(--line);padding-top:20px}.choice{color:var(--ink)}@media(max-width:700px){main{padding:28px 16px}h1{font-size:31px}.grid,.bottom{grid-template-columns:1fr}.bottom{gap:18px}.card{padding:18px}.comparison{grid-template-columns:1fr 1fr 60px}.size-note{font-size:10px}}
</style><main><header><div class="eyebrow">CELESTIAL FRONTIER / U3 REVIEW STUDY 01</div><h1>Familiar symbols. A shared visual language.</h1><p>Keep the current emoji and text symbols, or choose this original SVG direction: open shapes, rounded strokes and a restrained accent. This study changes no controls or game assets.</p></header><div class="toolbar"><label><input id="selected" type="checkbox"> Preview gold selected state</label><label>Symbol size <input id="size" type="range" min="20" max="32" step="2" value="24"><output id="size-value">24px</output></label></div><section class="grid" aria-label="Current symbols beside proposed original SVG icons">'''+''.join(rows)+'''</section><section class="bottom"><div><h3>At phone dock scale</h3><p>SVG direction only. The accepted five-plus-four arrangement and visible Prime count stay intact.</p><div class="phone" aria-label="SVG study dock, decorative preview">'''+phone+utility+'''</div></div><div><h3>The choice</h3><p class="choice">Current: colorful, familiar and platform dependent.<br>Orbit line: consistent silhouettes, stroke weight and selection color.</p><p>The glyph is 24px at the default comparison scale; a real control retains at least a 44px hit target. Objective text/progress and the Prime N/9 counter are separate from their icons. Guide currently uses “?”; Prime uses “✦”.</p></div></section><footer>Original SVG paths authored by OpenAI/Codex for Celestial Frontier · 6 September 2026. No third-party icon pack or embedded fonts. Current symbols render through this device's fonts. Review only; adoption requires Nick's choice.</footer></main><script>document.getElementById('selected').addEventListener('change',e=>document.body.classList.toggle('selected',e.target.checked));document.getElementById('size').addEventListener('input',e=>{document.documentElement.style.setProperty('--icon',e.target.value+'px');document.getElementById('size-value').value=e.target.value+'px';document.querySelectorAll('.size-note').forEach(n=>n.innerHTML=e.target.value+'px symbol<br>44px target');});</script></html>'''
write_new('index.html',html+'\n')
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1410" viewBox="0 0 1240 1410">','<rect width="1240" height="1410" fill="#080f1b"/>']
def text(x,y,value,size=16,color='#e8f0f8',weight='normal',family='Arial, sans-serif'):
    out.append(f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(value)}</text>')
text(48,45,'CELESTIAL FRONTIER  /  U3 ICON STUDY 01',12,'#dab97b')
text(48,97,'Familiar symbols. A shared visual language.',35,weight='bold')
text(48,133,'Current emoji and text symbols beside one original SVG direction.',18,'#a3b5c8')
text(48,158,'Review only: no product replacement. 24px symbols in 44px targets; same icon scale in both columns.',13,'#a3b5c8')
for i,(id,label,emoji,meaning,paths) in enumerate(ICONS):
    x=48+(i%2)*580;y=190+(i//2)*182
    out.append(f'<rect x="{x}" y="{y}" width="564" height="166" rx="16" fill="#111e30" stroke="#294059"/>')
    text(x+22,y+31,label,18,weight='bold');text(x+22,y+54,meaning,12,'#a3b5c8')
    for dx,lab in [(22,'CURRENT'),(178,'ORBIT LINE · STUDY'),(369,'SELECTED')]:text(x+dx,y+82,lab,10,'#a3b5c8')
    for dx,stroke,bg in [(22,'#294059','#0d1928'),(178,'#294059','#0d1928'),(369,'#ae8a4f','#332b20')]:
        out.append(f'<rect x="{x+dx}" y="{y+96}" width="92" height="44" rx="22" fill="{bg}" stroke="{stroke}"/>')
    text(x+35,y+126,emoji,24,family='Apple Color Emoji, Arial, sans-serif')
    if id=='prime':text(x+66,y+124,'0/9',12)
    for dx,color in [(211,'#a5d8e8'),(402,'#dab97b')]:
        offset=-7 if id=='prime' else 0
        out.append(f'<g transform="translate({x+dx+offset} {y+106})" fill="none" stroke="{color}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">{paths}</g>')
        if id=='prime':text(x+dx+21,y+124,'0/9',12)
text(48,1147,'ONE SYSTEM, DISTINCT SILHOUETTES',12,'#dab97b')
text(48,1180,'24-unit grid · 1.65-unit rounded stroke · Ice accent / gold selected state',19)
text(48,1212,'Prime N/9 and objective text/progress remain separate, visible information.',15,'#a3b5c8')
text(48,1239,'Guide currently uses “?”; Prime uses “✦”; Objective uses “⬆” or the Charters scroll.',15,'#a3b5c8')
text(48,1290,'CHOICE FOR NICK',12,'#dab97b')
text(48,1320,'Keep the colorful current symbols, or refine the original Orbit line SVG direction.',18)
text(48,1364,'Original paths: OpenAI/Codex for Celestial Frontier · 2026-09-06 · No third-party icon artwork.',12,'#8398af')
text(48,1387,'Current glyph appearance is supplied by the local font renderer. No fonts are embedded or redistributed.',12,'#8398af')
out.append('</svg>')
write_new('study.svg','\n'.join(out)+'\n')
manifest={'schema':'cf-u3-icon-study/v1','date':'2026-09-06','sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'author':'OpenAI/Codex for Celestial Frontier','status':'REVIEW_ONLY_NOT_ADOPTED','license':'Original agent-authored SVG paths; no third-party icon artwork or embedded fonts. This study assigns no new repository-wide license. Unicode reference glyphs use host fonts; font software is not redistributed.','icons':[{'id':id,'label':label,'currentSymbol':emoji,'purpose':meaning,'file':id+'.svg'} for id,label,emoji,meaning,paths in ICONS],'vectorSystem':{'viewBox':'0 0 24 24','strokeWidth':1.65,'linecap':'round','linejoin':'round','defaultDisplayPx':24,'controlMinimumPx':44},'authority':'port/UI_PARITY_PROGRAM_U1_U4.md: emoji retained in U1-U2; U3 comparison study precedes any switch','files':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(ROOT.iterdir()) if p.is_file()}}
write_new('provenance.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'Created ten original SVGs, standalone HTML and SVG proof sheet in {ROOT}')
