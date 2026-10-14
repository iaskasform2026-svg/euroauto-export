import {cleanText,titleEngine,allowedPage,publicReader} from './public-cars.js';
export function parseLeboncoinPage(html,url){
 url=allowedPage(url,'leboncoin.fr',/^\/ad\/voitures\/\d+\/?$/);
 const id=new URL(url).pathname.match(/\d+/)[0];let ad=null;
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
 function walk(value,depth=0){if(depth>25||ad||!value||typeof value!=='object')return;if(String(value.list_id||value.id)===id&&Array.isArray(value.price)&&Array.isArray(value.attributes)){ad=value;return;}for(const child of Object.values(value))if(typeof child==='object')walk(child,depth+1);}
 for(const script of scripts){try{walk(JSON.parse(script[1]));}catch{}}
 if(!ad)throw Error('Données structurées de la fiche leboncoin absentes. Importez les champs du véhicule manuellement.');
 if(ad.status&&['deleted','inactive','sold','expired'].includes(ad.status.toLowerCase()))throw Error('Annonce inactive ou vendue');
 const attributes=Object.fromEntries(ad.attributes.map(item=>[item.key,item.value_label||item.value]));
 const brand=attributes.u_car_brand||attributes.brand,model=attributes.u_car_model||attributes.model;
 const price=ad.price[0];if(!brand||!model||typeof price!=='number'||!Number.isFinite(price)||price<=0)throw Error('Marque, modèle ou prix non récupéré');
 const year=/^\d{4}$/.test(String(attributes.regdate||''))?Number(attributes.regdate):null;
 const rawKm=String(attributes.mileage||'').replace(/\s|km/gi,'');const km=/^\d+$/.test(rawKm)?Number(rawKm):null;
 return {brand:cleanText(brand),model:cleanText(model),engine:attributes.engine||titleEngine(ad.subject),year,km,price,url,currency:'EUR',taxBasis:'Non précisé',availability:'À vérifier auprès du vendeur',priceSource:'Fiche publique leboncoin importée manuellement',notes:''};
}
export async function fetchLeboncoinPage(url,fetcher=fetch){url=allowedPage(url,'leboncoin.fr',/^\/ad\/voitures\/\d+\/?$/);const read=await publicReader('www.leboncoin.fr',fetcher);return parseLeboncoinPage(await read(url),url);}
