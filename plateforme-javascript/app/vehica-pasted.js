import {parsePastedSearch} from './pasted-search';
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):Number(v);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}).replace(/&(nbsp|amp|quot|apos|lt|gt|euro|#039);/g,(_,v)=>({nbsp:' ',amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',euro:'€','#039':"'"}[v])).replace(/\s+/g,' ').trim();
function value(block,cls){return clean(block.match(new RegExp('<(?:div|span)\\b[^>]*class=["\'][^"\']*\\b'+cls+'\\b[^"\']*["\'][^>]*>([\\s\\S]*?)<\\/(?:div|span)>','i'))?.[1]);}
export function parseVehicaListing(html){
 const starts=[...html.matchAll(/<div\b[^>]*class=["'][^"']*\bvehica-car-card-row-wrapper\b[^"']*["'][^>]*>/gi)];
 const rows=[];const seen=new Set();
 starts.forEach((match,i)=>{
 const block=html.slice(match.index,starts[i+1]?.index??html.length);
 const title=value(block,'vehica-car-card-row__name');if(!title)return;
 const link=block.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*\bvehica-car-card-link\b/i)?.[1];
 let url='';try{const parsed=new URL(clean(link));if(['http:','https:'].includes(parsed.protocol))url=parsed.href;}catch{}
 if(!url||seen.has(url))return;seen.add(url);
 const info=[...block.matchAll(/<div\b[^>]*class=["']vehica-car-card__info__single["'][^>]*>([\s\S]*?)<\/div>/gi)].map(m=>clean(m[1]));
 const priceText=value(block,'vehica-car-card-row__price-desktop')||value(block,'vehica-car-card__price-mobile');
 const amount=priceText.replace(/[^\d,.]/g,'');const price=amount?Number(amount.includes(',')?amount.replace(/\./g,'').replace(',','.'):amount):null;
 const parsed=parsePastedSearch(title.replace(/^NOUVEAU\s+/i,'').replace(/\s+ALG[EÉ]RIE\b.*$/i,''))[0];
 const engine=title.match(/\b\d[.,]\d\s*(?:BlueHDi|e-HDi|HDi|dCi|TDI|TSI|TFSI|TCe|PureTech|EcoBoost)(?:\s*\d{2,3}\s*(?:cv|ch)?)?\b/i)?.[0]||'';
 const year=info.find(x=>/^(?:19|20)\d{2}$/.test(x));const kmText=info.find(x=>/^\d[\d\s.,]*\s*km$/i.test(x));
 const options=[...block.matchAll(/<span\b[^>]*class=["']vehica-car-card-row__secondary-attribute__value["'][^>]*>\s*<span>([\s\S]*?)<\/span>/gi)].map(m=>clean(m[1]));
 rows.push({title,brand:parsed?.brand||'',model:parsed?.model||'',engine,year:year?Number(year):null,km:kmText?Number(kmText.replace(/\D/g,'')):null,price:Number.isFinite(price)&&price>0?price:null,fuel:info.find(x=>/^(diesel|essence|hybride|[ée]lectrique|GPL)/i.test(x))||'',gearbox:info.find(x=>/^(automatique|manuelle|BVA|BVM)/i.test(x))||'',url,options:options.join(', '),source:[title,...info,priceText,...options].join('\n')});
 });return rows;
}
