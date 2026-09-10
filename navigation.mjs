// GitHub Pages와 단일 HTML 미리보기에서 함께 쓰는 화면별 방문 기록.
export function createScreenHistory({render,isPlaying,canRestore=()=>false,stop}){
 const w=window,page=w.location.pathname,key='trainingScreen',screens=['home','records','ranking','play','result'];
 let current='home',depth=0,applying=false,restoring=false,pendingHome=false,queued=null;
 const parse=()=>{const id=w.location.hash.slice(1);return screens.includes(id)?id:'home';};
 const state=()=>w.history.state?.[key];
 const url=id=>w.location.pathname+w.location.search+(id==='home'?'':'#'+id);
 const write=(id,n,replace=false)=>{w.history[replace?'replaceState':'pushState']({[key]:{page,id,depth:n}},'',url(id));current=id;depth=n;};
 const display=id=>{applying=true;try{render(id);}finally{applying=false;}};
 function commit(id){if(applying)return;if(pendingHome){queued=id;return;}if(id===current)return;
  if(id==='home'&&depth>0){current='home';pendingHome=true;w.history.go(-depth);return;}
  const replace=current==='play'&&id==='result'||current==='result'&&id==='play';write(id,replace?depth:depth+1,replace);
 }
 function restore(){const entry=state(),target=parse(),targetDepth=entry?.page===page?entry.depth:depth+1;
  if(restoring){restoring=false;return;}
  if(pendingHome){pendingHome=false;depth=targetDepth;current=target;if(queued&&queued!=='home'){const next=queued;queued=null;write(next,depth+1);return;}queued=null;display(target);return;}
  if(isPlaying()&&target!==current&&!w.confirm('이번 훈련을 그만할까요? 진행 중인 기록은 저장되지 않습니다.')){restoring=true;w.history.go(depth-targetDepth);return;}
  if(isPlaying()&&target!==current)stop();
  depth=targetDepth;current=target;
  // 완료·중단한 훈련은 앞으로가기로 재개하지 않습니다.
  if(target==='play'||target==='result'&&!canRestore('result')){write('home',depth,true);display('home');return;}
  display(target);
 }
 w.addEventListener('popstate',restore);
 return {commit,init(){const target=parse(),entry=state();
   if(entry?.page===page&&Number.isInteger(entry.depth)){depth=entry.depth;current=target;if(['play','result'].includes(target)){write('home',depth,true);display('home');}else display(target);return;}
   write('home',0,true);if(['records','ranking'].includes(target))write(target,1);display(current);
 }};
}
