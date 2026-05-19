import express from 'express';
import crypto from 'node:crypto';
import { transaction } from '../db/pool.js';
import { profileSchema, startPlayerSchema, validate } from '../utils/validators.js';

export const playerRoutes = express.Router();

playerRoutes.post('/start', async (req, res, next) => {
  try {
    const input = validate(startPlayerSchema, req.body);
    const result = await transaction(async (connection) => {
      const [playerResult] = await connection.execute(
        `INSERT INTO players (uuid, consent_status, gender)
         VALUES (:uuid, :consent_status, :gender)`,
        {
          uuid: crypto.randomUUID(),
          consent_status: input.consent_status ? 1 : 0,
          gender: input.gender,
        },
      );
      const [sessionResult] = await connection.execute(
        `INSERT INTO game_sessions (player_id, started_at, completed_status)
         VALUES (:player_id, NOW(), 0)`,
        { player_id: playerResult.insertId },
      );
      await connection.execute(
        `INSERT INTO player_answers (session_id, question_key, answer_value, answer_label)
         VALUES (:session_id, 'avatar_style', :avatar_style, :avatar_style)`,
        { session_id: sessionResult.insertId, avatar_style: input.avatar_style },
      );

      return { player_id: playerResult.insertId, session_id: sessionResult.insertId };
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

playerRoutes.post('/profile', async (req, res, next) => {
  try {
    const input = validate(profileSchema, req.body);
    await transaction(async (connection) => {
      await connection.execute(
        `UPDATE players
         SET gender = COALESCE(:gender, gender),
             age_range = :age_range,
             education_level = :education_level,
             province = :province,
             updated_at = NOW()
         WHERE id = :player_id`,
        input,
      );

      const answers = [
        ['age_range', input.age_range, input.age_range],
        ['education_level', input.education_level, input.education_level],
        ['province', input.province, input.province],
        ['interests', JSON.stringify(input.interests), input.interests.join(', ')],
      ];

      for (const [question_key, answer_value, answer_label] of answers) {
        await connection.execute(
          `INSERT INTO player_answers (session_id, question_key, answer_value, answer_label)
           VALUES (:session_id, :question_key, :answer_value, :answer_label)`,
          { session_id: input.session_id, question_key, answer_value, answer_label },
        );
      }
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
