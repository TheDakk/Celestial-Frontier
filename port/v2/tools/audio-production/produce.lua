-- Stock REAPER + the installed Surge XT only. The TSV is prepared by produce.py.
local out=assert(os.getenv('CF_AUDIO_JOB_OUT'),'Missing CF_AUDIO_JOB_OUT')
local project,filename=reaper.EnumProjects(-1,'')
assert(filename=='' and reaper.CountTracks(project)==0,'Requires dedicated empty project')
local function write(name,value)
  local f=assert(io.open(out..'/'..name,'wb')); f:write(value); f:close()
end
local function run()
  local tracks={}
  local function track(name,synth)
    if tracks[name] then return tracks[name] end
    local index=reaper.CountTracks(project); reaper.InsertTrackAtIndex(index,false)
    local t=reaper.GetTrack(project,index); reaper.GetSetMediaTrackInfo_String(t,'P_NAME',name,true)
    assert(reaper.TrackFX_AddByName(t,'ReaEQ (Cockos)',false,-1)>=0,'Stock EQ absent')
    if synth then
      local found=nil
      for i=0,100000 do local ok,n=reaper.EnumInstalledFX(i); if not ok then break end
        if n:match('^VST3i: Surge XT ') then found=n; break end end
      assert(found,'Installed Surge XT missing')
      local fx=reaper.TrackFX_AddByName(t,found,false,-1); assert(fx>=0,'Surge load failed')
      local values={['A Osc Drift']=0,['B Osc Drift']=0,['A Amp EG Release']=.12,['A Amp EG Attack']=.025}
      for _,s in ipairs({'A','B'}) do for i=1,3 do values[s..' Osc '..i..' Retrigger']=1 end end
      -- Values reference parameters observed from the installed Surge state; all writes are read back.
      local profiles={
        fire={.72,.12,.005,.16,.09},frost={.88,.5,.001,.1,.2},storm={.63,.21,.001,.2,.18},
        tide={.28,.18,.14,.4,.3},stone={.16,.32,.001,.16,.1},venom={.4,.62,.035,.3,.18},
        void={.12,.38,.3,.6,.45},sand={.58,.07,.015,.12,.07},chem={.7,.58,.001,.18,.1},
        psionic={.79,.45,.08,.42,.32}}
      local profile=profiles[name:match('^Surge accent%-(.+)$')]
      local instruments={['score-bass']={.2,.08,.01,.25,.1},['score-harmony']={.44,.13,.16,.5,.2},
        ['score-melody']={.68,.2,.015,.24,.14},['score-rhythm']={.12,.38,.001,.07,.015}}
      profile=profile or instruments[name:match('^Surge (.+)$')]
      if profile then
        values['A Filter 1 Cutoff']=profile[1];values['A Filter 1 Resonance']=profile[2]
        values['A Amp EG Attack']=profile[3];values['A Amp EG Decay']=profile[4];values['A Amp EG Release']=profile[5]
      end
      for name,value in pairs(values) do
        local found=nil
        for i=0,reaper.TrackFX_GetNumParams(t,fx)-1 do local ok,n=reaper.TrackFX_GetParamName(t,fx,i)
          if ok and n==name then assert(found==nil,'Ambiguous parameter'); found=i end end
        assert(found~=nil,'Missing parameter '..name)
        assert(reaper.TrackFX_SetParamNormalized(t,fx,found,value),'Parameter set failed')
        assert(math.abs(reaper.TrackFX_GetParamNormalized(t,fx,found)-value)<.01,'Parameter readback failed: '..name)
      end
      reaper.SetMediaTrackInfo_Value(t,'D_VOL',.09)
    end
    tracks[name]=t; return t
  end
  local maximum=0
  for line in io.lines(out..'/jobs.tsv') do
    local p={}; for v in (line..'\t'):gmatch('(.-)\t') do p[#p+1]=v end
    assert(#p==9,'Invalid prepared job row')
    local kind,id,media=p[1],p[2],p[3]
    local start,duration,rate,gain,note=tonumber(p[4]),tonumber(p[5]),tonumber(p[6]),tonumber(p[7]),tonumber(p[8])
    assert(id:match('^[%w._-]+$') and start and duration and duration>0 and duration<=24 and rate and rate>=.5 and rate<=2 and gain and gain>=0 and gain<=1,'Invalid bounded job')
    assert(p[9]=='mono' or p[9]=='stereo','Invalid channels')
    maximum=math.max(maximum,start+duration)
    if kind=='audio' then
      assert(media:match('^media/[%w._-]+$'),'Media must be local prepared copy')
      local t=track(p[9]..' source ingredients',false)
      local item=reaper.AddMediaItemToTrack(t); local take=reaper.AddTakeToMediaItem(item)
      local source=assert(reaper.PCM_Source_CreateFromFile(out..'/'..media),'Source unavailable')
      reaper.SetMediaItemTake_Source(take,source)
      reaper.SetMediaItemInfo_Value(item,'D_POSITION',start); reaper.SetMediaItemInfo_Value(item,'D_LENGTH',duration)
      reaper.SetMediaItemInfo_Value(item,'D_FADEINLEN',.005); reaper.SetMediaItemInfo_Value(item,'D_FADEOUTLEN',math.min(.025,duration/4))
      reaper.SetMediaItemInfo_Value(item,'B_LOOPSRC',0)
      reaper.SetMediaItemTakeInfo_Value(take,'D_PLAYRATE',rate); reaper.SetMediaItemTakeInfo_Value(take,'B_PPITCH',0)
      reaper.SetMediaItemTakeInfo_Value(take,'D_VOL',gain)
      reaper.GetSetMediaItemTakeInfo_String(take,'P_NAME',id,true)
    elseif kind=='synth' then
      assert(note and note>=24 and note<=100,'Invalid note')
      assert(media:match('^[a-z-]+$'),'Invalid synth part')
      local t=track('Surge '..media,true)
      local item=reaper.CreateNewMIDIItemInProj(t,start,start+duration,false); local take=reaper.GetActiveTake(item)
      assert(reaper.MIDI_InsertNote(take,false,false,reaper.MIDI_GetPPQPosFromProjTime(take,start+.01),
        reaper.MIDI_GetPPQPosFromProjTime(take,start+math.max(.02,duration*.55)),0,note,math.floor(70*gain),true))
      reaper.MIDI_Sort(take)
    elseif kind=='region' then
      reaper.AddProjectMarker2(project,true,start,start+duration,id,-1,0)
    else error('Unsupported job kind') end
  end
  reaper.GetSetProjectInfo(project,'PROJECT_SRATE',48000,true)
  reaper.GetSetProjectInfo(project,'PROJECT_SRATE_USE',1,true)
  for name,value in pairs({RENDER_SRATE=48000,RENDER_CHANNELS=2,RENDER_SETTINGS=0,RENDER_BOUNDSFLAG=0,RENDER_STARTPOS=0,RENDER_ENDPOS=maximum,RENDER_TAILFLAG=0}) do reaper.GetSetProjectInfo(project,name,value,true) end
  reaper.GetSetProjectInfo_String(project,'RENDER_FILE',out,true)
  reaper.GetSetProjectInfo_String(project,'RENDER_PATTERN','timeline',true)
  reaper.GetSetProjectInfo_String(project,'RENDER_FORMAT','evaw',true)
  reaper.GetSetProjectInfo_String(project,'RENDER_FORMAT2','',true)
  reaper.Main_SaveProjectEx(project,out..'/production.rpp',8)
  for name,t in pairs(tracks) do
    local ok,state=reaper.GetTrackStateChunk(t,'',false); assert(ok)
    write(name:gsub(' ','-')..'.trackchunk',state)
  end
  write('prepared.txt','REAPER '..reaper.GetAppVersion()..'\nProject and actual plug-in state saved; render not yet run.\n')
end
local ok,err=xpcall(run,debug.traceback)
if ok then reaper.Main_OnCommand(40004,0) else write('failure.txt',err); reaper.ShowConsoleMsg(err..'\n') end
