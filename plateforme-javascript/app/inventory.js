export function publicFeedUrl(value) {
  const u = new URL(value);
  const host = u.hostname.toLowerCase();
  if (u.protocol !== 'https:' || u.username || u.password || u.port && u.port !== '443'
    || !host.includes('.') || host.includes(':') || host.includes('[') || /^\d+\.\d+\.\d+\.\d+$/.test(host)
    || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw Error('URL de flux HTTPS public requise');
  return u.toString();
}
export function parseInventory(input, supplierId, sourceUrl, fetchedAt) {
  const items = Array.isArray(input) ? input : input.vehicles;
  if (!Array.isArray(items)) throw Error('Le flux doit contenir une liste de véhicules JSON');
  let rejected = 0;
  const vehicles = items.slice(0,1000).flatMap(v => {
    if (!v || !['brand','model','engine'].every(k => typeof v[k] === 'string' && v[k].trim() && v[k].length<500)
      || !Number.isInteger(v.year) || v.year<1950 || v.year>2030 || typeof v.price !== 'number' || !Number.isFinite(v.price) || v.price<=0
      || v.currency && v.currency !== 'EUR' || typeof v.km !== 'number' || !Number.isFinite(v.km) || v.km<0 || !v.url) {rejected++;return [];}
    let url;
    try {url = publicFeedUrl(v.url);} catch {rejected++;return [];}
    return [{brand:v.brand.trim(),model:v.model.trim(),engine:v.engine.trim(),year:v.year,price:v.price,km:v.km,url,supplierId,currency:'EUR',sourceUrl,fetchedAt,priceSource:'Flux fournisseur',notes:''}];
  });
  return {vehicles,rejected};
}
