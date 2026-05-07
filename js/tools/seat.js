/* =========================================
   學生座位排列系統邏輯 (Seat JS)
   ========================================= */
const SEAT_W = 72;
const SEAT_H = 62;
const SEAT_GAP = 6;
const SLOT_H = SEAT_H + SEAT_GAP;

const CLASSROOMS = [
  {
    id:'EB106', name:'EB106', type:'fan',
    layout:[
      {row:1, blocks:[2,2,2,0]},
      {row:2, blocks:[3,3,3,3]},
      {row:3, blocks:[4,4,4,3]},
      {row:4, blocks:[5,5,5,3]},
      {row:5, blocks:[6,6,6,3]},
      {row:6, blocks:[7,7,7,2]},
    ]
  },
  {
    id:'EL102', name:'EL102', type:'grid',
    rows:8,
    cols:[
      {label:'A排',   type:'desk',   startRow:1, endRow:5},
      {label:'B排',   type:'desk',   startRow:1, endRow:5},
      {label:'C排',   type:'desk',   startRow:1, endRow:5},
      {label:'D排',   type:'desk',   startRow:1, endRow:4},
    ]
  },
  {
    id:'EL103', name:'EL103', type:'grid',
    rows:9,
    cols:[
      {label:'A排',   type:'desk',   startRow:1, endRow:9},
      {label:'B排',   type:'desk',   startRow:1, endRow:9},
      {label:'C排',   type:'desk',   startRow:1, endRow:9},
      {label:'D排',   type:'desk',   startRow:1, endRow:9},
      {label:'側走道', type:'single', startRow:1, endRow:7},
    ]
  },
  {
    id:'EL104', name:'EL104', type:'grid',
    rows:9,
    cols:[
      {label:'側走道', type:'single', startRow:2, endRow:7},
      {label:'A排',   type:'desk',   startRow:1, endRow:9},
      {label:'B排',   type:'desk',   startRow:1, endRow:9},
      {label:'C排',   type:'desk',   startRow:1, endRow:9},
      {label:'D排',   type:'desk',   startRow:1, endRow:9},
    ]
  },
  {
    id:'EL105', name:'EL105', type:'grid',
    rows:8,
    cols:[
      {label:'A排',   type:'single',   startRow:1, endRow:5},
      {label:'B排',   type:'single',   startRow:2, endRow:6},
      {label:'C排',   type:'single',   startRow:2, endRow:6},
      {label:'D排',   type:'single',   startRow:2, endRow:6},
      {label:'E排',   type:'single',   startRow:2, endRow:6},
      {label:'F排',   type:'single',   startRow:2, endRow:6},
      {label:'G排',   type:'single',   startRow:2, endRow:6},
      {label:'H排',   type:'single',   startRow:2, endRow:6},
    ]
  },
  {
    id:'EL106', name:'EL106', type:'grid',
    rows:9,
    cols:[
      {label:'側走道', type:'single', startRow:1, endRow:7},
      {label:'A排',   type:'desk',   startRow:1, endRow:9},
      {label:'B排',   type:'desk',   startRow:1, endRow:9},
      {label:'C排',   type:'desk',   startRow:1, endRow:9},
      {label:'D排',   type:'desk',   startRow:1, endRow:9},
    ]
  },
  {
    id:'EL308', name:'EL308', type:'el308',
    maxRows: 6,
    cols:[
      { label:'A排', rows:5 },
      { label:'B排', rows:6 },
      { label:'C排', rows:6 },
      { label:'D排', rows:6 },
      { label:'E排', rows:6 },
      { label:'F排', rows:3 },
    ]
  },
  {
    id:'EL310', name:'EL310', type:'el310',
    maxRows: 12,
    segments:[
      { label:'A排',   type:'single',  startSlot:1, rows:12 },
      { label:'',      type:'aisle' },
      { label:'B排',   type:'single',  startSlot:2, rows:10 },
      { label:'C排',   type:'single',  startSlot:2, rows:10 },
      { label:'D排',   type:'single',  startSlot:2, rows:10 },
      { label:'',      type:'aisle' },
      { label:'教師機', type:'teacher', startSlot:1, rows:1  },
      { label:'E排',   type:'single',  startSlot:2, rows:9  },
      { label:'F排',   type:'single',  startSlot:2, rows:8  },
    ]
  }
];

let customCls=[];
let students=[];
let selectedCls=new Set();
let seatMap={};
let editSeatKey=null,editSeatCls=null;
let currentMode='order';
let quincunxOn=false;

function init(){ renderClsList(); }
function allClassrooms(){ return [...CLASSROOMS,...customCls]; }

