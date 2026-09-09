(function(global){
  const aliases = [
    [/\b(olio evo|olio extravergine(?: d['’]oliva)?|olio d['’]oliva)\b/g,'olio'],
    [/\b(pomodori|pomodorini|passata(?: di pomodoro)?|pelati|salsa di pomodoro)\b/g,'pomodoro'],
    [/\b(uova)\b/g,'uovo'],[/\b(patate)\b/g,'patata'],[/\b(cipolle)\b/g,'cipolla'],
    [/\b(zucchine)\b/g,'zucchina'],[/\b(carote)\b/g,'carota'],[/\b(peperoni)\b/g,'peperone'],
    [/\b(ceci lessati|ceci in scatola)\b/g,'ceci'],[/\b(lenticchie lessate|lenticchie in scatola)\b/g,'lenticchie'],
    [/\b(fagioli lessati|fagioli in scatola)\b/g,'fagioli'],[/\b(tonno in scatola)\b/g,'tonno'],
    [/\b(parmigiano reggiano|grana padano|grana)\b/g,'parmigiano'],
    [/\b(pecorino romano)\b/g,'pecorino'],[/\b(mozzarelle)\b/g,'mozzarella'],
    [/\b(pane raffermo|pane in cassetta|fette di pane)\b/g,'pane'],
    [/\b(fi[oó]cchi d['’]avena)\b/g,'avena'],[/\b(farina di ceci)\b/g,'farina-ceci'],
    [/\b(salsa di soia|soia)\b/g,'salsa-soia'],[/\b(lievito per dolci|lievito istantaneo)\b/g,'lievito'],
    [/\b(prezzemolo fresco)\b/g,'prezzemolo'],[/\b(basilico fresco)\b/g,'basilico']
  ];

  function cleanText(s){
    return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'");
  }
  function canonical(raw){
    let s=cleanText(raw).replace(/^\s*[!★*]+\s*/,'').replace(/\b\d+[\d.,]*\s*(g|gr|kg|ml|cl|l|pz|pezzi?|fette?|scatole?|barattoli?)\b/g,'').trim();
    aliases.forEach(([re,rep])=>{ s=s.replace(re,rep); });
    s=s.replace(/\b(fresco|fresca|surgelato|surgelata|congelato|congelata|cotto|cotta)\b/g,'').replace(/\s+/g,' ').trim();
    return s;
  }
  function parseList(text){
    const raw=(text||'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean);
    const out=[];
    for(const r of raw){
      let c=canonical(r);
      if(!c) continue;
      // Handle generic vegetables/legumes without destroying specific names.
      if(/^(verdure|verdura mista|ortaggi)$/.test(c)) c='verdura';
      if(/^(legumi|legume misto)$/.test(c)) c='legume';
      if(!out.includes(c)) out.push(c);
    }
    return out;
  }
  function hasIngredient(set, group){
    for(const item of group){
      if(item==='verdura'){
        if(['zucchina','peperone','carota','melanzana','broccoli','cavolfiore','bietola','spinaci','cavolo','pomodoro','piselli','verdura'].some(x=>set.has(x))) return true;
      } else if(item==='legume'){
        if(['ceci','lenticchie','fagioli','piselli','legume'].some(x=>set.has(x))) return true;
      } else if(set.has(item)) return true;
    }
    return false;
  }
  function groupLabel(group){ return group.join(' / '); }
  function toolOK(recipe, tools){
    if(!recipe.tools || recipe.tools.length===0) return true;
    const chosen=new Set(tools||[]);
    const primary=recipe.tools.every(t=>chosen.has(t));
    if(primary) return true;
    if(recipe.altTools && recipe.altTools.some(t=>chosen.has(t))) {
      const other=recipe.tools.filter(t=>!['tostapane','forno','padella'].includes(t));
      return other.every(t=>chosen.has(t));
    }
    return false;
  }
  function analyzeRecipe(recipe, have, tools){
    const set=new Set(have);
    const missing=[];
    recipe.ingredients.forEach(group=>{ if(!hasIngredient(set,group)) missing.push(groupLabel(group)); });
    const optionalPresent=(recipe.optional||[]).filter(g=>hasIngredient(set,g)).map(groupLabel);
    return {recipe,missing,optionalPresent,toolOK:toolOK(recipe,tools),score:(recipe.ingredients.length-missing.length)/recipe.ingredients.length};
  }
  function findRecipes(recipes, have, tools, mode='ricette', urgent=[]){
    let rows=recipes.map(r=>analyzeRecipe(r,have,tools)).filter(x=>x.toolOK);
    rows.forEach(x=>{
      x.urgentHits=urgent.filter(u=>x.recipe.ingredients.concat(x.recipe.optional||[]).some(g=>hasIngredient(new Set([u]),g))).length;
    });
    rows=rows.filter(x=>x.missing.length<=2);
    rows.sort((a,b)=>{
      if(mode==='ora') return a.missing.length-b.missing.length || a.recipe.time-b.recipe.time || b.score-a.score;
      if(mode==='salva') return b.urgentHits-a.urgentHits || a.missing.length-b.missing.length || a.recipe.time-b.recipe.time;
      return a.missing.length-b.missing.length || b.score-a.score || a.recipe.time-b.recipe.time;
    });
    return rows;
  }

  function experiments(have, tools){
    const s=new Set(have); const out=[]; const has=(x)=>s.has(x); const veg=['zucchina','peperone','carota','melanzana','broccoli','spinaci','pomodoro','piselli','cipolla'].filter(has);
    const proteins=['uovo','tonno','ceci','lenticchie','fagioli','prosciutto','formaggio'].filter(has);
    const herbs=['origano','basilico','prezzemolo','rosmarino','paprika','peperoncino','curry'].filter(has);
    const toolsSet=new Set(tools||[]);
    if(has('uovo') && toolsSet.has('padella')){
      const extras=[...veg,...proteins.filter(x=>x!=='uovo')].slice(0,3);
      out.push({title:'Frittata di quel che c’è',base:'uovo',uses:['uovo',...extras],steps:['Taglia piccoli gli ingredienti che richiedono cottura e falli ammorbidire in padella.','Sbatti le uova con un pizzico di sale.','Versa tutto in padella e cuoci lentamente finché è ben rappreso.'],note:'Esperimento guidato: struttura classica della frittata, ripieno costruito con ciò che hai.'});
    }
    if(has('pasta') && toolsSet.has('pentola')){
      const extras=[...veg,...proteins].slice(0,3);
      if(extras.length) out.push({title:'Pasta svuotafrigo',base:'pasta',uses:['pasta',...extras,...herbs.slice(0,1)],steps:['Cuoci la pasta.','In padella o pentola scalda gli ingredienti disponibili partendo da quelli che richiedono più cottura.','Aggiungi la pasta scolata e mescola con poca acqua di cottura.','Assaggia prima di aggiungere altro sale.'],note:'Esperimento: usa una base neutra e costruisce il condimento con quello che c’è.'});
    }
    if((has('riso')||has('couscous')) && (toolsSet.has('pentola')||toolsSet.has('padella'))){
      const base=has('riso')?'riso':'couscous'; const extras=[...veg,...proteins].slice(0,4);
      if(extras.length) out.push({title:'Ciotola svuotafrigo',base,uses:[base,...extras],steps:[`Prepara ${base} come indicato sulla confezione.`,'Cuoci o scalda separatamente gli ingredienti che non possono essere mangiati crudi.','Unisci tutto e condisci con poco olio, spezie o limone se disponibili.'],note:'Esperimento modulare: cereale + verdura + eventuale proteina.'});
    }
    if(has('pane')){
      const extras=[...veg,...proteins].slice(0,3);
      if(extras.length) out.push({title:'Pane caricato',base:'pane',uses:['pane',...extras],steps:['Tosta o scalda il pane se puoi.','Cuoci prima gli ingredienti che lo richiedono.','Monta sopra o dentro il pane gli ingredienti disponibili e servi subito.'],note:'Esperimento: bruschetta, toast o panino a seconda di quello che hai.'});
    }
    if(toolsSet.has('padella') && (veg.length||proteins.length)){
      const extras=[...veg,...proteins].slice(0,5);
      out.push({title:'Padellata d’emergenza',base:'padella',uses:extras,steps:['Taglia gli ingredienti a pezzi piccoli.','Metti prima in padella quelli più duri o che devono cuocere bene, poi quelli delicati o già cotti.','Cuoci a fuoco medio mescolando e aggiungi poca acqua se si asciuga troppo.','Finisci con le spezie disponibili.'],note:'Esperimento guidato: una sola padella, ordine di cottura dal più duro al più delicato.'});
    }
    return out.slice(0,5);
  }

  global.AppetitoEngine={canonical,parseList,findRecipes,experiments,analyzeRecipe};
  if(typeof module!=='undefined') module.exports=global.AppetitoEngine;
})(typeof window!=='undefined'?window:globalThis);
