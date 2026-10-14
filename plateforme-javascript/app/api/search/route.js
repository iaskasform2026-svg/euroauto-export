import {getContext,readRecords} from '../../data-access';
import {searchAnnouncements,SEARCH_SOURCES} from '../../web-search';
export const dynamic='force-dynamic';
export async function POST(req){
  const c=await getContext();
  if(!c)return Response.json({error:'Connexion requise'},{status:401});
  if(!c.admin)return Response.json({error:'Accès administrateur requis'},{status:403});
  try{
    const {requestId}=await req.json();
    if(!requestId)return Response.json({error:'Sélectionnez une commande pour rechercher ses 10 premières annonces sur les sites proposés.'},{status:400});
    const records=await readRecords(c.db);
    const request=records.find(r=>r.kind==='request'&&r.id===requestId);
    if(!request)return Response.json({error:'Commande introuvable'},{status:404});
    if(!c.searxngUrl)return Response.json({error:'Configurez l’URL de votre instance SearXNG avec la sortie JSON activée. Aucune clé Brave n’est nécessaire.',code:'SEARCH_NOT_CONFIGURED'},{status:503});
    const {candidates,warnings}=await searchAnnouncements(request,c.searxngUrl);
    return Response.json({mode:'web',provider:'SearXNG',candidates,warnings,results:candidates.map(v=>({requestId:request.id,vehicleId:v.id})),sources:SEARCH_SOURCES.map(s=>({name:s.name,ok:true,count:candidates.filter(v=>v.sourceId===s.id).length})),searchedAt:new Date().toISOString(),requestId,limit:10,message:'Jusqu’à 10 annonces classées selon la pertinence du moteur. Prix lus sur les pages accessibles ; critères, prix et disponibilité à vérifier avant publication.'},{headers:{'Cache-Control':'private, no-store'}});
  }catch(e){return Response.json({error:e.message||'Recherche Internet impossible'},{status:502});}
}
