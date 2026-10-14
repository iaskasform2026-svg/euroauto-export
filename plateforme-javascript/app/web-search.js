import { publicFeedUrl } from './inventory.js';
export const SEARCH_SOURCES = [
  {id:'mobile',name:'mobile.de',domain:'mobile.de',listing:path=>/\/(?:fahrzeuge\/details\.html|auto-inserat\/)/i.test(path)},
  {id:'autoscout',name:'AutoScout24',domain:'autoscout24.fr',listing:path=>/^\/(?:offres|offers|annonces)\//i.test(path)},
  {id:'lacentrale',name:'La Centrale',domain:'lacentrale.fr',listing:path=>/auto-occasion-annonce-|\/annonce-/i.test(path)},
  {id:'leboncoin',name:'leboncoin',domain:'leboncoin.fr',listing:path=>/^\/(?:ad\/voitures\/|voitures\/\d+)/i.test(path)}
];
const text = value => String(value||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').slice(0,1000);
export function listingSource(value, sources=SEARCH_SOURCES){
  try {const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;return sources.find(s=>(u.hostname===s.domain||u.hostname.endsWith('.'+s.domain))&&s.listing(u.pathname))||null;}catch{return null;}
}
export function makeSearchQuery(request,sources=SEARCH_SOURCES){
  const quoted=value=>'"'+String(value).replace(/["\\]/g,' ').trim()+'"';
  return '('+sources.map(s=>'site:'+s.domain).join(' OR ')+') '+[request.brand,request.model,request.engine].map(quoted).join(' ')+' '+request.year+' occasion';
}
export function selectSearchResults(results,sources=SEARCH_SOURCES,limit=10){
  const seen=new Set();const out=[];
  for(const result of results){const source=listingSource(result.url,sources);if(!source)continue;const url=new URL(result.url);url.hash='';for(const key of [...url.searchParams.keys()])if(key.startsWith('utm_'))url.searchParams.delete(key);const canonical=url.toString();if(seen.has(canonical))continue;seen.add(canonical);out.push({id:'web-'+out.length,title:text(result.title),description:text(result.description),url:canonical,sourceName:source.name,sourceId:source.id});if(out.length===limit)break;}
  return out;
}
export function readListingData(html){
  const objects=[];
  function walk(value){if(Array.isArray(value))return value.forEach(walk);if(!value||typeof value!=='object')return;const types=[value['@type']].flat();if(types.some(t=>['Car','Vehicle','Product'].includes(t)))objects.push(value);if(value['@graph'])walk(value['@graph']);}
  for(const script of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{walk(JSON.parse(script[1]));}catch{}}
  // Listing pages with multiple unrelated products don't identify a single vehicle reliably.
  const listing=objects.find(v=>[v['@type']].flat().some(t=>t==='Car'||t==='Vehicle'))||(objects.length===1?objects[0]:null);
  if(!listing)return {price:null,brand:'',model:'',engine:'',year:null,km:null};
  const offers=[listing.offers].flat().filter(Boolean);
  const prices=offers.map(o=>{const amount=o.price ?? o.priceSpecification?.price;const currency=o.priceCurrency ?? o.priceSpecification?.priceCurrency;if(currency!=='EUR'||!/^\d+(?:\.\d{1,2})?$/.test(String(amount)))return null;const number=Number(amount);return Number.isFinite(number)&&number>0?number:null;});
  const price=prices.length&&prices.every(p=>p!==null&&p===prices[0])?prices[0]:null;
  const field=value=>typeof value==='string'?text(value):text(value?.name);
  const year=Number(String(listing.vehicleModelDate||listing.productionDate||'').slice(0,4));
  const mileage=listing.mileageFromOdometer;
  const km=mileage&&['KMT','km','kilometers','kilometres'].includes(mileage.unitCode||mileage.unitText)&&Number.isFinite(Number(mileage.value))?Number(mileage.value):null;
  return {price,brand:field(listing.brand),model:field(listing.model),engine:field(listing.vehicleEngine),year:year>=1950&&year<=2030?year:null,km};
}
export async function boundedText(response,limit=2000000){
  const reader=response.body.getReader();let length=0;const chunks=[];
  while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>limit){await reader.cancel();throw Error('Réponse trop volumineuse');}chunks.push(part.value);}
  const data=new Uint8Array(length);let position=0;for(const chunk of chunks){data.set(chunk,position);position+=chunk.length;}return new TextDecoder().decode(data);
}
export function searxngEndpoint(value){
  if(!value)throw Error('Configurez une instance SearXNG avec la sortie JSON activée. Aucune clé API n’est nécessaire.');
  const endpoint=new URL(publicFeedUrl(value));
  endpoint.search='';endpoint.hash='';
  endpoint.pathname=endpoint.pathname.replace(/\/+$/,'').replace(/\/search$/,'')+'/search';
  return endpoint;
}
export async function querySearxng(instanceUrl,query,fetcher=fetch){
  const endpoint=searxngEndpoint(instanceUrl);
  endpoint.searchParams.set('q',query);endpoint.searchParams.set('format','json');endpoint.searchParams.set('categories','general');endpoint.searchParams.set('pageno','1');endpoint.searchParams.set('language','all');
  const response=await fetcher(endpoint.toString(),{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(response.status===403?'SearXNG refuse la sortie JSON ou bloque cet accès (HTTP 403). Activez search.formats: [html, json] sur votre instance.':'SearXNG indisponible (HTTP '+response.status+').');
  let payload;try{payload=JSON.parse(await boundedText(response));}catch{throw Error('L’instance n’a pas renvoyé de JSON valide. Vérifiez son URL et sa configuration.');}
  if(!Array.isArray(payload.results))throw Error('Réponse SearXNG invalide : la liste results est absente.');
  return payload;
}
export async function searchAnnouncements(request,instanceUrl,fetcher=fetch){
  const payload=await querySearxng(instanceUrl,makeSearchQuery(request),fetcher);
  const hits=selectSearchResults(payload.results.map(r=>({...r,description:r.content||r.description||''})));
  // Preserve search-engine order even when listing pages finish in different order.
  const candidates=[];
  for(let start=0;start<hits.length;start+=5){const batch=await Promise.all(hits.slice(start,start+5).map(async(hit,index)=>{
    const base={...hit,id:crypto.randomUUID(),rank:start+index+1,requestId:request.id,fetchedAt:new Date().toISOString(),price:null,brand:'',model:'',engine:'',year:null,km:null};
    try {const page=await fetcher(hit.url,{headers:{Accept:'text/html'},redirect:'error',signal:AbortSignal.timeout(8000)});if(!page.ok)throw Error('HTTP '+page.status);const details=readListingData(await boundedText(page));return {...base,...details,priceSource:details.price?'Prix lu sur l’annonce':'Prix non récupéré',verification:'À vérifier'};}
    catch {return {...base,priceSource:'Prix non récupéré',verification:'Page inaccessible — à vérifier'};}
  }));candidates.push(...batch);}
  return {candidates,warnings:(payload.unresponsive_engines||[]).map(item=>Array.isArray(item)?item.map(String).join(' : '):String(item))};
}
