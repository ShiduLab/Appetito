const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fridge=$('#fridge'), pantry=$('#pantry'), urgent=$('#urgent'), results=$('#results'), chips=$('#chips');
let currentMode='ricette', deferredPrompt=null;

function tools(){ return $$('input[name=tool]:checked').map(x=>x.value); }
function basics(){ const out=[]; if($('#basicWater').checked)out.push('acqua'); if($('#basicSalt').checked)out.push('sale'); if($('#basicOil').checked)out.push('olio'); return out; }
function inventory(){ return [...new Set([...AppetitoEngine.parseList(fridge.value),...AppetitoEngine.parseList(pantry.value),...basics()])]; }
function urgentList(){ return AppetitoEngine.parseList(urgent.value); }
function renderChips(items){ chips.innerHTML=items.length?items.map(x=>`<span class="chip">${escapeHTML(x)}</span>`).join(''):''; }
function escapeHTML(s){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function ingredientNames(recipe){ return recipe.ingredients.map(g=>g.join(' / ')); }
function recipeText(r){ return `${r.title}\n\nIngredienti chiave: ${ingredientNames(r).join(', ')}\n\n${r.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}`; }
async function shareRecipe(r){ const text=recipeText(r); if(navigator.share){ try{await navigator.share({title:`Appetito — ${r.title}`,text});return;}catch(e){} } await navigator.clipboard.writeText(text); alert('Ricetta copiata.'); }
function card(row){
  const r=row.recipe;
  const missing=row.missing.length?`<p class="missing">Ti manca: <strong>${row.missing.map(escapeHTML).join(', ')}</strong></p>`:`<p class="used">Hai tutto il necessario.</p>`;
  const optional=row.optionalPresent.length?`<p class="ingredientsLine">Extra che puoi usare: ${row.optionalPresent.map(escapeHTML).join(', ')}</p>`:'';
  return `<article class="recipe"><div class="recipeHead"><div><h3>${escapeHTML(r.title)}</h3><div class="badges"><span class="badge ${row.missing.length?'warn':'good'}">${row.missing.length?row.missing.length+' mancant'+(row.missing.length===1?'e':'i'):'fattibile'}</span><span class="badge">${r.time} min</span><span class="badge">${escapeHTML(r.difficulty)}</span></div></div><button class="share" data-share="${escapeHTML(r.id)}">Condividi</button></div>${missing}${optional}<p class="ingredientsLine">Base: ${ingredientNames(r).map(escapeHTML).join(' · ')}</p><details><summary>Come si fa</summary><ol>${r.steps.map(s=>`<li>${escapeHTML(s)}</li>`).join('')}</ol></details></article>`;
}
function experimentCard(e){
  return `<article class="recipe experiment"><div class="recipeHead"><div><h3>${escapeHTML(e.title)}</h3><div class="badges"><span class="badge exp">ESPERIMENTO</span></div></div></div><p class="ingredientsLine">Usa: ${e.uses.map(escapeHTML).join(' · ')}</p><p>${escapeHTML(e.note)}</p><details open><summary>Prova così</summary><ol>${e.steps.map(s=>`<li>${escapeHTML(s)}</li>`).join('')}</ol></details></article>`;
}
function run(){
  const have=inventory(); const urg=urgentList(); renderChips(have.filter(x=>!['acqua','sale','olio'].includes(x)));
  if(have.length<=basics().length){ results.innerHTML='<div class="empty">Dimmi almeno cosa c’è nel frigo o nella dispensa. Io da acqua, sale e olio posso fare filosofia, non pranzo.</div>';return; }
  const rows=AppetitoEngine.findRecipes(APPETITO_RECIPES,have,tools(),currentMode,urg);
  const exact=rows.filter(x=>x.missing.length===0), close=rows.filter(x=>x.missing.length>0);
  let html='';
  if(currentMode==='ingegno'){
    const ex=AppetitoEngine.experiments(have,tools());
    html+=`<h2 class="sectionTitle">Ingegno: fame, logica e quel che passa il convento</h2>${ex.length?ex.map(experimentCard).join(''):'<div class="empty">Con questi ingredienti non ho ancora trovato un esperimento decente. Aggiungi ciò che hai davvero, anche spezie e pane.</div>'}`;
    if(exact.length) html+=`<h2 class="sectionTitle">Ricette vere già possibili</h2>${exact.slice(0,6).map(card).join('')}`;
  } else {
    if(exact.length) html+=`<h2 class="sectionTitle">Hai tutto</h2>${exact.slice(0,currentMode==='ora'?8:12).map(card).join('')}`;
    if(close.length && currentMode!=='ora') html+=`<h2 class="sectionTitle">Ti manca poco</h2>${close.slice(0,8).map(card).join('')}`;
    if(!html) html='<div class="empty">Nessuna ricetta del piccolo ricettario locale combacia ancora. Prova <strong>Ingegno</strong>: lì non aspettiamo il ricettario, ci arrangiamo.</div>';
  }
  results.innerHTML=html;
  $$('[data-share]').forEach(btn=>btn.addEventListener('click',()=>{ const r=APPETITO_RECIPES.find(x=>x.id===btn.dataset.share); if(r)shareRecipe(r); }));
  save();
}
function save(){ localStorage.setItem('appetito-state',JSON.stringify({fridge:fridge.value,pantry:pantry.value,urgent:urgent.value,tools:tools(),mode:currentMode,basics:[$('#basicWater').checked,$('#basicSalt').checked,$('#basicOil').checked]})); }
function load(){ try{const s=JSON.parse(localStorage.getItem('appetito-state')||'null'); if(!s)return; fridge.value=s.fridge||'';pantry.value=s.pantry||'';urgent.value=s.urgent||''; if(s.tools){$$('input[name=tool]').forEach(x=>x.checked=s.tools.includes(x.value));} if(s.basics){[$('#basicWater'),$('#basicSalt'),$('#basicOil')].forEach((x,i)=>x.checked=!!s.basics[i]);} if(s.mode){currentMode=s.mode; $$('.mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===currentMode));} renderChips(inventory().filter(x=>!['acqua','sale','olio'].includes(x))); }catch(e){} }

$('#cookBtn').addEventListener('click',run);
$('#exampleBtn').addEventListener('click',()=>{fridge.value='uova, pomodori, mozzarella, mezza cipolla, zucchine';pantry.value='pasta, ceci, pane raffermo, origano, paprika, parmigiano';urgent.value='zucchine, pane';run();});
$('#clearBtn').addEventListener('click',()=>{if(!confirm('Svuoto frigo e dispensa di Appetito?'))return;fridge.value=pantry.value=urgent.value='';chips.innerHTML='';results.innerHTML='<div class="empty">Pulito. Adesso dimmi che c’è.</div>';localStorage.removeItem('appetito-state');});
$$('.mode').forEach(b=>b.addEventListener('click',()=>{currentMode=b.dataset.mode;$$('.mode').forEach(x=>x.classList.toggle('active',x===b));run();}));
[fridge,pantry,urgent,...$$('input[type=checkbox]')].forEach(el=>el.addEventListener('change',save));

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden');});
$('#installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').classList.add('hidden');});
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
load();
