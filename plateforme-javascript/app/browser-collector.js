export function browserRequest(action,url='',timeout=45000){
 return new Promise((resolve,reject)=>{
  const id=crypto.randomUUID();
  const listener=event=>{if(event.source!==window||event.origin!==location.origin||event.data?.channel!=='EUROPAUTO_BROWSER_RESPONSE'||event.data.id!==id)return;clearTimeout(timer);window.removeEventListener('message',listener);event.data.error?reject(Error(event.data.error)):resolve(event.data);};
  const timer=setTimeout(()=>{window.removeEventListener('message',listener);reject(Error(action==='ping'?'Extension non détectée.':'L’assistant n’a pas répondu à temps. Vérifiez l’onglet source et l’installation de l’extension.'));},timeout);
  window.addEventListener('message',listener);window.postMessage({channel:'EUROPAUTO_BROWSER_REQUEST',id,action,url},location.origin);
 });
}
