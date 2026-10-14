import {getContext} from '../../data-access';
import {parseLeboncoinPage,fetchLeboncoinPage} from '../../connectors/leboncoin';
export const dynamic='force-dynamic';
export async function POST(req){
 const c=await getContext();if(!c)return Response.json({error:'Connexion requise'},{status:401});if(!c.admin)return Response.json({error:'Accès administrateur requis'},{status:403});
 try{const {url,html}=await req.json();if(html&&typeof html!=='string'||typeof html==='string'&&html.length>2000000)throw Error('Code HTML invalide ou trop volumineux (2 Mo maximum)');const vehicle=html?parseLeboncoinPage(html,url):await fetchLeboncoinPage(url);const id='public-'+crypto.randomUUID();await c.db.prepare('INSERT INTO records (id,kind,owner,data) VALUES (?,?,?,?)').bind(id,'vehicle',c.user.userId,JSON.stringify({...vehicle,sourceName:'leboncoin',createdAt:new Date().toISOString(),fetchedAt:new Date().toISOString()})).run();return Response.json({ok:true,id,vehicle});}catch(e){return Response.json({error:e.message||'Lecture impossible'},{status:400});}
}
