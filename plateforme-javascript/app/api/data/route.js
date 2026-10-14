import { matchesRequest } from '../../matching';
import { getContext as context } from '../../data-access';
export const dynamic = 'force-dynamic';
const reply = (x, status = 200) => Response.json(x, { status });
export async function GET() { const c = await context(); if (!c)
    return reply({ error: 'Connexion requise' }, 401); const rows = await c.db.prepare('SELECT * FROM records').all(); const all = rows.results.map(r => ({ id: r.id, kind: r.kind, owner: r.owner, ...JSON.parse(r.data) })); const requests = all.filter(r => r.kind === 'request' && (c.admin || r.owner === c.user.userId)); const vehicles = all.filter(r => r.kind === 'vehicle'); const profiles = all.filter(r => r.kind === 'profile'); const matches = all.filter(r => r.kind === 'match'); return reply({ admin: c.admin, user: c.user, requests, profiles: c.admin ? profiles : profiles.filter(r => r.owner === c.user.userId), suppliers: c.admin ? all.filter(r => r.kind === 'supplier') : [], vehicles: c.admin ? vehicles : [], matches: c.admin ? matches : [], proposals: matches.filter(m => m.published && Number.isFinite(m.proposedPrice) && m.proposedPrice>0 && requests.some(r => r.id === m.requestId && vehicles.some(v => v.id === m.vehicleId && matchesRequest(r,v)))).map(m => { const v = vehicles.find(v => v.id === m.vehicleId); return v ? { id: m.id, requestId: m.requestId, brand: v.brand, model: v.model, engine: v.engine, year: v.year, price: m.proposedPrice, km: v.km } : null; }).filter(Boolean) }); }
export async function POST(req) {
    const c = await context();
    if (!c)
        return reply({ error: 'Connexion requise' }, 401);
    try {
        const b = await req.json();
        const { kind, data } = b;
        for (const key of ['id','kind','owner','createdAt']) if (data && typeof data === 'object') delete data[key];
        if (!['profile', 'request', 'supplier', 'vehicle', 'match'].includes(kind) || !data || typeof data !== 'object')
            return reply({ error: 'Données invalides' }, 400);
        if (['supplier', 'vehicle', 'match'].includes(kind) && !c.admin)
            return reply({ error: 'Accès administrateur requis' }, 403);
        const str = (k) => typeof data[k] === 'string' && data[k].trim().length > 0 && data[k].length < 500;
        if (kind === 'profile' && (!str('name') || !str('phone')))
            throw Error('Nom et téléphone requis');
        if (kind === 'request') { const profile = await c.db.prepare('SELECT id FROM records WHERE id=? AND kind=?').bind('profile-'+c.user.userId, 'profile').first(); if (!profile) throw Error('Complétez votre inscription avant de créer une demande'); }
        if (kind === 'vehicle' && (!Number.isFinite(data.km) || data.km < 0)) throw Error('Kilométrage invalide');
        if (kind === 'request' || kind === 'vehicle') {
            if (!['brand', 'model', 'engine'].every(str) || !Number.isInteger(data.year) || data.year < 1950 || data.year > 2030 || !Number.isFinite(data.price) || data.price <= 0)
                throw Error('Véhicule ou prix invalide');
        }
        if (kind === 'supplier' && !str('name'))
            throw Error('Nom requis');
        if (kind === 'supplier' || kind === 'vehicle') {
            if (data.feedUrl) { const u = new URL(data.feedUrl); if (u.protocol !== 'https:') throw Error('Le flux doit utiliser HTTPS'); }
            if (data.url) {
                const u = new URL(data.url);
                if (!['https:', 'http:'].includes(u.protocol))
                    throw Error('Lien invalide');
            }
        }
        if (kind === 'match') {
            const r = await c.db.prepare('SELECT data FROM records WHERE id=? AND kind=?').bind(data.requestId, 'request').first();
            const v = await c.db.prepare('SELECT data FROM records WHERE id=? AND kind=?').bind(data.vehicleId, 'vehicle').first();
            if (!r || !v)
                throw Error('Références invalides');
            if (!Number.isFinite(data.proposedPrice) || data.proposedPrice <= 0) throw Error('Saisissez un prix proposé au client supérieur à zéro');
            data.published = data.published === true;
            if (data.published && !matchesRequest(JSON.parse(r.data), JSON.parse(v.data))) throw Error('Le véhicule ne correspond pas aux critères de la demande');
        }
        const id = kind === 'profile' ? 'profile-' + c.user.userId : kind === 'match' ? 'match-' + data.requestId + '-' + data.vehicleId : crypto.randomUUID();
        await c.db.prepare('INSERT INTO records (id,kind,owner,data) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(id, kind, c.user.userId, JSON.stringify({ ...data, createdAt: new Date().toISOString() })).run();
        return reply({ ok: true, id });
    }
    catch (e) {
        return reply({ error: e.message || 'Enregistrement impossible' }, 400);
    }
}

export async function PATCH(req) {
  const c = await context();
  if (!c) return reply({error:'Connexion requise'},401);
  try {
    const body = await req.json();
    const existing = await c.db.prepare('SELECT * FROM records WHERE id=? AND kind=?').bind(body.id,'request').first();
    if (!existing || existing.owner !== c.user.userId) return reply({error:'Commande inaccessible'},404);
    const old = JSON.parse(existing.data);
    const data = body.data || {};
    if (!['brand','model','engine'].every(key => typeof data[key]==='string' && data[key].trim().length>0 && data[key].length<500)
      || !Number.isInteger(data.year) || data.year<1950 || data.year>2030 || !Number.isFinite(data.price) || data.price<=0)
      return reply({error:'Critères ou prix invalide'},400);
    const clean = {brand:data.brand.trim(),model:data.model.trim(),engine:data.engine.trim(),year:data.year,price:data.price,notes:String(data.notes||'').slice(0,2000),createdAt:old.createdAt,updatedAt:new Date().toISOString()};
    // One atomic batch prevents proposals for old criteria from remaining published.
    await c.db.batch([
      c.db.prepare('UPDATE records SET data=? WHERE id=? AND owner=?').bind(JSON.stringify(clean),body.id,c.user.userId),
      c.db.prepare("DELETE FROM records WHERE kind='match' AND json_extract(data,'$.requestId')=?").bind(body.id)
    ]);
    return reply({ok:true,id:body.id});
  } catch(e) { return reply({error:e.message || 'Modification impossible'},400); }
}
