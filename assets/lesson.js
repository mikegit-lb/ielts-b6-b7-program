/* Shared IELTS program engine — chrome injection + highlighter/vocab + notes + timer + answer reveal + self-score.
   State is shared across all pages via localStorage (same file:// origin). */
(function(){
  const LS={get:k=>{try{return JSON.parse(localStorage.getItem("ielts_b6b7_"+k))}catch(e){return null}},
            set:(k,v)=>localStorage.setItem("ielts_b6b7_"+k,JSON.stringify(v))};
  let hlMode=false;
  let done=LS.get("done")||{};
  let notes=LS.get("notes")||{};
  let highlights=LS.get("highlights")||{};
  let vocab=LS.get("vocab")||[];
  let checks=LS.get("checks")||{};
  const $=s=>document.querySelector(s);
  const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
  const DAY=document.body.getAttribute("data-day")||"hub";
  const WEEK=document.body.getAttribute("data-week")||"";

  /* ---- theme ---- */
  (function(){const t=LS.get("theme");if(t)document.documentElement.setAttribute("data-theme",t);})();

  /* ---- inject chrome ---- */
  const top=el("div","top");
  top.innerHTML=`<div class="topin">
    <a class="brand" href="index.html"><span class="dot"></span> IELTS B6→B7</a>
    <div class="spacer"></div>
    <button class="tool" id="hlBtn"><span>✎</span> Highlighter <span class="k" id="hlState">off</span></button>
    <button class="tool" id="vocabBtn">★ Vocab <span class="k" id="vocabCount">0</span></button>
    <button class="tool" id="timerBtn">⏱ Timer</button>
    <button class="tool" id="themeBtn">◐ Theme</button>
  </div>`;
  document.body.insertBefore(top,document.body.firstChild);

  const scrim=el("div","scrim");scrim.id="scrim";document.body.appendChild(scrim);
  const drawer=el("aside","drawer");drawer.id="drawer";
  drawer.innerHTML=`<div class="dvh"><h3>★ My vocabulary</h3><div class="spacer"></div><button class="tool" id="closeDrawer">✕</button></div>
    <div class="dvb" id="vocabList"></div>
    <div class="dvf"><button class="tool" id="copyVocab" style="flex:1;justify-content:center">Copy all</button>
    <button class="tool" id="clearVocab" style="justify-content:center">Clear</button></div>`;
  document.body.appendChild(drawer);

  const timer=el("div","timer");timer.id="timer";
  timer.innerHTML=`<div class="tt" id="ttDisp">20:00</div>
    <div class="pset"><button data-min="20">T1 20</button><button data-min="40">T2 40</button><button data-min="60">Full 60</button></div>
    <button id="tStart">Start</button><button id="tReset">Reset</button>`;
  document.body.appendChild(timer);

  /* ---- theme toggle ---- */
  $("#themeBtn").onclick=()=>{const cur=document.documentElement.getAttribute("data-theme");
    const next=cur==="dark"?"light":(cur==="light"?"":"dark");
    if(next)document.documentElement.setAttribute("data-theme",next);else document.documentElement.removeAttribute("data-theme");
    LS.set("theme",next);};

  /* ---- highlighter + vocab ---- */
  $("#hlBtn").onclick=()=>{hlMode=!hlMode;$("#hlBtn").classList.toggle("on",hlMode);$("#hlState").textContent=hlMode?"on":"off";};
  document.addEventListener("mouseup",()=>{
    if(!hlMode)return;
    const sel=window.getSelection();
    if(!sel||sel.isCollapsed||!sel.toString().trim())return;
    const range=sel.getRangeAt(0);
    const anc=range.commonAncestorContainer;
    const host=(anc.nodeType===3?anc.parentElement:anc).closest(".highlightable");
    if(!host){sel.removeAllRanges();return;}
    const text=sel.toString().trim();
    if(text.length>60){sel.removeAllRanges();return;}
    try{const mark=document.createElement("mark");mark.className="hl";range.surroundContents(mark);attachRemoval(mark);
      const key=hlKey(host);highlights[key]=highlights[key]||[];if(!highlights[key].includes(text))highlights[key].push(text);LS.set("highlights",highlights);
      addVocab(text);}catch(e){}
    sel.removeAllRanges();
  });
  function hlKey(host){return DAY+"::"+(host.getAttribute("data-hlkey")||"main");}
  function attachRemoval(mark){mark.addEventListener("click",ev=>{ev.stopPropagation();
    const txt=mark.textContent,parent=mark.parentNode;
    while(mark.firstChild)parent.insertBefore(mark.firstChild,mark);
    parent.removeChild(mark);parent.normalize();
    for(const k in highlights)highlights[k]=highlights[k].filter(p=>p!==txt);LS.set("highlights",highlights);
    removeVocab(txt);});}
  function restoreHighlights(){
    document.querySelectorAll(".highlightable").forEach(host=>{
      const key=hlKey(host),phrases=highlights[key];if(!phrases)return;
      phrases.forEach(p=>highlightFirst(host,p));
    });}
  function highlightFirst(container,phrase){
    const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT,null);let node;
    while((node=walker.nextNode())){
      if(node.parentElement.classList.contains("hl"))continue;
      const idx=node.nodeValue.indexOf(phrase);
      if(idx>-1){const r=document.createRange();r.setStart(node,idx);r.setEnd(node,idx+phrase.length);
        const m=document.createElement("mark");m.className="hl";try{r.surroundContents(m);attachRemoval(m);}catch(e){}return;}
    }}
  function addVocab(w){const n=w.toLowerCase();if(vocab.some(v=>v.w.toLowerCase()===n))return;
    vocab.push({w:w,day:WEEK?("W"+WEEK):"·"});LS.set("vocab",vocab);renderVocab();}
  function removeVocab(w){const b=vocab.length;vocab=vocab.filter(v=>v.w.toLowerCase()!==w.toLowerCase());
    if(vocab.length!==b){LS.set("vocab",vocab);renderVocab();}}
  function renderVocab(){$("#vocabCount").textContent=vocab.length;
    const list=$("#vocabList");if(!list)return;
    if(!vocab.length){list.innerHTML='<div class="empty">No saved words yet.<br>Turn on the Highlighter, then select any word to save it here.</div>';return;}
    list.innerHTML="";vocab.slice().reverse().forEach(v=>{const row=el("div","vword");
      row.innerHTML=`<span>${v.w} <small>${v.day}</small></span><button title="Remove">✕</button>`;
      row.querySelector("button").onclick=()=>removeVocab(v.w);list.appendChild(row);});}
  $("#vocabBtn").onclick=()=>{drawer.classList.add("open");scrim.classList.add("on");renderVocab();};
  $("#closeDrawer").onclick=()=>{drawer.classList.remove("open");scrim.classList.remove("on");};
  scrim.onclick=()=>{drawer.classList.remove("open");scrim.classList.remove("on");};
  $("#copyVocab").onclick=()=>{const t=vocab.map(v=>v.w).join("\n");navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>{$("#copyVocab").textContent="Copied ✓";setTimeout(()=>$("#copyVocab").textContent="Copy all",1200);});};
  $("#clearVocab").onclick=()=>{if(confirm("Clear all saved vocabulary?")){vocab=[];LS.set("vocab",vocab);renderVocab();}};

  /* ---- timer ---- */
  let tSecs=1200,tRun=false,tInt=null;
  const tFmt=s=>String(Math.floor(s/60)).padStart(2,'0')+":"+String(s%60).padStart(2,'0');
  const tDraw=()=>{$("#ttDisp").textContent=tFmt(tSecs);};
  $("#timerBtn").onclick=()=>timer.classList.toggle("show");
  timer.querySelectorAll(".pset button").forEach(b=>b.onclick=()=>{tRun=false;clearInterval(tInt);$("#tStart").textContent="Start";tSecs=parseInt(b.dataset.min)*60;tDraw();});
  $("#tStart").onclick=()=>{tRun=!tRun;$("#tStart").textContent=tRun?"Pause":"Start";
    if(tRun){tInt=setInterval(()=>{if(tSecs>0){tSecs--;tDraw();}else{clearInterval(tInt);tRun=false;$("#tStart").textContent="Start";$("#ttDisp").textContent="TIME";}},1000);}else clearInterval(tInt);};
  $("#tReset").onclick=()=>{tRun=false;clearInterval(tInt);$("#tStart").textContent="Start";tSecs=1200;tDraw();};
  tDraw();

  /* ---- answer reveal ---- */
  document.querySelectorAll("[data-reveal]").forEach(btn=>{
    btn.addEventListener("click",()=>{const t=document.getElementById(btn.getAttribute("data-reveal"));
      if(!t)return;const open=t.classList.toggle("show");
      btn.textContent=open?(btn.dataset.hide||"Hide answers"):(btn.dataset.show||"Show answer key");});});

  /* ---- self-score checklists ---- */
  document.querySelectorAll(".chklist li").forEach((li,i)=>{
    const key=DAY+"_chk_"+(li.getAttribute("data-k")||i);
    if(checks[key])li.classList.add("on");
    li.addEventListener("click",()=>{checks[key]=!checks[key];LS.set("checks",checks);li.classList.toggle("on",checks[key]);});});

  /* ---- notes ---- */
  document.querySelectorAll("textarea[data-note]").forEach(ta=>{
    const key=DAY+"_"+ta.getAttribute("data-note");
    if(notes[key])ta.value=notes[key];
    ta.addEventListener("input",()=>{notes[key]=ta.value;LS.set("notes",notes);});});

  /* ---- completion ---- */
  const cbox=$("#dayComplete");
  if(cbox){if(done[DAY])cbox.classList.add("done");
    cbox.addEventListener("click",()=>{done[DAY]=!done[DAY];LS.set("done",done);cbox.classList.toggle("done",done[DAY]);});}

  /* ---- MCQ / option selection (visual only) ---- */
  document.querySelectorAll(".opts").forEach(ul=>{
    const multi=ul.getAttribute("data-multi")==="1";
    ul.querySelectorAll("li").forEach(li=>li.addEventListener("click",()=>{
      if(!multi)ul.querySelectorAll("li").forEach(x=>x.classList.remove("sel"));
      li.classList.toggle("sel");}));});

  /* ---- hub helpers (progress + tile state) ---- */
  window.IELTS_HUB=function(){
    const dc=Object.values(done).filter(Boolean).length;
    const pf=$("#progFill"),pt=$("#progText");
    if(pf)pf.style.width=Math.round(dc/70*100)+"%";
    if(pt)pt.textContent=dc+" of 70 sessions complete";
    document.querySelectorAll(".tile[data-d]").forEach(t=>{if(done["day-"+t.getAttribute("data-d")])t.classList.add("done");});
    renderVocab();
  };

  restoreHighlights();
  renderVocab();
})();
