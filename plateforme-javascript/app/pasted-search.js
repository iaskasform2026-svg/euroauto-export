const brands = ['Alfa Romeo','Land Rover','Mercedes-Benz','Mercedes','Volkswagen','Citroën','Citroen','Peugeot','Renault','Toyota','Dacia','BMW','Audi','Fiat','Ford','Opel','Nissan','Hyundai','Kia','Seat','Skoda','Škoda','Volvo','Suzuki','Mazda','Honda','Mini','Tesla','Jeep','Porsche','Lexus','Mitsubishi','Chevrolet','DS'];
const brandPattern = brands.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
const titlePattern = new RegExp('^(?:\\d+[.)\\s-]+)?('+brandPattern+')\\b[ :–-]*(.*)$','i');
const number = s => {const n=Number(s.replace(/[\s\u00a0\u202f.]/g,'').replace(',','.'));return Number.isFinite(n)?n:null;};
function field(text,label){return text.match(new RegExp('(?:^|\\n)\\s*(?:'+label+')\\s*[:=]\\s*([^\\n|;]+)','i'))?.[1]?.trim()||'';}
export function parsePastedSearch(input){
 const text=String(input||'').replace(/\r/g,'').replace(/\u00a0|\u202f/g,' ').slice(0,100000);
 const lines=text.split('\n');const blocks=[];let current=[];
 for(const line of lines){const clean=line.trim();const start=titlePattern.test(clean)||/^marque\s*[:=]/i.test(clean);if(start&&current.some(x=>titlePattern.test(x)||/^marque\s*[:=]/i.test(x))){blocks.push(current.join('\n'));current=[];}current.push(clean);}
 if(current.length)blocks.push(current.join('\n'));
 const results=[];const seen=new Set();
 for(const block of blocks){
 const titleLine=block.split('\n').find(line=>titlePattern.test(line));const title=titleLine?.match(titlePattern);
 const brand=field(block,'marque|brand')||title?.[1]||'';
 const modelExplicit=field(block,'mod[eè]le|model');
 if(!brand&&!modelExplicit)continue;
 const remainder=(title?.[2]||'').split(/\s*(?:\||;| · )\s*/)[0];
 const model=modelExplicit||remainder.split(/\s+(?=\d[.,]\d\b|(?:19|20)\d{2}\b|\d[\d ]*\s*(?:€|eur|km)\b|diesel\b|essence\b|hybride\b|[ée]lectrique\b)/i)[0].trim();
 const yearMatch=field(block,'ann[eé]e|mise en circulation').match(/\b(?:19|20)\d{2}\b/)||block.match(/\b(?:19|20)\d{2}\b/);
 const priceMatch=block.match(/(\d[\d .]*?(?:,\d{1,2})?)\s*(?:€|EUR\b|euros?\b)/i);
 const kmMatch=block.match(/(\d[\d .]*)\s*km\b/i);
 const engine=field(block,'moteur|motorisation')||block.match(/\b\d[.,]\d\s*(?:BlueHDi|e-HDi|HDi|dCi|TDI|TSI|TFSI|TCe|PureTech|EcoBoost)(?:\s*\d{2,3})?\b/i)?.[0]||'';
 const fuel=field(block,'carburant|[ée]nergie')||block.match(/\b(diesel|essence|hybride rechargeable|hybride|[ée]lectrique|GPL)\b/i)?.[0]||'';
 const gearbox=field(block,'bo[iî]te(?: de vitesses)?')||block.match(/\b(automatique|manuelle|BVA|BVM)\b/i)?.[0]||'';
 const url=block.match(/https?:\/\/[^\s<>"\]]+/i)?.[0]||'';
 const row={brand,model,engine,year:yearMatch?Number(yearMatch[0]):null,km:kmMatch?number(kmMatch[1]):null,price:priceMatch?number(priceMatch[1]):null,fuel,gearbox,url,source:block};
 const key=JSON.stringify({...row,source:undefined});if(!seen.has(key)){seen.add(key);results.push(row);}
 }
 return results;
}
