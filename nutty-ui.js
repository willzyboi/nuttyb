'use strict';
const SLIDERS=[
 ['multiplier_resourceincome','Resource Income',0.1,10,0.1,'resource-sliders'],
 ['multiplier_shieldpower','Shield Power',0.1,10,0.1,'resource-sliders'],
 ['multiplier_builddistance','Build Range',1,10,0.1,'resource-sliders'],
 ['multiplier_buildpower','Build Power',0.1,10,0.1,'resource-sliders'],
 ['raptor_queen_count','Queen Quantity',1,100,1,'raptor-sliders'],
 ['raptor_spawncountmult','Wave Multiplier',1,5,1,'raptor-sliders'],
 ['raptor_firstwavesboost','First Waves Boost',1,10,1,'raptor-sliders'],
 ['raptor_graceperiodmult','Grace Period Multiplier',0.1,3,0.1,'raptor-sliders']
];
const GROUPS=[
 ['Main (Always Enabled)',['MAIN_DEFS','MAIN_UNITS']],
 ['T3 Eco',['T3_ECO']],
 ['Evolving Commanders',['ARMADA_COMMANDER','CORTEX_COMMANDER','LEGION_COMMANDER']],
 ['T4 Air',['T4_AIR']],
 ['Mega Nuke',['MEGA_NUKE']],
 ['T4 Defenses',['LEGENDARY_BASTION','LEGENDARY_BULWARK','LEGENDARY_PULSAR']],
 ['T2 Cross Faction',['CROSS_FACTION']],
 ['T4 Eco',['T4_ECO']],
 ['T2 LRPC v2',['LRPC']],
 ['T4 Epics',['BASTION','CALAMITY','EPIC_ELYSIUM','FORTRESS','RAGNAROK','STARFALL']],
 ['T3 Builders',['T3_BUILDERS']],
 ['Unit Launchers',['UNIT_LAUNCHERS']]
];
const UNIT_LABELS={MAIN_DEFS:'Main Defs',MAIN_UNITS:'Main Units',ARMADA_COMMANDER:'Armada Commander',CORTEX_COMMANDER:'Cortex Commander',LEGION_COMMANDER:'Legion Commander',LEGENDARY_BASTION:'Legendary Bastion',LEGENDARY_BULWARK:'Legendary Bulwark',LEGENDARY_PULSAR:'Legendary Pulsar',BASTION:'Epic Bastion',CALAMITY:'Epic Calamity',EPIC_ELYSIUM:'Epic Elysium',FORTRESS:'Epic Fortress',RAGNAROK:'Epic Ragnarok',STARFALL:'Epic Starfall'};
const LIMITS=[['T3_BUILDERS','T3 Builders',40],['UNIT_LAUNCHERS','Unit Launchers',9999],['RAGNAROK','Epic Ragnarok',9999],['CALAMITY','Epic Calamity',9999],['T4_AIR','Epic Tyrannus',9999],['STARFALL','Epic Starfall',9999]];
const DEPENDENCIES={T3_ECO:['T3_BUILDERS'],T4_ECO:['T3_BUILDERS','T3_ECO'],LEGENDARY_BASTION:['T3_BUILDERS'],LEGENDARY_BULWARK:['T3_BUILDERS'],LEGENDARY_PULSAR:['T3_BUILDERS'],BASTION:['T3_BUILDERS'],CALAMITY:['T3_BUILDERS'],EPIC_ELYSIUM:['T3_BUILDERS'],FORTRESS:['T3_BUILDERS'],RAGNAROK:['T3_BUILDERS'],STARFALL:['T3_BUILDERS']};
const LUA_SOURCES={};
BASE_PARTS.forEach((part,pi)=>part.commands.forEach((command,ci)=>{const m=command.match(/^!bset (tweak\w+) (\S+)$/i);if(m&&m[2]!=='0')LUA_SOURCES[pi+'/'+ci]={slot:m[1],source:decodeLua(m[2])};}));
function baselineValue(name){const line=BASE_PARTS[0].commands.find(c=>new RegExp('^!(?:bset\\s+)?'+name+'\\s','i').test(c));return Number(line?.split(' ').at(-1))||1;}
function defaults(){return {values:Object.fromEntries(SLIDERS.map(([name])=>[name,baselineValue(name)])),enabled:Object.fromEntries(GROUPS.flatMap(([,ids])=>ids.map(id=>[id,id!=='MEGA_NUKE']))),limits:{},wave:'mini',mode:'Raptors',map:'Full Metal Plate (12P)',start:'No Rush',raptorHP:2,queenHP:2,scavHP:2,bossHP:2};}
let config=defaults();
try{const saved=JSON.parse(localStorage.getItem('nutty-pink-v2'));if(saved){config={...config,...saved,values:{...config.values,...saved.values},enabled:{...config.enabled,...saved.enabled}};}else{const old=JSON.parse(localStorage.getItem('nutty-config-v1'));if(old){for(const [name]of SLIDERS){const line=Object.values(old.edits||{}).find(c=>new RegExp('^!(?:bset\\s+)?'+name+'\\s','i').test(c));if(line)config.values[name]=Number(line.split(' ').at(-1));}config.raptorHP=old.raptorHP??2;config.queenHP=old.queenHP??2;}}}catch{}
for(const [name,,min,max]of SLIDERS)config.values[name]=Math.max(min,Math.min(max,Number(config.values[name])||min));
config.enabled.MAIN_DEFS=config.enabled.MAIN_UNITS=true;
let outputs=[];const copyButtons=[];
function el(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
function slotCommand(slot,source){return '!bset '+slot+' '+(source.trim()?encodeLua(source):'0');}
function markerBlocks(source){return Array.from(source.matchAll(/--\s*([A-Z0-9_]+)_START\r?\n[\s\S]*?--\s*\1_END/g),m=>({id:m[1],code:m[0]}));}
function hasCode(source){return source.replace(/--[^\n]*/g,'').trim().length>0;}
function selected(id){if(id==='HP_2X')return config.mode==='Raptors'&&config.raptorHP>0;if(id==='QHP_2X')return config.mode==='Raptors'&&config.queenHP>0;if(id==='MINI_BOSSES')return config.mode==='Raptors'&&config.wave==='mini';if(id==='EVO_XP')return ['ARMADA_COMMANDER','CORTEX_COMMANDER','LEGION_COMMANDER'].some(x=>config.enabled[x]);return config.enabled[id]!==false;}
function limitCode(id){const value=config.limits[id];if(value===undefined||value===''||!selected(id))return '';const n=Number(value);let names=[];
 if(id==='T3_BUILDERS')names=['armt3aide','armt3airaide','cort3aide','cort3airaide','legt3aide','legt3airaide'];
 if(id==='UNIT_LAUNCHERS')names=['armbotrail_armt3','armbotrail_cort3','armbotrail_legt3','armbotrail_armvadert4'];
 if(id==='RAGNAROK')names=['epic_ragnarok'];if(id==='CALAMITY')names=['epic_calamity'];if(id==='STARFALL')names=['epic_starfall'];if(id==='T4_AIR')names=['legfortt4'];
 return '\ndo for _,name in ipairs({'+names.map(x=>"'"+x+"'").join(',')+'}) do local u=UnitDefs[name] if u then u.maxthisunit='+(n===0?'nil':n)+' if u.customparams and u.customparams.i18n_en_tooltip then u.customparams.i18n_en_tooltip=u.customparams.i18n_en_tooltip:gsub("x%d+ Max","'+(n===0?'Unlimited':'x'+n+' Max')+'") end end end end\n';
}
function sourceFor(key){const {slot,source}=LUA_SOURCES[key];if(slot==='tweakdefs6'&&!config.enabled.CROSS_FACTION)return '';if(slot==='tweakdefs7'&&!config.enabled.UNIT_LAUNCHERS)return '';
 const blocks=markerBlocks(source);let result=blocks.length?blocks.filter(b=>selected(b.id)&&b.id!=='STARFALL').map(b=>b.code+limitCode(b.id)).join('\n\n'):source;
 if(slot==='tweakdefs1'&&config.mode==='Raptors')result=hpSource('--HP_2X_QHP_2X\n'+result,config.raptorHP,config.queenHP);
 if(slot==='tweakdefs1'&&config.mode==='Scavengers')result=scavHealthSource()+result;
 if(slot==='tweakdefs7')result+=limitCode('UNIT_LAUNCHERS');
 return hasCode(result)?result:'';
}
function scavHealthSource(){if(!config.scavHP&&!config.bossHP)return '';return 'do local previous=UnitDef_Post function UnitDef_Post(name,u) if previous then previous(name,u) end if u.health then if name:match("^scavengerbossv4") then u.health=u.health*'+(config.bossHP||1)+' elseif name:match("_scav$") then u.health=u.health*'+(config.scavHP||1)+' end end end end\n';}
// BAR's current lobby/game use base64url(zlib(JSON)), not legacy addbox commands.
const CENTER_STARTBOX_OVERRIDE='eJyrViouSSwqScqvSC1WsoquVirIz6kEMyqUrAx0lCqVrAxqdcA8IwMI38jAoDYWJIas1MIULGdhClVsaAgRMDQ0rY2tja0FAJWCHrY';
function startboxCommands(){return config.mode==='Raptors'?['!bset startpostype 2','!bset mapmetadata_startbox_override '+CENTER_STARTBOX_OVERRIDE,'!bset raptor_raptorstart alwaysbox']:[];}
function gameCommands(){let commands=BASE_PARTS[0].commands.filter(c=>!/^!bset tweak/i.test(c));commands=commands.map(c=>{for(const [name]of SLIDERS){if(new RegExp('^!(?:bset\\s+)?'+name+'\\s','i').test(c))return '!bset '+name+' '+config.values[name];}return c;});
 const map=REFERENCE_OPTIONS.presets.maps.find(x=>x.name===config.map);const start=REFERENCE_OPTIONS.presets.modes.find(x=>x.name===config.start);
 commands=commands.filter(c=>!/^!(map|addbox|clearbox|raptor_queentimemult|raptor_raptorstart|debugcommands|map_lavatiderhythm)\b/i.test(c));
 const mapCommands=map?.commands||[];if(mapCommands.some(c=>/^!teamsize /.test(c)))commands=commands.filter(c=>!/^!teamsize /.test(c));
 const at=commands.findIndex(c=>c.startsWith('$rename '));commands.splice(at<0?commands.length:at,0,...mapCommands,...(start?.commands||[]));
 if(config.mode==='Raptors'){commands=commands.filter(c=>!/^!(?:addbox|clearbox|raptor_raptorstart)\b/i.test(c));commands.push(...startboxCommands());}
 if(config.mode==='Scavengers'){const at=commands.findIndex(c=>c.startsWith('!map '));commands.splice(at<0?0:at,0,...REFERENCE_OPTIONS.presets.scavengers);}
 if(config.start==='Zero Grace')commands=commands.map(c=>c.startsWith('!bset raptor_graceperiodmult ')?'!bset raptor_graceperiodmult 0':c);
 if(config.start==='No Rush Solo')commands.push('!teamsize 1');
 commands=commands.map(c=>{if(c.startsWith('$rename '))return '$rename PvE NuttyB '+config.mode+(config.mode==='Raptors'?' [Qx'+config.values.raptor_queen_count+']['+(config.queenHP||1)+'xQHP]['+(config.raptorHP||1)+'xRHP]':' ['+(config.scavHP||1)+'xHP]['+(config.bossHP||1)+'xBHP]');return c;});return commands;
}
function generate(){const parts=BASE_PARTS.map((part,pi)=>pi===0?gameCommands():part.commands.map((c,ci)=>{const key=pi+'/'+ci;return LUA_SOURCES[key]?slotCommand(LUA_SOURCES[key].slot,sourceFor(key)):c;}));
 // Slot zero reset belongs with its main payload. Every disabled slot gets an explicit reset.
 parts[1].unshift('!bset tweakunits 0');for(let i=4;i<=9;i++)parts[4].push('!bset tweakunits'+i+' 0');parts[4].push('!bset tweakdefs8 0');if(config.enabled.MEGA_NUKE)parts[4].push(slotCommand('tweakdefs8',REFERENCE_OPTIONS.mega));
 // Register Starfall last, after every other tweak has created or edited builders.
 const starfall=markerBlocks(LUA_SOURCES['3/1'].source).find(b=>b.id==='STARFALL');
 parts[4].push('!bset tweakdefs9 0',slotCommand('tweakdefs9',selected('STARFALL')?starfall.code+limitCode('STARFALL'):''));
 const sliderCommands=gameCommands().filter(c=>SLIDERS.some(([name])=>c.startsWith('!bset '+name+' ')));
 const roomName=gameCommands().find(c=>c.startsWith('$rename '));
 // Reapply the selected settings after the entire tweak set; never restore the
 // baseline queen count in the final room name.
 return sixCopyParts([...withCustomTweaks(parts.flat().filter(c=>!c.startsWith('$rename '))),...sliderCommands,...startboxCommands(),roomName]);
}
function withCustomTweaks(commands){
 const result=commands.slice();
 for(const {slot,source} of config.customTweaks||[]){
  const pattern=new RegExp('^!bset '+slot+' (\\S+)$','i');
  let original='';
  for(const command of result){const match=command.match(pattern);if(match&&match[1]!=='0')original=decodeLua(match[1]);}
  const combined=original?(slot.startsWith('tweakunits')?'table.merge((\n'+original+'\n),(\n'+source+'\n))':'do\n'+original+'\nend\ndo\n'+source+'\nend'):source;
  for(let i=result.length-1;i>=0;i--)if(pattern.test(result[i]))result.splice(i,1);
  result.push('!bset '+slot+' 0',slotCommand(slot,combined));
 }
 return result;
}
function sixCopyParts(commands){
 // Keep reset/payload pairs together; minimize the largest of six ordered pastes.
 const groups=[];
 for(let i=0;i<commands.length;i++){
  let group=commands[i];const reset=group.match(/^!bset (tweak\w+) 0$/i);
  if(reset&&commands[i+1]?.toLowerCase().startsWith('!bset '+reset[1].toLowerCase()+' '))group+='\n'+commands[++i];
  groups.push(group);
 }
 const n=groups.length,prefix=[0];groups.forEach(g=>prefix.push(prefix.at(-1)+g.length+1));
 const dp=Array.from({length:7},()=>Array(n+1).fill(Infinity)),cut=Array.from({length:7},()=>Array(n+1));dp[0][0]=0;
 for(let k=1;k<=6;k++)for(let i=k;i<=n;i++)for(let j=k-1;j<i;j++){
  const size=Math.max(dp[k-1][j],prefix[i]-prefix[j]);if(size<dp[k][i]){dp[k][i]=size;cut[k][i]=j;}
 }
 const result=[];let end=n;for(let k=6;k>0;k--){const begin=cut[k][end];result.unshift(groups.slice(begin,end).join('\n'));end=begin;}
 return result;
}
function save(){try{localStorage.setItem('nutty-pink-v2',JSON.stringify(config));}catch{}outputs=generate();document.querySelectorAll('.part-preview[data-part]').forEach(e=>e.value=outputs[Number(e.dataset.part)]);copyButtons.forEach((b,i)=>b.textContent='Copy part '+(i+1));document.getElementById('status').textContent='Ready to copy.';}
async function copy(text,button){let success=false;try{await navigator.clipboard.writeText(text);success=true;}catch{const manual=document.getElementById('manual');manual.hidden=false;manual.value=text;manual.focus();manual.select();try{success=document.execCommand('copy');}catch{}if(success)manual.hidden=true;}if(success){button.textContent='Copied ✓';document.getElementById('status').textContent='Copied. Paste into BAR lobby chat.';}else document.getElementById('status').textContent='Press Ctrl+C to copy the selected text.';}
function selectControl(root,name,value,options,onChange){const row=el('div','setting'),label=el('label','',name+':'),input=el('select');input.id='setting-'+name.replaceAll(' ','-');label.htmlFor=input.id;for(const option of options){const item=el('option','',typeof option==='string'?option:option.label);item.value=typeof option==='string'?option:option.value;input.append(item);}input.value=String(value);input.addEventListener('change',()=>{onChange(input.value);save();});row.append(label,input);root.append(row);}
function renderGame(){const root=document.getElementById('game-settings');root.replaceChildren();selectControl(root,'Mode',config.mode,['Raptors','Scavengers'],v=>{config.mode=v;renderGame();renderTweaks();});
 const hpOptions=[{value:0,label:'Default'},...[1,1.3,1.5,1.7,2,2.5,3,4,5].map(v=>({value:v,label:v+'x HP'}))];
 if(config.mode==='Raptors'){selectControl(root,'Raptor Health',config.raptorHP,hpOptions,v=>config.raptorHP=Number(v));selectControl(root,'Queen Health',config.queenHP,hpOptions,v=>config.queenHP=Number(v));}else{selectControl(root,'Scavengers HP',config.scavHP,hpOptions,v=>config.scavHP=Number(v));selectControl(root,'Scav Boss HP',config.bossHP,hpOptions,v=>config.bossHP=Number(v));}
 selectControl(root,'Map',config.map,REFERENCE_OPTIONS.presets.maps.map(x=>x.name),v=>config.map=v);selectControl(root,'Start',config.start,REFERENCE_OPTIONS.presets.modes.map(x=>x.name),v=>config.start=v);
}
function enable(id,on){config.enabled[id]=on;if(on)for(const dep of DEPENDENCIES[id]||[])enable(dep,true);else for(const [child,deps]of Object.entries(DEPENDENCIES))if(deps.includes(id))enable(child,false);}
const expanded=new Set();
function renderTweaks(){const root=document.getElementById('tweak-options');root.replaceChildren();GROUPS.forEach(([name,ids],index)=>{const wrapper=el('div'),row=el('div','tweak-row'),label=el('label'),check=el('input');check.type='checkbox';check.id='group-'+index;check.checked=ids.every(id=>config.enabled[id]);check.indeterminate=!check.checked&&ids.some(id=>config.enabled[id]);check.disabled=index===0;label.append(check,el('span','',name));check.addEventListener('change',()=>{ids.forEach(id=>enable(id,check.checked));renderTweaks();save();document.getElementById('tweak-status').textContent='Selections updated. Required builders are included automatically.';});row.append(label);wrapper.append(row);
 if(ids.length>1){const toggle=el('button','',expanded.has(index)?'▾':'▸');toggle.setAttribute('aria-label','Expand '+name);toggle.setAttribute('aria-expanded',String(expanded.has(index)));toggle.addEventListener('click',()=>{if(expanded.has(index))expanded.delete(index);else expanded.add(index);renderTweaks();});row.append(toggle);const sub=el('div','suboptions');sub.hidden=!expanded.has(index);ids.forEach(id=>{const l=el('label'),c=el('input');c.type='checkbox';c.checked=config.enabled[id];c.disabled=index===0;c.addEventListener('change',()=>{enable(id,c.checked);renderTweaks();save();});l.append(c,el('span','',UNIT_LABELS[id]||id));sub.append(l);});wrapper.append(sub);}root.append(wrapper);});
 const waves=document.getElementById('wave-options');waves.replaceChildren();for(const [value,name]of [['none','None'],['mini','Mini Bosses']]){const label=el('label','pill'),radio=el('input');radio.type='radio';radio.name='waves';radio.value=value;radio.checked=config.wave===value;radio.disabled=config.mode!=='Raptors';radio.addEventListener('change',()=>{config.wave=value;save();});label.append(radio,el('span','',name));waves.append(label);}
}
function renderLimits(){const root=document.getElementById('limits');root.replaceChildren();LIMITS.forEach(([id,name,defaultValue])=>{const label=el('label','limit'),text=el('span','',name);text.append(el('small','','Original: '+defaultValue+'/unit'));const input=el('input');input.type='number';input.min=0;input.step=1;input.placeholder='Default';input.value=config.limits[id]??'';input.setAttribute('aria-label',name+' maximum');input.addEventListener('input',()=>{if(input.value===''){delete config.limits[id];save();return;}const v=Number(input.value);if(Number.isInteger(v)&&v>=0){config.limits[id]=v;save();}});label.append(text,input);root.append(label);});}
function renderSliders(){for(const id of ['resource-sliders','raptor-sliders'])document.getElementById(id).replaceChildren();SLIDERS.forEach(([name,label,min,max,step,parent])=>{const root=document.getElementById(parent),control=el('div','control'),title=el('label','',label),inputs=el('div','inputs'),slider=el('input'),number=el('input');slider.type='range';slider.min=min;slider.max=max;slider.step=step;slider.value=config.values[name];slider.setAttribute('aria-label',label+' slider');number.type='number';number.id=name+'-value';number.min=min;number.max=max;number.step=step;number.value=config.values[name];title.htmlFor=number.id;number.setAttribute('aria-label',label);function update(value){if(!Number.isFinite(value))return;config.values[name]=Number(Math.max(min,Math.min(max,value)).toFixed(2));slider.value=number.value=config.values[name];save();}slider.addEventListener('input',()=>update(Number(slider.value)));number.addEventListener('input',()=>{const value=Number(number.value);if(number.value!==''&&value>=min&&value<=max&&Number.isFinite(value)){config.values[name]=value;slider.value=value;save();}});number.addEventListener('change',()=>update(Number(number.value)));const plus=el('button','','+'),minus=el('button','','−');plus.setAttribute('aria-label','Increase '+label);minus.setAttribute('aria-label','Decrease '+label);plus.addEventListener('click',()=>update(config.values[name]+step));minus.addEventListener('click',()=>update(config.values[name]-step));inputs.append(slider,number,plus,minus);control.append(title,inputs);root.append(control);});}
function renderOutputs(){const root=document.getElementById('generated');root.replaceChildren();Array.from({length:6}).forEach((_,i)=>{const row=el('div','copy-row'),side=el('div'),button=el('button','primary','Copy part '+(i+1));copyButtons[i]=button;button.addEventListener('click',()=>copy(outputs[i],button));side.append(button,el('p','hint','Settings & tweaks '+(i+1)+' of 6'));const preview=el('textarea','part-preview');preview.dataset.part=i;preview.readOnly=true;preview.setAttribute('aria-label','Part '+(i+1)+' generated commands');row.append(side,preview);root.append(row);});}
function renderAll(){renderGame();renderTweaks();renderLimits();renderSliders();save();}
document.getElementById('reset').addEventListener('click',()=>{config=defaults();renderAll();});
document.getElementById('reset-game').addEventListener('click',()=>{const d=defaults();for(const name of ['mode','map','start','raptorHP','queenHP','scavHP','bossHP'])config[name]=d[name];renderGame();renderTweaks();save();});
document.getElementById('none-hp').addEventListener('click',()=>{config.raptorHP=config.queenHP=config.scavHP=config.bossHP=0;renderGame();save();});
document.getElementById('reset-tweaks').addEventListener('click',()=>{config.enabled=defaults().enabled;config.limits={};config.wave='mini';renderTweaks();renderLimits();save();});
document.getElementById('none-tweaks').addEventListener('click',()=>{for(const id of Object.keys(config.enabled))config.enabled[id]=id.startsWith('MAIN_');config.wave='none';renderTweaks();save();});
document.getElementById('reset-multipliers').addEventListener('click',()=>{config.values=defaults().values;renderSliders();save();});
document.getElementById('copy-hp').addEventListener('click',e=>{const slot=Object.entries(LUA_SOURCES).find(([,s])=>s.slot==='tweakdefs1');copy('!bset tweakdefs1 0\n'+slotCommand('tweakdefs1',sourceFor(slot[0])),e.currentTarget);});
document.getElementById('copy-multipliers').addEventListener('click',e=>copy(gameCommands().filter(c=>SLIDERS.some(([name])=>new RegExp('^!(?:bset\\s+)?'+name+'\\s','i').test(c))).join('\n'),e.currentTarget));
document.getElementById('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([outputs.join('\n')],{type:'text/plain;charset=utf-8'})),a=el('a');a.href=url;a.download='nuttyb-custom.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
document.getElementById('commands-tab').addEventListener('click',()=>{document.getElementById('configuration').hidden=true;document.getElementById('configuration-tab').classList.remove('active');document.getElementById('commands-tab').classList.add('active');document.getElementById('configuration-tab').setAttribute('aria-pressed','false');document.getElementById('commands-tab').setAttribute('aria-pressed','true');});
document.getElementById('configuration-tab').addEventListener('click',()=>{document.getElementById('configuration').hidden=false;document.getElementById('commands-tab').classList.remove('active');document.getElementById('configuration-tab').classList.add('active');document.getElementById('configuration-tab').setAttribute('aria-pressed','true');document.getElementById('commands-tab').setAttribute('aria-pressed','false');});
renderOutputs();renderAll();

