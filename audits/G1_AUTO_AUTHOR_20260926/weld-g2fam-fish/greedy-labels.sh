#!/bin/zsh
# Greedy selective weld (C48 recipe, unchanged gate) on the TAIL-LABELLED fits (auto-g2tail-labels-v1/<fish>/tail-labels/fit),
# Claude 2026-09-27: the labels fill the tail stalk; the welds close the remaining axial body seams. Same base pair as greedy.sh.
cd /Users/dakk/Projects/celestial-frontier-anthropic-mac; W=audits/G1_AUTO_AUTHOR_20260926/weld-g2fam-fish; L=audits/G1_AUTO_AUTHOR_20260926/auto-g2tail-labels-v1
typeset -A BASE; BASE=(06-trout '[["body","spine1"]]' 07-perch '[["body","body-1"]]' 08-cod '[["body","body-1"]]' 09-carp '[["body","body-1"]]' 10-herring '[["body","spine1"]]')
for f in ${@:-10-herring 06-trout 08-cod 07-perch 09-carp}; do
  export FIT_SRC=$L/$f/tail-labels/fit
  cand=$(node $W/adjjson.mjs $f)
  kept=${BASE[$f]}; i=0
  for p in ${(f)cand}; do i=$((i+1)); try=$(node -e 'const k=JSON.parse(process.argv[1]),p=JSON.parse(process.argv[2]);if(k.some(q=>q.slice().sort().join()===p.slice().sort().join()))process.exit(3);console.log(JSON.stringify([...k,p]))' "$kept" "$p") || continue
    v=L$i; node $W/weld-pairs.mjs $f $v "$try" >/dev/null 2>&1 || { echo "$f +$p weld-refused"; continue; }
    D=$W/pairs/$f-$v; node audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs $(pwd)/$D/fit $(pwd)/$D/static.json > $D/static.log 2>&1
    st=$(node -e 'console.log(require("./'$D'/static.json").status)'); echo "$f +$p $st"; rm -rf $D/fit
    if [[ $st == PASS_STATIC ]]; then kept=$try; fi
  done
  echo "FINAL $f $kept"; node $W/weld-pairs.mjs $f labels-final "$kept" >/dev/null 2>&1
  D=$W/pairs/$f-labels-final; node audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs $(pwd)/$D/fit $(pwd)/$D/static.json > $D/static.log 2>&1; echo "FINAL-STATIC $f $(node -e 'console.log(require("./'$D'/static.json").status)')"
done
