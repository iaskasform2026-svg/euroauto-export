export function publicFeedUrl(value) {
  const u = new URL(value);
  const host = u.hostname.toLowerCase();
  if (u.protocol !== 'https:' || u.username || u.password || u.port && u.port !== '443'
    || !host.includes('.') || host.includes(':') || host.includes('[') || /^\d+\.\d+\.\d+\.\d+$/.test(host)
    || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw Error('URL de flux HTTPS public requise');
  return u.toString();
}
export function parseInventory(input, supplierId, sourceUrl, fetchedAt) {
  const items = Array.isArray(input) ? input : input?.vehicles;
  if (!Array.isArray(items)) throw Error('Le flux doit contenir une liste de véhicules JSON');
  let rejected = 0;
  const vehicles = items.slice(0,1000).flatMap(v => {
    if (!v || !['brand','model'].every(k => typeof v[k] === 'string' && v[k].trim() && v[k].length<500)
      || v.engine!=null&&(typeof v.engine!=='string'||v.engine.length>499) || v.year!=null&&(!Number.isInteger(v.year)||v.year<1950||v.year>2030) || typeof v.price !== 'number' || !Number.isFinite(v.price) || v.price<=0
      || v.currency && v.currency !== 'EUR' || v.km!=null&&(typeof v.km!=='number'||!Number.isFinite(v.km)||v.km<0) || !v.url) {rejected++;return [];}
    let url;
    try {url = publicFeedUrl(v.url);} catch {rejected++;return [];}
    return [{brand:v.brand.trim(),model:v.model.trim(),engine:v.engine?.trim()||'',year:v.year??null,price:v.price,km:v.km??null,url,supplierId,currency:'EUR',taxBasis:['HT','TTC'].includes(v.taxBasis)?v.taxBasis:'Non précisé',sourceUrl,fetchedAt,priceSource:'Flux fournisseur',notes:''}];
  });
  return {vehicles,rejected};
}
const headerKey=value=>String(value).replace(/^\uFEFF/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export function parseCsv(text){
  const firstLine=text.split(/\r?\n/,1)[0];const delimiter=(firstLine.match(/;/g)||[]).length>(firstLine.match(/,/g)||[]).length?';':',';
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell.length){throw Error('Guillemets CSV mal placés');}else quoted=!quoted;}
    else if(!quoted&&ch===delimiter){row.push(cell);cell='';}
    else if(!quoted&&(ch==='\n'||ch==='\r')){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(c=>c.trim()))rows.push(row);row=[];cell='';}
    else cell+=ch;
  }
  if(quoted)throw Error('Champ CSV non fermé');row.push(cell);if(row.some(c=>c.trim()))rows.push(row);
  if(!rows.length)throw Error('Flux CSV vide : en-têtes requis');
  const names=rows.shift().map(headerKey);
  if(new Set(names).size!==names.length)throw Error('En-têtes CSV dupliqués');
  const aliases={marque:'brand',modele:'model',moteur:'engine',motorisation:'engine',annee:'year',prix:'price',kilometrage:'km',lien:'url',devise:'currency',taxbasis:'taxBasis',regimeprix:'taxBasis'};
  const canonical=names.map(k=>aliases[k]||k);
  if(!['brand','model','price','url'].every(k=>canonical.includes(k)))throw Error('Colonnes CSV requises : brand, model, price, url');
  return rows.slice(0,1000).map(values=>{const item=Object.fromEntries(canonical.map((k,i)=>[k,(values[i]||'').trim()]));for(const key of ['year','price','km']){const raw=(item[key]||'').replace(/[\s\u00a0\u202f]/g,'').replace(',','.');item[key]=!raw&&key!=='price'?null:/^\d+(?:\.\d+)?$/.test(raw)?Number(raw):NaN;}return item;});
}
export function decodeInventory(body,contentType='',url=''){
  const trimmed=body.trim().replace(/^\uFEFF/,'');
  if(trimmed.startsWith('{')||trimmed.startsWith('[')){try{return JSON.parse(trimmed);}catch{throw Error('Flux JSON invalide');}}
  if(contentType.includes('csv')||/\.csv(?:\?|$)/i.test(url)||trimmed.includes('\n')&&/[;,]/.test(trimmed.split('\n')[0]))return parseCsv(trimmed);
  throw Error('Flux JSON ou CSV attendu. Une page de catalogue HTML n’est pas un flux de stock.');
}
