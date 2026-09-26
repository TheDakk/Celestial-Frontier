#!/bin/zsh
# Greedy selective weld (C48): from the passing single-pair weld, add each remaining OBSERVED axial adjacency (body/spine/head/caudal
# pairs; paired fins, dorsal and jaw excluded) one at a time; keep an addition only when the unchanged static gate still passes.
cd /Users/nick/Projects/celestial-frontier-anthropic-mac; W=audits/G1_AUTO_AUTHOR_20260926/weld-g2fam-fish
typeset -A BASE; BASE=(06-trout '[["body","spine1"]]' 07-perch '[["body","body-1"]]' 08-cod '[["body","body-1"]]' 09-carp '[["body","body-1"]]' 10-herring '[["body","spine1"]]')
for f in 06-trout 07-perch 08-cod 09-carp 10-herring; do
  cand=$(node /private/tmp/claude-501/-Users-nick-Projects-celestial-frontier-anthropic-mac/c7be4168-2776-4f72-9756-abbd6d48cfd1/scratchpad/adjjson.mjs $f)
  kept=${BASE[$f]}; i=0
  for p in ${(f)cand}; do i=$((i+1)); try=$(node -e 'const k=JSON.parse(process.argv[1]),p=JSON.parse(process.argv[2]);if(k.some(q=>q.slice().sort().join()===p.slice().sort().join()))process.exit(3);console.log(JSON.stringify([...k,p]))' "$kept" "$p") || continue
    v=G$i; node $W/weld-pairs.mjs $f $v "$try" >/dev/null 2>&1 || { echo "$f +$p weld-refused"; continue; }
    D=$W/pairs/$f-$v; node audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs $(pwd)/$D/fit $(pwd)/$D/static.json > $D/static.log 2>&1
    st=$(node -e 'console.log(require("./'$D'/static.json").status)'); echo "$f +$p $st"; rm -rf $D/fit
    if [[ $st == PASS_STATIC ]]; then kept=$try; fi
  done
  echo "FINAL $f $kept"; node $W/weld-pairs.mjs $f final "$kept" >/dev/null 2>&1
done
