'use strict';
const customRoot=document.getElementById('custom');
const customFormat=document.getElementById('custom-format');
const customTarget=document.getElementById('custom-target');
const customText=document.getElementById('custom-code');
const customMessage=document.getElementById('custom-status');
const customDraft=()=>{config.customDraft={format:customFormat.value,target:customTarget.value,text:customText.value};try{localStorage.setItem('nutty-pink-v2',JSON.stringify(config));}catch{}};
function showCustomDraft(){const draft=config.customDraft||{};customFormat.value=draft.format||'lua';customTarget.value=draft.target||'tweakdefs8';customText.value=draft.text||'';customTarget.disabled=customFormat.value==='tweak';document.getElementById('custom-target-row').hidden=customFormat.value==='tweak';customMessage.textContent=(config.customTweaks||[]).length?'Custom code is included in your six copy parts.':'Paste your code, then select Apply code.';}
for(const input of [customFormat,customTarget,customText])input.addEventListener('input',()=>{customDraft();document.getElementById('custom-target-row').hidden=customFormat.value==='tweak';customTarget.disabled=customFormat.value==='tweak';customMessage.textContent='Draft changed. Select Apply code to update your copy parts.';});
function parseCustomCode(format,target,text){
 if(!text.trim())throw Error('Paste some code first.');
 if(format==='lua')return [{slot:target,source:text.trim()}];
 const bySlot=new Map();
 for(const line of text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)){
  const match=line.match(/^!?bset\s+(tweak(?:defs|units)(?:[0-9])?)\s+([A-Za-z0-9+/_=-]+)$/i);
  if(!match)throw Error('Use complete !bset tweakdefs or !bset tweakunits commands, with slots 0–9.');
  const slot=match[1].toLowerCase(),payload=match[2];
  if(payload==='0')continue;
  let source;try{source=decodeLua(payload);}catch{throw Error('A tweak code could not be decoded. Paste the complete command.');}
  if(!source.trim()||source.includes('\uFFFD'))throw Error('A tweak code contains invalid text. Paste the complete command.');
  if(bySlot.has(slot))throw Error('Use one encoded command per slot.');
  bySlot.set(slot,{slot,source});
 }
 if(!bySlot.size)throw Error('Paste an encoded tweak command, not just a reset command.');
 return [...bySlot.values()];
}
document.getElementById('apply-custom').addEventListener('click',()=>{
 try{const tweaks=parseCustomCode(customFormat.value,customTarget.value,customText.value);config.customTweaks=tweaks;customDraft();save();customMessage.textContent='Applied. Custom code is included in your six copy parts. Lua syntax and game compatibility need an in-game check.';}
 catch(error){customMessage.textContent=error.message;}
});
document.getElementById('clear-custom').addEventListener('click',()=>{delete config.customTweaks;delete config.customDraft;showCustomDraft();save();customMessage.textContent='Custom code removed from your copy parts.';});
function customTabState(active){customRoot.hidden=active!=='custom';for(const id of ['configuration-tab','commands-tab','custom-tab']){const on=id===active+'-tab';document.getElementById(id).classList[on?'add':'remove']('active');document.getElementById(id).setAttribute('aria-pressed',String(on));}}
document.getElementById('custom-tab').addEventListener('click',()=>{document.getElementById('configuration').hidden=true;document.getElementById('outputs').hidden=true;customTabState('custom');});
for(const tab of ['configuration','commands'])document.getElementById(tab+'-tab').addEventListener('click',()=>{document.getElementById('outputs').hidden=false;customTabState(tab);});
document.getElementById('reset').addEventListener('click',showCustomDraft);
showCustomDraft();
