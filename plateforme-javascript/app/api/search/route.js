import {AEM_SOURCE} from '../../connectors/auto-export-marseille';
import {getContext,readRecords} from '../../data-access';
import {rankMatches,synchronizeFeeds} from '../../feed-search';
export const dynamic='force-dynamic';
export async function POST(req){
  const c=await getContext();
  if(!c)return Response.json({error:'Connexion requise'},{status:401});
  if(!c.admin)return Response.json({error:'Accès administrateur requis'},{status:403});
  try{
    const {requestId}=await req.json();
    const catalogueOnly=new URL(req.url).pathname.endsWith('/catalog-search');
    let records=await readRecords(c.db);
    const requests=records.filter(r=>r.kind==='request'&&(!requestId||r.id===requestId));
    if(!requests.length)return Response.json({error:'Créez ou sélectionnez une commande avant de rechercher.'},{status:400});
    if(!catalogueOnly&&!records.some(r=>r.kind==='supplier'&&r.connector==='auto-export-marseille')){await c.db.prepare('INSERT OR IGNORE INTO records (id,kind,owner,data) VALUES (?,?,?,?)').bind(AEM_SOURCE.id,'supplier',c.user.userId,JSON.stringify({...AEM_SOURCE,createdAt:new Date().toISOString()})).run();records=await readRecords(c.db);}
    const configured=records.filter(r=>r.kind==='supplier'&&(r.feedUrl||r.connector==='auto-export-marseille')); 
    const feeds=configured.slice(0,8);
    const sources=catalogueOnly?[]:await synchronizeFeeds(c,feeds);
    if(!catalogueOnly)records=await readRecords(c.db);
    const refreshed=new Map(sources.filter(s=>s.ok).map(s=>[s.supplierId,s.sourceUrl]));
    const vehicles=records.filter(v=>v.kind==='vehicle'&&(catalogueOnly||refreshed.has(v.supplierId)&&refreshed.get(v.supplierId)===v.sourceUrl));
    const {results,totalMatches}=rankMatches(requests,vehicles,10);
    return Response.json({mode:catalogueOnly?'catalogue':'feeds',results,totalMatches,limit:10,feedCount:feeds.length,sources,searchedAt:new Date().toISOString(),warnings:configured.length>8?['Seuls les 8 premiers flux ont été consultés.']:[],message:catalogueOnly?'Catalogue enregistré : les prix peuvent dater de la dernière importation.':feeds.length?'Recherche dans les sources fournisseurs actualisées (flux ou fiches publiques). Dix résultats maximum, triés par prix vendeur croissant. Prix fournisseur sans majoration ; les prix HT sont signalés.':'Aucune source fournisseur configurée. Ajoutez une URL de stock JSON ou CSV dans Fournisseurs ; aucun catalogue manuel n’a été présenté comme une recherche de flux.'},{headers:{'Cache-Control':'private, no-store'}});
  }catch(e){return Response.json({error:e.message||'Recherche des flux impossible'},{status:500});}
}
