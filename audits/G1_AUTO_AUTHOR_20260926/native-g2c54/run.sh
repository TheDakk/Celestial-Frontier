#!/bin/zsh
# Sequential native runs (one browser at a time). From repo root.
R=$PWD; N=audits/G1_AUTO_AUTHOR_20260926/native-g2c54; A=audits/G1_AUTO_AUTHOR_20260926/auto-g2c54-v10; B=audits/TAIL_STALK_BRIDGE_20260926
cd port/v2
for id in 01-dingo 02-jackal 04-lion 05-tiger 06-leopard 09-ocelot 12-weasel 14-goose 15-quail; do
  CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/$id/fit $R/$A/$id/fit $R/$N/$id $R/$N/$id-script.json > $R/$N/$id.log 2>&1; echo "$id exit=$?"
done
for id in 07-perch 09-carp; do
  CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$B/$id/fit $R/$B/$id/fit $R/$B/native-$id $R/audits/G1_AUTO_AUTHOR_20260926/native-g2fam-fish/$id-script.json > $R/$B/native-$id.log 2>&1; echo "$id exit=$?"
done