function getCapacity(cls){
  if(cls.type==='fan') return cls.layout.reduce((s,r)=>s+r.blocks.reduce((a,b)=>a+b,0),0);
  if(cls.type==='grid'){ let c=0; cls.cols.forEach(col=>{ const rows=col.endRow-col.startRow+1; c+=col.type==='single'?rows:rows*2; }); return c; }
  if(cls.type==='el308') return cls.cols.reduce((s,c)=>s+c.rows,0);
  if(cls.type==='el310'){ let c=0; cls.segments.forEach(seg=>{ if(seg.type==='aisle'||seg.type==='teacher') return; c+=seg.rows; }); return c; }
  return 0;
}

function getTotalSelectedCap(){
  return [...selectedCls].reduce((s,id)=>{ const c=allClassrooms().find(x=>x.id===id); return s+(c?getCapacity(c):0); },0);
}

function parseStudents(){
  const raw=document.getElementById('studentInput').value.trim();
  if(!raw){showAlert('請輸入學生名單','warning');return;}
  const lines=raw.split('\n').map(l=>l.trim()).filter(l=>l);
  students=lines.map((l,i)=>{ const parts=l.split(/\s+/); if(parts.length>=2) return {id:parts[0],name:parts.slice(1).join(' ')}; return {id:`S${String(i+1).padStart(3,'0')}`,name:parts[0]}; });
  renderStuTags(); updateCapBar();
  showAlert(`✅ 已載入 ${students.length} 位學生`,'success');
}

function loadSample(){
  const names=['王小明','李小華','張大偉','陳美玲','林志豪','黃雅婷','吳建宏','劉淑芬','蔡宗翰','鄭佳穎','許志明','謝雨晴','楊俊傑','周淑娟','洪建志','邱雅雯','曾志遠','廖美慧','彭建國','盧淑惠','蕭志偉','江雅琪','何建平','鍾美珍','余志強'];
  document.getElementById('studentInput').value=names.map((n,i)=>`B1${String(1001+i).padStart(4,'0')} ${n}`).join('\n');
  parseStudents();
}

function clearStudents(){
  students=[];seatMap={};
  document.getElementById('studentInput').value='';
  document.getElementById('stuInfo').textContent='';
  document.getElementById('stuTags').innerHTML='';
  document.getElementById('capWrap').style.display='none';
  document.getElementById('clsViews').innerHTML='<div class="no-result"><div class="icon">🏫</div>請先選擇教室並載入學生名單，<br>然後點擊「開始排座位」</div>';
}

function renderStuTags(){
  document.getElementById('stuInfo').textContent=`共 ${students.length} 位學生`;
  document.getElementById('stuTags').innerHTML=students.map(s=>`<span class="tag">${s.name}</span>`).join('');
}

function renderClsList(){
  const all=allClassrooms();
  document.getElementById('clsList').innerHTML=all.map(c=>`
    <div class="opt-item ${selectedCls.has(c.id)?'selected':''}" onclick="toggleCls('${c.id}')">
      <input type="checkbox" ${selectedCls.has(c.id)?'checked':''} onclick="event.stopPropagation();toggleCls('${c.id}')">
      <span>${c.name}</span>
      <span style="margin-left:auto;font-size:.72rem;color:#aaa">${getCapacity(c)}座</span>
    </div>`).join('');
  updateCapBar();
}

function toggleCls(id){
  if(selectedCls.has(id)) selectedCls.delete(id); else selectedCls.add(id);
  renderClsList(); updateCapBar();
}

function updateCapBar(){
  if(!selectedCls.size||!students.length){document.getElementById('capWrap').style.display='none';return;}
  const cap=getTotalSelectedCap();
  const pct=Math.min(100,Math.round(students.length/cap*100));
  const fill=document.getElementById('capFill');
  fill.style.width=pct+'%';
  fill.className='cap-fill '+(pct>100?'over':pct>85?'warn':'ok');
  document.getElementById('capText').textContent=`${students.length} 人 / ${cap} 座 (${pct}%) — ${[...selectedCls].join('、')}`;
  document.getElementById('capWrap').style.display='block';
}

function selMode(m){
  currentMode=m;
  ['order','random','name'].forEach(k=>{ document.getElementById('opt-'+k).classList.toggle('selected',k===m); document.getElementById('opt-'+k).querySelector('input').checked=(k===m); });
}

function onQuincunxToggle(){
  quincunxOn=document.getElementById('quincunxToggle').checked;
  document.getElementById('quincunxToggleRow').classList.toggle('active',quincunxOn);
  document.getElementById('quincunxInfo').style.display=quincunxOn?'block':'none';
}

