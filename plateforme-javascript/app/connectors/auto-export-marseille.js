import {cleanText,moneyValue,titleEngine,allowedPage,publicReader} from './public-cars.js';
export const AEM_SOURCE={id:'supplier-auto-export-marseille',name:'Auto Export Marseille',url:'https://autoexportmarseille.com/',connector:'auto-export-marseille',notes:'Lecture des fiches publiques. Prix vendeur HT ; disponibilité à vérifier.'};
export function parseAemPage(html,url){
 url=allowedPage(url,'autoexportmarseille.com',/^\/annonce\/[^/]+\/?$/);
 const attributes={};
 const attribute=/<div\b[^>]*class=["'][^"']*\bvehica-car-attributes__name\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<div\b[^>]*class=["'][^"']*\bvehica-car-attributes__values\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
 for(const m of html.matchAll(attribute))attributes[cleanText(m[1]).replace(/:$/,'').trim()]=cleanText(m[2]);
 const title=cleanText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
 const stock=attributes.Stock||'';
 if(/rupture|vendu|indisponible|réservé/i.test(stock))return {excluded:true,reason:'Véhicule non disponible'};
 const prices=[...html.matchAll(/<div\b[^>]*class=["']vehica-car-price["'][^>]*>([\s\S]*?)<\/div>/gi)].map(m=>moneyValue(m[1])).filter(p=>p!==null);
 const price=prices.length&&prices.every(p=>p===prices[0])?prices[0]:null;
 const brand=attributes.Marque,model=attributes['Modèle'];
 if(!brand||!model||price===null)throw Error('Fiche non exploitable : marque, modèle ou prix non récupéré');
 const year=/^\d{4}$/.test(attributes['Année']||'')?Number(attributes['Année']):null;
 const mileage=attributes['Kilométrage'];const km=mileage&&/^\d+$/.test(mileage.replace(/\s|km/gi,''))?Number(mileage.replace(/\s|km/gi,'')):null;
 return {brand,model,engine:attributes.Moteur||titleEngine(title),year,km,price,currency:'EUR',url,taxBasis:/hors[-\s]?taxes/i.test(cleanText(html))?'HT':'Non précisé',availability:stock||'À vérifier',priceSource:'Fiche publique Auto Export Marseille',notes:''};
}
export function aemLinks(html,base){const links=[];const seen=new Set();for(const m of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)){try{const url=allowedPage(new URL(m[1].replace(/&amp;/g,'&'),base).toString(),'autoexportmarseille.com',/^\/annonce\/[^/]+\/?$/);if(!seen.has(url)){seen.add(url);links.push(url);}}catch{}}return links;}
export async function fetchAemInventory(supplier,fetcher=fetch){
 const read=await publicReader('autoexportmarseille.com',fetcher);
 const urls=[];for(const index of ['https://autoexportmarseille.com/','https://autoexportmarseille.com/annonces/']){const html=await read(index);for(const url of aemLinks(html,index))if(!urls.includes(url))urls.push(url);}
 if(!urls.length)throw Error('Aucune fiche trouvée sur les pages publiques : structure du site à vérifier');
 const scanned=urls.slice(0,16),vehicles=[];let rejected=0,unavailable=0;const errors=[];
 for(let i=0;i<scanned.length;i+=3){const batch=await Promise.all(scanned.slice(i,i+3).map(async url=>{try{return parseAemPage(await read(url),url);}catch(e){return {error:e.message};}}));for(const item of batch){if(item.excluded){unavailable++;continue;}if(item.error){rejected++;errors.push(item.error);continue;}vehicles.push({...item,supplierId:supplier.id,sourceUrl:'https://autoexportmarseille.com/',fetchedAt:new Date().toISOString()});}}
 if(!vehicles.length&&rejected)throw Error('Fiches inaccessibles ou non exploitables : '+errors[0]);
 return {vehicles,rejected,unavailable,sourceUrl:'https://autoexportmarseille.com/',scanned:scanned.length,truncated:urls.length>scanned.length,warnings:errors.length?['Certaines fiches n’ont pas pu être lues.']:[]};
}
