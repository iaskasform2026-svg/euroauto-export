import {matchesRequest} from './matching.js';
import {publicFeedUrl,parseInventory,decodeInventory} from './inventory.js';
export async function fetchInventory(supplier,fetcher=fetch){
  const sourceUrl=publicFeedUrl(supplier.feedUrl);
  const response=await fetcher(sourceUrl,{headers:{Accept:'application/json, text/csv;q=0.9'},redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Réponse HTTP '+response.status);
  const reader=response.body.getReader();let size=0;const chunks=[];
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>2000000){await reader.cancel();throw Error('Flux trop volumineux (maximum 2 Mo)');}chunks.push(part.value);}
  const combined=new Uint8Array(size);let offset=0;for(const chunk of chunks){combined.set(chunk,offset);offset+=chunk.length;}
  const input=decodeInventory(new TextDecoder().decode(combined),response.headers.get('content-type')||'',sourceUrl);
  const parsed=parseInventory(input,supplier.id,sourceUrl,new Date().toISOString());
  if(!parsed.vehicles.length&&parsed.rejected)throw Error('Aucune ligne exploitable : vérifiez les colonnes, les critères, les prix en EUR et les liens des annonces.');
  return {...parsed,sourceUrl};
}
export function rankMatches(requests,vehicles,limit=10){
  const all=requests.flatMap(r=>vehicles.filter(v=>matchesRequest(r,v)).map(v=>({requestId:r.id,vehicleId:v.id,price:v.price,url:v.url||v.id})));
  all.sort((a,b)=>a.price-b.price||a.vehicleId.localeCompare(b.vehicleId)||a.requestId.localeCompare(b.requestId));
  const seen=new Set();const unique=all.filter(row=>{const key=row.requestId+'|'+row.url;if(seen.has(key))return false;seen.add(key);return true;});
  return {totalMatches:unique.length,results:unique.slice(0,limit).map(({requestId,vehicleId})=>({requestId,vehicleId}))};
}
export async function synchronizeFeeds(c,feeds,fetcher=fetch){
  const reports=[];
  const fetched=await Promise.all(feeds.map(async supplier=>{try{return {supplier,stock:await fetchInventory(supplier,fetcher)};}catch(error){return {supplier,error};}}));
  // Fetch independently, then commit complete snapshots in source order.
  for(const {supplier,stock,error} of fetched){
    try{
      if(error)throw error;
      const {vehicles,rejected,sourceUrl}=stock;
      const statements=[c.db.prepare("DELETE FROM records WHERE kind='vehicle' AND json_extract(data,'$.sourceUrl')=? AND json_extract(data,'$.supplierId')=?").bind(sourceUrl,supplier.id)];
      const seen=new Set();
      for(const vehicle of vehicles){if(seen.has(vehicle.url))continue;seen.add(vehicle.url);const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(supplier.id+'|'+vehicle.url));const id='feed-'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');statements.push(c.db.prepare('INSERT INTO records (id,kind,owner,data) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(id,'vehicle',c.user.userId,JSON.stringify({...vehicle,sourceName:supplier.name,createdAt:vehicle.fetchedAt})));}
      await c.db.batch(statements);reports.push({supplierId:supplier.id,name:supplier.name,ok:true,count:seen.size,rejected,sourceUrl});
    }catch(e){reports.push({supplierId:supplier.id,name:supplier.name,ok:false,error:e.message});}
  }
  return reports;
}
