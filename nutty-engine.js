function decodeLua(s) { return new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0))); }
function encodeLua(s) { let b=''; for(const n of new TextEncoder().encode(s)) b+=String.fromCharCode(n); return btoa(b).replace(/=+$/,''); }
function numericFields(source) {
  // Tokenize before locating assignments: quoted text, comments and array indexes stay untouched.
  const re=/--\[(=*)\[[\s\S]*?\]\1\]|--[^\n]*|\[(=*)\[[\s\S]*?\]\2\]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_][\w]*|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|\S/g;
  const tokens=[]; let m; while((m=re.exec(source))) { if(m[0].startsWith('--')) continue; tokens.push({v:m[0],start:m.index,end:re.lastIndex}); }
  const fields=[]; let section='General', context='';
  const markers=[...source.matchAll(/--\s*([A-Z][A-Z_0-9]+)_START/g)];
  for(let i=0;i<tokens.length-2;i++) {
    const t=tokens[i];
    if(!/^[A-Za-z_][\w]*$/.test(t.v)||tokens[i+1].v!=='=') continue;
    if(tokens[i+2].v==='{') { if(!['weapondefs','weapons','damage','customparams','featuredefs','sounds','sfxtypes','buildoptions'].includes(t.v)) context=t.v; continue; }
    if(t.v.length===1 || tokens[i-1]?.v==='local') continue;
    let n=i+2, sign='';if(tokens[n].v==='-'){sign='-';n++;}
    const value=sign+tokens[n]?.v;if(!/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value))continue;
    if(['+','-','*','/','^','%','..'].includes(tokens[n+1]?.v))continue;
    section=markers.filter(x=>x.index<t.start).at(-1)?.[1]?.replaceAll('_',' ')||'General';
    fields.push({name:t.v,context,section,value:Number(value),start:tokens[i+2].start,end:tokens[n].end});
  }
  return fields;
}
function replaceFields(source, fields, values) { let result=source;for(let i=fields.length-1;i>=0;i--){const f=fields[i];const v=values[i];if(v!==undefined&&Number.isFinite(Number(v)))result=result.slice(0,f.start)+Number(v)+result.slice(f.end);}return result; }
function hpSource(source, raptor, queen) {
  return source.replace(/(-- HP_2X_START[\s\S]*?unitDef\.health=unitDef\.health\*)[\d.]+/,(_,p)=>p+raptor).replace(/(-- QHP_2X_START[\s\S]*?c\.health=c\.health\*)[\d.]+/,(_,p)=>p+queen);
}
