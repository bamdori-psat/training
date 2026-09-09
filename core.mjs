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
export function assessMemory(seed,rounds){if(!Array.isArray(rounds)||!rounds.length)throw new Error('완료 기록이 없습니다.');let count=4,score=0,mistakes=0,duration=0;for(let r=0;r<rounds.length;r++){if(mistakes>=3)throw new Error('종료 뒤 입력입니다.');const row=rounds[r],layout=memoryLayout(count,seed,r+1);if(!row||!Array.isArray(row.clicks)||row.clicks.length>count||!Number.isFinite(row.endedAt)||row.endedAt<0)throw new Error('입력 기록이 올바르지 않습니다.');let expected=1,last=0,wrong=false;const seen=new Set();for(const click of row.clicks){if(wrong||expected>count||!Number.isInteger(click.index)||click.index<0||click.index>=count||seen.has(click.index)||!Number.isFinite(click.at)||click.at<last||click.at-last>=3000)throw new Error('입력 기록이 올바르지 않습니다.');seen.add(click.index);last=click.at;if(layout[click.index]===expected){score++;expected++;}else wrong=true;}const complete=expected>count;if(row.endedAt<last)throw new Error('시간 기록이 올바르지 않습니다.');if(complete||wrong){if(row.endedAt-last>100)throw new Error('시간 기록이 올바르지 않습니다.');}else if(row.endedAt-last<3000)throw new Error('시간 초과가 아닙니다.');if(!complete)mistakes++;duration+=3000+row.endedAt+2000;count=complete?count+1:Math.max(2,count-1);}if(mistakes!==3)throw new Error('훈련을 끝까지 완료해 주세요.');return {score,duration};}
export function memoryRows(count,random=Math.random){const base=Math.ceil(Math.sqrt(count)),widths=[...new Set([base-1,base,base+1].map(n=>Math.min(count,5,Math.max(2,n))))];const width=widths[Math.floor(random()*widths.length)],rows=[];for(let left=count;left>0;left-=width)rows.push(Math.min(width,left));if(rows.length>1&&random()<.5){while(Math.max(...rows)-Math.min(...rows)>1){rows[rows.indexOf(Math.max(...rows))]--;rows[rows.indexOf(Math.min(...rows))]++;}}for(let i=rows.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[rows[i],rows[j]]=[rows[j],rows[i]];}return rows;}
export function weekStartKST(now=Date.now()){const day=86400000,shifted=now+9*3600000,midnight=Math.floor(shifted/day)*day;return midnight-((new Date(midnight).getUTCDay()+6)%7)*day-9*3600000;}
