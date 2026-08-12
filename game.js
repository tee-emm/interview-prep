// --- MEMORY RUN -------------------------------------------------------------
// Uses the exact presentation script from presentation.js and the interview
// exemplar answers from drill.js. The game progressively removes cues as
// mastery improves, so practice moves from recognition to active recall.

const modePresentationBtn=document.getElementById('modeStory');
const modeInterviewBtn=document.getElementById('modePath');
modePresentationBtn.innerHTML='<span class="game-badge">🎤</span><strong>Presentation Memory</strong>Learn each slide, its paragraph order and transition, then practise from the title alone.';
modeInterviewBtn.innerHTML='<span class="game-badge">💬</span><strong>Interview Answer Memory</strong>Recall the answer structure and key evidence, then compare it with the full exemplar.';
const heroTitle=document.querySelector('#game .gamehero h2');
const heroSub=document.querySelector('#game .gamehero .sub');
if(heroTitle)heroTitle.textContent='Memory Run';
if(heroSub)heroSub.textContent='The game gets harder as you remember more: cues → sequence → transitions → full recall.';

document.getElementById('newGameRound').textContent='Start memory round';
document.getElementById('resetGameScore').textContent='Reset memory progress';

const previousScore=state.gameScoreData||{};
let memoryGame=state.memoryGame||{
  score:previousScore.score||0,
  streak:previousScore.streak||0,
  rounds:previousScore.rounds||0,
  presentation:{},
  interview:{}
};

let gameMode='presentation';
let gameCurrent=null;
let helpUsed=0;

