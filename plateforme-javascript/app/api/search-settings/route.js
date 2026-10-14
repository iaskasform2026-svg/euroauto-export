import {getContext} from '../../data-access';
import {querySearxng,searxngEndpoint} from '../../web-search';
export const dynamic='force-dynamic';
export async function POST(req){
  const c=await getContext();
  if(!c)return Response.json({error:'Connexion requise'},{status:401});
  if(!c.admin)return Response.json({error:'Accès administrateur requis'},{status:403});
  try{
    const {url}=await req.json();
    const endpoint=searxngEndpoint(url).toString();
    const test=await querySearxng(endpoint,'automobile occasion');
    if(!test.results.length && test.unresponsive_engines?.length)throw Error('L’instance répond, mais ses moteurs ne renvoient aucun résultat et signalent des erreurs. Vérifiez les moteurs avant de l’enregistrer.');
    await c.db.prepare('INSERT INTO settings (id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('searxng_url',endpoint).run();
    return Response.json({ok:true,url:endpoint,message:'Connexion JSON testée et URL enregistrée.'},{headers:{'Cache-Control':'private, no-store'}});
  }catch(e){return Response.json({error:e.message||'Connexion SearXNG impossible'},{status:400});}
}
