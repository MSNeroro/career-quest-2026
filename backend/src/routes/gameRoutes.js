import express from 'express';
import { query } from '../db/pool.js';
import { eventSchema, scoreSchema, validate } from '../utils/validators.js';

export const gameRoutes = express.Router();

gameRoutes.post('/event', async (req, res, next) => {
  try {
    const input = validate(eventSchema, req.body);
    await query(
      `INSERT INTO game_events
       (session_id, event_type, event_key, event_value, score_key, score_value)
       VALUES (:session_id, :event_type, :event_key, :event_value, :score_key, :score_value)`,
      input,
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

gameRoutes.post('/score', async (req, res, next) => {
  try {
    const input = validate(scoreSchema, req.body);
    const scores = input.scores;
    await query(
      `INSERT INTO skill_scores
       (session_id, analytical, creativity, technology, communication, empathy, independence,
        service_minded, business, content, health_care)
       VALUES (:session_id, :analytical, :creativity, :technology, :communication, :empathy, :independence,
        :service_minded, :business, :content, :health_care)
       ON DUPLICATE KEY UPDATE
        analytical = VALUES(analytical),
        creativity = VALUES(creativity),
        technology = VALUES(technology),
        communication = VALUES(communication),
        empathy = VALUES(empathy),
        independence = VALUES(independence),
        service_minded = VALUES(service_minded),
        business = VALUES(business),
        content = VALUES(content),
        health_care = VALUES(health_care),
        updated_at = NOW()`,
      {
        session_id: input.session_id,
        analytical: scores.analytical || 0,
        creativity: scores.creativity || 0,
        technology: scores.technology || 0,
        communication: scores.communication || 0,
        empathy: scores.empathy || 0,
        independence: scores.independence || 0,
        service_minded: scores.service_minded || 0,
        business: scores.business || 0,
        content: scores.content || 0,
        health_care: scores.health_care || 0,
      },
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
