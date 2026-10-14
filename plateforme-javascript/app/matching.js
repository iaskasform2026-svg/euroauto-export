export const normalize = value => String(value ?? '').trim().toLowerCase();
export const isSpecified = value => value !== null && value !== undefined && !(typeof value === 'string' && !value.trim());
export const requestPriceRange = request => ({min:isSpecified(request.minPrice)?request.minPrice:null,max:Object.hasOwn(request,'maxPrice')?(isSpecified(request.maxPrice)?request.maxPrice:null):(isSpecified(request.price)?request.price:null)});
export function validateRequestBudget(request){
  const {min,max}=requestPriceRange(request);
  if(min!==null&&(!Number.isFinite(min)||min<0)||max!==null&&(!Number.isFinite(max)||max<=0)||min!==null&&max!==null&&min>max)throw Error('Fourchette invalide : minimum positif ou nul, maximum positif et minimum inférieur ou égal au maximum.');
  return {minPrice:min,maxPrice:max,price:max};
}
export function requestYearRange(request){
  if(Object.hasOwn(request,'minYear')||Object.hasOwn(request,'maxYear'))return {min:isSpecified(request.minYear)?request.minYear:null,max:isSpecified(request.maxYear)?request.maxYear:null};
  return {min:isSpecified(request.year)?request.year:null,max:isSpecified(request.year)?request.year:null};
}
export function validateRequestYears(request){
  const {min,max}=requestYearRange(request);
  if([min,max].some(value=>value!==null&&(!Number.isInteger(value)||value<1950||value>2030))||min!==null&&max!==null&&min>max)throw Error('Années invalides : bornes entières de 1950 à 2030 et minimum inférieur ou égal au maximum.');
  return {minYear:min,maxYear:max,year:min!==null&&min===max?min:null};
}
export function validateRequestCriteria(request){
  const clean={};
  for(const key of ['brand','model','engine']){if(isSpecified(request[key])&&(typeof request[key]!=='string'||request[key].length>499))throw Error('Critère '+key+' invalide');clean[key]=normalize(request[key])?String(request[key]).trim():'';}
  return {...clean,...validateRequestYears(request),...validateRequestBudget(request)};
}
export function matchDetails(request,vehicle){
  const checks=[];
  for(const key of ['brand','model','engine'])if(isSpecified(request[key]))checks.push({key,match:normalize(request[key])===normalize(vehicle[key])});
  const years=requestYearRange(request);
  if(years.min!==null)checks.push({key:'minYear',match:Number.isInteger(vehicle.year)&&vehicle.year>=years.min});
  if(years.max!==null)checks.push({key:'maxYear',match:Number.isInteger(vehicle.year)&&vehicle.year<=years.max});
  const {min,max}=requestPriceRange(request);
  if(min!==null)checks.push({key:'minPrice',match:Number.isFinite(min)&&min>=0&&Number.isFinite(vehicle.price)&&vehicle.price>=min});
  if(max!==null)checks.push({key:'maxPrice',match:Number.isFinite(max)&&max>0&&Number.isFinite(vehicle.price)&&vehicle.price<=max});
  return {total:checks.length,matched:checks.filter(c=>c.match).length,matches:checks.every(c=>c.match),checks};
}
export const matchesRequest=(request,vehicle)=>matchDetails(request,vehicle).matches;
