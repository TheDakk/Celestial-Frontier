import pathlib,hashlib,json
p=pathlib.Path('port/v2/tools/creature-animation');a=pathlib.Path('audits/C163_C12_FIXED_ROTATIONS_20261002');names=['arap-skin.mjs','wasm-arap-sweep.mjs','arap-sweep.c','arap-sweep.wasm','arap-sweep-bytes.mjs','arap-sweep-build.json','build-arap-sweep.mjs']
rows=[]
for name in names:
 b=(p/name).read_bytes()
 for d in ['baseline','candidate']:(a/d/name).write_bytes(b)
 rows.append({'path':str(p/name),'sha256':hashlib.sha256(b).hexdigest()})
def edit(name,old,new):
 f=a/'candidate'/name;s=f.read_text();assert s.count(old)==1,(name,old,s.count(old));temp=f.with_suffix(f.suffix+'.new');temp.write_text(s.replace(old,new));temp.replace(f)
edit('arap-sweep.c','double *position, const double *target, double *rotation, double *rhs) {\n  for (unsigned i = 0; i < vertex_count; ++i) {','double *position, const double *target, double *rotation, double *rhs,\n    const unsigned *rotation_indices) {\n  /* Zero means the full first pass. The private list holds count then indices.\n   * Only pinned vertices with exclusively pinned neighbours may be omitted. */\n  const unsigned rotation_count = rotation_indices ? rotation_indices[0] : vertex_count;\n  for (unsigned row = 0; row < rotation_count; ++row) {\n    const unsigned i = rotation_indices ? rotation_indices[row + 1] : row;')
for old,new in [('s.uint()===13', 's.uint()===14'),('one thirteen-i32 signature','one fourteen-i32 signature'),('i<13','i<14'),('pass(i32 x 13)','pass(i32 x 14)')]:edit('build-arap-sweep.mjs',old,new)
edit('wasm-arap-sweep.mjs'," if(!runtime||typeof runtime.Module",''' // Derive immutable rotation membership from the validated movable solve rows.
 // The caller cannot supply or mutate the subset. Pinned-only islands stay exact.
 const movable=new Uint8Array(n);for(let row=0;row<reciprocals.length;row++)movable[rows[row*11]/2]=1;
 const dynamic=[];for(let i=0;i<n;i++){let changes=movable[i]!==0;for(let k=starts[i];!changes&&k<starts[i+1];k++)changes=movable[neighbours[k]/2]!==0;if(changes)dynamic.push(i);}
 const rotationIndices=Uint32Array.from([dynamic.length,...dynamic]);
 if(!runtime||typeof runtime.Module''')
edit('wasm-arap-sweep.mjs','lambdaOffset=reserve(lambda.byteLength),pages=', 'lambdaOffset=reserve(lambda.byteLength),rotationIndicesOffset=reserve(rotationIndices.byteLength),pages=')
edit('wasm-arap-sweep.mjs','fixedLambda.set(lambda);','fixedLambda.set(lambda);new Uint32Array(buffer,rotationIndicesOffset,rotationIndices.length).set(rotationIndices);')
old="let normalPasses=0,robustFallbacks=0;const runPass=sweeps=>{need(Number.isInteger(sweeps)&&sweeps>=1&&sweeps<=32,'sweep budget');const result=leaf(n,rowCount,sweeps,startsOffset,neighboursOffset,deltasOffset,lambdaOffset,rowsOffset,reciprocalsOffset,positionOffset,targetOffset,rotationOffset,rhsOffset);need(result===0||result===1,'invalid result');if(result===1)normalPasses++;else robustFallbacks++;return result===1;};"
new="""let normalPasses=0,robustFallbacks=0;
  const checkSweeps=sweeps=>need(Number.isInteger(sweeps)&&sweeps>=1&&sweeps<=32,'sweep budget');
  const invoke=(sweeps,indices)=>{const result=leaf(n,rowCount,sweeps,startsOffset,neighboursOffset,deltasOffset,lambdaOffset,rowsOffset,reciprocalsOffset,positionOffset,targetOffset,rotationOffset,rhsOffset,indices);need(result===0||result===1,'invalid result');if(result===1)normalPasses++;else robustFallbacks++;return result===1;};
  // Public single-pass calls always recompute every rotation, as before.
  const runPass=sweeps=>{checkSweeps(sweeps);return invoke(sweeps,0);};
  // One synchronous solve block owns the only reuse lifetime. There is no cache
  // token, cross-call reuse or caller interleaving. A failed pass stops the block;
  // its robust JS replacement and all later passes must recompute every rotation.
  const runPosePasses=(sweeps,passes)=>{checkSweeps(sweeps);need(Number.isInteger(passes)&&passes>=1&&passes<=16,'pass budget');for(let pass=0;pass<passes;pass++)if(!invoke(sweeps,pass===0?0:rotationIndicesOffset))return pass;return passes;};"""
edit('wasm-arap-sweep.mjs',old,new)
edit('wasm-arap-sweep.mjs','byteLength:buffer.byteLength,runPass,get normalPasses','byteLength:buffer.byteLength,runPass,runPosePasses,cachedRotationRows:n-dynamic.length,get normalPasses')
edit('arap-skin.mjs',' for(let pass=0;pass<s.iterations;pass++){\n  if(s.sweepKernel?.runPass(s.globalIterations))continue;',' // The first pass of each pose is full; only this synchronous block may reuse\n // rotations of pinned-only islands. A refusal is recomputed fully by JS below.\n const completedPasses=s.sweepKernel?.runPosePasses(s.globalIterations,s.iterations)??0;\n for(let pass=completedPasses;pass<s.iterations;pass++){\n  if(pass>completedPasses&&s.sweepKernel?.runPass(s.globalIterations))continue;')
edit('wasm-arap-sweep.mjs','position.fill(0);target.fill(0);rotation.fill(0);rhs.fill(0);normalPasses=0;robustFallbacks=0;','// Admit the subset path against two fresh full reference passes as well.\n  for(let pass=0;pass<2;pass++)if(!referencePass(snapshot,expected,target,expectedRotation,expectedRhs))return null;if(runPosePasses(1,2)!==2)return null;for(let i=0;i<positionLength;i++)if(!Object.is(expected[i],position[i])||!Object.is(expectedRotation[i],rotation[i])||!Object.is(expectedRhs[i],rhs[i]))return null;\n  position.fill(0);target.fill(0);rotation.fill(0);rhs.fill(0);normalPasses=0;robustFallbacks=0;')
(a/'baseline-sources.json').write_text(json.dumps({'schema':'cf.c163-fixed-rotations-baseline/v1','sources':rows},indent=2)+'\n')
overrides={str(p/name):str(a/'candidate'/name) for name in ['arap-skin.mjs','wasm-arap-sweep.mjs','arap-sweep-bytes.mjs']}
for name in ['pose-refusal.mjs','wasm-orientation-forward.mjs','wasm-orientation-active.mjs','orientation-projector.mjs']:overrides[str(a/'candidate'/name)]=str(p/name)
(a/'source-overrides.json').write_text(json.dumps(overrides,indent=2)+'\n')
