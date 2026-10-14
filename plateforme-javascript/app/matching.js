export const normalize = value => String(value || '').trim().toLowerCase();
export const matchesRequest = (request, vehicle) => ['brand', 'model', 'engine'].every(key => normalize(request[key]) === normalize(vehicle[key])) && request.year === vehicle.year && vehicle.price <= request.price;
