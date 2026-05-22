import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import fs from 'node:fs/promises';
import { query, transaction } from '../db/pool.js';
import { env } from '../config/env.js';
import { createCsrfToken, requireAdmin, requireCsrf } from '../middleware/security.js';
import { memoryStore } from '../services/memoryStore.js';
import { adminLoginSchema, careerSchema, validate } from '../utils/validators.js';

const upload = multer({ dest: 'uploads/', limits: { fileSize: 2 * 1024 * 1024 } });
export const adminRoutes = express.Router();

adminRoutes.post('/login', async (req, res, next) => {
  try {
    const input = validate(adminLoginSchema, req.body);
    if (env.useMemoryStore && input.username === 'admin' && input.password === 'password') {
      req.session.adminUser = { id: 1, username: 'admin', role: 'admin' };
      return res.json({ ok: true, csrfToken: createCsrfToken(req), admin: req.session.adminUser });
    }
    const rows = await query('SELECT * FROM admin_users WHERE username = :username LIMIT 1', {
      username: input.username,
    });
    const admin = rows[0];
    if (!admin || !(await bcrypt.compare(input.password, admin.password_hash))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.adminUser = { id: admin.id, username: admin.username, role: admin.role };
    res.json({ ok: true, csrfToken: createCsrfToken(req), admin: req.session.adminUser });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/careers', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const input = validate(careerSchema, req.body);
    if (env.useMemoryStore) {
      return res.status(201).json(memoryStore.createCareer(input));
    }
    const result = await query(
      `INSERT INTO careers
       (career_name_th, career_name_en, category, description, required_skills_json,
        interest_tags_json, personality_tags_json, education_hint, roadmap, trend_score,
        popularity_score, source_name, source_url, active_status)
       VALUES (:career_name_th, :career_name_en, :category, :description, :required_skills_json,
        :interest_tags_json, :personality_tags_json, :education_hint, :roadmap, :trend_score,
        :popularity_score, :source_name, :source_url, :active_status)`,
      input,
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
});

adminRoutes.put('/careers/:id', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const input = validate(careerSchema, req.body);
    if (env.useMemoryStore) {
      return res.json(memoryStore.updateCareer(Number(req.params.id), input));
    }
    await query(
      `UPDATE careers
       SET career_name_th = :career_name_th,
           career_name_en = :career_name_en,
           category = :category,
           description = :description,
           required_skills_json = :required_skills_json,
           interest_tags_json = :interest_tags_json,
           personality_tags_json = :personality_tags_json,
           education_hint = :education_hint,
           roadmap = :roadmap,
           trend_score = :trend_score,
           popularity_score = :popularity_score,
           source_name = :source_name,
           source_url = :source_url,
           active_status = :active_status,
           updated_at = NOW()
       WHERE id = :id`,
      { ...input, id: Number(req.params.id) },
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRoutes.delete('/careers/:id', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    if (env.useMemoryStore) {
      return res.json(memoryStore.deactivateCareer(Number(req.params.id)));
    }
    await query(
      `UPDATE careers
       SET active_status = 0, updated_at = NOW()
       WHERE id = :id`,
      { id: Number(req.params.id) },
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/labor/import', requireAdmin, requireCsrf, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' });
    const csv = await fs.readFile(req.file.path, 'utf8');
    const records = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
    await fs.unlink(req.file.path).catch(() => {});
    if (env.useMemoryStore) {
      return res.status(201).json({ imported_rows: records.length, demo_mode: true });
    }

    const datasetName = req.body.dataset_name || req.file.originalname;
    const datasetYear = Number(records[0]?.dataset_year || new Date().getFullYear());

    const importedRows = await transaction(async (connection) => {
      const [datasetResult] = await connection.execute(
        `INSERT INTO labor_market_datasets
         (dataset_name, dataset_year, source_name, source_url, uploaded_by)
         VALUES (:dataset_name, :dataset_year, :source_name, :source_url, :uploaded_by)`,
        {
          dataset_name: datasetName,
          dataset_year: datasetYear,
          source_name: req.body.source_name || 'CSV import',
          source_url: req.body.source_url || '',
          uploaded_by: req.session.adminUser.username,
        },
      );

      for (const row of records) {
        await connection.execute(
          `INSERT INTO labor_market_rows
           (dataset_id, metric_key, metric_name, area_type, sex, value, unit)
           VALUES (:dataset_id, :metric_key, :metric_name, :area_type, :sex, :value, :unit)`,
          {
            dataset_id: datasetResult.insertId,
            metric_key: row.metric_key,
            metric_name: row.metric_name,
            area_type: row.area_type,
            sex: row.sex,
            value: Number(row.value || 0),
            unit: row.unit || 'คน',
          },
        );
      }
      return records.length;
    });

    res.status(201).json({ imported_rows: importedRows });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/dashboard', requireAdmin, async (_req, res, next) => {
  try {
    if (env.useMemoryStore) {
      return res.json(memoryStore.dashboard());
    }
    const [totalPlayers, playersToday, completedSessions, topProvince, topCareer] = await Promise.all([
      query('SELECT COUNT(*) AS value FROM players'),
      query('SELECT COUNT(*) AS value FROM players WHERE DATE(created_at) = CURRENT_DATE'),
      query('SELECT COUNT(*) AS value FROM game_sessions WHERE completed_status = 1'),
      query(`SELECT province, COUNT(*) AS value FROM players WHERE province IS NOT NULL GROUP BY province ORDER BY value DESC LIMIT 5`),
      query(
        `SELECT c.career_name_th, COUNT(*) AS value
         FROM recommendations r
         JOIN careers c ON c.id = r.career_id
         GROUP BY c.id
         ORDER BY value DESC
         LIMIT 5`,
      ),
    ]);
    res.json({
      total_players: totalPlayers[0]?.value || 0,
      players_today: playersToday[0]?.value || 0,
      completed_sessions: completedSessions[0]?.value || 0,
      top_provinces: topProvince,
      top_recommended_careers: topCareer,
    });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/export/summary', requireAdmin, async (_req, res, next) => {
  try {
    if (env.useMemoryStore) {
      const csv = [
        'career_name_th,category,recommended_count,avg_score',
        ...memoryStore.listCareers().map((career) =>
          [career.career_name_th, career.category, 0, '0.00']
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(','),
        ),
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="career-quest-summary-demo.csv"');
      return res.send(`\uFEFF${csv}`);
    }
    const rows = await query(
      `SELECT c.career_name_th, c.category, COUNT(r.id) AS recommended_count, AVG(r.final_score) AS avg_score
       FROM careers c
       LEFT JOIN recommendations r ON r.career_id = c.id
       GROUP BY c.id
       ORDER BY recommended_count DESC, c.career_name_th`,
    );
    const csv = [
      'career_name_th,category,recommended_count,avg_score',
      ...rows.map((row) =>
        [row.career_name_th, row.category, row.recommended_count, Number(row.avg_score || 0).toFixed(2)]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      ),
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="career-quest-summary.csv"');
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
});
