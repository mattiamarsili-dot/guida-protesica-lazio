const DB=window.PROTESICA_DB;
if(!DB) throw new Error("Database non caricato.");

const TERRITORIES=DB.territories, OFFICES=DB.offices, REL=DB.district_offices, DISTRICTS=DB.districts;
let currentMode="home";

const $=id=>document.getElementById(id);
const norm=s=>(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function districtFor(t){return DISTRICTS.find(d=>d.ASL===t.ASL&&d.Distretto_ID===t.Distretto_ID)}
function officesFor(t){
  const ids=REL.filter(x=>x.ASL===t.ASL&&x.Distretto_ID===t.Distretto_ID).map(x=>x.Office_ID);
  return OFFICES.filter(o=>ids.includes(o.Office_ID));
}
function mainPhone(raw){if(!raw)return"";return raw.split("/")[0].trim().replace(/[^\d+]/g,"")}
function validAddress(a){return a&&!norm(a).includes("non specificato")}
function mapUrl(a){return"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(a.replace(/\*/g,"").trim())}
function uniqueSources(os){return uniq(os.map(o=>o.Fonte_link).filter(Boolean))}

function hideModes(){["mode-roma","mode-comune","mode-cap","mode-asl","result"].forEach(id=>$(id).classList.add("hidden"))}
function setHeaderMode(isResult){$("hero").classList.toggle("hidden",isResult);$("mini-header").classList.toggle("hidden",!isResult)}
function openMode(mode){
  currentMode=mode;setHeaderMode(false);$("home").classList.add("hidden");hideModes();$("mode-"+mode).classList.remove("hidden");
  if(mode==="roma")renderRome();if(mode==="asl")renderAslButtons();window.scrollTo({top:0,behavior:"smooth"});
}
function goHome(){currentMode="home";setHeaderMode(false);hideModes();$("home").classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"})}
function backToCurrentMode(){setHeaderMode(false);$("result").classList.add("hidden");$("mode-"+currentMode).classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"})}

function renderRome(){
  const rome=TERRITORIES.filter(t=>t.Tipo_territorio==="Municipio");
  const asls=["ASL Roma 1","ASL Roma 2","ASL Roma 3"];
  $("rome-groups").innerHTML=asls.map(asl=>{
    const rows=rome.filter(t=>t.ASL===asl).sort((a,b)=>a.Comune_o_Municipio.localeCompare(b.Comune_o_Municipio,"it",{numeric:true}));
    return `<div class="asl-group"><div class="asl-head"><div class="asl-name">${esc(asl)}</div><span class="small">${rows.length} Municipi</span></div>
      <div class="municipio-grid">${rows.map(t=>`<button class="municipio" onclick="selectByKey('${esc(t.ASL)}','${esc(t.Distretto_ID)}','${esc(t.Comune_o_Municipio)}')"><strong>${esc(t.Comune_o_Municipio)}</strong><small>${esc(districtFor(t)?.Distretto||t.Distretto_ID)}</small></button>`).join("")}</div></div>`;
  }).join("");
}

const COMUNI=TERRITORIES.filter(t=>t.Tipo_territorio==="Comune").sort((a,b)=>a.Comune_o_Municipio.localeCompare(b.Comune_o_Municipio,"it"));
function closeComuneSuggestions(){const b=$("comune-suggestions"),i=$("comune-search");b.classList.remove("show");b.innerHTML="";i.setAttribute("aria-expanded","false")}
function renderComuneSuggestions(){
  const input=$("comune-search"),q=norm(input.value),box=$("comune-suggestions"),msg=$("comune-msg");
  if(q.length<2){closeComuneSuggestions();msg.textContent="Digita almeno 2 lettere oppure il nome completo del Comune.";return}
  const matches=COMUNI.filter(t=>norm(t.Comune_o_Municipio).includes(q)).slice(0,8);
  if(!matches.length){closeComuneSuggestions();msg.textContent="Nessun Comune trovato. Controlla il nome e riprova.";return}
  box.innerHTML=matches.map(t=>{
    const d=districtFor(t),payload=encodeURIComponent(JSON.stringify([t.ASL,t.Distretto_ID,t.Comune_o_Municipio]));
    return `<button type="button" class="suggestion-item" data-key="${payload}" onclick="chooseComuneSuggestion(this)">${esc(t.Comune_o_Municipio)}<small>${esc(t.ASL)} · ${esc(d?.Distretto||t.Distretto_ID)}</small></button>`;
  }).join("");
  box.classList.add("show");input.setAttribute("aria-expanded","true");msg.textContent=matches.length===1?"1 risultato trovato.":"Seleziona il Comune corretto dall'elenco.";
}
function chooseComuneSuggestion(el){
  const [asl,did,name]=JSON.parse(decodeURIComponent(el.dataset.key));$("comune-search").value=name;closeComuneSuggestions();$("comune-search").blur();setTimeout(()=>selectByKey(asl,did,name),50);
}
function ensureComuneInputVisible(){const s=$("comune-search-shell");if(s)setTimeout(()=>s.scrollIntoView({block:"start",behavior:"smooth"}),180)}
function findComune(){
  const input=$("comune-search"),q=norm(input.value);if(!q){$("comune-msg").textContent="Scrivi il nome del Comune.";ensureComuneInputVisible();return}
  let t=COMUNI.find(x=>norm(x.Comune_o_Municipio)===q);
  if(!t){const m=COMUNI.filter(x=>norm(x.Comune_o_Municipio).includes(q));if(m.length===1)t=m[0];else{renderComuneSuggestions();$("comune-msg").textContent=m.length>1?"Seleziona il Comune corretto dall'elenco.":"Comune non trovato. Controlla il nome e riprova.";return}}
  closeComuneSuggestions();input.blur();$("comune-msg").textContent="";selectByKey(t.ASL,t.Distretto_ID,t.Comune_o_Municipio);
}


const ROMA_CAP_MUNICIPI={"00118":["Municipio VII"],"00119":["Municipio X"],"00121":["Municipio X"],"00122":["Municipio X"],"00123":["Municipio XV"],"00124":["Municipio X"],"00125":["Municipio X"],"00126":["Municipio X"],"00127":["Municipio IX","Municipio X"],"00128":["Municipio IX"],"00129":["Municipio IX"],"00131":["Municipio IV"],"00132":["Municipio VI"],"00133":["Municipio VI"],"00134":["Municipio IX"],"00135":["Municipio XIV","Municipio XV"],"00136":["Municipio XIV","Municipio I"],"00137":["Municipio III"],"00138":["Municipio III"],"00139":["Municipio III"],"00141":["Municipio III"],"00142":["Municipio VIII","Municipio IX"],"00143":["Municipio IX"],"00144":["Municipio IX"],"00145":["Municipio VIII"],"00146":["Municipio XI","Municipio VIII"],"00147":["Municipio VIII"],"00148":["Municipio XI"],"00149":["Municipio XI"],"00151":["Municipio XII","Municipio XI"],"00152":["Municipio XII"],"00153":["Municipio I","Municipio VIII"],"00154":["Municipio VIII"],"00155":["Municipio V","Municipio IV"],"00156":["Municipio IV"],"00157":["Municipio IV"],"00158":["Municipio IV"],"00159":["Municipio IV","Municipio V"],"00161":["Municipio II"],"00162":["Municipio II","Municipio IV"],"00163":["Municipio XII","Municipio XI"],"00164":["Municipio XII"],"00165":["Municipio I","Municipio XIII"],"00166":[],"00167":["Municipio XIII","Municipio XIV"],"00168":["Municipio XIV"],"00169":["Municipio VI","Municipio V"],"00171":["Municipio V"],"00172":["Municipio V"],"00173":["Municipio VII","Municipio VI"],"00174":["Municipio VII"],"00175":["Municipio VII","Municipio V"],"00176":["Municipio V"],"00177":["Municipio V"],"00178":["Municipio VII","Municipio IX"],"00179":["Municipio VII"],"00181":["Municipio VII"],"00182":["Municipio VII"],"00183":["Municipio VII","Municipio I"],"00184":["Municipio I"],"00185":["Municipio I"],"00186":["Municipio I"],"00187":["Municipio I","Municipio II"],"00188":["Municipio XV"],"00189":["Municipio XV"],"00191":["Municipio XV"],"00192":["Municipio I"],"00193":["Municipio I"],"00195":["Municipio I"],"00196":["Municipio II","Municipio I"],"00197":["Municipio II"],"00198":["Municipio II"],"00199":["Municipio II","Municipio III"]};
const ROMA_MUNICIPIO_LOOKUP="https://www.comune.roma.it/web/it/mappa-dei-municipi.page";
const CAP_SOURCE_PRIMARY="https://cdn.jsdelivr.net/gh/RP92/comuni-italiani/data/regioni/lazio.json";
const CAP_SOURCE_FALLBACK="https://cdn.jsdelivr.net/gh/RP92/comuni-italiani/data/comuni.json";
let capDataset=null;

function normalizeComuneName(name){
  return norm(name)
    .replace(/\bsanta\b/g,"santa")
    .replace(/\bsanto\b/g,"santo")
    .replace(/\bsan\b/g,"san")
    .replace(/\s+/g," ").trim();
}

async function loadCapDataset(){
  if(capDataset) return capDataset;
  $("cap-msg").textContent="Caricamento archivio CAP...";
  try{
    let res=await fetch(CAP_SOURCE_PRIMARY,{cache:"force-cache"});
    if(!res.ok) throw new Error("primary");
    let data=await res.json();
    if(!Array.isArray(data)) throw new Error("Formato CAP non valido");
    capDataset=data;
  }catch(e){
    try{
      let res=await fetch(CAP_SOURCE_FALLBACK,{cache:"force-cache"});
      if(!res.ok) throw new Error("fallback");
      let data=await res.json();
      capDataset=data.filter(x=>x.regione&&norm(x.regione.nome)==="lazio");
    }catch(e2){
      throw new Error("Archivio CAP non raggiungibile");
    }
  }
  return capDataset;
}

function territoryByComuneName(name){
  const n=normalizeComuneName(name);
  return TERRITORIES.filter(t=>t.Tipo_territorio==="Comune" && normalizeComuneName(t.Comune_o_Municipio)===n);
}

function renderRomeCapChoice(cap){
  const names=ROMA_CAP_MUNICIPI[cap];

  if(names===undefined){
    $("cap-msg").textContent=`Il CAP ${cap} appartiene a Roma, ma non è presente nella mappa CAP→Municipio verificata della guida.`;
    $("cap-results").innerHTML=`<div class="notice"><strong>Serve una verifica per indirizzo.</strong><br>Usa il servizio ufficiale di Roma Capitale per individuare il Municipio esatto.</div>
      <a class="btn green" style="margin-top:10px" href="${ROMA_MUNICIPIO_LOOKUP}" target="_blank" rel="noopener">Verifica Municipio su Roma Capitale</a>`;
    return;
  }

  if(names.length===0){
    $("cap-msg").textContent=`Il CAP ${cap} attraversa più di due Municipi: il solo CAP non consente una selezione affidabile.`;
    $("cap-results").innerHTML=`<div class="notice"><strong>Per questo CAP serve l'indirizzo.</strong><br>Per evitare di indicarti un ufficio sbagliato, verifica prima il Municipio sul servizio ufficiale di Roma Capitale.</div>
      <a class="btn green" style="margin-top:10px" href="${ROMA_MUNICIPIO_LOOKUP}" target="_blank" rel="noopener">Trova il Municipio dall'indirizzo</a>
      <button class="btn soft" style="margin-top:10px" onclick="openMode('roma')">Poi scegli il Municipio nella guida</button>`;
    return;
  }

  const options=names.map(name=>TERRITORIES.find(t=>t.Tipo_territorio==="Municipio" && t.Comune_o_Municipio===name)).filter(Boolean);

  $("cap-msg").textContent=options.length===1
    ? `CAP ${cap}: risulta ${options[0].Comune_o_Municipio}. Conferma per continuare.`
    : `CAP ${cap}: risultano due Municipi possibili. Seleziona quello corrispondente al tuo indirizzo.`;

  $("cap-results").innerHTML=`<div class="cap-grid">${options.map(t=>
    `<button class="cap-card" onclick="selectByKey('${esc(t.ASL)}','${esc(t.Distretto_ID)}','${esc(t.Comune_o_Municipio)}')">
      <strong>${esc(t.Comune_o_Municipio)}</strong>
      <small>${esc(t.ASL)} · ${esc(districtFor(t)?.Distretto||t.Distretto_ID)}</small>
    </button>`).join("")}</div>
    <div class="small" style="margin-top:10px">Se il tuo indirizzo è vicino a un confine municipale, verifica il Municipio sul sito ufficiale di Roma Capitale.</div>
    <a class="btn soft" style="margin-top:8px" href="${ROMA_MUNICIPIO_LOOKUP}" target="_blank" rel="noopener">Verifica dall'indirizzo</a>`;
}

async function findCap(){
  const input=$("cap-search");
  const cap=(input.value||"").replace(/\D/g,"").slice(0,5);
  input.value=cap;
  $("cap-results").innerHTML="";

  if(cap.length!==5){
    $("cap-msg").textContent="Inserisci un CAP valido di 5 cifre.";
    return;
  }

  // I CAP romani vengono risolti localmente per evitare di mostrare tutti i Municipi.
  if(cap.startsWith("001") && Object.prototype.hasOwnProperty.call(ROMA_CAP_MUNICIPI,cap)){
    renderRomeCapChoice(cap);
    return;
  }

  $("cap-results").innerHTML='<div class="cap-loading">Ricerca del CAP in corso…</div>';

  try{
    const dataset=await loadCapDataset();
    const matches=dataset.filter(x=>Array.isArray(x.cap)&&x.cap.includes(cap));

    if(!matches.length){
      $("cap-msg").textContent=`Nessun Comune del Lazio trovato per il CAP ${cap}. Puoi usare la ricerca per Comune.`;
      $("cap-results").innerHTML=`<button class="btn soft" onclick="openMode('comune')">Cerca per Comune</button>`;
      return;
    }

    if(matches.some(x=>normalizeComuneName(x.nome)==="roma")){
      renderRomeCapChoice(cap);
      return;
    }

    let candidates=[];
    matches.forEach(m=>{
      const ts=territoryByComuneName(m.nome);
      ts.forEach(t=>candidates.push({t,capRecord:m}));
    });

    const seen=new Set();
    candidates=candidates.filter(c=>{
      const k=[c.t.ASL,c.t.Distretto_ID,c.t.Comune_o_Municipio].join("|");
      if(seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if(!candidates.length){
      $("cap-msg").textContent=`Il CAP ${cap} è stato riconosciuto, ma il Comune non è stato associato automaticamente alla guida sanitaria. Cerca il Comune per nome.`;
      $("cap-results").innerHTML=matches.map(m=>`<div class="source-item"><strong>${esc(m.nome)}</strong><div class="small">CAP ${cap}</div></div>`).join("")
        + `<button class="btn soft" style="margin-top:10px" onclick="openMode('comune')">Cerca per Comune</button>`;
      return;
    }

    if(candidates.length===1){
      const t=candidates[0].t;
      $("cap-msg").textContent=`CAP ${cap}: trovato ${t.Comune_o_Municipio}.`;
      $("cap-results").innerHTML="";
      setTimeout(()=>selectByKey(t.ASL,t.Distretto_ID,t.Comune_o_Municipio),120);
      return;
    }

    $("cap-msg").textContent=`Il CAP ${cap} corrisponde a più Comuni. Seleziona il tuo Comune di residenza.`;
    $("cap-results").innerHTML=`<div class="cap-grid">${candidates.slice(0,8).map(({t})=>
      `<button class="cap-card" onclick="selectByKey('${esc(t.ASL)}','${esc(t.Distretto_ID)}','${esc(t.Comune_o_Municipio)}')">
        <strong>${esc(t.Comune_o_Municipio)}</strong>
        <small>${esc(t.ASL)} · ${esc(districtFor(t)?.Distretto||t.Distretto_ID)}</small>
      </button>`).join("")}</div>`;
  }catch(e){
    $("cap-msg").textContent="La ricerca CAP fuori Roma richiede una connessione internet. Puoi comunque cercare subito per Comune, Municipio o ASL.";
    $("cap-results").innerHTML=`<button class="btn soft" onclick="openMode('comune')">Cerca per Comune</button>`;
  }
}

function renderAslButtons(){
  const asls=uniq(TERRITORIES.map(t=>t.ASL)).sort((a,b)=>a.localeCompare(b,"it",{numeric:true}));
  $("asl-buttons").innerHTML=asls.map(asl=>`<button class="choice" onclick="browseAsl('${esc(asl)}')">${esc(asl)}<small>Mostra distretti e territori</small></button>`).join("");
  $("asl-browser").innerHTML="";
}
function browseAsl(asl){
  const rows=TERRITORIES.filter(t=>t.ASL===asl),groups={};rows.forEach(t=>(groups[t.Distretto_ID]??=[]).push(t));
  const isRome=rows.some(t=>t.Tipo_territorio==="Municipio");
  $("asl-browser").innerHTML=`<div class="asl-group" style="margin-top:16px"><div class="asl-head"><div class="asl-name">${esc(asl)}</div><span class="small">Seleziona il tuo territorio</span></div>
    ${Object.keys(groups).sort((a,b)=>a.localeCompare(b,"it",{numeric:true})).map(did=>{
      const sample=groups[did][0],d=districtFor(sample);
      return `<div class="distretto"><strong>${esc(d?.Distretto||did)}</strong><div class="small" style="margin:2px 0 8px">${isRome?"Municipi":"Comuni"} del distretto</div>
      <div class="municipio-grid">${groups[did].sort((a,b)=>a.Comune_o_Municipio.localeCompare(b.Comune_o_Municipio,"it")).map(t=>`<button class="municipio" onclick="selectByKey('${esc(t.ASL)}','${esc(t.Distretto_ID)}','${esc(t.Comune_o_Municipio)}')">${esc(t.Comune_o_Municipio)}</button>`).join("")}</div></div>`;
    }).join("")}</div>`;
}
function selectByKey(asl,did,name){const t=TERRITORIES.find(x=>x.ASL===asl&&x.Distretto_ID===did&&x.Comune_o_Municipio===name);if(t)showResult(t)}


function buildOfficeDeepLink(t,o){
  const params=new URLSearchParams();
  params.set("asl",t.ASL);
  params.set("distretto",t.Distretto_ID);
  params.set("territorio",t.Comune_o_Municipio);
  params.set("ufficio",o.Office_ID);
  return location.href.split("#")[0] + "#" + params.toString();
}

function officeShareText(t,o){
  const d=districtFor(t);
  const lines=[
    "Assistenza Protesica Lazio",
    `${t.ASL} — ${d?.Distretto||t.Distretto_ID}`,
    `Territorio: ${t.Comune_o_Municipio}`,
    "",
    o.Ufficio||"Ufficio Assistenza Protesica"
  ];
  if(o.Indirizzo) lines.push(`Indirizzo: ${o.Indirizzo}`);
  if(o.Orari_pubblico) lines.push(`Orari al pubblico: ${o.Orari_pubblico}`);
  if(o.Orari_telefonici) lines.push(`Orari telefonici: ${o.Orari_telefonici}`);
  if(o.Telefono) lines.push(`Telefono: ${o.Telefono}`);
  if(o.Email) lines.push(`E-mail: ${o.Email}`);
  if(o.PEC) lines.push(`PEC: ${o.PEC}`);
  lines.push("", "Verifica sempre gli eventuali dati contrassegnati con * prima di recarti allo sportello.");
  return lines.join("\n");
}

async function shareOffice(asl,did,territorio,officeId){
  const t=TERRITORIES.find(x=>x.ASL===asl&&x.Distretto_ID===did&&x.Comune_o_Municipio===territorio);
  const o=OFFICES.find(x=>x.Office_ID===officeId);
  if(!t||!o) return;

  const text=officeShareText(t,o);
  const deep=buildOfficeDeepLink(t,o);
  const online=location.protocol==="http:"||location.protocol==="https:";
  const payload={
    title:`${o.Ufficio||"Assistenza Protesica"} — ${t.Comune_o_Municipio}`,
    text: online ? text + "\n\nApri direttamente la scheda:\n" + deep : text
  };
  if(online) payload.url=deep;

  try{
    if(navigator.share){
      await navigator.share(payload);
    }else if(navigator.clipboard){
      await navigator.clipboard.writeText(payload.text + (online?`\n${deep}`:""));
      alert(online ? "Scheda e link copiati negli appunti." : "Scheda copiata negli appunti.");
    }else{
      alert(text);
    }
  }catch(e){}
}

function openDeepLinkedOffice(){
  if(!location.hash||location.hash.length<2) return;
  const p=new URLSearchParams(location.hash.slice(1));
  const asl=p.get("asl"),did=p.get("distretto"),territorio=p.get("territorio"),officeId=p.get("ufficio");
  if(!asl||!did||!territorio) return;
  const t=TERRITORIES.find(x=>x.ASL===asl&&x.Distretto_ID===did&&x.Comune_o_Municipio===territorio);
  if(!t) return;

  // Open the result directly from a shared link.
  currentMode = t.Tipo_territorio==="Municipio" ? "roma" : "comune";
  $("home").classList.add("hidden");
  hideModes();
  showResult(t,officeId||null);
}

function officeCard(o,index,total,t){
  const title=total>1?`${o.Ufficio||"Assistenza Protesica"} — sede ${index+1}`:(o.Ufficio||"Assistenza Protesica");
  const address=o.Indirizzo||"Indirizzo non specificato*",hours=o.Orari_pubblico||"Orario non specificato*";
  const telHours=o.Orari_telefonici||"",phone=o.Telefono||"",email=o.Email||"",pec=o.PEC||"",call=mainPhone(phone);
  const risky=[address,hours].some(v=>v.includes("*"))||o.Affidabilita==="C";
  return `<article class="patient-card">
    <div class="office-name"><h3>${esc(title)}</h3>${risky?`<span class="office-badge">Verifica consigliata</span>`:""}</div>
    <div class="info-grid">
      <div class="info-box"><div class="label">Dove devi andare</div><div class="big">📍 ${esc(address)}</div></div>
      <div class="info-box"><div class="label">Quando puoi andare</div><div class="hours">🕒 ${esc(hours)}</div>${telHours?`<div class="small" style="margin-top:5px"><strong>Telefono:</strong> ${esc(telHours)}</div>`:""}</div>
    </div>
    <div class="contact-lines">${phone?`<div><strong>Telefono:</strong> ${esc(phone)}</div>`:""}${email?`<div><strong>E-mail:</strong> ${esc(email)}</div>`:""}${pec?`<div><strong>PEC:</strong> ${esc(pec)}</div>`:""}</div>
    <div class="action-grid">
      ${call?`<a class="btn primary" href="tel:${call}">☎ Chiama</a>`:""}
      ${email?`<a class="btn soft" href="mailto:${esc(email)}">✉ Scrivi e-mail</a>`:""}
      ${validAddress(address)?`<a class="btn green" href="${mapUrl(address)}" target="_blank" rel="noopener">🗺 Apri mappa</a>`:""}
      <button class="btn sharecard" onclick="shareOffice('${esc(t.ASL)}','${esc(t.Distretto_ID)}','${esc(t.Comune_o_Municipio)}','${esc(o.Office_ID)}')">↗ Condividi scheda</button>
    </div>
    ${risky?`<div class="quick-note"><strong><span class="star">*</span> Prima di partire:</strong> questo dato presenta un elemento da verificare. Chiama o scrivi all'ufficio prima di recarti allo sportello.</div>`:""}
  </article>`;
}

function showResult(t,preferredOfficeId=null){
  setHeaderMode(true);$("mode-"+currentMode).classList.add("hidden");$("result").classList.remove("hidden");
  const d=districtFor(t),os=officesFor(t);
  $("res-territorio").textContent=t.Comune_o_Municipio;$("res-asl").textContent=t.ASL;$("res-distretto").textContent=d?.Distretto||t.Distretto_ID;
  $("office-intro").textContent=os.length>1?"Per questo distretto risultano più sedi. Scegli quella più adatta e verifica prima di recarti allo sportello.":"Questi sono i riferimenti dell'ufficio protesica associato al tuo territorio.";
  let ordered=os;
  if(preferredOfficeId){
    ordered=[...os].sort((a,b)=>(a.Office_ID===preferredOfficeId?-1:0)-(b.Office_ID===preferredOfficeId?-1:0));
  }
  $("office-cards").innerHTML=ordered.length?ordered.map((o,i)=>officeCard(o,i,ordered.length,t)).join(""):`<div class="notice">Nel database non è ancora presente uno sportello verificato per questo distretto.</div>`;
  const srcs=uniqueSources(os);
  $("source-links").innerHTML=srcs.length?srcs.map((u,i)=>`<div class="source-item"><strong>Fonte ufficiale ${i+1}</strong><div class="small" style="margin:4px 0 9px">${esc(u)}</div><a class="btn green" href="${esc(u)}" target="_blank" rel="noopener">Apri pagina ASL</a></div>`).join(""):`<div class="notice">Link specifico non ancora disponibile nel database.</div>`;
  const grades=uniq(os.map(o=>o.Affidabilita)),notes=uniq(os.map(o=>o.Conflitti_note).filter(Boolean));
  $("technical-details").innerHTML=`<p><strong>Affidabilità:</strong> ${esc(grades.join(", ")||t.Affidabilita_mappa||"C")}</p><p><strong>Ultima verifica dataset:</strong> ${esc(DB.meta.dataset_verified)}</p>${notes.length?`<p><strong>Note:</strong><br>${notes.map(esc).join("<br>")}</p>`:""}<p class="small">L'asterisco (*) segnala un orario o recapito da verificare prima dell'accesso.</p>`;
  window.scrollTo({top:0,behavior:"smooth"});
}

async function shareGuide(){
  const online=location.protocol==="http:"||location.protocol==="https:";
  const data={
    title:"Guida Assistenza Protesica Lazio",
    text:"Trova ASL, distretto e ufficio protesica competente nel Lazio."
  };
  if(online) data.url=location.href.split("#")[0];
  try{
    if(navigator.share){await navigator.share(data)}
    else if(navigator.clipboard){
      await navigator.clipboard.writeText(online?location.href.split("#")[0]:data.text);
      alert(online?"Link della guida copiato negli appunti.":"Testo della guida copiato negli appunti.");
    }else{
      alert(online?location.href.split("#")[0]:data.text);
    }
  }catch(e){}
}

const capInput=$("cap-search");
capInput.addEventListener("input",()=>{capInput.value=capInput.value.replace(/\D/g,"").slice(0,5);});
capInput.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();findCap();}});

const comuneInput=$("comune-search");
comuneInput.addEventListener("input",renderComuneSuggestions);
comuneInput.addEventListener("focus",ensureComuneInputVisible);
comuneInput.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();findComune()}if(e.key==="Escape")closeComuneSuggestions()});
document.addEventListener("click",e=>{const s=$("comune-search-shell");if(s&&!s.contains(e.target))closeComuneSuggestions()});
if(window.visualViewport)window.visualViewport.addEventListener("resize",()=>{if(document.activeElement===comuneInput)ensureComuneInputVisible()});

window.addEventListener('DOMContentLoaded',openDeepLinkedOffice);
