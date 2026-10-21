(()=>{'use strict';
const configArea=document.getElementById('configuration');if(!configArea)return;
document.body.classList.add('game-polished');
const sections=Array.from(configArea.children).filter(e=>e.tagName==='SECTION');
const battle=sections.find(e=>e.querySelector('#game-settings'));
const arsenal=sections.find(e=>e.querySelector('#tweak-options'));
const tuning=sections.find(e=>e.querySelector('#resource-sliders'));
const community=document.getElementById('community-settings');
if(!battle||!arsenal||!tuning)return;
const hero=document.createElement('div');hero.className='game-intro';hero.innerHTML='<span class="pro-eyebrow">YOUR NEXT BATTLE</span><h2>Make it your game.</h2><p>Set the battlefield, choose your arsenal, then fine-tune the challenge.</p>';
const nav=document.createElement('nav');nav.className='game-step-nav';nav.setAttribute('aria-label','Battle setup sections');
const panels=[[battle,community],[arsenal],[tuning]];const names=['Battlefield','Arsenal','Fine-tuning'];const hints=['Map, mode & rules','Units, waves & limits','Economy & difficulty'];let current=0;
const summary=document.createElement('div');summary.className='battle-summary';summary.setAttribute('aria-live','polite');
function show(i){current=i;panels.forEach((group,n)=>group.forEach(e=>{if(e)e.classList.toggle('pro-step-hidden',n!==i);}));Array.from(nav.children).forEach((b,n)=>{b.setAttribute('aria-current',n===i?'step':'false');});}
for(let i=0;i<3;i++){const b=document.createElement('button');b.type='button';b.innerHTML='<span class="step-number">'+(i+1)+'</span><span><strong>'+names[i]+'</strong><small>'+hints[i]+'</small></span>';b.addEventListener('click',()=>show(i));nav.append(b);}
configArea.prepend(hero,nav,summary);
const route=document.createElement('div');route.className='game-step-footer';const previous=document.createElement('button');previous.textContent='← Previous';const next=document.createElement('button');next.className='primary';next.textContent='Next: Arsenal →';const review=document.createElement('button');review.textContent='Review & copy setup';
function move(i){show(i);previous.disabled=i===0;next.disabled=i===2;next.textContent=i===0?'Next: Arsenal →':i===1?'Next: Fine-tuning →':'All sections reviewed';}
previous.addEventListener('click',()=>move(Math.max(0,current-1)));next.addEventListener('click',()=>move(Math.min(2,current+1)));review.addEventListener('click',()=>document.getElementById('outputs').scrollIntoView({behavior:'smooth',block:'start'}));route.append(previous,next,review);configArea.append(route);
nav.addEventListener('click',()=>move(current));
function update(){const value=id=>{const e=document.getElementById(id);return e?.selectedOptions?.[0]?.textContent||e?.value||'';};const parts=[value('setting-Mode'),value('setting-Map'),value('setting-Start')].filter(Boolean);summary.replaceChildren();const label=document.createElement('span');label.className='summary-label';label.textContent='CURRENT SETUP';summary.append(label);for(const part of parts){const chip=document.createElement('span');chip.className='summary-chip';chip.textContent=part;summary.append(chip);}}
configArea.addEventListener('change',update);configArea.addEventListener('input',update);
const presets=document.getElementById('saved-presets');if(presets){const heading=presets.querySelector('h2');const details=document.createElement('details');details.className='presets-drawer';const title=document.createElement('summary');title.textContent='Your saved presets';details.append(title);for(const child of Array.from(presets.children))if(child!==heading)details.append(child);presets.replaceChildren(details);}
if(community?.querySelector('h2'))community.querySelector('h2').textContent='Rules & performance';
battle.querySelector('h2').textContent='Set the battlefield';arsenal.querySelector('h2').textContent='Choose your arsenal';tuning.querySelector('h2').textContent='Fine-tune your battle';
const intro=document.querySelector('header .intro');if(intro)intro.textContent='Your NuttyB command centre. Build a battle in three simple steps.';
move(0);update();
})();