function buildSeatGrid(cls){
  const seats=[];
  if(cls.type==='fan'){
    cls.layout.forEach(r=>{ let colIdx=0; r.blocks.forEach((cnt,bi)=>{ if(cnt===0){colIdx+=8;return;} for(let p=0;p<cnt;p++) seats.push({key:`${r.row}-${bi}-${p}`,gridRow:r.row,gridCol:colIdx+p}); colIdx+=cnt+2; }); });
  } else if(cls.type==='grid'){
    let colIdx=0;
    cls.cols.forEach((col,ci)=>{ for(let row=col.startRow;row<=col.endRow;row++){ if(col.type==='single'){ seats.push({key:`${row}-${ci}-0`,gridRow:row,gridCol:colIdx}); } else { seats.push({key:`${row}-${ci}-0`,gridRow:row,gridCol:colIdx}); seats.push({key:`${row}-${ci}-1`,gridRow:row,gridCol:colIdx+1}); } } colIdx+=col.type==='single'?2:3; });
  } else if(cls.type==='el308'){
    cls.cols.forEach((col,ci)=>{ for(let r=0;r<col.rows;r++) seats.push({key:`${ci}-${r}`,gridRow:r+1,gridCol:ci}); });
  } else if(cls.type==='el310'){
    let colIdx=0;
    cls.segments.forEach((seg,si)=>{
      if(seg.type==='aisle'){colIdx+=2;return;}
      if(seg.type==='teacher'){colIdx+=2;return;}
      const start=seg.startSlot||1;
      for(let r=0;r<seg.rows;r++) seats.push({key:`${si}-${r}`,gridRow:start+r,gridCol:colIdx});
      colIdx+=2;
    });
  }
  return seats;
}

// 🌟 移植自 Python：進階梅花座演算法 (支援 EB106 專屬規則)
function applyQuincunx(cls, seats){
  const result = [];
  if(cls.type === 'fan'){
    // EB106 專屬客製化防作弊規則
    for(const s of seats){
      const parts = s.key.split('-');
      const row = parseInt(parts[0], 10);
      const bi = parseInt(parts[1], 10);
      const p = parseInt(parts[2], 10);
      
      if(bi === 0 || bi === 1){
        if(p % 2 === 0) result.push(s);
      } else if(bi === 2){
        if(row % 2 === p % 2) result.push(s);
      } else if(bi === 3){
        if(row === 6){
          if(p % 2 === 1) result.push(s);
        } else {
          if(p % 2 === 0) result.push(s);
        }
      }
    }
  } else {
    // 其他方形教室維持原本的「上下左右防碰撞」邏輯
    const occupied = new Set();
    for(const s of seats){
      const neighbors = [`${s.gridRow-1},${s.gridCol}`, `${s.gridRow+1},${s.gridCol}`, `${s.gridRow},${s.gridCol-1}`, `${s.gridRow},${s.gridCol+1}`];
      if(!neighbors.some(n => occupied.has(n))){ 
        result.push(s); 
        occupied.add(`${s.gridRow},${s.gridCol}`); 
      }
    }
  }
  return result;
}

function assignSeats(){
  if(!students.length){showAlert('請先載入學生名單','warning');return;}
  if(!selectedCls.size){showAlert('請先選擇教室','warning');return;}
  
  let sorted=[...students];
  if(currentMode==='random') sorted=shuffle(sorted);
  else if(currentMode==='name') sorted.sort((a,b)=>a.name.localeCompare(b.name,'zh-TW'));
  else sorted.sort((a,b)=>a.id.localeCompare(b.id));
  
  seatMap={}; let stuIdx=0;
  for(const clsId of selectedCls){
    const cls=allClassrooms().find(c=>c.id===clsId); if(!cls)continue;
    const grid=buildSeatGrid(cls);
    const avail=quincunxOn ? applyQuincunx(cls, grid) : grid;
    seatMap[clsId]={};
    for(const s of avail){ 
      if(stuIdx>=sorted.length) break; 
      seatMap[clsId][s.key]=sorted[stuIdx++].id; 
    }
  }
  if(stuIdx<sorted.length) showAlert(`⚠️ 座位不足，${sorted.length-stuIdx} 位學生未分配`,'warning');
  else showAlert(`✅ 排列完成！${stuIdx} 人分配至 ${selectedCls.size} 間教室${quincunxOn?' (梅花座)':''}`,'success');
  
  renderAllClassrooms(); renderList();
}

function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

