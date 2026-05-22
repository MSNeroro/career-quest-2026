import { calculateMatches } from '../backend/src/services/matchingEngine.js';
import { fallbackCareers, memoryStore } from '../backend/src/services/memoryStore.js';

function send(res, status, payload, headers = {}) {
  Object.entries({
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  }).forEach(([key, value]) => res.setHeader(key, value));
  res.status(status).send(typeof payload === 'string' ? payload : JSON.stringify(payload));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function activeCareers() {
  return memoryStore.listCareers();
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || 'career-quest-2026.vercel.app'}`);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const method = req.method.toUpperCase();

  try {
    if (method === 'GET' && path === '/health') {
      return send(res, 200, { ok: true, service: 'career-quest-api', storage: 'memory-demo' });
    }

    if (method === 'GET' && path === '/careers') {
      return send(res, 200, { careers: activeCareers() });
    }

    if (method === 'POST' && path === '/player/start') {
      const body = await readBody(req);
      if (!body.consent_status) return send(res, 400, { error: 'Consent is required' });
      return send(res, 201, memoryStore.startPlayer(body));
    }

    if (method === 'POST' && path === '/player/profile') {
      const body = await readBody(req);
      return send(res, 200, memoryStore.saveProfile(body));
    }

    if (method === 'POST' && path === '/game/event') {
      return send(res, 201, { ok: true });
    }

    if (method === 'POST' && path === '/game/score') {
      const body = await readBody(req);
      return send(res, 200, memoryStore.saveScore(body));
    }

    if (method === 'POST' && path === '/recommendation/calculate') {
      const body = await readBody(req);
      const recommendations = calculateMatches({
        careers: fallbackCareers,
        profile: body.player_profile || {},
        skillScores: body.skill_scores || {},
        selectedCareerIds: body.selected_career_ids || [],
      }).map((item) => ({ ...item, career_id: item.id }));
      memoryStore.saveRecommendations(Number(body.session_id), recommendations);
      return send(res, 200, { recommendations });
    }

    const recommendationMatch = path.match(/^\/recommendation\/(\d+)$/);
    if (method === 'GET' && recommendationMatch) {
      return send(res, 200, {
        recommendations: memoryStore.getRecommendations(Number(recommendationMatch[1])),
      });
    }

    if (method === 'POST' && path === '/admin/login') {
      const body = await readBody(req);
      if (body.username === 'admin' && body.password === 'password') {
        return send(res, 200, {
          ok: true,
          csrfToken: 'demo-csrf-token',
          admin: { id: 1, username: 'admin', role: 'admin' },
        });
      }
      return send(res, 401, { error: 'Invalid username or password' });
    }

    if (method === 'GET' && path === '/admin/dashboard') {
      return send(res, 200, memoryStore.dashboard());
    }

    if (method === 'POST' && path === '/admin/careers') {
      const body = await readBody(req);
      return send(res, 201, memoryStore.createCareer(body));
    }

    const careerMatch = path.match(/^\/admin\/careers\/(\d+)$/);
    if (careerMatch && method === 'PUT') {
      const body = await readBody(req);
      return send(res, 200, memoryStore.updateCareer(Number(careerMatch[1]), body));
    }

    if (careerMatch && method === 'DELETE') {
      return send(res, 200, memoryStore.deactivateCareer(Number(careerMatch[1])));
    }

    if (method === 'POST' && path === '/admin/labor/import') {
      return send(res, 201, { imported_rows: 0, demo_mode: true });
    }

    if (method === 'GET' && path === '/admin/export/summary') {
      const csv = [
        'career_name_th,category,recommended_count,avg_score',
        ...activeCareers().map((career) =>
          [career.career_name_th, career.category, 0, '0.00']
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(','),
        ),
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="career-quest-summary-demo.csv"');
      return res.status(200).send(`\uFEFF${csv}`);
    }

    return send(res, 404, { error: `Route not found: ${method} /api${path}` });
  } catch (error) {
    console.error(error);
    return send(res, 500, {
      error: 'Demo API error',
      message: error.message,
    });
  }
}
