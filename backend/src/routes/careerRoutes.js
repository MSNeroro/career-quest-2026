import express from 'express';
import { query, transaction } from '../db/pool.js';
import { calculateMatches } from '../services/matchingEngine.js';
import { recommendationSchema, validate } from '../utils/validators.js';

export const careerRoutes = express.Router();

careerRoutes.get('/careers', async (_req, res, next) => {
  try {
    const careers = await query(
      `SELECT id, career_name_th, career_name_en, category, description,
              required_skills_json, interest_tags_json, personality_tags_json,
              education_hint, roadmap, trend_score, popularity_score,
              source_name, source_url, active_status
       FROM careers
       WHERE active_status = 1
       ORDER BY category, career_name_th`,
    );
    res.json({ careers });
  } catch (error) {
    next(error);
  }
});

careerRoutes.post('/recommendation/calculate', async (req, res, next) => {
  try {
    const input = validate(recommendationSchema, req.body);
    const careers = await query(
      `SELECT *
       FROM careers
       WHERE active_status = 1`,
    );
    const recommendations = calculateMatches({
      careers,
      profile: input.player_profile,
      skillScores: input.skill_scores,
      selectedCareerIds: input.selected_career_ids,
    });

    await transaction(async (connection) => {
      await connection.execute('DELETE FROM recommendations WHERE session_id = :session_id', {
        session_id: input.session_id,
      });
      for (const item of recommendations) {
        await connection.execute(
          `INSERT INTO recommendations
           (session_id, career_id, final_score, reason_text, rank_no)
           VALUES (:session_id, :career_id, :final_score, :reason_text, :rank_no)`,
          {
            session_id: input.session_id,
            career_id: item.id,
            final_score: item.final_score,
            reason_text: item.reason_text,
            rank_no: item.rank_no,
          },
        );
      }
      await connection.execute(
        `UPDATE game_sessions
         SET ended_at = NOW(), completed_status = 1, total_score = :total_score
         WHERE id = :session_id`,
        {
          session_id: input.session_id,
          total_score: recommendations[0]?.final_score || 0,
        },
      );
    });

    res.json({ recommendations: recommendations.map((item) => ({ ...item, career_id: item.id })) });
  } catch (error) {
    next(error);
  }
});

careerRoutes.get('/recommendation/:session_id', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT r.*, c.career_name_th, c.career_name_en, c.category, c.roadmap
       FROM recommendations r
       JOIN careers c ON c.id = r.career_id
       WHERE r.session_id = :session_id
       ORDER BY r.rank_no`,
      { session_id: Number(req.params.session_id) },
    );
    res.json({ recommendations: rows });
  } catch (error) {
    next(error);
  }
});
