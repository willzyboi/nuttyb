'use strict';
(()=>{
 const key='blackouts-named-presets-v1';let presets={};
 try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&typeof saved==='object'&&!Array.isArray(saved))presets=saved;}catch{}
 const panel=el('section','panel');panel.id='saved-presets';
 panel.append(el('h2','','Your presets'),el('p','hint','Save your sliders, tick boxes, limits and applied custom code. Presets stay in this browser.'));
 const controls=el('div','toolbar');controls.style.flexWrap='wrap';
 const name=el('input');name.type='text';name.placeholder='Preset name';name.maxLength=80;name.setAttribute('aria-label','Preset name');
 const saveButton=el('button','primary','Save preset'),choose=el('select');choose.setAttribute('aria-label','Saved presets');choose.style.width='auto';choose.style.maxWidth='100%';
 const load=el('button','','Load preset'),remove=el('button','','Delete preset'),status=el('p','hint');status.setAttribute('role','status');
 controls.append(name,saveButton,choose,load,remove);panel.append(controls,status);
 document.querySelector('.topnav').after(panel);
 function refresh(selected){choose.replaceChildren();const blank=el('option','','Choose a preset');blank.value='';choose.append(blank);Object.keys(presets).sort().forEach(title=>{const option=el('option','',title);option.value=title;choose.append(option);});choose.value=selected||'';load.disabled=remove.disabled=!choose.value;}
 function persist(){try{localStorage.setItem(key,JSON.stringify(presets));return true;}catch{status.textContent='Could not save: browser storage is unavailable or full.';return false;}}
 saveButton.addEventListener('click',()=>{const title=name.value.trim();if(!title){status.textContent='Enter a name for your preset.';name.focus();return;}const previous=presets;presets={...presets,[title]:JSON.parse(JSON.stringify(config))};if(!persist()){presets=previous;return;}refresh(title);status.textContent='Saved “'+title+'”. Saving the same name updates that preset.';});
 choose.addEventListener('change',()=>{load.disabled=remove.disabled=!choose.value;if(choose.value)name.value=choose.value;});
 load.addEventListener('click',()=>{const title=choose.value;if(!Object.hasOwn(presets,title))return;const selected=JSON.parse(JSON.stringify(presets[title])),base=defaults();config={...base,...selected,values:{...base.values,...selected.values},enabled:{...base.enabled,...selected.enabled}};for(const [id,,min,max]of SLIDERS)config.values[id]=Math.max(min,Math.min(max,Number(config.values[id])||min));config.enabled.MAIN_DEFS=config.enabled.MAIN_UNITS=true;renderAll();if(typeof showCustomDraft==='function')showCustomDraft();status.textContent='Loaded “'+title+'”. Your copy commands are updated.';});
 remove.addEventListener('click',()=>{const title=choose.value;if(!Object.hasOwn(presets,title))return;const previous=presets;presets={...presets};delete presets[title];if(!persist()){presets=previous;return;}refresh();status.textContent='Deleted “'+title+'”.';});
 refresh();
})();
