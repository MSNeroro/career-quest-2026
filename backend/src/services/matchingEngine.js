import { parseJsonArray } from '../utils/json.js';

const scoreLabels = {
  analytical: 'วิเคราะห์ข้อมูล',
  creativity: 'ความคิดสร้างสรรค์',
  technology: 'เทคโนโลยี',
  communication: 'สื่อสาร',
  empathy: 'เข้าใจผู้คน',
  independence: 'ทำงานอิสระ',
  service_minded: 'บริการ',
  business: 'ธุรกิจ',
  content: 'คอนเทนต์',
  health_care: 'สุขภาพ',
};

function overlapScore(left = [], right = []) {
  if (!left.length || !right.length) return 0;
  const set = new Set(left);
  const hits = right.filter((item) => set.has(item)).length;
  return Math.min(100, (hits / Math.max(right.length, 1)) * 100);
}

function normalizeSkillScore(scores, requiredSkills) {
  if (!requiredSkills.length) return 40;
  const total = requiredSkills.reduce((sum, key) => sum + Number(scores[key] || 0), 0);
  return Math.min(100, (total / (requiredSkills.length * 10)) * 100);
}

function topSkillNames(scores, limit = 3) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => scoreLabels[key] || key)
    .join(', ');
}

export function calculateMatches({ careers, profile, skillScores, selectedCareerIds }) {
  const selectedSet = new Set(selectedCareerIds);

  return careers
    .map((career) => {
      const requiredSkills = parseJsonArray(career.required_skills_json);
      const interestTags = parseJsonArray(career.interest_tags_json);
      const personalityTags = parseJsonArray(career.personality_tags_json);

      const interestScore = overlapScore(profile.interests, interestTags);
      const educationScore = profile.education_level && career.education_hint ? 70 : 45;
      const selectedCareerBoost = selectedSet.has(career.id) ? 100 : 35;
      const profileMatchScore = interestScore * 0.58 + educationScore * 0.17 + selectedCareerBoost * 0.25;

      const skillMatchScore = normalizeSkillScore(skillScores, requiredSkills);
      const behaviorScore = Math.min(
        100,
        skillMatchScore * 0.72 + overlapScore(Object.keys(skillScores).filter((key) => skillScores[key] > 0), personalityTags) * 0.28,
      );
      const careerTrendScore = (Number(career.trend_score || 0) + Number(career.popularity_score || 0)) / 2;

      const finalScore =
        profileMatchScore * 0.3 + behaviorScore * 0.35 + skillMatchScore * 0.25 + careerTrendScore * 0.1;

      const strengths = topSkillNames(skillScores);
      const missing = requiredSkills
        .filter((key) => Number(skillScores[key] || 0) < 5)
        .slice(0, 3)
        .map((key) => scoreLabels[key] || key)
        .join(', ');

      return {
        ...career,
        final_score: Math.max(0, Math.min(100, finalScore)),
        reason_text: `ระบบพบความเชื่อมโยงระหว่างความสนใจของคุณ ทักษะเด่น และแนวโน้มตลาดของสาย ${career.category}`,
        strengths: strengths || 'เริ่มต้นได้หลายด้าน',
        growth_areas: missing || 'ต่อยอดจากทักษะเด่นด้วยโปรเจกต์จริง',
        project_idea: `ลองทำโปรเจกต์ขนาดเล็กที่เกี่ยวกับ ${career.career_name_th} แล้วบันทึกผลงานเป็น portfolio`,
      };
    })
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 3)
    .map((career, index) => ({ ...career, rank_no: index + 1 }));
}
