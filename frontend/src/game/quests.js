import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  HeartPulse,
  Megaphone,
  Sparkles,
  UsersRound,
  WandSparkles,
} from 'lucide-react';

export const interests = [
  { key: 'technology', label: 'เทคโนโลยี', icon: BrainCircuit },
  { key: 'data', label: 'ข้อมูล', icon: BarChart3 },
  { key: 'art', label: 'ศิลปะ', icon: WandSparkles },
  { key: 'marketing', label: 'การตลาด', icon: Megaphone },
  { key: 'health', label: 'สุขภาพ', icon: HeartPulse },
  { key: 'helping', label: 'ช่วยเหลือผู้คน', icon: UsersRound },
  { key: 'business', label: 'ธุรกิจ', icon: BriefcaseBusiness },
  { key: 'freelance', label: 'อิสระ', icon: Sparkles },
];

export const quests = [
  {
    key: 'graph_reading',
    city: 'เมืองแห่งข้อมูลแรงงาน',
    prompt: 'กราฟบอกว่าผู้มีงานทำสูง แต่ผู้ว่างงานเริ่มขยับขึ้น คุณจะสรุปให้ทีมฟังอย่างไร',
    options: [
      {
        label: 'ชี้แนวโน้มและขอข้อมูลเพิ่มก่อนตัดสินใจ',
        scores: { analytical: 3, communication: 1, technology: 1 },
      },
      { label: 'รีบสรุปว่าตลาดแย่ลงทันที', scores: { communication: 1 } },
      { label: 'เลือกทำอินโฟกราฟิกเล่าให้เข้าใจง่าย', scores: { content: 2, creativity: 2 } },
    ],
  },
  {
    key: 'work_problem',
    city: 'เมืองเทคโนโลยี',
    prompt: 'ระบบสมัครงานออนไลน์มีคนใช้แล้วสับสน คุณจะเริ่มแก้จากจุดไหน',
    options: [
      { label: 'ดูข้อมูลพฤติกรรมและสัมภาษณ์ผู้ใช้', scores: { analytical: 2, empathy: 2 } },
      { label: 'เปลี่ยนสีทั้งหมดให้ดูสดขึ้นก่อน', scores: { creativity: 1 } },
      { label: 'ออกแบบ flow ใหม่และทดสอบกับกลุ่มเล็ก', scores: { technology: 2, communication: 1 } },
    ],
  },
  {
    key: 'content_idea',
    city: 'เมืองครีเอเตอร์',
    prompt: 'ต้องทำคอนเทนต์ให้วัยรุ่นเข้าใจตลาดแรงงาน คุณเลือกไอเดียไหน',
    options: [
      { label: 'คลิปสั้น “อาชีพนี้วันหนึ่งทำอะไรบ้าง”', scores: { content: 3, creativity: 2 } },
      { label: 'รายงาน PDF ยาว 80 หน้า', scores: { analytical: 1 } },
      { label: 'เกมทายทักษะพร้อม feedback ทันที', scores: { technology: 1, content: 2 } },
    ],
  },
  {
    key: 'tool_match',
    city: 'เมืองเครื่องมืออาชีพ',
    prompt: 'จับคู่เครื่องมือกับภารกิจ: ทีมต้องวิเคราะห์คำตอบผู้เล่นจำนวนมาก',
    options: [
      { label: 'Spreadsheet + dashboard สรุปแนวโน้ม', scores: { analytical: 2, business: 1 } },
      { label: 'AI ช่วยจัดกลุ่มคำตอบและให้มนุษย์ตรวจซ้ำ', scores: { technology: 3, analytical: 1 } },
      { label: 'อ่านทีละคำตอบโดยไม่จัดหมวด', scores: { service_minded: 1 } },
    ],
  },
  {
    key: 'care_service',
    city: 'เมืองสุขภาพ',
    prompt: 'ผู้ใช้สูงวัยไม่มั่นใจเรื่องการเรียนออนไลน์ คุณจะช่วยอย่างไร',
    options: [
      { label: 'อธิบายทีละขั้นและให้กำลังใจ', scores: { empathy: 3, service_minded: 2 } },
      { label: 'ส่งคู่มือยาว ๆ แล้วให้ลองเอง', scores: { independence: 1 } },
      { label: 'จัดกลุ่มเพื่อนช่วยเพื่อน', scores: { communication: 2, empathy: 1 } },
    ],
  },
  {
    key: 'work_style',
    city: 'เมืองฟรีแลนซ์',
    prompt: 'คุณอยากทำงานแบบไหนเมื่อเจอโปรเจกต์ท้าทาย',
    options: [
      { label: 'วางแผนเอง รับผิดชอบเอง และส่งงานตามเป้า', scores: { independence: 3, business: 1 } },
      { label: 'ทำกับทีมใหญ่ มีบทบาทชัดเจน', scores: { communication: 2, business: 1 } },
      { label: 'ทดลองหลายไอเดียจนเจอทางที่ใช่', scores: { creativity: 2, independence: 1 } },
    ],
  },
];

export const scoreKeys = [
  'analytical',
  'creativity',
  'technology',
  'communication',
  'empathy',
  'independence',
  'service_minded',
  'business',
  'content',
  'health_care',
];

export const scoreLabels = {
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
