(()=>{
 const origin='https://europauto-portail.sharprain32.chatgpt.site';if(location.origin!==origin||window.top!==window)return;
 let busy=false;
 window.addEventListener('message',event=>{
  const message=event.data;if(event.source!==window||event.origin!==origin||!message||message.channel!=='EUROPAUTO_BROWSER_REQUEST'||typeof message.id!=='string'||message.id.length>100)return;
  const reply=payload=>window.postMessage({channel:'EUROPAUTO_BROWSER_RESPONSE',id:message.id,...payload},origin);
  if(message.action==='ping'){reply({ok:true,version:'1.0.0'});return;}
  if(message.action!=='collect')return;
  if(busy){reply({error:'Une collecte est déjà en cours.'});return;}
  if(typeof message.url!=='string'||message.url.length>3000){reply({error:'URL invalide.'});return;}
  busy=true;chrome.runtime.sendMessage({type:'EUROPAUTO_COLLECT',url:message.url},response=>{busy=false;const error=chrome.runtime.lastError;if(error){reply({error:'Extension interrompue. Rechargez EuropAuto puis réessayez.'});return;}reply(response||{error:'Aucune réponse de l’extension.'});});
 });
})();
