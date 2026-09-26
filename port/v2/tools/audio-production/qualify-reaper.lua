-- Run only in the empty project of the dedicated command-line REAPER instance.
-- This is a synth/host qualification signal, NOT an animal voice or accepted asset.
local out = os.getenv('CF_AUDIO_QUALIFICATION_OUT')
assert(out and out:sub(1,1) == '/', 'CF_AUDIO_QUALIFICATION_OUT must be an absolute new directory')
local project, filename = reaper.EnumProjects(-1, '')
assert(project and filename == '' and reaper.CountTracks(project) == 0,
  'Qualification requires a new empty project; existing projects are never changed')
local function quote(s)
  return '"' .. tostring(s):gsub('\\','\\\\'):gsub('"','\\"'):gsub('\n','\\n'):gsub('\r','\\r'):gsub('\t','\\t') .. '"'
end
local function write(name, text)
  local p = out .. '/' .. name
  local existing = io.open(p,'rb'); if existing then existing:close(); error('Existing output refused: '..name) end
  local f = assert(io.open(p,'wb')); assert(f:write(text)); f:close()
end
local function run()
  local fxNames, surge = {}, nil
  for i=0,100000 do
    local ok, name, ident = reaper.EnumInstalledFX(i)
    if not ok then break end
    if name:find('Surge XT',1,true) and not name:find('Effects',1,true) then
      fxNames[#fxNames+1] = '{"name":'..quote(name)..',"identifier":'..quote(ident)..'}'
      if name:match('^VST3i:') then surge = name end
    end
  end
  write('host.json','{"reaper":'..quote(reaper.GetAppVersion())..',"surge":['..table.concat(fxNames,',')..']}\n')
  assert(surge, 'Installed Surge XT VST3 instrument not enumerated; no substitute instrument used')
  reaper.InsertTrackAtIndex(0, false)
  local track = assert(reaper.GetTrack(project,0))
  reaper.GetSetMediaTrackInfo_String(track,'P_NAME','CF host qualification — fictional synth signal',true)
  reaper.SetMediaTrackInfo_Value(track,'D_VOL',0.10)
  local fx = reaper.TrackFX_AddByName(track,surge,false,-1)
  assert(fx >= 0, 'Surge failed to load')
  -- Fresh Surge voices otherwise start at random oscillator phases. Bind the
  -- observed installed parameter names, not guessed numeric parameter indices.
  local overrides = {}
  for _,scene in ipairs({'A','B'}) do
    overrides[scene..' Osc Drift'] = 0
    for oscillator=1,3 do overrides[scene..' Osc '..oscillator..' Retrigger'] = 1 end
  end
  for name,value in pairs(overrides) do
    local found = nil
    for index=0,reaper.TrackFX_GetNumParams(track,fx)-1 do
      local ok,paramName = reaper.TrackFX_GetParamName(track,fx,index)
      if ok and paramName == name then assert(found == nil,'Ambiguous synth parameter '..name); found=index end
    end
    assert(found ~= nil,'Missing synth parameter '..name)
    assert(reaper.TrackFX_SetParamNormalized(track,fx,found,value),'Cannot set '..name)
    assert(math.abs(reaper.TrackFX_GetParamNormalized(track,fx,found)-value)<0.000001,'Cannot verify '..name)
  end

  local eq = reaper.TrackFX_AddByName(track,'ReaEQ (Cockos)',false,-1)
  assert(eq >= 0, 'Stock ReaEQ failed to load')
  local comp = reaper.TrackFX_AddByName(track,'ReaComp (Cockos)',false,-1)
  assert(comp >= 0, 'Stock ReaComp failed to load')
  local item = assert(reaper.CreateNewMIDIItemInProj(track,0,3,false))
  local take = assert(reaper.GetActiveTake(item))
  for i, note in ipairs({60,64,67}) do
    local startTime = 0.15 + (i-1)*0.55
    assert(reaper.MIDI_InsertNote(take,false,false,
      reaper.MIDI_GetPPQPosFromProjTime(take,startTime),
      reaper.MIDI_GetPPQPosFromProjTime(take,startTime+0.35),0,note,64,true))
  end
  reaper.MIDI_Sort(take)
  reaper.GetSetProjectInfo(project,'PROJECT_SRATE',48000,true)
  reaper.GetSetProjectInfo(project,'PROJECT_SRATE_USE',1,true)
  reaper.GetSetProjectInfo(project,'RENDER_SRATE',48000,true)
  reaper.GetSetProjectInfo(project,'RENDER_CHANNELS',2,true)
  reaper.GetSetProjectInfo(project,'RENDER_SETTINGS',0,true)
  reaper.GetSetProjectInfo(project,'RENDER_BOUNDSFLAG',0,true)
  reaper.GetSetProjectInfo(project,'RENDER_STARTPOS',0,true)
  reaper.GetSetProjectInfo(project,'RENDER_ENDPOS',3,true)
  reaper.GetSetProjectInfo(project,'RENDER_TAILFLAG',0,true)
  reaper.GetSetProjectInfo_String(project,'RENDER_FILE',out,true)
  reaper.GetSetProjectInfo_String(project,'RENDER_PATTERN','host-qualification',true)
  reaper.GetSetProjectInfo_String(project,'RENDER_FORMAT','evaw',true)
  reaper.GetSetProjectInfo_String(project,'RENDER_FORMAT2','',true)
  local parameters = {}
  for i=0,reaper.TrackFX_GetNumParams(track,fx)-1 do
    local ok,name = reaper.TrackFX_GetParamName(track,fx,i)
    assert(ok, 'Could not read saved synth parameter')
    parameters[#parameters+1] = '{"index":'..i..',"name":'..quote(name)..',"value":'..string.format('%.17g',reaper.TrackFX_GetParamNormalized(track,fx,i))..'}'
  end
  local stateOK,state = reaper.GetTrackStateChunk(track,'',false)
  assert(stateOK and #state>0, 'Synth state could not be saved')
  write('surge-and-stock-effects.trackchunk',state)
  write('surge-parameters.json','{"source":"installed instrument with explicit oscillator retrigger and zero drift","parameters":['..table.concat(parameters,',')..']}\n')
  reaper.Main_SaveProjectEx(project,out..'/host-qualification.rpp',8)
  local projectFile=assert(io.open(out..'/host-qualification.rpp','rb')); projectFile:close()
  write('prepared.json','{"status":"PROJECT_PREPARED","rendered":false,"listeningAccepted":false,"instrument":'..quote(surge)..'}\n')
end
local ok,err=xpcall(run,debug.traceback)
if not ok then
  write('failure.json','{"status":"FAIL","error":'..quote(err)..'}\n')
  reaper.ShowConsoleMsg('CF qualification failed: '..err..'\n')
else
  -- Quit only this dedicated, now-saved project instance. Never use -closeall.
  reaper.Main_OnCommand(40004,0)
end