function saveMemory(){state.memoryGame=memoryGame;save();}
function renderGameStats(){
  document.getElementById('gameScore').textContent=memoryGame.score;
  document.getElementById('gameStreak').textContent=memoryGame.streak;
  document.getElementById('gameRound').textContent=memoryGame.rounds;
}
function shuffled(arr){return [...arr].sort(()=>Math.random()-.5);}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function paras(text){return String(text).split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);}
function sentences(text){return String(text).replace(/\n/g,' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(x=>x.trim()).filter(Boolean)||[String(text).trim()];}
function firstSentence(text){return sentences(text)[0]||String(text);}
function lastSentence(text){const s=sentences(text);return s[s.length-1]||String(text);}
function firstWords(text,n=5){return String(text).split(/\s+/).slice(0,n).join(' ')+'…';}
function cueList(text){return paras(text).map((p,i)=>`<div style="margin:7px 0"><strong>${i+1}.</strong> ${esc(firstWords(p,5))}</div>`).join('');}
function mastery(map,key){return Math.max(0,Math.min(5,Number(map[key]||0)));}
function weightedIndex(items,map,keyFn){
  const bucket=[];
  items.forEach((item,i)=>{
    const m=mastery(map,keyFn(item,i));
    const weight=Math.max(1,6-m);
    for(let x=0;x<weight;x++)bucket.push(i);
  });
  return bucket[Math.floor(Math.random()*bucket.length)];
}
function choiceButton(text,onClick){
  const b=document.createElement('button');
  b.className='gamechoice';
  b.textContent=text;
  b.onclick=()=>onClick(b);
  return b;
}
function clearRound(){
  helpUsed=0;
  document.getElementById('gameChoices').innerHTML='';
  document.getElementById('gameSequence').innerHTML='';
  const f=document.getElementById('gameFeedback');f.className='gamefeedback';f.innerHTML='';
  const cue=document.getElementById('memoryCue');cue.classList.add('hidden');cue.innerHTML='';
  const cueBtn=document.getElementById('sayCueBtn');cueBtn.classList.add('hidden');cueBtn.textContent='Show memory cue';
  const next=document.getElementById('nextGameRound');next.classList.add('hidden');next.textContent='Next round';
}
function chooseGameMode(mode){
  gameMode=mode;
  modePresentationBtn.classList.toggle('active',mode==='presentation');
  modeInterviewBtn.classList.toggle('active',mode==='interview');
  document.getElementById('gameModeLabel').textContent=mode==='presentation'?'Presentation Memory':'Interview Answer Memory';
  document.getElementById('gameCategory').textContent=mode==='presentation'?'Presentation':'Interview';
  document.getElementById('gamePrompt').textContent='Press “Start memory round” to begin.';
  clearRound();
}

function challengeForPresentation(m){
  if(m<=0)return 'guided';
  if(m===1)return Math.random()<.5?'opening':'guided';
  if(m===2)return Math.random()<.55?'sequence':'opening';
  if(m===3)return Math.random()<.55?'transition':'sequence';
  return Math.random()<.7?'full':'transition';
}
function challengeForInterview(m){
  if(m<=0)return 'guided';
  if(m===1)return Math.random()<.5?'opening':'guided';
  if(m===2)return Math.random()<.55?'ending':'opening';
  if(m===3)return Math.random()<.6?'cueRecall':'ending';
  return Math.random()<.75?'full':'cueRecall';
}

function startGameRound(){
  clearRound();
  if(gameMode==='presentation')startPresentationRound(); else startInterviewRound();
}

function startPresentationRound(){
  const idx=weightedIndex(slides,memoryGame.presentation,s=>s.n);
  const s=slides[idx];
  const m=mastery(memoryGame.presentation,s.n);
  const type=challengeForPresentation(m);
  gameCurrent={kind:'presentation',idx,key:s.n,item:s,type};
  document.getElementById('gameCategory').textContent=`Slide ${s.n} · mastery ${m}/5`;

  if(type==='guided'){
    document.getElementById('gameModeLabel').textContent='Level 1 · Guided recall';
    document.getElementById('gamePrompt').innerHTML=`<strong>Slide ${s.n}: ${esc(s.title)}</strong><br><span class="muted">Use the paragraph-start cues below and say the whole slide aloud in order.</span>`;
    const cue=document.getElementById('memoryCue');
    cue.innerHTML=`<strong>First-word cues</strong>${cueList(s.script)}<div style="margin-top:9px"><strong>Transition starts:</strong> ${esc(firstWords(s.transition,4))}</div>`;
    cue.classList.remove('hidden');helpUsed=1;
    document.getElementById('gameChoices').appendChild(choiceButton('I recited it — show the script',()=>showRecallCheck(s.script,s.transition)));
  }else if(type==='opening'){
    document.getElementById('gameModeLabel').textContent='Level 2 · Opening line';
    document.getElementById('gamePrompt').innerHTML=`<strong>Slide ${s.n}: ${esc(s.title)}</strong><br>Which sentence starts your spoken script?`;
    const correct=firstSentence(s.script);
    const distractors=shuffled(slides.filter((_,i)=>i!==idx)).slice(0,3).map(x=>firstSentence(x.script));
    renderAutoChoices(shuffled([correct,...distractors]),correct,`The opening is: “${correct}”`);
  }else if(type==='sequence'){
    const p=paras(s.script);
    if(p.length<2){startPresentationRound();return;}
    const pos=Math.floor(Math.random()*(p.length-1));
    const correct=firstSentence(p[pos+1]);
    const distractors=shuffled(slides.filter((_,i)=>i!==idx).flatMap(x=>paras(x.script).map(firstSentence))).slice(0,3);
    document.getElementById('gameModeLabel').textContent='Level 3 · What comes next?';
    document.getElementById('gamePrompt').innerHTML=`<strong>Slide ${s.n}: ${esc(s.title)}</strong><br><span class="muted">After this paragraph:</span><br><br>${esc(p[pos])}<br><br><strong>Which line starts the next paragraph?</strong>`;
    renderAutoChoices(shuffled([correct,...distractors]),correct,`Next paragraph: “${correct}”`);
  }else if(type==='transition'){
    document.getElementById('gameModeLabel').textContent='Level 4 · Transition';
    document.getElementById('gamePrompt').innerHTML=`<strong>Slide ${s.n}: ${esc(s.title)}</strong><br>Which transition takes you into the next slide?`;
    const correct=s.transition;
    const distractors=shuffled(slides.filter((_,i)=>i!==idx)).slice(0,3).map(x=>x.transition);
    renderAutoChoices(shuffled([correct,...distractors]),correct,`Your transition is: “${correct}”`);
  }else{
    document.getElementById('gameModeLabel').textContent='Level 5 · Naked recall';
    document.getElementById('gamePrompt').innerHTML=`<strong>Slide ${s.n}: ${esc(s.title)}</strong><br><span class="muted">No cues. Recite the full slide and transition aloud from memory.</span>`;
    const cueBtn=document.getElementById('sayCueBtn');cueBtn.classList.remove('hidden');cueBtn.textContent='I’m stuck — show first words';
    cueBtn.onclick=()=>{helpUsed++;const cue=document.getElementById('memoryCue');cue.innerHTML=`<strong>First-word cues</strong>${cueList(s.script)}<div style="margin-top:9px"><strong>Transition:</strong> ${esc(firstWords(s.transition,4))}</div>`;cue.classList.remove('hidden');};
    document.getElementById('gameChoices').appendChild(choiceButton('Check myself against the script',()=>showRecallCheck(s.script,s.transition)));
  }
}

function startInterviewRound(){
  const idx=weightedIndex(questions,memoryGame.interview,(_,i)=>String(i));
  const q=questions[idx];
  const key=String(idx);const m=mastery(memoryGame.interview,key);
  const type=challengeForInterview(m);
  gameCurrent={kind:'interview',idx,key,item:q,type};
  document.getElementById('gameCategory').textContent=`${q.c} · mastery ${m}/5`;

  if(type==='guided'){
    document.getElementById('gameModeLabel').textContent='Level 1 · Guided answer';
    document.getElementById('gamePrompt').innerHTML=`<strong>${esc(q.q)}</strong><br><span class="muted">Say your answer aloud using the cues. Focus on the story, your actions and evidence.</span>`;
    const cue=document.getElementById('memoryCue');cue.innerHTML=`<strong>Scoring anchors:</strong> ${q.t.map(x=>`<span class="chip blue">${esc(x)}</span>`).join(' ')}<div style="margin-top:10px"><strong>Paragraph starts</strong>${cueList(q.a)}</div>`;cue.classList.remove('hidden');helpUsed=1;
    document.getElementById('gameChoices').appendChild(choiceButton('I answered — show the exemplar',()=>showRecallCheck(q.a,null)));
  }else if(type==='opening'){
    document.getElementById('gameModeLabel').textContent='Level 2 · Start the answer';
    document.getElementById('gamePrompt').innerHTML=`<strong>${esc(q.q)}</strong><br>Which sentence opens your exemplar answer?`;
    const correct=firstSentence(q.a);
    const distractors=shuffled(questions.filter((_,i)=>i!==idx)).slice(0,3).map(x=>firstSentence(x.a));
    renderAutoChoices(shuffled([correct,...distractors]),correct,`Your answer opens: “${correct}”`);
  }else if(type==='ending'){
    document.getElementById('gameModeLabel').textContent='Level 3 · Land the answer';
    document.getElementById('gamePrompt').innerHTML=`<strong>${esc(q.q)}</strong><br>Which sentence is the final idea in your exemplar?`;
    const correct=lastSentence(q.a);
    const distractors=shuffled(questions.filter((_,i)=>i!==idx)).slice(0,3).map(x=>lastSentence(x.a));
    renderAutoChoices(shuffled([correct,...distractors]),correct,`Your answer lands on: “${correct}”`);
  }else if(type==='cueRecall'){
    document.getElementById('gameModeLabel').textContent='Level 4 · Key-point recall';
    document.getElementById('gamePrompt').innerHTML=`<strong>${esc(q.q)}</strong><br><span class="muted">Answer aloud. You only get the scoring anchors — no paragraph cues.</span><br><br>${q.t.map(x=>`<span class="chip blue">${esc(x)}</span>`).join(' ')}`;
    const cueBtn=document.getElementById('sayCueBtn');cueBtn.classList.remove('hidden');cueBtn.textContent='Need help — show paragraph starts';
    cueBtn.onclick=()=>{helpUsed++;const cue=document.getElementById('memoryCue');cue.innerHTML=`<strong>Paragraph starts</strong>${cueList(q.a)}`;cue.classList.remove('hidden');};
    document.getElementById('gameChoices').appendChild(choiceButton('Check myself against the exemplar',()=>showRecallCheck(q.a,null)));
  }else{
    document.getElementById('gameModeLabel').textContent='Level 5 · Answer from memory';
    document.getElementById('gamePrompt').innerHTML=`<strong>${esc(q.q)}</strong><br><span class="muted">No cues. Give the answer aloud as if the panel asked you.</span>`;
    const cueBtn=document.getElementById('sayCueBtn');cueBtn.classList.remove('hidden');cueBtn.textContent='I’m stuck — show anchors';
    cueBtn.onclick=()=>{helpUsed++;const cue=document.getElementById('memoryCue');cue.innerHTML=`<strong>Scoring anchors:</strong> ${q.t.map(x=>`<span class="chip blue">${esc(x)}</span>`).join(' ')}<div style="margin-top:10px"><strong>Paragraph starts</strong>${cueList(q.a)}</div>`;cue.classList.remove('hidden');};
    document.getElementById('gameChoices').appendChild(choiceButton('Check myself against the exemplar',()=>showRecallCheck(q.a,null)));
  }
}

function renderAutoChoices(options,correct,explanation){
  const box=document.getElementById('gameChoices');
  options.forEach(text=>box.appendChild(choiceButton(text,b=>{
    const ok=text===correct;
    document.querySelectorAll('#gameChoices .gamechoice').forEach(x=>{x.disabled=true;if(x.textContent===correct)x.classList.add('correct');});
    if(!ok)b.classList.add('wrong');
    finishAuto(ok,explanation);
  })));
}

function finishAuto(correct,explanation){
  const map=gameCurrent.kind==='presentation'?memoryGame.presentation:memoryGame.interview;
  const before=mastery(map,gameCurrent.key);
  memoryGame.rounds++;
  if(correct){
    memoryGame.streak++;
    memoryGame.score+=100+Math.min(memoryGame.streak-1,5)*20;
    map[gameCurrent.key]=Math.min(5,before+1);
  }else{
    memoryGame.streak=0;
    memoryGame.score+=10;
    map[gameCurrent.key]=Math.max(0,before-1);
  }
  saveMemory();renderGameStats();
  const after=mastery(map,gameCurrent.key);
  const f=document.getElementById('gameFeedback');f.className='gamefeedback show '+(correct?'good':'retry');
  f.innerHTML=`<strong>${correct?'✓ Correct — retrieval strengthened':'↺ Not yet — this item will come back sooner'}</strong><br>${esc(explanation)}<div style="margin-top:8px"><strong>Mastery:</strong> ${after}/5</div>`;
  document.getElementById('nextGameRound').classList.remove('hidden');
}

function showRecallCheck(answer,transition){
  document.querySelectorAll('#gameChoices .gamechoice').forEach(x=>x.disabled=true);
  const f=document.getElementById('gameFeedback');f.className='gamefeedback show';
  f.innerHTML=`<strong>Compare with the source</strong><div style="white-space:pre-line;margin-top:10px;line-height:1.55">${esc(answer)}</div>${transition?`<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(0,0,0,.12)"><strong>Transition:</strong> ${esc(transition)}</div>`:''}<div style="margin-top:14px"><strong>How much did you retrieve before looking?</strong></div>`;
  const row=document.createElement('div');row.className='row';row.style.marginTop='9px';
  const strong=document.createElement('button');strong.className='btn small';strong.textContent='Got it';strong.onclick=()=>gradeRecall('strong');
  const cue=document.createElement('button');cue.className='btn secondary small';cue.textContent='Needed a cue';cue.onclick=()=>gradeRecall('cue');
  const miss=document.createElement('button');miss.className='btn ghost small';miss.textContent='Lost the sequence';miss.onclick=()=>gradeRecall('miss');
  row.append(strong,cue,miss);f.appendChild(row);
}

function gradeRecall(grade){
  const map=gameCurrent.kind==='presentation'?memoryGame.presentation:memoryGame.interview;
  const before=mastery(map,gameCurrent.key);
  memoryGame.rounds++;
  if(grade==='strong'&&helpUsed===0){
    memoryGame.streak++;memoryGame.score+=140+Math.min(memoryGame.streak-1,5)*20;map[gameCurrent.key]=Math.min(5,before+1);
  }else if(grade==='strong'){
    memoryGame.streak++;memoryGame.score+=100;map[gameCurrent.key]=Math.min(5,before+1);
  }else if(grade==='cue'){
    memoryGame.streak=0;memoryGame.score+=55;map[gameCurrent.key]=before;
  }else{
    memoryGame.streak=0;memoryGame.score+=15;map[gameCurrent.key]=Math.max(0,before-1);
  }
  saveMemory();renderGameStats();
  const after=mastery(map,gameCurrent.key);
  const f=document.getElementById('gameFeedback');
  const note=document.createElement('div');note.style.marginTop='12px';note.innerHTML=`<strong>Saved.</strong> Mastery is now ${after}/5. ${after<5?'This item will keep returning, with fewer cues as mastery rises.':'You reached full-recall level for this item.'}`;
  f.appendChild(note);
  f.querySelectorAll('button').forEach(b=>b.disabled=true);
  document.getElementById('nextGameRound').classList.remove('hidden');
}

modePresentationBtn.onclick=()=>chooseGameMode('presentation');
modeInterviewBtn.onclick=()=>chooseGameMode('interview');
document.getElementById('newGameRound').onclick=startGameRound;
document.getElementById('nextGameRound').onclick=startGameRound;
document.getElementById('resetGameScore').onclick=()=>{
  if(confirm('Reset score and all presentation/interview mastery?')){
    memoryGame={score:0,streak:0,rounds:0,presentation:{},interview:{}};
    saveMemory();renderGameStats();chooseGameMode(gameMode);toast('Memory progress reset');
  }
};

chooseGameMode('presentation');
renderGameStats();
