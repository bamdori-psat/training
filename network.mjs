// 조회만 한 번 재시도합니다. 기록 제출은 중복 전송을 피하도록 자동 재시도하지 않습니다.
export async function requestTrainingJSON(url,body,{timeoutMs=body?10000:30000,retries=body?0:1}={}){
 for(let attempt=0;;attempt++){
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const response=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});
   if(!response.ok){let data;try{data=await response.json();}catch{}const error=new Error(data?.error||`데이터를 불러오지 못했습니다. (${response.status})`);error.retryable=[408,429,502,503,504].includes(response.status);throw error;}
   return await response.json();
  }catch(error){const timedOut=controller.signal.aborted||['AbortError','TimeoutError'].includes(error.name);const retryable=timedOut||error.retryable===true||error instanceof TypeError;
   if(attempt<retries&&retryable)continue;
   if(timedOut)throw new Error('서버 응답이 늦어 조회를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
   if(error instanceof TypeError)throw new Error('서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.');
   throw error;
  }finally{clearTimeout(timeout);}
 }
}