function renderAllClassrooms(){
  if(!selectedCls.size)return;
  let html='';
  for(const clsId of selectedCls){
    const cls=allClassrooms().find(c=>c.id===clsId); if(!cls)continue;
    const map=seatMap[clsId]||{};
    const count=Object.keys(map).length;
    html+=`<div class="cls-view">`;
    
    // 🌟 關鍵修復：使用 min-width: 100% 與 width: max-content
    html+=`<div style="display: flex; flex-direction: column; align-items: stretch; width: max-content; min-width: 100%;">`;
    
    html+=`<div class="cls-title" style="display: flex; justify-content: center; gap: 10px; margin-bottom: 12px;">
            <span class="cls-badge">${cls.name}</span>
            <span class="cls-stat">👥 ${count} 人 / ${getCapacity(cls)} 座</span>
          </div>`;
          
    html+=`<div class="stage" style="width: 100%; box-sizing: border-box;">▼ 白板 / 講台 ▼</div>`;
    
    html+=`<div class="cls-center" style="display: flex; justify-content: center; width: 100%;">`;
    if(cls.type==='fan')        html+=renderFan(cls,clsId);
    else if(cls.type==='grid')  html+=renderGrid(cls,clsId);
    else if(cls.type==='el308') html+=renderEL308(cls,clsId);
    else if(cls.type==='el310') html+=renderEL310(cls,clsId);
    html+=`</div>`;
    
    html+=`</div></div>`;
  }
  document.getElementById('clsViews').innerHTML=html||'<div class="no-result"><div class="icon">🏫</div>尚未排列</div>';
}

// ── EL310 ──
function renderEL310(cls, clsId){
  const map=seatMap[clsId]||{};
  const hasAssigned=Object.keys(map).length>0;
  const eSegIdx=cls.segments.findIndex(s=>s.label==='E排');
  const eSeg=eSegIdx>=0?cls.segments[eSegIdx]:null;

  let hdr=`<div class="el310-headers">`;
  cls.segments.forEach((seg)=>{
    if(seg.type==='aisle'){ hdr+=`<div style="width:24px;min-width:24px"></div>`; return; }
    if(seg.label==='E排') return;
    if(seg.type==='teacher') hdr+=`<div class="el310-col-lbl" style="color:#374151;font-size:.65rem">教師機<br>/E排</div>`;
    else hdr+=`<div class="el310-col-lbl">${seg.label}</div>`;
  });
  hdr+=`</div>`;

  let body=`<div class="el310-body">`;
  cls.segments.forEach((seg,si)=>{
    if(seg.type==='aisle'){
      const totalH=cls.maxRows*SLOT_H-SEAT_GAP;
      body+=`<div style="width:24px;min-width:24px;height:${totalH}px;background:repeating-linear-gradient(180deg,#cbd5e0 0px,#cbd5e0 3px,transparent 3px,transparent 10px);border-radius:4px;opacity:.5"></div>`;
      return;
    }
    if(seg.label==='E排') return;
    body+=`<div class="el310-col">`;
    if(seg.type==='teacher'){
      body+=`<div class="teacher-pc">💻<br>教師機</div>`;
      if(eSeg){
        for(let r=0;r<eSeg.rows;r++) body+=renderSeatHtml(`${eSegIdx}-${r}`,r+1,0,clsId,hasAssigned);
        const used=1+eSeg.rows;
        if(used<cls.maxRows) body+=`<div style="height:${(cls.maxRows-used)*SLOT_H-SEAT_GAP}px"></div>`;
      }
    } else {
      const start=seg.startSlot||1;
      if(start>1) body+=`<div style="height:${(start-1)*SLOT_H}px"></div>`;
      for(let r=0;r<seg.rows;r++) body+=renderSeatHtml(`${si}-${r}`,r+1,0,clsId,hasAssigned);
      const used=(start-1)+seg.rows;
      if(used<cls.maxRows) body+=`<div style="height:${(cls.maxRows-used)*SLOT_H-SEAT_GAP}px"></div>`;
    }
    body+=`</div>`;
  });
  body+=`</div>`;
  return `<div class="el310-outer">${hdr}${body}</div>`;
}

