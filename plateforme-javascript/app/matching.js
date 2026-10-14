export const normalize = value => String(value ?? '').trim().toLowerCase();
export const isSpecified = value => value !== null && value !== undefined && !(typeof value === 'string' && !value.trim());
export const requestPriceRange = request => ({min:isSpecified(request.minPrice)?request.minPrice:null,max:Object.hasOwn(request,'maxPrice')?(isSpecified(request.maxPrice)?request.maxPrice:null):(isSpecified(request.price)?request.price:null)});
export function validateRequestBudget(request){
  const {min,max}=requestPriceRange(request);
  if(min!==null&&(!Number.isFinite(min)||min<0)||max!==null&&(!Number.isFinite(max)||max<=0)||min!==null&&max!==null&&min>max)throw Error('Fourchette invalide : minimum positif ou nul, maximum positif et minimum inférieur ou égal au maximum.');
  return {minPrice:min,maxPrice:max,price:max};
}
export function validateRequestCriteria(request){
  const clean={};
  for(const key of ['brand','model','engine']){if(isSpecified(request[key])&&(typeof request[key]!=='string'||request[key].length>499))throw Error('Critère '+key+' invalide');clean[key]=normalize(request[key])?String(request[key]).trim():'';}
  clean.year=isSpecified(request.year)?request.year:null;
  if(clean.year!==null&&(!Number.isInteger(clean.year)||clean.year<1950||clean.year>2030))throw Error('Année invalide');
  return {...clean,...validateRequestBudget(request)};
}
export function matchDetails(request,vehicle){
  const checks=[];
  for(const key of ['brand','model','engine'])if(isSpecified(request[key]))checks.push({key,match:normalize(request[key])===normalize(vehicle[key])});
  if(isSpecified(request.year))checks.push({key:'year',match:request.year===vehicle.year});
  const {min,max}=requestPriceRange(request);
  if(min!==null)checks.push({key:'minPrice',match:Number.isFinite(min)&&min>=0&&Number.isFinite(vehicle.price)&&vehicle.price>=min});
  if(max!==null)checks.push({key:'maxPrice',match:Number.isFinite(max)&&max>0&&Number.isFinite(vehicle.price)&&vehicle.price<=max});
  return {total:checks.length,matched:checks.filter(c=>c.match).length,matches:checks.every(c=>c.match),checks};
}
export const matchesRequest=(request,vehicle)=>matchDetails(request,vehicle).matches;
