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