// ── EL308 ──
function renderEL308(cls, clsId){
  const map=seatMap[clsId]||{};
  const hasAssigned=Object.keys(map).length>0;
  let html=`<div style="display:inline-flex;flex-direction:column;align-items:stretch">`;
  html+=`<div style="display:flex;justify-content:flex-end;margin-bottom:5px"><div style="background:#374151;color:#fff;border-radius:6px;padding:3px 12px;font-size:.72rem;font-weight:700">🚪 門</div></div>`;
  html+=`<div style="display:flex;gap:${SEAT_GAP}px;margin-bottom:5px;justify-content:center">`;
  cls.cols.forEach(col=>{ html+=`<div style="width:${SEAT_W}px;min-width:${SEAT_W}px;text-align:center;font-size:.7rem;font-weight:700;color:#555">${col.label}</div>`; });
  html+=`</div>`;
  html+=`<div style="display:flex;gap:${SEAT_GAP}px;align-items:flex-start;justify-content:center">`;
  cls.cols.forEach((col,ci)=>{
    html+=`<div style="display:flex;flex-direction:column;gap:${SEAT_GAP}px;align-items:center">`;
    for(let r=0;r<cls.maxRows;r++){
      if(r<col.rows) html+=renderSeatHtml(`${ci}-${r}`,r+1,0,clsId,hasAssigned);
      else html+=`<div style="width:${SEAT_W}px;height:${SEAT_H}px"></div>`;
    }
    html+=`</div>`;
  });
  html+=`</div></div>`;
  return html;
}

// 🌟 自動修復 Flexbox 置中導致左側被裁切的問題
if(!document.getElementById('layout-fix-css')){
  const style = document.createElement('style');
  style.id = 'layout-fix-css';
  style.innerHTML = `
    .cls-center { align-items: flex-start !important; }
    .cls-center > * { margin: 0 auto; }
    .eb106-row { margin-bottom: var(--seat-gap); }
  `;
  document.head.appendChild(style);
}

// ── EB106 (扇形防擠壓與精準間距渲染) ──
function renderFan(cls, clsId){
  const hasAssigned = Object.keys(seatMap[clsId]||{}).length > 0;
  
  // 外層容器，確保不會被擠壓
  let html = `<div class="eb106" style="display: flex; flex-direction: column; width: max-content; padding: 10px 20px;">`;
  
  // 計算每個區塊的最大座位數，用來撐開隱形對齊空間
  const maxBlocks = {};
  cls.layout.forEach(r => {
    r.blocks.forEach((cnt, bi) => { maxBlocks[bi] = Math.max(maxBlocks[bi] || 0, cnt); });
  });

  cls.layout.forEach(r => { 
    html += `<div class="eb106-row" style="display: flex; justify-content: center; align-items: flex-start;">`; 
    
    r.blocks.forEach((cnt, bi) => { 
      const maxCnt = maxBlocks[bi] || 0;
      
      // 精準計算該區塊的絕對寬度 (座位寬度 + 座位間距)
      const widthStyle = maxCnt > 0 
        ? `width: calc(${maxCnt} * ${SEAT_W}px + ${maxCnt > 0 ? maxCnt - 1 : 0} * ${SEAT_GAP}px); flex-shrink: 0;` 
        : `width: 0px;`;
      
      // 🌟 自訂走道寬度：調整這裡可以改變區塊之間的距離
      let marginStyle = "";
      if(bi === 1) marginStyle = "margin-left: 35px;"; // 左側小走道
      if(bi === 2) marginStyle = "margin-left: 35px;"; // 中央大走道
      if(bi === 3) marginStyle = "margin-left: 35px;"; // 右側小走道
      
      // 如果該排該區塊沒有座位 (例如 0)，只保留佔位空間
      if(cnt === 0){
        if(maxCnt > 0) html += `<div style="${widthStyle} ${marginStyle}"></div>`;
        return;
      } 
      
      // 左半邊 (bi=0,1) 靠右對齊，右半邊 (bi=2,3) 靠左對齊，形成扇形包覆感
      const justify = bi < 2 ? "flex-end" : "flex-start";
      
      html += `<div class="eb106-block" style="${widthStyle} ${marginStyle} display: flex; gap: ${SEAT_GAP}px; justify-content: ${justify};">`; 
      for(let p=0; p<cnt; p++) {
        html += renderSeatHtml(`${r.row}-${bi}-${p}`, r.row, p, clsId, hasAssigned); 
      }
      html += '</div>'; 
    }); 
    html += '</div>'; 
  });
  html += '</div>'; 
  return html;
}

