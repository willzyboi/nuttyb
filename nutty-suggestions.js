(()=>{'use strict';
 const root=document.getElementById('suggestions');
 const tab=document.getElementById('suggestions-tab');
 if(!root||!tab)return;
 const others=['configuration','custom','widgets','library','planner','tools'];
 tab.addEventListener('click',()=>{
  for(const id of others){document.getElementById(id).hidden=true;const b=document.getElementById(id+'-tab');b.classList.remove('active');b.setAttribute('aria-pressed','false');}
  document.getElementById('outputs').hidden=true;
  root.hidden=false;tab.classList.add('active');tab.setAttribute('aria-pressed','true');
 });
 for(const id of others)document.getElementById(id+'-tab').addEventListener('click',()=>{root.hidden=true;tab.classList.remove('active');tab.setAttribute('aria-pressed','false');});
 for(const id of ['planner-own','planner-community'])document.getElementById(id)?.addEventListener('click',()=>{root.hidden=true;tab.classList.remove('active');tab.setAttribute('aria-pressed','false');});
 const patchButton=document.querySelector('.patch-notes-button');
 if(patchButton){
  const actions=document.createElement('span');
  actions.style.cssText='display:inline-flex;gap:8px;flex-wrap:wrap;align-items:center';
  const shortcut=document.createElement('button');
  shortcut.id='header-suggestions';shortcut.type='button';shortcut.className='patch-notes-button';shortcut.textContent='Suggestions';
  shortcut.addEventListener('click',()=>{tab.click();root.scrollIntoView({behavior:'smooth',block:'start'});});
  patchButton.replaceWith(actions);actions.append(patchButton,shortcut);
 }
 const form=document.getElementById('suggestion-form'),link=document.getElementById('suggestion-submit'),status=document.getElementById('suggestion-status');
 form.addEventListener('input',()=>{link.hidden=true;status.textContent='Prepare your suggestion when you are ready.';});
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const title=document.getElementById('suggestion-title').value.trim(),details=document.getElementById('suggestion-details').value.trim(),category=document.getElementById('suggestion-category').value;
  if(!title||!details){status.textContent='Add a title and explain your suggestion.';return;}
  const body='## Config suggestion\n\nCategory: '+category+'\n\n'+details+'\n\nSubmitted from NuttyB config website.';
  link.href='https://github.com/willzyboi/nuttyb/issues/new?title='+encodeURIComponent('Suggestion: '+title)+'&body='+encodeURIComponent(body);
  link.hidden=false;status.textContent='Ready. Open GitHub, review your suggestion, then select Submit new issue. It has not been submitted yet.';
 });
})();
