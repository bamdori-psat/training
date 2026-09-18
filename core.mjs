export const COURSES = {
  easy: { name: 'Easy', startRange: [61,79], stepRange: [3,6] },
  normal: { name: 'Normal', startRange: [81,139], stepRange: [5,9] },
  hard: { name: 'Hard', startRange: [141,299], stepRange: [7,14] }
};
export function sequence(start, step) {
  if (!Number.isInteger(start) || !Number.isInteger(step) || start < 2 || start > 999 || step < 1 || step >= start || Math.floor((start-1)/step)>100) throw new Error('시작 수는 2~999, 빼는 수는 1 이상이며, 정답 수는 100개 이하여야 합니다.');
  return Array.from({length: Math.floor((start-1)/step)}, (_, i) => start-step*(i+1));
}
export function assess(start, step, attempts) {
  const expected=sequence(start,step); let correct=0;
  if (!Array.isArray(attempts) || attempts.length>500) throw new Error('입력 기록이 올바르지 않습니다.');
  for(const n of attempts) {
    if(!Number.isInteger(n)||n<0||n>999||correct===expected.length) throw new Error('입력 기록이 올바르지 않습니다.');
    if(n===expected[correct]) correct++;
  }
  return {correct,complete:correct===expected.length,total:expected.length};
}
export const validNickname = n => typeof n==='string' && /^[가-힣a-zA-Z0-9_]{2,12}$/.test(n);

export function courseSteps(course) {
  const list=course==='all'?Object.values(COURSES):[COURSES[course]];
  if(list.some(c=>!c))throw new Error('코스를 확인해 주세요.');
  return [...new Set(list.flatMap(c=>Array.from({length:c.stepRange[1]-c.stepRange[0]+1},(_,i)=>c.stepRange[0]+i)))].filter(n=>n!==5&&n!==10).sort((a,b)=>a-b);
}
export function randomProblem(course, random = Math.random) {
  if (!Object.hasOwn(COURSES,course)) throw new Error('코스를 확인해 주세요.');
  const c=COURSES[course], pick=([min,max])=>min+Math.floor(random()*(max-min+1));
  const steps=courseSteps(course);
  return {start:pick(c.startRange),step:steps[Math.floor(random()*steps.length)],name:c.name};
}

