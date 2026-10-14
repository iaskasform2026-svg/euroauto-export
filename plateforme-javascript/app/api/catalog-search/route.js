import {getContext,readRecords} from '../../data-access';
import {matchesRequest} from '../../matching';
import {publicFeedUrl,parseInventory} from '../../inventory';
export const dynamic='force-dynamic';
export async function POST(req) {
  const c=await getContext();
  if(!c) return Response.json({error:'Connexion requise'},{status:401});
  if(!c.admin) return Response.json({error:'Accès administrateur requis'},{status:403});
  try {
    const {requestId}=await req.json();
    let all=await readRecords(c.db);
    const requests=all.filter(r=>r.kind==='request'&&(!requestId||r.id===requestId));
    if(!requests.length) return Response.json({error:'Créez ou sélectionnez une commande avant de rechercher'},{status:400});
    const feeds=all.filter(r=>r.kind==='supplier'&&r.feedUrl).slice(0,8);
    const sources=await Promise.all(feeds.map(async supplier=>{
      try {
        const sourceUrl=publicFeedUrl(supplier.feedUrl);
        const response=await fetch(sourceUrl,{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000)});
        if(!response.ok) throw Error('Réponse HTTP '+response.status);
        const bytes=Number(response.headers.get('Content-Length')||0);
        if(bytes>2000000)throw Error('Flux trop volumineux (maximum 2 Mo)');
        // Limit streamed responses too; do not trust Content-Length alone.
        const reader=response.body.getReader();let size=0;const chunks=[];
        while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>2000000){await reader.cancel();throw Error('Flux trop volumineux (maximum 2 Mo)');}chunks.push(part.value);}
        const combined=new Uint8Array(size);let offset=0;for(const chunk of chunks){combined.set(chunk,offset);offset+=chunk.length;}
        const fetchedAt=new Date().toISOString();
        const {vehicles,rejected}=parseInventory(JSON.parse(new TextDecoder().decode(combined)),supplier.id,sourceUrl,fetchedAt);
        // Reconcile the entire source snapshot so sold/removed listings cannot remain in results.
        const writes=[c.db.prepare("DELETE FROM records WHERE kind='vehicle' AND json_extract(data,'$.sourceUrl')=? AND json_extract(data,'$.supplierId')=?").bind(sourceUrl,supplier.id)];
        for(const vehicle of vehicles){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(supplier.id+'|'+vehicle.url));const id='feed-'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');writes.push(c.db.prepare('INSERT INTO records (id,kind,owner,data) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(id,'vehicle',c.user.userId,JSON.stringify({...vehicle,createdAt:fetchedAt})));}
        await c.db.batch(writes);
        return {name:supplier.name,ok:true,count:vehicles.length,rejected};
      } catch(e){return {name:supplier.name,ok:false,error:e.message};}
    }));
    all=await readRecords(c.db);
    const failedSuppliers=new Set(feeds.filter(s=>sources.some(x=>x.name===s.name&&!x.ok)).map(s=>s.id));
    const vehicles=all.filter(v=>v.kind==='vehicle'&&!(v.sourceUrl&&failedSuppliers.has(v.supplierId)));
    const results=requests.flatMap(r=>vehicles.filter(v=>matchesRequest(r,v)).map(v=>({requestId:r.id,vehicleId:v.id})));
    return Response.json({results,sources,feedCount:feeds.length,searchedAt:new Date().toISOString(),message:feeds.length?'Prix reçus des flux fournisseurs. Vérifiez leur disponibilité auprès du vendeur.':'Aucun flux Internet connecté : recherche dans le catalogue enregistré, aux prix saisis depuis les annonces. Ajoutez un flux JSON fournisseur pour importer automatiquement les véhicules et leurs prix.'});
  }catch(e){return Response.json({error:e.message||'Recherche impossible'},{status:500});}
}
