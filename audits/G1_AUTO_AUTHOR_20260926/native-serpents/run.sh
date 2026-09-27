#!/bin/zsh
R=$PWD; N=audits/G1_AUTO_AUTHOR_20260926/native-serpents; A=audits/G1_AUTO_AUTHOR_20260926/auto-g2serp-strips-v1; cd port/v2
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/17-python/fit $R/$A/17-python/fit $R/$N/17-python $R/$N/17-python-script.json > $R/$N/17-python.log 2>&1; echo "17-python exit=$?"
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/19-racer/fit $R/$A/19-racer/fit $R/$N/19-racer $R/$N/19-racer-script.json > $R/$N/19-racer.log 2>&1; echo "19-racer exit=$?"
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/20-garter-snake/fit $R/$A/20-garter-snake/fit $R/$N/20-garter-snake $R/$N/20-garter-snake-script.json > $R/$N/20-garter-snake.log 2>&1; echo "20-garter-snake exit=$?"
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/17-tree-snake/fit $R/$A/17-tree-snake/fit $R/$N/17-tree-snake $R/$N/17-tree-snake-script.json > $R/$N/17-tree-snake.log 2>&1; echo "17-tree-snake exit=$?"
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/18-rat-snake/fit $R/$A/18-rat-snake/fit $R/$N/18-rat-snake $R/$N/18-rat-snake-script.json > $R/$N/18-rat-snake.log 2>&1; echo "18-rat-snake exit=$?"
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/19-cottonmouth/fit $R/$A/19-cottonmouth/fit $R/$N/19-cottonmouth $R/$N/19-cottonmouth-script.json > $R/$N/19-cottonmouth.log 2>&1; echo "19-cottonmouth exit=$?"
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/21-mamba/fit $R/$A/21-mamba/fit $R/$N/21-mamba $R/$N/21-mamba-script.json > $R/$N/21-mamba.log 2>&1; echo "21-mamba exit=$?"
CF_CPU_THROTTLE=4 node tools/battle2-proof/native-runner.mjs $R/$A/24-grass-snake/fit $R/$A/24-grass-snake/fit $R/$N/24-grass-snake $R/$N/24-grass-snake-script.json > $R/$N/24-grass-snake.log 2>&1; echo "24-grass-snake exit=$?"