export function formatKST(value){if(!Number.isFinite(value))return '';const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));const get=t=>p.find(x=>x.type===t).value;return `${get('year')}.${get('month')}.${get('day')} ${get('hour')}:${get('minute')}:${get('second')} KST`;}
export function memoryLayout(count,seed,round){let x=(seed^Math.imul(round,2654435761))>>>0;const random=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};const a=Array.from({length:count},(_,i)=>i+1);for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export const MEMORY_INPUT_MS = 1000;
export function assessMemory(seed,rounds){if(!Array.isArray(rounds)||!rounds.length)throw new Error('완료 기록이 없습니다.');let count=4,score=0,mistakes=0,duration=0;for(let r=0;r<rounds.length;r++){if(mistakes>=3)throw new Error('종료 뒤 입력입니다.');const row=rounds[r],layout=memoryLayout(count,seed,r+1);if(!row||!Array.isArray(row.clicks)||row.clicks.length>count||!Number.isFinite(row.endedAt)||row.endedAt<0)throw new Error('입력 기록이 올바르지 않습니다.');let expected=1,last=0,wrong=false;const seen=new Set();for(const click of row.clicks){if(wrong||expected>count||!Number.isInteger(click.index)||click.index<0||click.index>=count||seen.has(click.index)||!Number.isFinite(click.at)||click.at<last||click.at-last>=MEMORY_INPUT_MS)throw new Error('입력 기록이 올바르지 않습니다.');seen.add(click.index);last=click.at;if(layout[click.index]===expected){score++;expected++;}else wrong=true;}const complete=expected>count;if(row.endedAt<last)throw new Error('시간 기록이 올바르지 않습니다.');if(complete||wrong){if(row.endedAt-last>100)throw new Error('시간 기록이 올바르지 않습니다.');}else if(row.endedAt-last<MEMORY_INPUT_MS)throw new Error('시간 초과가 아닙니다.');if(!complete)mistakes++;duration+=2000+row.endedAt+2000;count=complete?count+1:Math.max(2,count-1);}if(mistakes!==3)throw new Error('훈련을 끝까지 완료해 주세요.');return {score,duration};}
export function memoryRows(count,random=Math.random){const base=Math.ceil(Math.sqrt(count)),widths=[...new Set([base-1,base,base+1].map(n=>Math.min(count,5,Math.max(2,n))))];const width=widths[Math.floor(random()*widths.length)],rows=[];for(let left=count;left>0;left-=width)rows.push(Math.min(width,left));if(rows.length>1&&random()<.5){while(Math.max(...rows)-Math.min(...rows)>1){rows[rows.indexOf(Math.max(...rows))]--;rows[rows.indexOf(Math.min(...rows))]++;}}for(let i=rows.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[rows[i],rows[j]]=[rows[j],rows[i]];}return rows;}
export function weekStartKST(now=Date.now()){const day=86400000,shifted=now+9*3600000,midnight=Math.floor(shifted/day)*day;return midnight-((new Date(midnight).getUTCDay()+6)%7)*day-9*3600000;}
// 터치/펜/마우스 즉시 입력과 click 대체 경로를 함께 지원합니다.
export function bindPressInput(container,selector,activate){let lastButton=null,lastAt=-Infinity;const immediate=e=>{if(e.type==='pointerdown'&&e.pointerType!=='touch'&&e.pointerType!=='pen'&&e.button!==0)return;const b=e.target.closest(selector);if(!b||b.disabled)return;if(e.cancelable)e.preventDefault();lastButton=b;lastAt=performance.now();activate(b);};container.addEventListener('pointerdown',immediate);if(!window.PointerEvent)container.addEventListener('touchstart',immediate,{passive:false});container.addEventListener('click',e=>{const b=e.target.closest(selector);if(!b||b.disabled)return;if(b===lastButton&&performance.now()-lastAt<1000){e.preventDefault();return;}activate(b);});}
export function memoryBoardSize(width,height,columns,rows){const w=Math.max(0,width),h=Math.max(0,height);const unit=Math.max(0,Math.min(w/columns,h/rows)),gap=Math.min(10,unit*.1);const tile=Math.max(0,Math.min((w-gap*(columns-1))/columns,(h-gap*(rows-1))/rows));return {tile,gap,width:columns*tile+(columns-1)*gap,height:rows*tile+(rows-1)*gap,font:Math.min(36,tile*.38),radius:Math.min(16,tile*.16)};}
export function memoryShapeBounds(count){const base=Math.ceil(Math.sqrt(count));const widths=[base-1,base,base+1].map(n=>Math.min(count,5,Math.max(2,n)));return {columns:Math.max(...widths),rows:Math.ceil(count/Math.min(...widths))};}
export function bindHubShare(root=document){const text='주변 사람들의 뇌도 말랑말랑하게 만들어 주세요!',url='https://bamdori-psat.github.io/training/';root.querySelectorAll('[data-hub-share]').forEach(button=>{button.addEventListener('click',async()=>{const box=button.closest('.hub-share'),status=box.querySelector('[role=status]'),fallback=box.querySelector('textarea');status.textContent='';fallback.hidden=true;button.disabled=true;try{if(window.navigator.share){try{await window.navigator.share({title:'밤도리 인지훈련',text,url});return;}catch(e){if(e.name==='AbortError')return;}}const content=text+'\n'+url;try{if(!window.navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await window.navigator.clipboard.writeText(content);status.textContent='공유 문구와 링크를 복사했습니다.';}catch{fallback.value=content;fallback.hidden=false;fallback.focus();fallback.select();status.textContent='선택된 문구와 링크를 복사해 주세요.';}}finally{button.disabled=false;}});});}

export const ARITHMETIC_MODES={add:'덧셈',subtract:'뺄셈',multiply:'곱셈',mixed:'혼합형'};
export const ARITHMETIC_LENGTHS={short:20,normal:50,long:100};
export function arithmeticQuestions(mode,length,seed){
 if(!Object.hasOwn(ARITHMETIC_MODES,mode)||!Object.hasOwn(ARITHMETIC_LENGTHS,length)||!Number.isInteger(seed)||seed<0||seed>4294967295)throw new Error('훈련 옵션을 확인해 주세요.');
 let state=seed>>>0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;},pick=(a,b)=>a+Math.floor(rand()*(b-a+1));
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=pick(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
 const quota=(n,weights)=>{const items=shuffle(weights.map((w,i)=>({i,count:Math.floor(n*w),fraction:n*w-Math.floor(n*w)})));let left=n-items.reduce((s,x)=>s+x.count,0);items.sort((a,b)=>b.fraction-a.fraction);for(let i=0;i<left;i++)items[i].count++;return items.sort((a,b)=>a.i-b.i).map(x=>x.count);};
 const types={add:['a2','a3'],subtract:['s2'],multiply:['m1','m2']},weights={add:[.5,.5],subtract:[1],multiply:[.8,.2]};
 const kinds=[];const addTypes=(group,n)=>quota(n,weights[group]).forEach((count,i)=>{for(let j=0;j<count;j++)kinds.push(types[group][i]);});
 const total=ARITHMETIC_LENGTHS[length];
 if(mode==='mixed'){const counts=quota(total,[.2,.2,.2,.15,.15,.1]);['add','subtract','multiply'].forEach((g,i)=>addTypes(g,counts[i]));['as','ma','ms'].forEach((g,i)=>{for(let j=0;j<counts[i+3];j++)kinds.push(g);});}else addTypes(mode,total);
 return shuffle(kinds).map(kind=>{let a,b,c,answer,text;do{
 a=pick(10,99);b=pick(2,9);c=pick(10,99);
 if(['a2','a3','s2','as'].includes(kind))b=pick(10,99);
 if(kind==='m2')b=pick(11,19);
 switch(kind){case'a2':answer=a+b;text=`${a} + ${b}`;break;case'a3':answer=a+b+c;text=`${a} + ${b} + ${c}`;break;case's2':answer=a-b;text=`${a} − ${b}`;break;case'm1':case'm2':answer=a*b;text=`${a} × ${b}`;break;case'as':answer=a+b-c;text=`${a} + ${b} − ${c}`;break;case'ma':answer=a*b+c;text=`(${a} × ${b}) + ${c}`;break;case'ms':answer=a*b-c;text=`(${a} × ${b}) − ${c}`;break;}
 }while(answer<0||(kind==='m2'&&answer>=1000)||(kind==='s2'&&Math.floor(a/10)===Math.floor(b/10))||(kind==='ms'&&(a*b>99||Math.floor(a*b/10)===Math.floor(c/10)))||(kind==='as'&&a+b<100&&Math.floor((a+b)/10)===Math.floor(c/10)));
 return {kind,a,b,c,answer,text};});
}
export function assessArithmetic(mode,length,seed,attempts){const questions=arithmeticQuestions(mode,length,seed);if(!Array.isArray(attempts)||attempts.length>2000)throw new Error('입력 기록이 올바르지 않습니다.');let correct=0;for(const value of attempts){if(!Number.isInteger(value)||value<0||value>9999||correct===questions.length)throw new Error('입력 기록이 올바르지 않습니다.');if(value===questions[correct].answer)correct++;}return {total:questions.length,complete:correct===questions.length};}

export function rankingCondition(game,record){const span=document.createElement('span');span.className='rank-condition';const strong=document.createElement('strong');strong.textContent=game==='subtraction'?(COURSES[record.course]?.name||''):(ARITHMETIC_MODES[record.mode]||'');span.append(strong);span.append(game==='subtraction'?` · ${record.step}씩 빼기${record.start!=null?' · 시작 '+record.start:''}`:` · ${ARITHMETIC_LENGTHS[record.length]}문제`);return span;}
