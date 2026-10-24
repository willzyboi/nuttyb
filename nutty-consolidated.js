'use strict';
(() => {
  const WILLBOIZY_LOBBY_SETTINGS={"mode":"Raptors","map":"Full Metal Plate (12P)","start":"No Rush","wave":"mini","raptorHP":2,"queenHP":2,"values":{"teamsize":12,"assistdronesbuildpowermultiplier":1,"commanderbuildersbuildpower":1000,"commanderbuildersrange":1000,"disablemapdamage":1,"experimentalextraunits":1,"experimentallegionfaction":1,"maxunits":10000,"multiplier_energyconversion":1,"multiplier_energyproduction":1,"multiplier_losrange":1,"multiplier_maxvelocity":1,"multiplier_metalextraction":1,"multiplier_radarrange":1,"multiplier_turnrate":1,"multiplier_weapondamage":1,"multiplier_weaponrange":1,"raptor_spawntimemult":1,"releasecandidates":1,"startenergy":10000,"startenergystorage":10000,"startmetal":10000,"startmetalstorage":10000,"scavunitsforplayers":1,"forceallunits":1,"unit_restrictions_noair":0,"unit_restrictions_noendgamelrpc":0,"unit_restrictions_noextractors":1,"unit_restrictions_nolrpc":0,"unit_restrictions_notacnukes":0,"evocom":0,"unit_restrictions_nonukes":1,"multiplier_resourceincome":2,"multiplier_shieldpower":2,"multiplier_builddistance":2,"multiplier_buildpower":2,"raptor_queen_count":100,"raptor_spawncountmult":3,"raptor_firstwavesboost":4,"raptor_graceperiodmult":3,"raptor_queentimemult":1.3,"startpostype":2,"tweakunits4":0,"tweakunits5":0,"tweakunits6":0,"tweakunits7":0,"tweakunits8":0,"tweakunits9":0,"tweakdefs9":0}};
  const byId = new Map(COMMUNITY_TWEAKS.map(t => [t.id, t]));
  const state = () => config.community ||= {profile:'will', difficulty:'custom', extras:{}, library:[], lobbyTag:''};
  const source = (id) => byId.get(id).source.replaceAll('$HP_MULTIPLIER$', String(id === 'queen-hp-template' ? config.queenHP || 1 : config.raptorHP || 1));
  const EFFECTS_LUA="do\n local level=$LEVEL$\n local custom={steel_dome=true,epic_starfall=true,epic_calamity=true,epic_ragnarok=true,armannit4=true,cordoomt4=true,legbastiont4=true,epic_bastion=true}\n for name,unit in pairs(UnitDefs) do\n  local raptor=name:find('raptor',1,true)~=nil\n  if custom[name] or (level>=2 and raptor) or level>=3 then\n   for _,weapon in pairs(unit.weapondefs or {}) do\n    if level>=2 or weapon.cegtag=='arty-heavy-purple' then weapon.cegtag='' end\n    weapon.smoketrail=false weapon.smoketrailcastshadow=false weapon.camerashake=0\n    if level>=2 then\n     local kind=string.lower(weapon.weapontype or '')\n     if kind~='shield' then\n      weapon.explosiongenerator=custom[name] and (level==3 and 'custom:laserhit-mini-purple' or 'custom:laserhit-small-purple') or 'custom:laserhit-mini'\n     end\n    end\n   end\n   if level>=3 then unit.leavetracks=false if unit.customparams then unit.customparams.usebuildinggrounddecal=false end end\n  end\n end\nend";
  function effectsMode(){const e=state().extras;return ['off','light','medium','heavy'].includes(e.effectsMode)?e.effectsMode:e.lightEffects===false?'off':'light';}
  const originalGenerate = generate;
  const originalGame = gameCommands;
  const priorities = ['raptor-hp-template','queen-hp-template','main-defs','eco-t3','builders-t3','defences-t3','defences-t4','mini-bosses','mini-bosses-extended','wave-challenge','cross-faction-t2','lrpc-rebalance','eco-t4','rflrpc-t4','air-rework-t4','unit-launchers','geo+walls-t3','mega-nuke'];
  function compactLua(code) {
    const tokens=(code.match(/--\[(=*)\[[\s\S]*?\]\1\]|--[^\n]*|\[(=*)\[[\s\S]*?\]\2\]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_][\w]*|0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|\.\.\.|\.\.|==|~=|<=|>=|\S/g)||[]).filter(t=>!t.startsWith('--'));
    let out='',previous='';
    for(const token of tokens){const gap=previous && ((/[\w]$/.test(previous)&&/^[\w]/.test(token))||(previous==='-'&&token==='-')||(previous==='['&&token.startsWith('['))||(previous.endsWith(']')&&token===']')||(/\d$/.test(previous)&&token.startsWith('.'))||(previous.endsWith('.')&&(/^[\d.]/.test(token))));out+=(gap?' ':'')+token;previous=token;}
    return out;
  }
  function halfRateEpicDefinitions(code) {
    const ast=window.luaparse.parse(code,{luaVersion:'5.1',ranges:true}),edits=[];
    const fields=(table)=>table?.type==='TableConstructorExpression'?table.fields:[];
    function visit(node){
      if(!node||typeof node!=='object')return;
      if(node.type==='AssignmentStatement'&&node.variables.some(v=>v.type==='MemberExpression'&&['epic_calamity','epic_ragnarok'].includes(v.identifier?.name))){
        const factor=node.variables.some(v=>v.type==='MemberExpression'&&v.identifier?.name==='epic_calamity')?4:2;
        const tables=node.init.flatMap(v=>v.type==='CallExpression'?v.arguments:[v]);
        for(const table of tables)for(const field of fields(table))if(field.key?.name==='weapondefs')for(const weapon of fields(field.value))for(const stat of fields(weapon.value)){
          const key=stat.key?.name;
          if(['reloadtime','energypershot','metalpershot'].includes(key)&&stat.value.type==='NumericLiteral')edits.push([stat.value.range,stat.value.value*factor]);
          if(key==='damage')for(const armour of fields(stat.value))if(armour.value.type==='NumericLiteral')edits.push([armour.value.range,armour.value.value*factor]);
        }
      }
      for(const [key,value]of Object.entries(node))if(key!=='range'){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}
    }
    visit(ast);
    for(const [range,value]of edits.sort((a,b)=>b[0][0]-a[0][0]))code=code.slice(0,range[0])+value+code.slice(range[1]);
    return code;
  }
  function packForBar(lines) {
    const result=lines.filter(c=>!/^!bset tweak(?:defs|units)\d* /i.test(c));
    const slots=lines.map(c=>c.match(/^!bset (tweak(defs|units)(\d*)) (\S+)$/i)).filter(m=>m&&m[4]!=='0').sort((a,b)=>(a[2]==='units'?0:1)-(b[2]==='units'?0:1)||Number(a[3]||0)-Number(b[3]||0));
    const unitSources=[],definitionSources=[];
    for(const m of slots){const code=compactLua(decodeLua(m[4]));
      if(m[2]==='units'){
        try{window.luaparse.parse('return '+code,{luaVersion:'5.1'});unitSources.push(code);}
        catch{window.luaparse.parse(code,{luaVersion:'5.1'});definitionSources.push(code);}
      }else definitionSources.push(code);
    }
    const level={light:1,medium:2,heavy:3}[effectsMode()];if(level)definitionSources.push(compactLua(EFFECTS_LUA.replace('$LEVEL$',String(level))));
    definitionSources.push(compactLua("-- COMBAT_POPULATION_RULES_START\ndo\n local defs=UnitDefs or {}\n for name,u in pairs(defs) do\n  local mobile=(tonumber(u.speed or u.maxvelocity) or 0)>0 or u.canfly==true\n  local support=u.builder==true or (tonumber(u.workertime) or 0)>0 or u.canresurrect==true\n  if mobile and not support and u.weapons and next(u.weapons) then\n   u.customparams=u.customparams or {}\n   u.customparams.wmod_blocked_combat=true\n  end\n end\n for name,u in pairs(defs) do\n  if (name=='armbotrail' or name:match('^armbotrail_')) and name~='armbotrail_cort3' then\n   u.maxthisunit=0\n   u.customparams=u.customparams or {}\n   u.customparams.wmod_blocked_combat=true\n  end\n end\n for _,u in pairs(defs) do\n  if u.buildoptions then\n   for i=#u.buildoptions,1,-1 do\n    local option=defs[u.buildoptions[i]]\n    if option and option.customparams and option.customparams.wmod_blocked_combat then table.remove(u.buildoptions,i) end\n   end\n  end\n end\n for name,u in pairs(defs) do\n  if name=='armbotrail' or name:match('^armbotrail_') then\n   if name=='armbotrail_cort3' then u.maxthisunit=10 end\n   u.customparams=u.customparams or {}\n   u.customparams.i18n_en_humanname='Cortex Behemoth Launcher'\n   u.customparams.i18n_en_tooltip='Cortex Behemoths only. 10 launchers/player; 5 stored shots; 10s reload.'\n   for _,w in pairs(u.weapondefs or {}) do\n    if w.customparams and w.customparams.spawns_name then\n     w.stockpile=true\n     w.stockpiletime=20\n     w.reloadtime=10\n     w.burst=1\n     w.projectiles=1\n     w.customparams.stockpilelimit=5\n     w.customparams.spawns_name='corjugg'\n     w.customparams.spawns_count=1\n     w.customparams.spawns_mode=nil\n     w.customparams.spawns_debris=nil\n    end\n   end\n  end\n end\n\n if defs.armbotrail_cort3 then\n  local t3={armt3aide=true,armt3airaide=true,cort3aide=true,cort3airaide=true,legt3aide=true,legt3airaide=true}\n  for name,u in pairs(defs) do\n   local faction=name:match('^arm') or name:match('^leg') or name:match('^cor')\n   local mobile=(tonumber(u.speed or u.maxvelocity) or 0)>0 or u.canfly==true\n   if t3[name] or (faction and mobile and u.builder==true and u.buildoptions and next(u.buildoptions)) then\n    u.buildoptions=u.buildoptions or {}\n    local found=false\n    for _,option in pairs(u.buildoptions) do if option=='armbotrail_cort3' then found=true break end end\n    if not found then u.buildoptions[#u.buildoptions+1]='armbotrail_cort3' end\n   end\n  end\n end\nend\n-- COMBAT_POPULATION_RULES_END\n"));
    definitionSources.push(compactLua("-- QUEEN_PHASE_STABILITY_START\ndo\n local defs=UnitDefs or {}\n local disabled={steel_dome=true,legstarfall_scav=true,legministarfall_scav=true,legstarfall=true,legministarfall=true,armvulc=true,corbuzz=true,armminivulc=true,corminibuzz=true,armvulc_scav=true,corbuzz_scav=true,armminivulc_scav=true,corminibuzz_scav=true}\n for name in pairs(disabled) do if defs[name] then defs[name].maxthisunit=0 end end\n for _,u in pairs(defs) do\n  if u.buildoptions then for i=#u.buildoptions,1,-1 do if disabled[u.buildoptions[i]] then table.remove(u.buildoptions,i) end end end\n end\n local u=defs.epic_elysium\n if u then\n  u.maxthisunit=nil\n  u.customparams=u.customparams or {}\n  u.customparams.i18n_en_tooltip='Shield with faint visuals.'\n end\n for _,unit in pairs(defs) do\n  for _,weapon in pairs(unit.weapondefs or {}) do\n   if string.lower(weapon.weapontype or '')=='shield' and weapon.shield then\n    weapon.shield.alpha=0.03\n    weapon.shield.visiblerepulse=false\n   end\n  end\n end\n -- Keep the engine fallback name consistent with the translated custom name.\n local names={armannit4='Legendary Pulsar',cordoomt4='Legendary Bulwark',legbastiont4='Legendary Bastion',epic_elysium='Epic Elysium',epic_calamity='Epic Calamity',epic_ragnarok='Epic Ragnarok'}\n for name,unit in pairs(defs) do\n  local cp=unit.customparams or {}\n  local label=names[name] or cp.i18n_en_humanname or unit.name\n  if type(label)=='string' and label~='' then\n   unit.name=label\n   unit.customparams=cp\n   cp.i18n_en_humanname=label\n   cp.i18nfromunit=nil\n   cp.i18n_en_tooltip=cp.i18n_en_tooltip or unit.description or unit.tooltip or label\n   unit.description=cp.i18n_en_tooltip\n  end\n end\nend\n-- QUEEN_PHASE_STABILITY_END\n"));
    // Gantries produce constructors and support builders only, including taxed variants.
    definitionSources.push(compactLua("do local defs=UnitDefs or {} for name,factory in pairs(defs) do local gantry=name:find('shltx',1,true) or name:find('gant',1,true) or name:find('apt3',1,true) if gantry and factory.buildoptions then for i=#factory.buildoptions,1,-1 do local unit=defs[factory.buildoptions[i]] local support=unit and (unit.builder==true or (tonumber(unit.workertime) or 0)>0 or unit.canresurrect==true) if not support then table.remove(factory.buildoptions,i) end end end end end"));
    if(state().extras.reducedDeaths!==false)definitionSources.push(compactLua("do\n local defs=UnitDefs or {}\n local explosions={}\n local function copy(t)local n={} for k,v in pairs(t)do n[k]=type(v)=='table' and copy(v) or v end return n end\n if VFS and VFS.DirList and VFS.Include then\n  local ok,system=pcall(VFS.Include,'gamedata/system.lua')\n  if ok and type(system)=='table' then\n   local shared={}\n   for _,path in ipairs(VFS.DirList('weapons/','*.lua',nil,true))do\n    local env={Shared=shared,BAR=BAR,GetFilename=function()return path end} env._G=env setmetatable(env,{__index=system})\n    local loaded,items=pcall(VFS.Include,path,env,VFS_MODES)\n    if loaded and type(items)=='table' then for name,w in pairs(items)do if type(name)=='string' and type(w)=='table' then explosions[string.lower(name)]=w end end end\n   end\n  end\n end\n for _,u in pairs(defs)do\n  u.sfxtypes=u.sfxtypes or {}\n  for _,key in ipairs({'pieceexplosiongenerators','crashexplosiongenerators'})do local list=u.sfxtypes[key] or {} for i in pairs(list)do list[i]='blank' end if not next(list) then list[1]='blank' end u.sfxtypes[key]=list end\n  u.weapondefs=u.weapondefs or {}\n  for _,key in ipairs({'explodeas','selfdestructas'})do\n   local name=u[key]\n   if type(name)=='string' and name~='' then\n    local base=u.weapondefs[string.lower(name)] or explosions[string.lower(name)]\n    if base then local silent=copy(base) silent.explosiongenerator='custom:blank' silent.cegtag='' silent.camerashake=0 local alias='wmod_quiet_'..key u.weapondefs[alias]=silent u[key]=alias end\n   end\n  end\n end\nend"));
    definitionSources.push(compactLua("-- BEAM_HOLO_PROTECTION_START\n-- Run after clones and repairs so inherited weapons are protected too.\ndo\n local defs=UnitDefs or {}\n local families={armanni=true,armannit3=true,armannit4=true,cordoom=true,cordoomt3=true,cordoomt4=true,legbastion=true,legbastiont4=true,epic_bastion=true,epic_ragnarok=true}\n for name,unit in pairs(defs) do\n  local base=name:gsub('_scav$','')\n  if families[base] then\n   for _,weapon in pairs(unit.weapondefs or {}) do\n    local kind=string.lower(weapon.weapontype or '')\n    if kind=='beamlaser' or kind=='lasercannon' or kind=='lightningcannon' then\n     weapon.collidefriendly=false\n     weapon.avoidfriendly=false\n     weapon.collideneutral=false\n     weapon.avoidneutral=false\n     -- Collision flags alone do not suppress splash at the beam endpoint.\n     weapon.impactonly=true\n    end\n   end\n  end\n end\nend\n-- BEAM_HOLO_PROTECTION_END\n"));
    definitionSources.push(compactLua("-- DOOMBRINGER_SPAWN_WINDOW: tech anger differs from queen anger.\ndo\n local doom=(UnitDefs or {}).raptor_doombringer\n if doom then\n  doom.customparams=doom.customparams or {}\n  local cp=doom.customparams\n  cp.raptorcustomsquad=true\n  cp.raptorsquadminanger=140\n  cp.raptorsquadmaxanger=1000\n  cp.raptorsquadrarity='basic'\n  cp.raptorsquadunitsamount=1\n  cp.raptorsquadweight=99\n  cp.raptorsquadforcesurface=true\n  cp.raptorsquadforceair=nil\n end\nend"));
    const unitChunks=[];
    for(const code of unitSources){
      if(slotCommand('tweakunits9',code).length<=14480){unitChunks.push(code);continue;}
      const ast=window.luaparse.parse('return '+code,{luaVersion:'5.1',ranges:true}),expression=ast.body[0]?.arguments[0];
      if(expression?.type!=='TableConstructorExpression')throw Error('A custom unit expression is too large for one BAR slot. Reduce it in the Workshop.');
      let fields=[];
      for(const field of expression.fields){const part=code.slice(field.range[0]-7,field.range[1]-7);const next='{'+[...fields,part].join(',')+'}';if(fields.length&&slotCommand('tweakunits9',next).length>14480){unitChunks.push('{'+fields.join(',')+'}');fields=[];}fields.push(part);if(slotCommand('tweakunits9','{'+part+'}').length>14480)throw Error('One unit definition is too large for a BAR slot. Reduce it in the Workshop.');}
      if(fields.length)unitChunks.push('{'+fields.join(',')+'}');
    }
    definitionSources.push(compactLua("do\n local u=(UnitDefs or {}).epic_starfall\n local w=u and u.weapondefs and u.weapondefs.epic_purple_cataclysm\n if w then\n  local oldReload=tonumber(w.reloadtime) or 14\n  local oldDamage=tonumber((w.damage or {}).default) or 1\n  local scale=320000/oldDamage\n  for armor,damage in pairs(w.damage or {}) do w.damage[armor]=damage*scale end\n  w.energypershot=(tonumber(w.energypershot) or 0)*10/oldReload\n  w.name='Starfall Rift Orb'\n  w.weaponvelocity=4500 w.hightrajectory=0 u.hightrajectory=0\n  w.impactonly=true w.noselfdamage=true\n  w.collidefriendly=false w.avoidfriendly=false\n  w.cratermult=0 w.craterboost=0 w.impulsefactor=0\n  w.burst=1 w.projectiles=1 w.burstrate=0 w.reloadtime=10\n  w.windup=0 w.weapontimer=10\n  w.size=32 w.sizedecay=0 w.accuracy=0 w.sprayangle=0\n  w.rgbcolor='0.65 0.12 1' w.rgbcolor2='0.95 0.65 1'\n  w.cegtag='arty-heavy-purple'\n  w.explosiongenerator='custom:starfire-explosion'\n  w.camerashake=0\n  u.customparams=u.customparams or {}\n  u.customparams.i18n_en_tooltip='Rift Orb siege cannon. One massive purple shot every 10 seconds; 320,000 damage per shot; 3,000 range.'\n end\nend"));
    const definitionChunks=[];let current='';
    for(const originalCode of definitionSources){
      const code=halfRateEpicDefinitions(originalCode);
      const ast=window.luaparse.parse(code,{luaVersion:'5.1',ranges:true});
      // Preserve each original slot's scope. Most slots are already isolated do/end blocks.
      const scoped=ast.body.every(n=>n.type==='DoStatement')?ast.body.map(n=>code.slice(...n.range)):['do '+code+' end'];
      for(const block of scoped){const next=current?current+' '+block:block;if(current&&slotCommand('tweakdefs9',next).length>16000){definitionChunks.push(current);current='';}if(slotCommand('tweakdefs9',block).length>16000)throw Error('One Lua block exceeds BAR’s 16,000-character slot limit. Reduce it in the Workshop.');current=current?current+' '+block:block;}
    }
    if(current)definitionChunks.push(current);
    // Keep final names and restrictions outside the optional code's failure scope.
    const tail=definitionChunks.pop();
    const tailAst=window.luaparse.parse(tail,{luaVersion:'5.1',ranges:true});
    const cut=tailAst.body.find(n=>tail.slice(...n.range).includes('wmod_blocked_combat')||tail.slice(...n.range).includes("epic_elysium='Epic Elysium'"))?.range[0];
    if(cut>0){const prefix=tail.slice(0,cut),final=tail.slice(cut);definitionChunks.push("do local ok,e=pcall(function() "+prefix+" end)if not ok then Spring.Echo('NuttyB tweak failed',e)end end "+final);}
    else definitionChunks.push(tail);
    // Final independent slot: custom display names must survive optional tweak failures.
    definitionChunks.push(compactLua("-- LEGENDARY_BASTION_SWARM_CLEAR\ndo\n local defs=UnitDefs or {}\n local bastion,bulwark,base=defs.legbastiont4,defs.cordoomt4,defs.legbastion\n if bastion and base then\n  if bulwark then bastion.health=(tonumber(bulwark.health) or 28000)+5000 end\n  -- The beacon script never sets ARMORED when deactivated.\n  -- Keep the native model and script together for a working closing animation.\n  bastion.objectname=base.objectname\n  bastion.script=base.script\n  bastion.buildpic=base.buildpic\n  bastion.onoffable=true\n  bastion.activatewhenbuilt=true\n  bastion.damagemodifier=0.25\n  bastion.customparams=bastion.customparams or {}\n  bastion.customparams.i18n_en_tooltip='Anti-swarm purple heat ray: 320-area blasts every 0.1 seconds. 5,000 more HP than Legendary Bulwark; 75% less damage when fully closed/off.'\n  local slot=bastion.weapons and bastion.weapons[1]\n  local ray=slot and bastion.weapondefs and bastion.weapondefs[string.lower(slot.def or '')]\n  if ray then\n   ray.projectiles=1\n   ray.sprayangle=0\n   ray.accuracy=0\n   -- Scatter is not independent targeting. Preserve original damage and appearance.\n   ray.customparams=ray.customparams or {}\n   ray.customparams.sweepfire_firetime=0\n   ray.customparams.sweepfire_reloadtime=0\n   ray.collidefriendly=false\n   ray.avoidfriendly=false\n   ray.collideneutral=false\n   ray.avoidneutral=false\n   ray.impactonly=false\n   ray.areaofeffect=320\n   ray.edgeeffectiveness=0.65\n   ray.reloadtime=0.1\n   ray.beamtime=0.1\n   ray.beamburst=false\n   ray.thickness=9\n   ray.corethickness=0.35\n   ray.laserflaresize=12\n   ray.name='Legendary Swarmbreaker Heat Ray'\n   ray.noselfdamage=true\n   ray.damage=ray.damage or {}\n   ray.damage.default=2500\n   ray.damage.vtol=15\n   ray.energypershot=1000\n   ray.customparams.exclude_preaim=nil\n   bastion.customparams.reaimtime=15\n   ray.avoidfeature=false ray.collidefeature=false\n   slot.fastautoretargeting=true\n  end\n end\nend\n"));
    definitionChunks.push(compactLua("do\n local pluto=(UnitDefs or {}).legflak\n local slot=pluto and pluto.weapons and pluto.weapons[1]\n local name=slot and slot.def and string.lower(slot.def)\n local gun=name and pluto.weapondefs and pluto.weapondefs[name]\n if gun then\n  -- Align reload to simulation frames before calculating sustained AA damage.\n  local reload=math.max(1,math.floor((tonumber(gun.reloadtime) or 1)*30+0.5))/30\n  local rounds=math.max(1,tonumber(gun.burst) or 1)*math.max(1,tonumber(gun.projectiles) or 1)\n  gun.reloadtime=reload\n  gun.damage=gun.damage or {}\n  gun.damage.vtol=4000*reload/rounds\n end\nend\n"+"do\n local calamity=(UnitDefs or {}).epic_calamity\n if calamity then calamity.firestate=2 end\n local names={epic_calamity={'Epic Calamity','Heavy long-range plasma artillery.'},epic_ragnarok={'Epic Ragnarok','Experimental long-range beam artillery.'},epic_elysium={'Epic Elysium','Experimental area shield.'},cordoomt4={'Legendary Bulwark','Heavy defensive tower with scatter, heat-ray and point-defence weapons.'},armannit4={'Legendary Pulsar','Heavy tachyon defence tower.'},legbastiont4={'Legendary Bastion','Anti-swarm purple heat ray: 320-area blasts every 0.1 seconds. 5,000 more HP than Legendary Bulwark; 75% less damage when fully closed/off.'}}\n local factions={arm='Armada',cor='Cortex',leg='Legion'}\n for prefix,faction in pairs(factions)do\n  names[prefix..'afust3_200']={'Legendary Fusion Reactor','Produces energy. Extremely explosive when destroyed.'}\n  names[prefix..'mmkrt3_200']={'Legendary Energy Converter','Converts energy into metal.'}\n  names[prefix..'uwadvmst3']={'T3 Hardened Metal Storage','Hardened tier 3 metal storage.'}\n  names[prefix..'uwadvest3']={'T3 Hardened Energy Storage','Hardened tier 3 energy storage.'}\n  names[prefix..'nanotct3']={'T3 Construction Turret','Tier 3 construction and repair support.'}\n end\n names.legadveconvt3_200=names.legmmkrt3_200\n names.legamstort3=names.leguwadvmst3\n names.legadvestoret3=names.leguwadvest3\n names.armadvestoret3=names.armuwadvest3\n names.coradvestoret3=names.coruwadvest3\n for key,u in pairs(UnitDefs or {})do\n  local cp=u.customparams or {} local entry=names[key]\n  local label=cp.i18n_en_humanname or (entry and entry[1]) or u.name\n  if type(label)=='string' and label~='' and label~=key and not label:match('^units%.') then\n   local description=cp.i18n_en_tooltip or (entry and entry[2]) or u.description or label\n   if type(description)~='string' or description=='' or description:match('^units%.') then description=entry and entry[2] or label end\n   u.name=label u.description=description u.customparams=cp cp.i18nfromunit=nil\n   for _,language in ipairs({'en','cs','de','es','fr','hr','it','lt','ru','zh','pl','pt','pt_br','tr','uk','ko','ja','nl','hu','en_us','en_gb'})do\n    cp['i18n_'..language..'_humanname']=label cp['i18n_'..language..'_tooltip']=description\n   end\n  end\n end\nend"));
    for(const [type,chunks] of [['tweakunits',unitChunks],['tweakdefs',definitionChunks]]){
      if(chunks.length>10)throw Error('This selection needs more than ten '+type+' slots. Remove an optional tweak.');
      for(let i=0;i<10;i++){const notice=type==='tweakunits'&&i===0&&chunks[i]?'--[=['+COMMUNITY_LICENSE+'\nSource: github.com/nuttyb-community/nuttyb; original author comments are retained in the website tweak browser.]=]\n':'';result.push(slotCommand(type+(i||''),chunks[i]?notice+chunks[i]:''));}
    }
    return result;
  }
  function appendSource(commands, type, code) {
    if (!code.trim()) return;
    const slots = Array.from({length:10}, (_,i) => type + (i || ''));
    const matchers = slots.map(slot => new RegExp('^!bset '+slot+' (\\S+)$','i'));
    const index = matchers.findIndex(re => !commands.some(c => {const m=c.match(re);return m && m[1] !== '0';}));
    if (index < 0 && type === 'tweakdefs') {
      const re = /^!bset tweakdefs8 (\S+)$/i;
      const at = commands.findIndex(c => re.test(c));
      const payload = commands[at].match(re)[1];
      const existing = payload === '0' ? '' : decodeLua(payload);
      commands[at] = slotCommand('tweakdefs8', 'do\n'+existing+'\nend\ndo\n'+code+'\nend');
      return;
    }
    if (index < 0) throw Error('All '+type+' slots are full. Remove a tweak or combine code in the editor.');
    const re = matchers[index];
    for(let i=commands.length-1;i>=0;i--) if(re.test(commands[i])) commands.splice(i,1);
    commands.push(slotCommand(slots[index],code));
  }
  gameCommands = function() {
    let lines = originalGame();
    const tag = state().lobbyTag.trim().replace(/[\r\n]/g,' ');
    lines = lines.map(c => c.startsWith('$rename ') ? '$rename WMod PVE NuttyB '+config.mode+(tag?' ['+tag+']':'')+(config.mode==='Raptors'?' [Qx'+config.values.raptor_queen_count+']['+(config.queenHP||1)+'xQHP]['+(config.raptorHP||1)+'xRHP]':' ['+(config.scavHP||1)+'xHP]['+(config.bossHP||1)+'xBHP]') : c);
    return lines;
  };
  function communityCommands() {
    const c = state(), defs=[], units=['main-units'];
    for(const [id,module] of [['ARMADA_COMMANDER','evocom-arm'],['CORTEX_COMMANDER','evocom-cor'],['LEGION_COMMANDER','evocom-leg']]) if(selected(id)) units.push(module);
    if(c.extras.rebalance) units.push('rflrpc-rebalance');
    defs.push('raptor-hp-template','queen-hp-template','main-defs');
    for(const [id,module] of [['T3_ECO','eco-t3'],['T3_BUILDERS','builders-t3'],['CROSS_FACTION','cross-faction-t2'],['LRPC','lrpc-rebalance'],['T4_ECO','eco-t4'],['T4_AIR','air-rework-t4'],['UNIT_LAUNCHERS','unit-launchers'],['MEGA_NUKE','mega-nuke']]) if(selected(id)) defs.push(module);
    defs.push('defences-t3');
    if(['LEGENDARY_BASTION','LEGENDARY_BULWARK','LEGENDARY_PULSAR'].some(selected)) defs.push('defences-t4');
    if(['RAGNAROK','CALAMITY','STARFALL'].some(selected)) defs.push('rflrpc-t4');
    if(c.extras.geo) defs.push('geo+walls-t3');
    const wave = {mini:'mini-bosses',extended:'mini-bosses-extended',experimental:'wave-challenge'}[config.wave];
    if(config.mode==='Raptors' && wave) defs.push(wave);
    const ordered = priorities.filter(id => defs.includes(id));
    const lines = gameCommands();
    // Keep ordered module boundaries intact; table expressions use their own unit slots.
    for(const id of units) appendSource(lines,'tweakunits',source(id));
    let chunk='';
    for(const id of ordered) {
      const block='do\n'+source(id)+'\nend\n';
      if(chunk && chunk.length+block.length>22000){appendSource(lines,'tweakdefs',chunk);chunk='';}
      chunk+=block;
    }
    // Keep per-unit selections effective even when a community module creates a group.
    const disabled = [['LEGENDARY_BASTION','legbastiont4'],['LEGENDARY_BULWARK','cordoomt4'],['LEGENDARY_PULSAR','armannit4'],['RAGNAROK','epic_ragnarok'],['CALAMITY','epic_calamity'],['STARFALL','epic_starfall']].filter(([id])=>!selected(id)).map(([,name])=>name);
    chunk += "\ndo local removed={"+disabled.map(name=>"['"+name+"']=true").join(',')+"} for name in pairs(removed) do UnitDefs[name]=nil end for _,u in pairs(UnitDefs) do if u.buildoptions then for i=#u.buildoptions,1,-1 do if removed[u.buildoptions[i]] then table.remove(u.buildoptions,i) end end end end local p=UnitDefs.armannit4 if p then p.damagemodifier=0.15 p.onoffable=true p.script='Units/ARMANNI.cob' p.customparams=p.customparams or {} p.customparams.i18n_en_tooltip='Rapid-fire tachyon bolts. Takes 85% less damage when fully closed/off.' end end\n";
    if(chunk)appendSource(lines,'tweakdefs',chunk);
    // Include the mod's anti-air option without replacing the community artillery.
    if(selected('STEEL_DOME'))appendSource(lines,'tweakdefs',STEEL_DOME_LUA);
    for(const type of ['tweakunits','tweakdefs']) for(let i=0;i<10;i++) {
      const slot=type+(i||'');if(!lines.some(l=>l.startsWith('!bset '+slot+' ')))lines.push('!bset '+slot+' 0');
    }
    return withCustomTweaks(lines);
  }
  generate = function() {
    const c=state();
    let commands=c.profile==='community'?communityCommands():originalGenerate().join('\n').split('\n');
    let extras='';
    if(c.profile==='will') {
      if(c.extras.geo)extras+='do\n'+source('geo+walls-t3')+'\nend\n';
      const wave={extended:'mini-bosses-extended',experimental:'wave-challenge'}[config.wave];
      if(config.mode==='Raptors' && wave)extras+='do\n'+source(wave)+'\nend\n';
      if(c.extras.rebalance)appendSource(commands,'tweakunits',source('rflrpc-rebalance'));
    }
    for(const id of c.library || []) if(byId.get(id)?.misc)extras+='do\n'+source(id)+'\nend\n';
    if(extras)appendSource(commands,'tweakdefs',extras);
    commands=packForBar(commands);
    for(const [slot,code] of Object.entries(config.slotEdits || {})) {
      if(!/^tweak(?:defs|units)[0-9]?$/.test(slot))continue;
      if(slotCommand(slot,code).length>16000)throw Error('The edited slot exceeds BAR’s 16,000-character limit.');
      const re=new RegExp('^!bset '+slot+' \\S+$','i');
      commands=commands.filter(c=>!re.test(c));commands.push(slotCommand(slot,code));
    }
    let room=commands.find(c=>c.startsWith('$rename '));
    commands=commands.filter(c=>!c.startsWith('$rename '));
    if(room)commands.push(room);
    return [cleanCommands(commands).join('\n')];
  };
  const originalSave=save;
  save=function(){try{originalSave();document.getElementById('command-count').textContent=outputs[0].split('\n').length+' commands · '+new TextEncoder().encode(outputs[0]).length.toLocaleString()+' bytes';}catch(error){document.getElementById('status').textContent=error.message;}};
  const count=el('p','hint');count.id='command-count';document.getElementById('generated').before(count);
  const panel=el('section','panel consolidation-panel');panel.id='community-settings';
  panel.append(el('h2','','More ways to play'),el('p','hint','Choose a ruleset, then shape the battle. Community artillery uses its own balance; Willboizy’s rules keep your custom Epic Starfall.'));
  const controls=el('div','consolidation-controls');panel.append(controls);
  document.getElementById('configuration').prepend(panel);
  function field(label,options,value,change) {
    const wrap=el('label','consolidation-field'),text=el('span','',label),select=el('select');
    for(const [v,name] of options){const o=el('option','',name);o.value=v;select.append(o);}select.value=value;
    select.addEventListener('change',()=>{change(select.value);renderAll();renderExtras();});wrap.append(text,select);controls.append(wrap);return select;
  }
  function renderExtras() {
    controls.replaceChildren();const c=state();
    const quick=el('div','toolbar');quick.style.gridColumn='1 / -1';quick.style.flexWrap='wrap';
    const title=el('strong',"","Willboizy's Lobby Settings"),loadQuick=el('button',"",'Load preset'),copyQuick=el('button','primary','Copy lobby code');
    function loadWillboizy(){
      const base=defaults(),p=WILLBOIZY_LOBBY_SETTINGS;
      config={...base,mode:p.mode,map:p.map,start:p.start,wave:p.wave,raptorHP:p.raptorHP,queenHP:p.queenHP};
      for(const [id,,min,max]of SLIDERS)if(Number.isFinite(p.values[id]))config.values[id]=Math.max(min,Math.min(max,p.values[id]));
      config.community={profile:'will',difficulty:'custom',extras:{geo:false,rebalance:false,effectsMode:'off',reducedDeaths:true},library:[],lobbyTag:''};
      renderAll();renderExtras();if(typeof showCustomDraft==='function')showCustomDraft();
      document.getElementById('status').textContent="Willboizy's lobby settings loaded with the latest game code.";
    }
    loadQuick.addEventListener('click',loadWillboizy);
    copyQuick.addEventListener('click',async()=>{loadWillboizy();await copy(generate().join('\n'),copyQuick);});
    const copyHint=el('span','hint',"← This is Willboizy's lobby preset code — just paste it into your BAR lobby.");copyHint.style.margin='0';copyHint.style.flex='1 1 260px';copyQuick.setAttribute('aria-describedby','willboizy-copy-hint');copyHint.id='willboizy-copy-hint';
    const copyGuide=el('div','toolbar');copyGuide.style.flex='1 1 420px';copyGuide.style.minWidth='0';copyGuide.style.flexWrap='nowrap';copyQuick.style.flexShrink='0';copyGuide.append(copyQuick,copyHint);quick.append(title,loadQuick,copyGuide);controls.append(quick);

    field('Arsenal rules',[['will','Willboizy’s custom arsenal'],['community','Community NuttyB arsenal']],c.profile,v=>{c.profile=v;});
    field('Difficulty package',[['custom','My own settings'],['easy','Easy · 1.3× health'],['medium','Medium · 1.5× health'],['hard','Hard · 3× health']],c.difficulty,v=>{
      c.difficulty=v;if(v==='custom')return;config.raptorHP=config.queenHP={easy:1.3,medium:1.5,hard:3}[v];enable('CROSS_FACTION',v!=='hard');for(const id of ['LEGENDARY_BASTION','LEGENDARY_BULWARK','LEGENDARY_PULSAR'])enable(id,v!=='hard');
    });
    for(const [id,label] of [['geo','T3 geothermal buildings & walls'],['rebalance','Standard Ragnarok / Calamity / Starfall rebalance']]){
      const l=el('label','tweak-row'),box=el('input');box.type='checkbox';box.checked=!!c.extras[id];box.addEventListener('change',()=>{c.extras[id]=box.checked;save();});l.append(box,el('span','',label));controls.append(l);
    }
    field('Performance effects',[['off','Off · full effects'],['light','Light · fewer custom trails'],['medium','Medium · lighter custom and raptor effects'],['heavy','Heavy · minimal effects for all units']],effectsMode(),v=>{c.extras.effectsMode=v;});
    controls.append(el('p','hint','Light keeps full impacts. Medium trims custom and raptor trails and impacts. Heavy uses small impact flashes throughout the battle and disables tracks/building decals. Projectile colours, models and combat stats stay the same. Applies to the next game.'));
    const deathBox=el('input');deathBox.type='checkbox';deathBox.checked=c.extras.reducedDeaths!==false;deathBox.setAttribute('aria-label','Reduce death effects');deathBox.addEventListener('change',()=>{c.extras.reducedDeaths=deathBox.checked;save();});const deathLabel=el('label','tweak-row');deathLabel.append(deathBox,el('span','','Reduce death effects'));controls.append(deathLabel,el('p','hint','Suppresses configured death and crash particles while keeping explosion damage and wrecks. Some script animations and graphics-widget smoke may remain. Applies to the next game.'));
    const tag=el('input');tag.type='text';tag.maxLength=100;tag.value=c.lobbyTag;tag.placeholder='Optional lobby tag';tag.setAttribute('aria-label','Lobby name tag');tag.addEventListener('input',()=>{c.lobbyTag=tag.value;save();});const wrap=el('label','consolidation-field');wrap.append(el('span','','Lobby name tag'),tag);controls.append(wrap);
    const presets=el('div','toolbar');for(const [name,key] of [['Community default','default'],['Casual start','casual'],['Timuela · EvoEco','timuela']]){
      const b=el('button','',name);b.addEventListener('click',()=>applyPreset(key));presets.append(b);
    }controls.append(presets);
    const credit=el('p','hint');const a=el('a','','Community Lua credits & MIT licence');a.href='COMMUNITY-LUA-LICENSE.txt';a.target='_blank';credit.append(a);controls.append(credit);
  }
  async function applyPreset(key) {
    config=defaults();
    const c=state();c.profile='community';c.difficulty=key==='default'?'medium':'easy';c.extras={rebalance:true,geo:false};config.raptorHP=config.queenHP=key==='default'?1.5:1.3;config.map='Full Metal Plate (12P)';config.start='No Rush';config.wave=key==='casual'?'none':'mini';config.values.multiplier_resourceincome=key==='casual'?2:1;config.values.multiplier_buildpower=key==='casual'?1.5:1;config.values.multiplier_builddistance=key==='default'?1.5:2;config.values.raptor_queen_count=key==='casual'?6:12;config.enabled={...defaults().enabled,T4_ECO:key!=='timuela'};
    if(key==='timuela') {
      try{
        const response=await fetch('https://raw.githubusercontent.com/timuela/BAR-widgets/refs/heads/main/tweaks/evo_eco-yardmaps.lua');if(!response.ok)throw Error('Download failed');const lua=await response.text();config.customTweaks=[...(config.customTweaks||[]),{slot:'tweakdefs9',source:lua}];c.lobbyTag='EvoEco';
      }catch{document.getElementById('tools-status').textContent='Timuela settings loaded; EvoEco source could not be fetched. Use the creator link in the tweak browser to add it.';}
    }
    renderAll();renderExtras();showCustomDraft();
  }
  // Import/export settings and named presets without changing the existing save format.
  const saved=document.getElementById('saved-presets'),transfer=el('div','toolbar preset-transfer');
  const exportButton=el('button','','Export settings'),importLabel=el('label','file-control','Import settings'),importInput=el('input');importInput.type='file';importInput.accept='.json,application/json';importLabel.append(importInput);
  function download(name,text,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  exportButton.addEventListener('click',()=>download('nutty-b-preset.json',JSON.stringify({version:1,name:'Nutty B config',configuration:config},null,2),'application/json'));
  importInput.addEventListener('change',async()=>{try{const data=JSON.parse(await importInput.files[0].text());const incoming=data.configuration||data;if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))throw Error('Choose a configuration JSON file.');if('presetDifficulty' in incoming){applyCommunitySettings(incoming);return;}const base=defaults();config={...base,...incoming,values:{...base.values,...incoming.values},enabled:{...base.enabled,...incoming.enabled}};for(const [name,,min,max]of SLIDERS)config.values[name]=Math.min(max,Math.max(min,Number(config.values[name])||min));config.enabled.MAIN_DEFS=config.enabled.MAIN_UNITS=true;renderAll();renderExtras();showCustomDraft();document.getElementById('tools-status').textContent='Settings imported.';}catch(e){document.getElementById('tools-status').textContent=e.message;}finally{importInput.value='';}});
  function applyCommunitySettings(incoming){config=defaults();const c=state();c.profile='community';c.extras={geo:!!incoming.isT3GeoWalls,rebalance:incoming.isRFLRPCRebalance!==false};c.lobbyTag=incoming.lobbyName||'';const hp={Easy:1.3,Medium:1.5,Hard:3}[incoming.presetDifficulty]||1.5;config.raptorHP=config.queenHP=hp;config.map=REFERENCE_OPTIONS.presets.maps.some(m=>m.name===incoming.gameMap)?incoming.gameMap:config.map;config.start={'No rush':'No Rush','No rush solo':'No Rush Solo','Zero grace':'Zero Grace',Surrounded:'Surrounded'}[incoming.start]||config.start;config.wave={'None':'none','Mini Bosses':'mini','Mini Bosses Extended':'extended','Experimental Wave Challenge':'experimental'}[incoming.challenges]||'mini';for(const [prop,id]of [['incomeMult','multiplier_resourceincome'],['buildDistMult','multiplier_builddistance'],['buildPowerMult','multiplier_buildpower'],['queenCount','raptor_queen_count']])if(Number.isFinite(incoming[prop])){const spec=SLIDERS.find(s=>s[0]===id);config.values[id]=Math.max(spec[2],Math.min(spec[3],incoming[prop]));}config.enabled.T4_ECO=incoming.isEcoT4!==false;config.enabled.MEGA_NUKE=!!incoming.isMegaNuke;for(const id of ['RAGNAROK','CALAMITY','STARFALL'])config.enabled[id]=incoming.isRFLRPCT4!==false;renderAll();renderExtras();}
  transfer.append(exportButton,importLabel);saved.append(transfer);
  // One workspace brings together source browsing, Base64 and slot editing.
  const tools=el('section','panel');tools.id='tools';tools.hidden=true;
  tools.innerHTML='<h2>Tweak workshop</h2><p class="hint">Explore community Lua, convert code, save reusable tweaks, or edit generated slots.</p><div class="workshop-tabs"><button data-workshop="browse" class="primary">Tweak browser</button><button data-workshop="convert">Lua / Base64</button><button data-workshop="editor">Slot editor</button><button data-workshop="saved">Saved tweaks</button></div><div id="workshop-content"></div><p class="status" id="tools-status" role="status" aria-live="polite"></p>';
  document.getElementById('outputs').before(tools);
  const tab=el('button','','Workshop');tab.id='tools-tab';tab.setAttribute('aria-pressed','false');document.querySelector('.topnav').append(tab);
  const allTabs=['configuration','custom','widgets','library','tools','planner'];
  for(const name of allTabs)document.getElementById(name+'-tab').addEventListener('click',()=>{
    for(const id of allTabs){const on=id===name;const button=document.getElementById(id+'-tab');button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));document.getElementById(id).hidden=!on;}
    document.getElementById('outputs').hidden=name!=='configuration';
    saved.hidden=name==='tools'||name==='widgets'||name==='library'||name==='planner';
  });
  const area=document.getElementById('workshop-content'),message=document.getElementById('tools-status');
  let mode='browse',draft='',draftType='tweakdefs',tweaks=[];
  try{tweaks=JSON.parse(localStorage.getItem('nutty-reusable-tweaks-v1')||'[]');if(!Array.isArray(tweaks))tweaks=[];}catch{}
  function textBox(value,label){const t=el('textarea','workshop-code');t.value=value;t.spellcheck=false;t.setAttribute('aria-label',label);return t;}
  function minifyLua(code) {
    validateLua(code);
    const tokens=code.match(/--\[(=*)\[[\s\S]*?\]\1\]|--[^\n]*|\[(=*)\[[\s\S]*?\]\2\]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_][\w]*|0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|\.\.\.|\.\.|==|~=|<=|>=|\S/g)||[];
    const result=compactLua(code);
    validateLua(result);
    return result;
  }
  function validateLua(code) {
    try{return window.luaparse.parse(code,{luaVersion:'5.1',locations:true});}
    catch(error){try{return window.luaparse.parse('return '+code,{luaVersion:'5.1',locations:true});}catch{throw error;}}
  }
  function formatLua(code) {
    const ast=validateLua(code),lines=code.split('\n'),depth=lines.map(()=>0),protectedLines=new Set();
    for(const m of code.matchAll(/--\[(=*)\[[\s\S]*?\]\1\]|\[(=*)\[[\s\S]*?\]\2\]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g)){
      const start=code.slice(0,m.index).split('\n').length-1;
      for(let i=1;i<m[0].split('\n').length;i++)protectedLines.add(start+i);
    }
    function visit(node){if(!node||typeof node!=='object')return;if(node.body&&node.loc)for(let i=node.loc.start.line;i<node.loc.end.line-1;i++)depth[i]++;for(const [key,value]of Object.entries(node))if(key!=='loc'){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}
    // The root chunk is not a nested scope.
    ast.body.forEach(visit);
    const result=lines.map((line,i)=>protectedLines.has(i)?line:'  '.repeat(depth[i])+line.trim()).join('\n');
    validateLua(result);return result;
  }
  function renderWorkshop(){
    area.replaceChildren();tools.querySelectorAll('[data-workshop]').forEach(b=>b.classList.toggle('primary',b.dataset.workshop===mode));
    if(mode==='browse') {
      const search=el('input');search.type='search';search.placeholder='Find a tweak or author';search.setAttribute('aria-label','Search community tweaks');const list=el('div','library-grid');area.append(search,list);
      function draw(){list.replaceChildren();for(const t of COMMUNITY_TWEAKS.filter(t=>(t.title+' '+t.author+' '+t.path).toLowerCase().includes(search.value.toLowerCase()))){
        const card=el('article','library-card');card.append(el('h3','',t.title),el('small','','By '+t.author),el('p','hint',t.type+' · '+(t.misc?'Optional experiment':'Community foundation')));const actions=el('div','toolbar'),view=el('button','','View Lua');view.addEventListener('click',()=>{draft=source(t.id);draftType=t.type;mode='convert';renderWorkshop();});const link=el('a','','Creator source ↗');link.href=t.url;link.target='_blank';link.rel='noopener noreferrer';actions.append(view,link);
        if(t.misc){const label=el('label'),check=el('input');check.type='checkbox';check.checked=(state().library||[]).includes(t.id);check.addEventListener('change',()=>{const ids=new Set(state().library||[]);check.checked?ids.add(t.id):ids.delete(t.id);state().library=[...ids];save();});label.append(check,el('span','','Include in battle'));actions.append(label);}
        card.append(actions);list.append(card);
      }}search.addEventListener('input',draw);draw();
      const link=el('a','widget-link','Timuela EvoEco source ↗');link.href='https://github.com/timuela/BAR-widgets/blob/main/tweaks/evo_eco-yardmaps.lua';link.target='_blank';link.rel='noopener noreferrer';area.append(link);
    } else if(mode==='convert') {
      const type=el('select');type.setAttribute('aria-label','Reusable tweak code type');for(const [value,label]of [['tweakdefs','Definition code · tweakdefs'],['tweakunits','Unit table · tweakunits']]){const option=el('option','',label);option.value=value;type.append(option);}type.value=draftType;type.addEventListener('change',()=>draftType=type.value);area.append(type);const text=textBox(draft,'Lua or encoded tweak code'),bar=el('div','toolbar');text.addEventListener('input',()=>draft=text.value);
      for(const [label,action]of [['Encode Base64',()=>{text.value=encodeLua(text.value);draft=text.value;}],['Decode Base64',()=>{const m=text.value.trim().match(/^!?bset\s+tweak\w*\s+(\S+)$/i);text.value=decodeLua(m?m[1]:text.value.trim());draft=text.value;}],['Minify Lua',()=>{text.value=minifyLua(text.value);draft=text.value;}],['Format Lua',()=>{text.value=formatLua(text.value);draft=text.value;}],['Check Lua',()=>{validateLua(text.value);message.textContent='Lua syntax is valid. Gameplay still needs an in-game test.';}],['Copy',e=>copy(text.value,e.currentTarget)],['Download Lua',()=>download('custom-tweak.lua',text.value)],['Save reusable tweak',()=>{validateLua(text.value);if(draftType==='tweakunits')window.luaparse.parse('return '+text.value,{luaVersion:'5.1'});const name=window.prompt('Name for this tweak');if(!name?.trim())return;tweaks.push({name:name.trim(),source:text.value,type:draftType});localStorage.setItem('nutty-reusable-tweaks-v1',JSON.stringify(tweaks));message.textContent='Tweak saved in this browser.';}]]){const b=el('button','',label);b.addEventListener('click',e=>{try{action(e);}catch{message.textContent='Could not convert this code. Check the complete payload.';}});bar.append(b);}const upload=el('input');upload.type='file';upload.accept='.lua,.txt';upload.setAttribute('aria-label','Import Lua or tweak code file');upload.addEventListener('change',async()=>{if(upload.files[0]){text.value=await upload.files[0].text();draft=text.value;}upload.value='';});area.append(upload,text,bar);
    } else if(mode==='editor') {
      const lines=generate()[0].split('\n'),slots=lines.map(l=>l.match(/^!bset (tweak(?:defs|units)\d*) (\S+)$/i)).filter(m=>m&&m[2]!=='0');
      const select=el('select');select.setAttribute('aria-label','Generated tweak slot');for(const m of slots){const o=el('option','',m[1]);o.value=m[1];select.append(o);}const text=textBox('','Slot Lua source'),bar=el('div','toolbar');
      const load=()=>{const m=slots.find(m=>m[1]===select.value);text.value=m?decodeLua(m[2]):'';};select.addEventListener('change',load);load();
      for(const [label,action]of [['Apply edit',()=>{if(!select.value)throw Error('Choose a slot first.');validateLua(text.value);config.slotEdits||={};config.slotEdits[select.value]=text.value;save();message.textContent='Slot override applied to your generated code.';}],['Reset slot',()=>{if(config.slotEdits)delete config.slotEdits[select.value];save();renderWorkshop();}],['Copy Lua',e=>copy(text.value,e.currentTarget)],['Copy encoded command',e=>copy(slotCommand(select.value,text.value),e.currentTarget)],['Download Lua',()=>download(select.value+'.lua',text.value)]]){const b=el('button','',label);b.addEventListener('click',e=>{try{action(e);}catch(error){message.textContent=error.message;}});bar.append(b);}area.append(el('p','hint','Edits override this slot until you reset it. Sliders continue to update other slots.'),select,text,bar);
    } else {
      const list=el('div','library-grid');for(const [i,t]of tweaks.entries()){const card=el('article','library-card');card.append(el('h3','',t.name));const view=el('button','','Edit / convert');view.addEventListener('click',()=>{draft=t.source;draftType=t.type||'tweakdefs';mode='convert';renderWorkshop();});const use=el('button','primary','Include code');use.addEventListener('click',()=>{config.customTweaks||=[];config.customTweaks.push({slot:(t.type==='tweakunits'?'tweakunits8':'tweakdefs8'),source:t.source});save();message.textContent='Included in the generated code.';});const remove=el('button','','Delete saved tweak');remove.addEventListener('click',()=>{tweaks.splice(i,1);localStorage.setItem('nutty-reusable-tweaks-v1',JSON.stringify(tweaks));renderWorkshop();});card.append(view,use,remove);list.append(card);}area.append(list);if(!tweaks.length)area.append(el('p','hint','Save a tweak from Lua / Base64 to keep it here.'));
    }
  }
  tools.querySelectorAll('[data-workshop]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.workshop;renderWorkshop();}));
  // Start presets set every related numeric value, then users can adjust sliders.
  const oldRenderGame=renderGame;
  renderGame=function(){oldRenderGame();const start=document.getElementById('setting-Start');start.addEventListener('change',()=>{const values={'No Rush':[3,4,3],'No Rush Solo':[3,3,2.7],'Zero Grace':[3,3,.1],Surrounded:[3,6,3]}[config.start];if(values){[config.values.raptor_spawncountmult,config.values.raptor_firstwavesboost,config.values.raptor_graceperiodmult]=values;renderSliders();save();}});};
  SLIDERS.find(s=>s[0]==='multiplier_builddistance')[2]=.5;
  document.getElementById('reset').addEventListener('click',()=>{renderExtras();renderWorkshop();});
  document.getElementById('reset-tweaks').addEventListener('click',()=>renderExtras());
  const oldRenderAll=renderAll;renderAll=function(){oldRenderAll();renderExtras();};
  renderAll();renderWorkshop();
})();