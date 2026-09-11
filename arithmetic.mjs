import {requestTrainingJSON} from './network.mjs?v=20260911-arithmetic3';
import {createScreenHistory} from './navigation.mjs?v=20260911-arithmetic3';
import {createRankingExplorer} from './analytics.mjs?v=20260911-arithmetic3';
import {ARITHMETIC_MODES,ARITHMETIC_LENGTHS,arithmeticQuestions,validNickname,formatKST,rankingCondition,bindPressInput,bindHubShare} from './core.mjs?v=20260911-arithmetic3';
const $=id=>document.getElementById(id), apiBase=(window.TRAINING_CONFIG?.apiBase||'').replace(/\/$/,'');
const storage={get(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}};
let identity=storage.get('training.identity',null); if(typeof identity!=='string'||identity.length!==36)identity=crypto.randomUUID();storage.set('training.identity',identity);
let mode='add',length='short',phase='home',run=null,timer=null,rankRequest=0,wrongAnimation=null;
const keyButtons=new Map([...document.querySelectorAll('[data-key]')].map(b=>[b.dataset.key,b])),pressTimers=new WeakMap();
function press(k){const button=keyButtons.get(k);if(!button)return;clearTimeout(pressTimers.get(button));button.classList.add('pressed');pressTimers.set(button,setTimeout(()=>button.classList.remove('pressed'),120));}
const format=n=>(n/1000).toFixed(2);
let navigation;
function show(id){navigation?.commit(id);document.querySelectorAll('.screen').forEach(e=>e.hidden=e.id!==id);phase=id;window.scrollTo(0,0);}
function localRecords(){const rows=storage.get('training.arithmetic.records',[]);return Array.isArray(rows)?rows.filter(r=>r&&Number.isFinite(r.elapsed)&&Number.isInteger(r.total)&&r.total>0).slice(0,50).map(r=>({...r,average:r.elapsed/r.total})):[];}
async function api(path,body){return requestTrainingJSON(apiBase+'/arithmetic'+path,body);}
function homeNote(){$('homeStatus').textContent='';}
function chooseOption(group,key,b){document.querySelectorAll(`[data-${key}]`).forEach(el=>{const active=el===b;el.classList.toggle('chosen',active);el.setAttribute('aria-pressed',active);});}
$('modes').onclick=e=>{const b=e.target.closest('[data-mode]');if(!b)return;mode=b.dataset.mode;chooseOption('modes','mode',b);$('previewCurrent').textContent={add:'38 + 47',subtract:'83 − 56',multiply:'24 × 7',mixed:'(16 × 4) − 28'}[mode];};
$('lengths').onclick=e=>{const b=e.target.closest('[data-length]');if(!b)return;length=b.dataset.length;chooseOption('lengths','length',b);};
function inputDisplay(){$('answer').textContent=run.input||'답을 입력하세요';$('answer').classList.toggle('placeholder',!run.input);$('answer').classList.toggle('wrong',Boolean(run.rejected));}
function refresh(){$('current').textContent=run.questions[run.correct]?.text||'';$('progressFill').style.width=100*run.correct/run.expected.length+'%';inputDisplay();}
async function start(){if($('start').disabled)return;
$('start').disabled=true;$('homeStatus').textContent='';let remote=null,params;
try{remote=apiBase?await api('/start',{mode,length,identity}):null;params={seed:remote?.seed??crypto.getRandomValues(new Uint32Array(1))[0]};}catch(e){$('homeStatus').textContent=`훈련을 시작하지 못했습니다. ${e.message}`;$('start').disabled=false;return;}
const questions=arithmeticQuestions(mode,length,params.seed),expected=questions.map(q=>q.answer);
run={mode,length,questions,expected,correct:0,input:'',rejected:false,attempts:[],ready:false,remote,published:false,label:`${ARITHMETIC_MODES[mode]} · ${ARITHMETIC_LENGTHS[length]}문제`};
show('play');$('timer').textContent='0.0초';$('modeLabel').textContent=run.label;$('feedback').textContent='';$('keypad').inert=true;
const readyAt=performance.now()+3000;run.started=readyAt;refresh();$('current').textContent='3';clearInterval(timer);
timer=setInterval(()=>{if(phase!=='play')return;const now=performance.now();if(now<readyAt){$('current').textContent=Math.ceil((readyAt-now)/1000);return;}if(!run.ready){run.started=now;run.ready=true;$('keypad').inert=false;refresh();}$('timer').textContent=((now-run.started)/1000).toFixed(1)+'초';},50);$('start').disabled=false;}
$('start').onclick=start;
function key(k){
 if(phase!=='play'||!run.ready||$('quitDialog').open)return;
 if(!/^\d$/.test(k)&&!['back','clear'].includes(k))return;
 press(k);
 const wasRejected=run.rejected;wrongAnimation?.cancel();
 run.rejected=false;$('answer').classList.remove('shake');$('feedback').textContent='';
 if(k==='back')run.input=run.input.slice(0,-1);
 else if(k==='clear')run.input='';
 else {if(wasRejected)run.input='';run.input+=k;}
 if(/^\d$/.test(k)&&run.input.length===String(run.expected[run.correct]).length)submit();
 else inputDisplay();
}
bindPressInput($('keypad'),'[data-key]',b=>key(b.dataset.key));
document.addEventListener('keydown',e=>{if(phase!=='play'||e.ctrlKey||e.metaKey||e.altKey||$('quitDialog').open)return;if(/^\d$/.test(e.key)||['Backspace','Delete'].includes(e.key)){e.preventDefault();if(e.repeat)return;key(e.key==='Backspace'?'back':e.key==='Delete'?'clear':e.key);}});
function submit(){
 if(!run.ready||!run.input||phase!=='play')return;
 const n=Number(run.input);run.attempts.push(n);
 if(n===run.expected[run.correct]){if(run.correct+1===run.expected.length)run.elapsed=Math.round(performance.now()-run.started);run.correct++;run.input='';run.rejected=false;$('feedback').textContent='';}
 else{run.rejected=true;$('feedback').textContent='오답입니다. 다음 숫자부터 다시 입력하세요.';}
 if(run.rejected){inputDisplay();if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)wrongAnimation=$('answer').animate?.([{transform:'translateX(0)'},{transform:'translateX(-7px)'},{transform:'translateX(7px)'},{transform:'translateX(-7px)'},{transform:'translateX(0)'}],{duration:280});}
 else refresh();
 if(run.correct===run.expected.length)finish();
 else if(run.attempts.length>=2000){clearInterval(timer);show('home');$('homeStatus').textContent='입력이 2,000회에 도달해 종료했습니다. 다시 시작해 주세요.';}
}
async function finish(){clearInterval(timer);run.ready=false;const finished=run;show('result');$('resultCourse').textContent=run.label;$('elapsed').textContent=format(run.elapsed/run.correct);$('resultRanking').hidden=true;$('publishBox').hidden=true;$('publishStatus').textContent='';$('consent').checked=false;$('publish').disabled=false;
const record={label:run.label,mode:run.mode,length:run.length,elapsed:run.elapsed,total:run.correct,average:run.elapsed/run.correct,date:Date.now()};const saved=storage.set('training.arithmetic.records',[record,...localRecords()].slice(0,50));$('saveStatus').textContent=saved?'이 기기에 기록을 저장했습니다.':'브라우저 저장 공간을 사용할 수 없어 기록을 저장하지 못했습니다.';
if(run.remote){$('saveStatus').textContent+=' 랭킹용 기록을 확인하고 있습니다…';try{const verified=await api('/finish',{token:run.remote.token,identity,attempts:run.attempts,elapsed:run.elapsed});finished.verified=verified;if(run===finished&&phase==='result'){$('publishBox').hidden=false;$('nickname').value=storage.get('training.nickname','');$('saveStatus').textContent=saved?'이 기기에 기록을 저장했습니다.':'브라우저 저장 공간을 사용할 수 없어 기록을 저장하지 못했습니다.';}}catch(e){if(run===finished&&phase==='result')$('saveStatus').textContent=`개인 기록은 ${saved?'저장했습니다':'저장하지 못했습니다'}. 랭킹 기록 확인 실패: ${e.message}`;}}
}
$('publish').onclick=async()=>{if(!run?.verified||run.published)return;const nickname=$('nickname').value.trim();if(!validNickname(nickname)){$('publishStatus').textContent='닉네임은 한글·영문·숫자·_로 2~12자 입력해 주세요.';return;}if(!$('consent').checked){$('publishStatus').textContent='기록 공개에 동의해 주세요.';return;}const finished=run;$('publish').disabled=true;try{await api('/publish',{token:finished.remote.token,identity,nickname});finished.published=true;storage.set('training.nickname',nickname);if(run===finished){$('publishStatus').textContent='등록했습니다';$('resultRanking').hidden=false;}}catch(e){if(run===finished){if(e.code==='NICKNAME_BEST_EXISTS'){window.alert(e.message);$('nickname').focus();$('nickname').select();}$('publishStatus').textContent=e.message;$('publish').disabled=false;}}};
$('again').onclick=()=>{homeNote();start();};$('resultHome').onclick=()=>{show('home');homeNote();};
$('quit').onclick=()=>$('quitDialog').showModal();$('keepPlaying').onclick=()=>$('quitDialog').close();$('confirmQuit').onclick=()=>{$('quitDialog').close();clearInterval(timer);run=null;show('home');homeNote();};
window.addEventListener('beforeunload',e=>{if(phase==='play'){e.preventDefault();e.returnValue='';}});
function row(title,subtitle,score,detail){const outer=document.createElement('div');outer.className='row';const a=document.createElement('div'),b=document.createElement('div');b.className='score';for(const [parent,tag,text] of [[a,'strong',title],[a,'small',subtitle],[b,'strong',score],[b,'small',detail]]){const el=document.createElement(tag);if(text?.nodeType)el.append(text);else el.textContent=text;parent.append(el);}outer.append(a,b);return outer;}
function empty(target,text){const p=document.createElement('p');p.className='empty';p.textContent=text;target.replaceChildren(p);}
function records(){show('records');const list=$('recordList'),items=localRecords();list.replaceChildren();if(!items.length)empty(list,'아직 기록이 없습니다. 첫 훈련을 시작해 보세요.');items.forEach(r=>list.append(row(r.label,new Date(r.date).toLocaleString('ko-KR'),r.average!==null?format(r.average)+'초/문항':'환산 불가',r.total?`${r.total}문항`:'')));}
$('showRecords').onclick=records;$('clearRecords').onclick=()=>{if(confirm('이 브라우저의 훈련 기록을 모두 삭제할까요? 전체 랭킹 기록은 유지됩니다.')){if(storage.set('training.arithmetic.records',[]))records();else alert('기록을 삭제하지 못했습니다.');}};
let rankNickname='';
async function ranking(){const serial=++rankRequest;show('ranking');if(explorer.active()){await explorer.render();return;}explorer.invalidate();explorer.render();const search=rankNickname;$('rankNote').textContent=search?'검색 결과는 최대 50건이며, 순위는 선택한 연산·문항수 전체 기록 기준입니다.':'상위 50위까지만 조회할 수 있습니다';show('ranking');const list=$('rankList');if(!apiBase){empty(list,'전체 랭킹은 연결 준비 중입니다. 현재는 나의 기록에서 개인 훈련 결과를 확인할 수 있습니다.');return;}empty(list,'기록을 불러오고 있습니다…');try{const {rows}=await api('/ranking?mode='+$('rankMode').value+'&length='+$('rankLength').value+($('rankPeriod').value==='week'?'&period=week':'')+(search?'&nickname='+encodeURIComponent(search):''));if(serial!==rankRequest)return;list.replaceChildren();if(!rows.length)empty(list,search?'선택한 조건에 해당 닉네임의 기록이 없습니다.':'아직 등록된 기록이 없습니다. 첫 기록의 주인공이 되어 보세요.');rows.forEach((r,i)=>list.append(row(`${r.rank??i+1}. ${r.nickname}`,rankingCondition('arithmetic',r),format(r.average)+'초/문항',formatKST(r.created))));}catch(e){if(serial===rankRequest)empty(list,'랭킹을 불러오지 못했습니다. '+e.message);}}
$('showRanking').onclick=enterRanking;$('rankMode').onchange=ranking;$('rankLength').onchange=ranking;
document.querySelectorAll('.back').forEach(b=>b.onclick=()=>{rankRequest++;show('home');homeNote();});homeNote();
$('resultRanking').onclick=enterRanking;
function searchRanking(){rankNickname=$('rankNickname').value.trim();ranking();}
$('searchRanking').onclick=searchRanking;
$('rankNickname').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();searchRanking();}};$('clearRankSearch').onclick=()=>{rankNickname='';$('rankNickname').value='';ranking();};

$('rankPeriod').onchange=ranking;

bindHubShare();

const explorer=createRankingExplorer({game:'arithmetic',apiBase,filters:()=>({period:$('rankPeriod').value,mode:$('rankMode').value,length:$('rankLength').value,nickname:rankNickname}),refresh:ranking});

navigation=createScreenHistory({render(id){rankRequest++;explorer.invalidate();if(id==='ranking')enterRanking();else if(id==='records')records();else{if(id==='home'){clearInterval(timer);if(run)run.ready=false;}show(id);}},isPlaying:()=>phase==='play',canRestore:()=>Boolean(run?.elapsed!==undefined&&!run?.ready),stop(){clearInterval(timer);if(run)run.ready=false;if($('quitDialog').open)$('quitDialog').close();}});
navigation.init();

function enterRanking(){$('rankMode').value='all';$('rankLength').value='all';rankNickname='';$('rankPeriod').value='all';$('rankNickname').value='';explorer.reset();return ranking();}
