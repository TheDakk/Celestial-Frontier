#!/bin/zsh
R=$PWD; N=audits/G1_AUTO_AUTHOR_20260926/native-g2c59; A=audits/G1_AUTO_AUTHOR_20260926/auto-g2c59-v10s; cd port/v2
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/04-raccoon/fit $R/$A/04-raccoon/fit $R/$N/04-raccoon $R/$N/04-raccoon-script.json > $R/$N/04-raccoon.log 2>&1; echo "04-raccoon exit=$?"
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/08-vulture/fit $R/$A/08-vulture/fit $R/$N/08-vulture $R/$N/08-vulture-script.json > $R/$N/08-vulture.log 2>&1; echo "08-vulture exit=$?"
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/10-water-snake/fit $R/$A/10-water-snake/fit $R/$N/10-water-snake $R/$N/10-water-snake-script.json > $R/$N/10-water-snake.log 2>&1; echo "10-water-snake exit=$?"
