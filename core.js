
const STORE='tm_sdr_prep_v1';
const saved=JSON.parse(localStorage.getItem(STORE)||'{}');
const state=Object.assign({tasks:{},stories:{},requirements:{},scores:[]},saved);
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1200)}
function switchView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
window.switchView=switchView;
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));

const interviewAt=new Date('2026-08-13T11:00:00-04:00');
function updateCountdown(){
  let d=interviewAt-new Date();
  const el=document.getElementById('countdown');
  if(d<=0){el.textContent='Interview time';return}
  const h=Math.floor(d/3600000), m=Math.floor((d%3600000)/60000);
  el.textContent=`${h}h ${String(m).padStart(2,'0')}m`;
}
updateCountdown();setInterval(updateCountdown,30000);

const tasks=[
 ['pSkeleton','Explain all five content slides without the script','25 min'],
 ['pTimed','Complete one timed presentation run','15 min'],
 ['stories','Say the five core stories aloud','35 min'],
 ['questions','Answer 8 random interview questions','35 min'],
 ['qa','Practice 8 presentation follow-up questions','25 min'],
 ['panel','Run one five-question mock panel','20 min'],
 ['final','Do one final presentation run, then stop','15 min']
];
function renderTasks(){
 const box=document.getElementById('todayTasks');box.innerHTML='';
 tasks.forEach(([id,text,time])=>{
   const row=document.createElement('label');row.className='task'+(state.tasks[id]?' done':'');
   row.innerHTML=`<input type="checkbox" ${state.tasks[id]?'checked':''}><span class="tasktext">${text}</span><span class="tasktime">${time}</span>`;
   row.querySelector('input').onchange=e=>{state.tasks[id]=e.target.checked;save();renderTasks();};
   box.appendChild(row);
 });
 const n=tasks.filter(t=>state.tasks[t[0]]).length,p=Math.round(n/tasks.length*100);
 document.getElementById('todayPct').textContent=p+'%';document.getElementById('todayBar').style.width=p+'%';
}
renderTasks();