// ── EL104 ──
function renderGrid(cls,clsId){
  const hasAssigned=Object.keys(seatMap[clsId]||{}).length>0;
  let html=`<div class="el104">`;
  cls.cols.forEach((col,ci)=>{
    html+=`<div class="el104-col"><div class="el104-col-lbl">${col.label}</div>`;
    for(let row=1;row<=cls.rows;row++){
      if(row<col.startRow||row>col.endRow){ html+=`<div style="height:${SEAT_H}px"></div>`; continue; }
      if(col.type==='single'){ html+=`<div>${renderSeatHtml(`${row}-${ci}-0`,row,0,clsId,hasAssigned)}</div>`; }
      else { html+=`<div class="desk">${renderSeatHtml(`${row}-${ci}-0`,row,0,clsId,hasAssigned)}${renderSeatHtml(`${row}-${ci}-1`,row,1,clsId,hasAssigned)}</div>`; }
    }
    html+='</div>';
  });
  html+='</div>'; return html;
}

// ── 單一座位 ──
function renderSeatHtml(key,seatNum,pos,clsId,hasAssigned){
  const map=seatMap[clsId]||{};
  const sid=map[key];
  const stu=sid?students.find(s=>s.id===sid):null;
  const isQ=quincunxOn&&!stu&&hasAssigned;
  let c='seat';
  if(stu) c+=' occupied'; else if(isQ) c+=' quincunx'; else if(hasAssigned) c+=' empty';
  const num=`<div class="seat-num">${seatNum}</div>`;
  const content=stu
    ?`<div class="seat-name">${stu.name}</div><div class="seat-id">${stu.id}</div>`
    :(isQ?`<div style="font-size:.8rem;color:#d69e2e">🌸</div>`:`<div class="seat-id" style="color:#ccc">空</div>`);
  return `<div class="${c}" onclick="openSeatEdit('${key}','${clsId}')" draggable="true" ondragstart="dragStart('${key}','${clsId}')" ondragover="dragOver(event)" ondrop="drop(event,'${key}','${clsId}')">${num}${content}</div>`;
}

function renderList(){
  let rows=[];
  for(const clsId of selectedCls){ 
    const map=seatMap[clsId]||{}; 
    Object.entries(map).forEach(([k,sid])=>{ 
      const stu=students.find(s=>s.id===sid); 
      rows.push(`<tr><td>${clsId}</td><td>${k}</td><td>${stu?stu.id:''}</td><td>${stu?stu.name:''}</td></tr>`); 
    }); 
  }
  document.getElementById('listContent').innerHTML=rows.length?`<table class="exp-table"><thead><tr><th>教室</th><th>座位</th><th>學號</th><th>姓名</th></tr></thead><tbody>${rows.join('')}</tbody></table>`:'<div class="no-result"><div class="icon">📋</div>尚未排列座位</div>';
}

let dragKey=null,dragClsId=null;
function dragStart(key,clsId){dragKey=key;dragClsId=clsId;}
function dragOver(e){e.preventDefault();}
function drop(e,key,clsId){
  e.preventDefault(); if(!dragKey||dragClsId!==clsId||dragKey===key)return;
  const map=seatMap[clsId]||{}; const tmp=map[dragKey];
  if(map[key]) map[dragKey]=map[key]; else delete map[dragKey];
  if(tmp) map[key]=tmp; else delete map[key];
  renderAllClassrooms();renderList();
}

function openSeatEdit(key,clsId){
  editSeatKey=key;editSeatCls=clsId;
  const map=seatMap[clsId]||{}; const sid=map[key]; const stu=sid?students.find(s=>s.id===sid):null;
  document.getElementById('seatModalInfo').textContent=`教室：${clsId}　座位：${key}　目前：${stu?stu.name+' ('+stu.id+')':'空座位'}`;
  const sel=document.getElementById('seatSelect');
  const occupied=new Set(); for(const m of Object.values(seatMap)) Object.values(m).forEach(v=>occupied.add(v));
  sel.innerHTML='<option value="">-- 空座位 --</option>'+students.map(s=>`<option value="${s.id}" ${s.id===sid?'selected':''}>${s.name} (${s.id})${occupied.has(s.id)&&s.id!==sid?' ✓':''}</option>`).join('');
  openModal('seatModal');
}
function clearSeat(){ if(!seatMap[editSeatCls])return; delete seatMap[editSeatCls][editSeatKey]; closeModal('seatModal');renderAllClassrooms();renderList(); }
function saveSeat(){
  const v=document.getElementById('seatSelect').value;
  if(!seatMap[editSeatCls]) seatMap[editSeatCls]={};
  if(v){ 
    for(const [cid,map] of Object.entries(seatMap)){ 
      const oldKey=Object.keys(map).find(k=>map[k]===v); 
      if(oldKey){ 
        if(cid===editSeatCls&&oldKey!==editSeatKey){ 
          if(seatMap[editSeatCls][editSeatKey]) map[oldKey]=seatMap[editSeatCls][editSeatKey]; else delete map[oldKey]; 
        } else if(cid!==editSeatCls) delete map[oldKey]; 
        break; 
      } 
    } 
    seatMap[editSeatCls][editSeatKey]=v; 
  } else { 
    delete seatMap[editSeatCls][editSeatKey]; 
  }
  closeModal('seatModal');renderAllClassrooms();renderList();
}

