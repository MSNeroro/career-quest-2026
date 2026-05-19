import { z } from 'zod';

export const startPlayerSchema = z.object({
  consent_status: z.literal(true),
  gender: z.enum(['male', 'female', 'not_specified']).default('not_specified'),
  avatar_style: z.string().max(64).optional().default('bright'),
});

export const profileSchema = z.object({
  session_id: z.number().int().positive(),
  player_id: z.number().int().positive(),
  gender: z.enum(['male', 'female', 'not_specified']).optional(),
  age_range: z.string().max(24),
  education_level: z.string().max(64),
  province: z.string().max(128),
  interests: z.array(z.string().max(64)).max(12).default([]),
});

export const eventSchema = z.object({
  session_id: z.number().int().positive(),
  event_type: z.string().max(64),
  event_key: z.string().max(128),
  event_value: z.string().max(500).optional().default(''),
  score_key: z.string().max(64).optional().nullable(),
  score_value: z.number().optional().nullable(),
});

export const scoreSchema = z.object({
  session_id: z.number().int().positive(),
  scores: z.record(z.number().min(0).max(100)),
});

export const recommendationSchema = z.object({
  session_id: z.number().int().positive(),
  player_profile: z.object({
    gender: z.string().optional(),
    age_range: z.string().optional(),
    education_level: z.string().optional(),
    province: z.string().optional(),
    interests: z.array(z.string()).optional().default([]),
  }),
  skill_scores: z.record(z.number()).default({}),
  selected_career_ids: z.array(z.number().int().positive()).default([]),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(8).max(200),
});

export const careerSchema = z.object({
  career_name_th: z.string().min(1).max(255),
  career_name_en: z.string().min(1).max(255),
  category: z.string().min(1).max(120),
  description: z.string().min(1),
  required_skills_json: z.string().default('[]'),
  interest_tags_json: z.string().default('[]'),
  personality_tags_json: z.string().default('[]'),
  education_hint: z.string().optional().default(''),
  roadmap: z.string().optional().default(''),
  trend_score: z.coerce.number().min(0).max(100).default(70),
  popularity_score: z.coerce.number().min(0).max(100).default(70),
  source_name: z.string().optional().default(''),
  source_url: z.string().url().optional().or(z.literal('')).default(''),
  active_status: z.coerce.number().int().min(0).max(1).default(1),
});

export function validate(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ');
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
  return result.data;
}
