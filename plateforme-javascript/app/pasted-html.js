import {parsePastedSearch} from './pasted-search';
const scalar=value=>typeof value==='string'||typeof value==='number'?String(value):'';
const label=value=>scalar(value)||scalar(value?.name)||scalar(value?.value);
function numeric(value){if(typeof value==='number')return Number.isFinite(value)?value:null;const s=scalar(value).replace(/[^\d.,-]/g,'');if(!s)return null;const n=Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s);return Number.isFinite(n)?n:null;}
function safeUrl(value,base){try{const u=new URL(scalar(value),base||undefined);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function structuredVehicles(data,base=''){
 const rows=[];let visited=0;
 function walk(node,depth=0){if(!node||typeof node!=='object'||depth>30||++visited>60000)return;if(Array.isArray(node)){node.forEach(x=>walk(x,depth+1));return;}
 const types=[node['@type']].flat().filter(Boolean);const attrs=Array.isArray(node.attributes)?Object.fromEntries(node.attributes.map(a=>[a.key,label(a.value??a.values?.[0])])):{};
 const isAd=Array.isArray(node.attributes)&&('price'in node)&&('subject'in node||'list_id'in node);
 if(isAd||types.some(t=>['Car','Vehicle','Product','IndividualProduct'].includes(t))){
 const title=label(node.subject||node.name||node.title);const parsed=parsePastedSearch(title)[0];const offer=[node.offers].flat().find(x=>x&&typeof x==='object')||{};
 const brand=label(node.brand)||attrs.u_car_brand||attrs.brand||parsed?.brand||'';
 const model=label(node.model)||attrs.u_car_model||attrs.model||parsed?.model||'';
 if(brand||model){const rawPrice=isAd?([node.price].flat()[0]):offer.price??node.price;const price=numeric(rawPrice);const currency=offer.priceCurrency||node.currency||'EUR';const yr=label(node.vehicleModelDate||node.productionDate||attrs.regdate||attrs.year).match(/\b(?:19|20)\d{2}\b/);
 rows.push({brand,model,engine:label(node.vehicleEngine)||attrs.engine||attrs.motorization||parsed?.engine||'',year:yr?Number(yr[0]):null,km:numeric(node.mileageFromOdometer?.value??attrs.mileage),price:currency==='EUR'&&price>0?price:null,fuel:label(node.fuelType)||attrs.fuel||'',gearbox:label(node.vehicleTransmission)||attrs.gearbox||'',url:safeUrl(node.url||node['@id']||offer.url,base),source:JSON.stringify({title,brand,model,price:rawPrice,currency,attributes:node.attributes,year:yr?.[0]}).slice(0,6000)});}
 }
 for(const value of Object.values(node))walk(value,depth+1);
 }
 walk(data);return rows;
}
function dedup(rows){const unique=new Map();for(const row of rows){const key=row.url||JSON.stringify([row.brand,row.model,row.year,row.km,row.price]);const prior=unique.get(key);if(!prior||Object.values(row).filter(x=>x!==null&&x!=='').length>Object.values(prior).filter(x=>x!==null&&x!=='').length)unique.set(key,row);}return [...unique.values()];}
export function parsePastedHtml(html,base=''){
 if(!html.trim())throw Error('Collez le code source HTML de la liste des annonces.');
 if(html.length>8000000)throw Error('Le HTML dépasse la limite de 8 millions de caractères.');
 if(!/<[a-z!][\s\S]*>/i.test(html))throw Error('Le contenu ne semble pas être du HTML. Copiez le code source de la page.');
 // A detached template is inert: no scripts execute and no external resources load.
 const template=document.createElement('template');template.innerHTML=html;const root=template.content;
 const rows=[];let scripts=0;
 for(const script of root.querySelectorAll('script')){const type=script.getAttribute('type')||'';if(type.includes('json')||script.id==='__NEXT_DATA__'){try{rows.push(...structuredVehicles(JSON.parse(script.textContent),base));scripts++;}catch{/* Unsupported or malformed JSON is ignored, never executed. */}}}
 for(const item of root.querySelectorAll('[itemscope]')){if(!/(?:Car|Vehicle|Product)$/.test(item.getAttribute('itemtype')||''))continue;const get=key=>{const el=item.querySelector(`[itemprop="${key}"]`);return el?.getAttribute('content')||el?.getAttribute('href')||el?.textContent?.trim()||'';};rows.push(...structuredVehicles({'@type':'Car',name:get('name'),brand:get('brand'),model:get('model'),vehicleModelDate:get('vehicleModelDate')||get('productionDate'),vehicleEngine:get('vehicleEngine'),fuelType:get('fuelType'),vehicleTransmission:get('vehicleTransmission'),mileageFromOdometer:{value:get('mileageFromOdometer')},offers:{price:get('price'),priceCurrency:get('priceCurrency')||'EUR'},url:get('url')},base));}
 const structured=dedup(rows);
 if(structured.length)return {rows:structured,method:'Données structurées JSON / microdonnées',warning:'Seules les données présentes dans le HTML sont extraites. Vérifiez les caractéristiques et le prix de chaque annonce.'};
 root.querySelectorAll('script,style,noscript,nav,header,footer,svg,iframe').forEach(el=>el.remove());
 let cards=[...root.querySelectorAll('article,[data-qa-id="aditem_container"],[data-testid="ad-card"],li[itemtype]')];
 if(!cards.length){const links=[...root.querySelectorAll('a[href]')].filter(a=>/\/ad\/voitures\/|\/annonce\/|\/auto-occasion-annonce-|\/offres\//.test(a.getAttribute('href')));cards=links.map(a=>a.closest('li')||a.closest('article')||a);}
 cards=cards.filter((card,i)=>!cards.some((other,j)=>j!==i&&other.contains(card)));
 const fallback=[];
 for(const card of cards.slice(0,1000)){const copy=card.cloneNode(true);copy.querySelectorAll('br').forEach(el=>el.replaceWith('\n'));copy.querySelectorAll('h1,h2,h3,h4,p,div,span,li,dt,dd').forEach(el=>el.append('\n'));const text=copy.textContent.replace(/\n\s*\n/g,'\n').trim();const candidates=parsePastedSearch(text);const link=card.matches('a[href]')?card:card.querySelector('a[href]');for(const row of candidates)fallback.push({...row,url:safeUrl(link?.getAttribute('href'),base),source:text.slice(0,6000)});}
 return {rows:dedup(fallback),method:'Lecture des cartes HTML',warning:fallback.length?'Lecture approximative des cartes : contrôlez les valeurs extraites.':'Aucune annonce exploitable dans ce HTML. La liste peut être chargée après ouverture par JavaScript ou utiliser un format non reconnu. Essayez de copier le HTML de la liste affichée depuis les outils de développement.'};
}
