export const normalize = value => String(value || '').trim().toLowerCase();
// Legacy orders retain their former maximum budget and a zero lower bound.
export const requestPriceRange = request => ({min:request.minPrice ?? 0,max:request.maxPrice ?? request.price});
export function validateRequestBudget(request){
  const {min,max}=requestPriceRange(request);
  if(!Number.isFinite(min)||!Number.isFinite(max)||min<0||max<=0||min>max)throw Error('Le prix minimum doit être positif ou nul et inférieur ou égal au prix maximum.');
  return {minPrice:min,maxPrice:max,price:max};
}
export function matchesRequest(request,vehicle){
  const {min,max}=requestPriceRange(request);
  return Number.isFinite(min)&&Number.isFinite(max)&&min>=0&&max>0&&min<=max&&Number.isFinite(vehicle.price)
    &&['brand','model','engine'].every(key=>normalize(request[key])===normalize(vehicle[key]))
    &&request.year===vehicle.year&&vehicle.price>=min&&vehicle.price<=max;
}
