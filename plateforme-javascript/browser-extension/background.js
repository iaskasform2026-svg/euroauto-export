import {APP_ORIGIN,listingUrl,trustedSender,publicAccessAllowed} from './policy.js';
let busy=false;
async function waitLoaded(tabId){
 return new Promise((resolve,reject)=>{
  const done=error=>{clearTimeout(timer);chrome.tabs.onUpdated.removeListener(updated);chrome.tabs.onRemoved.removeListener(removed);error?reject(error):resolve();};
  const updated=(id,change)=>{if(id===tabId&&change.status==='complete')done();};
  const removed=id=>{if(id===tabId)done(Error('L’onglet source a été fermé.'));};
  const timer=setTimeout(()=>done(Error('Le chargement de la page a dépassé 20 secondes. L’onglet reste ouvert ; vous pouvez importer son HTML manuellement.')),20000);
  chrome.tabs.onUpdated.addListener(updated);chrome.tabs.onRemoved.addListener(removed);
  chrome.tabs.get(tabId).then(tab=>{if(tab.status==='complete')done();}).catch(done);
 });
}
async function collect(url,sender){
 const target=listingUrl(url);
 const robots=await fetch(new URL('/robots.txt',target),{credentials:'omit',redirect:'error',signal:AbortSignal.timeout(6000)});
 if(robots.ok){const body=await robots.text();if(body.length>100000||!publicAccessAllowed(body)||/^\s*disallow:\s*\/annonces/im.test(body))throw Error('La source refuse cette collecte automatique. Utilisez l’import manuel.');}else if(robots.status!==404)throw Error('La politique d’accès de la source ne peut pas être vérifiée.');
 const tab=await chrome.tabs.create({url:target,active:true});
 await waitLoaded(tab.id);
 listingUrl((await chrome.tabs.get(tab.id)).url);
 const injection=await chrome.scripting.executeScript({target:{tabId:tab.id},func:async()=>{
  // This function only reads the rendered public listing, never cookies or browser storage.
  if(location.protocol!=='https:'||!['autoexportmarseille.com','www.autoexportmarseille.com'].includes(location.hostname)||!/^\/annonces(?:\/page\/\d+)?\/?$/.test(location.pathname))throw Error('La page a quitté la liste publique autorisée.');
  for(let i=0;i<12&&!document.querySelector('.vehica-car-card-row-wrapper');i++)await new Promise(resolve=>setTimeout(resolve,500));
  if(!document.querySelector('.vehica-car-card-row-wrapper'))throw Error('Aucune liste lisible : page vide, consentement ou accès bloqué. Importez le HTML manuellement.');
  const copy=document.documentElement.cloneNode(true);
  copy.querySelectorAll('input,textarea,[contenteditable]').forEach(node=>node.remove());
  const html='<!doctype html>\n'+copy.outerHTML;
  if(html.length>8000000)throw Error('Le HTML dépasse 8 millions de caractères.');
  return {html,url:location.href,capturedAt:new Date().toISOString()};
 }});
 const result=injection[0]?.result;if(!result?.html)throw Error('Le navigateur n’a renvoyé aucun HTML.');
 // Return focus to the original EuropAuto tab; the source tab stays open for verification.
 await chrome.tabs.update(sender.tab.id,{active:true}).catch(()=>{});
 return {...result,sourceTabId:tab.id};
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(message?.type!=='EUROPAUTO_COLLECT'||!trustedSender(sender))return false;
 if(busy){respond({error:'Une collecte est déjà en cours.'});return false;}
 busy=true;collect(message.url,sender).then(result=>respond({ok:true,...result})).catch(error=>respond({error:error.message||'La lecture de l’onglet a échoué.'})).finally(()=>{busy=false;});return true;
});