function openAddCls(){openModal('addClsModal');}
function addCls(){
  const name=document.getElementById('newClsName').value.trim(); const raw=document.getElementById('newClsLayout').value.trim();
  if(!name||!raw){showAlert('請填寫教室名稱與配置','warning');return;}
  const layout=raw.split('\n').map((l,i)=>({row:i+1,blocks:l.split(',').map(n=>parseInt(n)||0)}));
  const maxSec=Math.max(...layout.map(r=>r.blocks.length));
  const sections=Array.from({length:maxSec},(_,i)=>['左區','中左區','中右區','右區'][i]||`區${i+1}`);
  customCls.push({id:name,name,type:'fan',sections,layout});
  closeModal('addClsModal'); document.getElementById('newClsName').value=''; document.getElementById('newClsLayout').value='';
  renderClsList(); showAlert(`✅ 已新增教室 ${name}`,'success');
}

// 🌟 移植自 Python：純名單 CSV 匯出 (依照教室與學號排序)
function exportCSV(){
  let hasData=false; for(const m of Object.values(seatMap)) if(Object.keys(m).length){hasData=true;break;}
  if(!hasData){showAlert('尚未排列座位','warning');return;}
  
  let csvContent = '\uFEFF教室,學號,姓名\n';
  const list = [];
  
  for (const [clsId, map] of Object.entries(seatMap)) {
      for (const [seatKey, stuId] of Object.entries(map)) {
          const stu = students.find(s => s.id === stuId);
          if (stu) list.push({ clsId, stuId: stu.id, stuName: stu.name });
      }
  }
  
  list.sort((a, b) => {
      if (a.clsId !== b.clsId) return a.clsId.localeCompare(b.clsId);
      return a.stuId.localeCompare(b.stuId);
  });
  
  list.forEach(item => { csvContent += `${item.clsId},${item.stuId},${item.stuName}\n`; });
  
  const blob=new Blob([csvContent],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='座位表名單.csv';a.click();
  showAlert('✅ CSV 名單匯出成功', 'success');
}

// 🌟 移植自 Python：高畫質截圖下載
async function downloadImage() {
    const container = document.getElementById('clsViews');
    if(!selectedCls.size) { showAlert('請先選擇教室並排好座位', 'warning'); return; }
    
    const originalCssText = container.style.cssText;
    const originalScrollX = window.scrollX;
    const originalScrollY = window.scrollY;
    window.scrollTo(0, 0);
    
    container.style.width = 'max-content';
    container.style.overflow = 'visible';
    
    const views = container.querySelectorAll('.cls-view');
    const centers = container.querySelectorAll('.cls-center');
    const originalViewsCss = [];
    const originalCentersCss = [];
    
    views.forEach(v => {
        originalViewsCss.push(v.style.cssText);
        v.style.width = 'max-content';
        v.style.overflow = 'visible';
    });
    
    centers.forEach(c => {
        originalCentersCss.push(c.style.cssText);
        c.style.width = 'max-content';
        c.style.padding = '20px'; 
    });
    
    try {
        showAlert('📸 正在產生完整高畫質圖片，請稍候...', 'info');
        const canvas = await html2canvas(container, { 
            scale: 2, 
            backgroundColor: '#f0f4f8',
            scrollX: 0,
            scrollY: 0
        });
        const link = document.createElement('a');
        link.download = '完整高畫質座位表.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showAlert('✅ 圖片下載成功！', 'success');
    } catch (error) {
        showAlert("❌ 截圖失敗，請稍後再試！", 'error');
    } finally {
        container.style.cssText = originalCssText;
        views.forEach((v, i) => v.style.cssText = originalViewsCss[i]);
        centers.forEach((c, i) => c.style.cssText = originalCentersCss[i]);
        window.scrollTo(originalScrollX, originalScrollY);
    }
}

// 🌟 移植自 Python：智慧型比例偵測列印
async function exportPrint() {
    const container = document.getElementById('clsViews');
    if(!selectedCls.size) { showAlert('請先選擇教室並排好座位', 'warning'); return; }
    
    const originalCssText = container.style.cssText;
    const originalScrollX = window.scrollX;
    const originalScrollY = window.scrollY;
    window.scrollTo(0, 0);
    
    container.style.width = 'max-content';
    container.style.overflow = 'visible';
    
    const views = container.querySelectorAll('.cls-view');
    const centers = container.querySelectorAll('.cls-center');
    const originalViewsCss = [];
    const originalCentersCss = [];
    
    views.forEach(v => {
        originalViewsCss.push(v.style.cssText);
        v.style.width = 'max-content';
        v.style.overflow = 'visible';
    });
    centers.forEach(c => {
        originalCentersCss.push(c.style.cssText);
        c.style.width = 'max-content';
        c.style.padding = '20px';
    });

    const printStyle = document.createElement('style');
    printStyle.id = 'print-theme-css';
    printStyle.innerHTML = `
        .print-mode, .print-mode * { background: transparent !important; color: #000000 !important; border-color: #000000 !important; box-shadow: none !important; text-shadow: none !important; }
        .print-mode { background: #ffffff !important; }
        .print-mode .seat { border: 2px solid #000000 !important; min-height: 65px !important; justify-content: flex-start !important; padding-top: 10px !important; }
        .print-mode .print-wide-stretch .seat { height: 110px !important; margin: 10px 4px !important; }
    `;
    document.head.appendChild(printStyle);
    container.classList.add('print-mode');

    views.forEach(v => {
        const rect = v.getBoundingClientRect();
        if ((rect.width / rect.height) > 1.6) v.classList.add('print-wide-stretch');
    });

    const seats = container.querySelectorAll('.seat');
    const originalSeatHtmls = [];
    seats.forEach(seat => {
        originalSeatHtmls.push(seat.innerHTML);
        seat.innerHTML = seat.innerHTML.replace(/🌸/g, '');
    });

    try {
        showAlert('🖨️ 正在準備智慧排版列印畫面，請稍候...', 'info');
        const w = window.open('', '_blank');
        w.document.write(`
            <html><head><title>列印座位表</title>
            <style>
                @page { size: landscape; margin: 10mm; }
                body { margin: 0; background: #fff; text-align: center; }
                img { max-width: 100%; max-height: 95vh; object-fit: contain; page-break-after: always; margin-bottom: 20px; }
            </style>
            </head><body>
        `);
        
        for (let i = 0; i < views.length; i++) {
            const canvas = await html2canvas(views[i], { scale: 2, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 });
            w.document.write(`<img src="${canvas.toDataURL('image/png')}">`);
        }
        
        w.document.write('</body></html>');
        w.document.close();
        setTimeout(() => { w.focus(); w.print(); }, 500);
        
    } catch (error) {
        showAlert("❌ 列印準備失敗！", 'error');
    } finally {
        container.classList.remove('print-mode');
        const pStyle = document.getElementById('print-theme-css');
        if(pStyle) pStyle.remove();
        views.forEach(v => v.classList.remove('print-wide-stretch'));
        seats.forEach((seat, i) => { seat.innerHTML = originalSeatHtmls[i]; });
        
        container.style.cssText = originalCssText;
        views.forEach((v, i) => v.style.cssText = originalViewsCss[i]);
        centers.forEach((c, i) => c.style.cssText = originalCentersCss[i]);
        window.scrollTo(originalScrollX, originalScrollY);
    }
}

function resetAll(){
  seatMap={};students=[];selectedCls=new Set();
  document.getElementById('studentInput').value=''; document.getElementById('stuInfo').textContent=''; document.getElementById('stuTags').innerHTML=''; document.getElementById('capWrap').style.display='none';
  document.getElementById('quincunxToggle').checked=false; quincunxOn=false;
  document.getElementById('quincunxToggleRow').classList.remove('active'); document.getElementById('quincunxInfo').style.display='none';
  renderClsList();
  document.getElementById('clsViews').innerHTML='<div class="no-result"><div class="icon">🏫</div>請先選擇教室並載入學生名單，<br>然後點擊「開始排座位」</div>';
  document.getElementById('listContent').innerHTML='<div class="no-result"><div class="icon">📋</div>尚未排列座位</div>';
  showAlert('已重設所有資料','info');
}

function switchTab(t){ ['seat','list'].forEach(k=>{ document.getElementById('tab-'+k).classList.toggle('active',k===t); document.getElementById('view-'+k).style.display=k===t?'block':'none'; }); }
function openModal(id){document.getElementById(id).classList.add('show');}
function closeModal(id){document.getElementById(id).classList.remove('show');}
function showAlert(msg,type='info'){ const d=document.getElementById('alertArea'); d.innerHTML=`<div class="alert alert-${type}">${msg}</div>`; setTimeout(()=>d.innerHTML='',3500); }

init();
