import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  Check,
  ChevronRight,
  Download,
  Edit3,
  FileUp,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { api, API_BASE } from './api/client';
import { educationLevels, provinces } from './data/provinces';
import { interests, quests, scoreKeys, scoreLabels } from './game/quests';

const ageRanges = ['15-18', '19-24', '25-34', '35-44', '45+'];
const avatars = [
  { key: 'bright', label: 'นักสำรวจสดใส', gender: 'not_specified', emoji: '✨' },
  { key: 'tech', label: 'สายเทค', gender: 'not_specified', emoji: '💻' },
  { key: 'creative', label: 'สายครีเอทีฟ', gender: 'not_specified', emoji: '🎨' },
  { key: 'care', label: 'สายดูแลผู้คน', gender: 'not_specified', emoji: '💚' },
];

const emptyScores = Object.fromEntries(scoreKeys.map((key) => [key, 0]));

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function PrimaryButton({ children, className, ...props }) {
  return (
    <button
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, className, ...props }) {
  return (
    <button
      className={cx(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-300/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 dark:border-slate-600 dark:text-slate-100',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Shell({ children, stepIndex, theme, setTheme, soundOn, setSoundOn }) {
  const progress = Math.round(((stepIndex + 1) / 5) * 100);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-600 text-white shadow-glow">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              Career Quest 2026
            </p>
            <h1 className="text-lg font-black leading-tight sm:text-2xl">เส้นทางอาชีพของฉัน</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-300/70 bg-white/70 text-slate-700 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
            aria-label={soundOn ? 'ปิดเสียง' : 'เปิดเสียง'}
            onClick={() => setSoundOn((value) => !value)}
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-300/70 bg-white/70 text-slate-700 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
            aria-label="เปลี่ยนธีม"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <section className="mb-5 rounded-full bg-white/60 p-1 dark:bg-slate-900/50">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-teal-500 via-amber-400 to-rose-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </section>

      {children}
    </main>
  );
}

function Mascot({ message }) {
  return (
    <div className="glass-panel flex items-center gap-3 rounded-[28px] p-4">
      <div className="avatar-bob grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-amber-300 via-rose-300 to-teal-300 text-3xl shadow-lg">
        🧭
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
          มินิไกด์
        </p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{message}</p>
      </div>
    </div>
  );
}

function OptionCard({ selected, children, onClick, icon: Icon }) {
  return (
    <button
      className={cx(
        'game-card min-h-24 rounded-[24px] p-4 text-left',
        selected && 'border-teal-500 ring-4 ring-teal-400/20',
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-500/12 text-teal-700 dark:text-teal-200">
            <Icon size={22} />
          </span>
        ) : null}
        <span className="font-bold leading-snug">{children}</span>
        {selected ? <Check className="ml-auto text-teal-600" size={20} /> : null}
      </div>
    </button>
  );
}

function GameApp() {
  const [theme, setTheme] = useState(localStorage.getItem('cq-theme') || 'light');
  const [soundOn, setSoundOn] = useState(false);
  const [step, setStep] = useState('intro');
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('careerQuestSession');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState({
    consent_status: false,
    avatar_style: '',
    gender: 'not_specified',
    age_range: '',
    education_level: '',
    province: '',
    interests: [],
  });
  const [questIndex, setQuestIndex] = useState(0);
  const [scores, setScores] = useState(emptyScores);
  const [careers, setCareers] = useState([]);
  const [selectedCareers, setSelectedCareers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('cq-theme', theme);
  }, [theme]);

  const stepIndex = ['intro', 'profile', 'quest', 'career', 'result'].indexOf(step);
  const canContinueIntro = profile.consent_status && profile.avatar_style;
  const canContinueProfile =
    profile.age_range && profile.education_level && profile.province && profile.interests.length >= 2;

  async function startGame() {
    setApiError('');
    try {
      const payload = await api.startPlayer({
        consent_status: profile.consent_status,
        gender: profile.gender,
        avatar_style: profile.avatar_style,
      });
      localStorage.setItem('careerQuestSession', JSON.stringify(payload));
      setSession(payload);
      setStep('profile');
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function saveProfile() {
    setApiError('');
    try {
      await api.saveProfile({
        session_id: session.session_id,
        player_id: session.player_id,
        ...profile,
      });
      setStep('quest');
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function chooseQuest(option) {
    const nextScores = { ...scores };
    Object.entries(option.scores).forEach(([key, value]) => {
      nextScores[key] = (nextScores[key] || 0) + value;
    });
    setScores(nextScores);

    if (session) {
      await api.saveEvent({
        session_id: session.session_id,
        event_type: 'quest_answer',
        event_key: quests[questIndex].key,
        event_value: option.label,
        score_key: Object.keys(option.scores)[0],
        score_value: Object.values(option.scores)[0],
      });
    }

    if (questIndex + 1 >= quests.length) {
      await api.saveScore({ session_id: session.session_id, scores: nextScores });
      const careersPayload = await api.getCareers();
      setCareers(careersPayload.careers || []);
      setStep('career');
      return;
    }

    setQuestIndex((value) => value + 1);
  }

  async function calculate() {
    setApiError('');
    try {
      const payload = await api.calculateRecommendation({
        session_id: session.session_id,
        player_profile: profile,
        skill_scores: scores,
        selected_career_ids: selectedCareers,
      });
      setRecommendations(payload.recommendations || []);
      setStep('result');
    } catch (error) {
      setApiError(error.message);
    }
  }

  const chartData = useMemo(
    () =>
      scoreKeys.map((key) => ({
        skill: scoreLabels[key],
        score: Math.min(10, scores[key] || 0),
      })),
    [scores],
  );

  return (
    <Shell
      stepIndex={Math.max(0, stepIndex)}
      theme={theme}
      setTheme={setTheme}
      soundOn={soundOn}
      setSoundOn={setSoundOn}
    >
      <AnimatePresence mode="wait">
        {step === 'intro' ? (
          <motion.section
            key="intro"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid flex-1 items-center gap-5 lg:grid-cols-[1fr_0.86fr]"
          >
            <div className="glass-panel rounded-[32px] p-6 sm:p-8">
              <p className="mb-3 inline-flex rounded-full bg-teal-500/12 px-3 py-1 text-xs font-bold text-teal-800 dark:text-teal-200">
                Mini Game / Career Discovery
              </p>
              <h2 className="max-w-2xl text-4xl font-black leading-tight sm:text-6xl">
                ออกเดินทางหาอาชีพที่เข้ากับตัวคุณ
              </h2>
              <p className="mt-4 max-w-xl text-base font-medium text-slate-600 dark:text-slate-300">
                เกมนี้จะใช้คำตอบและพฤติกรรมระหว่างเล่นเพื่อวิเคราะห์แนวโน้มอาชีพ โดยเก็บเท่าที่จำเป็น
                และมีตัวเลือกข้ามหรือไม่ระบุในข้อมูลส่วนตัว
              </p>
              <div className="mt-6 flex items-start gap-3 rounded-3xl border border-teal-300/50 bg-teal-50/80 p-4 text-sm text-teal-950 dark:bg-teal-950/40 dark:text-teal-50">
                <ShieldCheck className="mt-0.5 shrink-0" size={20} />
                <span>
                  โปร่งใสตามหลัก PDPA เบื้องต้น: ขอ consent ก่อนเริ่ม ไม่เก็บเลขบัตรหรือข้อมูลติดต่อ
                  และใช้ข้อมูลเพื่อคำแนะนำอาชีพในเกมนี้เท่านั้น
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <Mascot message="เลือก avatar ที่ใกล้กับสไตล์คุณก่อน แล้วเราไปสำรวจเมืองอาชีพกัน" />
              <div className="grid grid-cols-2 gap-3">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.key}
                    className={cx(
                      'game-card rounded-[24px] p-4 text-left',
                      profile.avatar_style === avatar.key && 'border-teal-500 ring-4 ring-teal-400/20',
                    )}
                    onClick={() =>
                      setProfile((value) => ({
                        ...value,
                        avatar_style: avatar.key,
                        gender: avatar.gender,
                      }))
                    }
                    type="button"
                  >
                    <span className="text-4xl">{avatar.emoji}</span>
                    <p className="mt-3 font-bold">{avatar.label}</p>
                  </button>
                ))}
              </div>
              <label className="flex items-start gap-3 rounded-3xl bg-white/70 p-4 text-sm font-semibold dark:bg-slate-900/60">
                <input
                  className="mt-1 h-5 w-5 accent-teal-600"
                  type="checkbox"
                  checked={profile.consent_status}
                  onChange={(event) =>
                    setProfile((value) => ({ ...value, consent_status: event.target.checked }))
                  }
                />
                ยินยอมให้ใช้ข้อมูลการเล่นเพื่อวิเคราะห์และแนะนำอาชีพภายในเกม
              </label>
              {apiError ? <p className="rounded-2xl bg-rose-100 p-3 text-sm font-bold text-rose-700">{apiError}</p> : null}
              <PrimaryButton disabled={!canContinueIntro} onClick={startGame} className="w-full">
                เริ่มภารกิจ <ChevronRight size={18} />
              </PrimaryButton>
            </div>
          </motion.section>
        ) : null}

        {step === 'profile' ? (
          <motion.section
            key="profile"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"
          >
            <div className="space-y-4">
              <Mascot message="ข้อมูลชุดนี้ช่วยให้คำแนะนำแม่นขึ้น แต่เราเก็บแบบเบา ๆ เหมือนเลือกจุดเริ่มเดินทาง" />
              <div className="glass-panel rounded-[28px] p-5">
                <h2 className="text-2xl font-black">Profile Discovery</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  เลือกเส้นทางเริ่มต้น ไม่ใช่ข้อสอบ ไม่มีถูกผิด
                </p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="mb-3 font-black">ช่วงอายุ</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {ageRanges.map((range) => (
                    <OptionCard
                      key={range}
                      selected={profile.age_range === range}
                      onClick={() => setProfile((value) => ({ ...value, age_range: range }))}
                    >
                      {range}
                    </OptionCard>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-black">Learning Badge</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {educationLevels.map((level) => (
                    <OptionCard
                      key={level.value}
                      selected={profile.education_level === level.value}
                      onClick={() => setProfile((value) => ({ ...value, education_level: level.value }))}
                    >
                      {level.icon} · {level.label}
                    </OptionCard>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="font-black">
                  จังหวัดเริ่มต้น
                  <select
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white/80 px-4 py-3 text-base dark:border-slate-600 dark:bg-slate-900"
                    value={profile.province}
                    onChange={(event) => setProfile((value) => ({ ...value, province: event.target.value }))}
                  >
                    <option value="">เลือกจังหวัด</option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <h3 className="mb-2 font-black">ไอเท็มความสนใจ เลือกอย่างน้อย 2</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {interests.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={cx(
                          'rounded-2xl border border-slate-300 bg-white/70 px-3 py-2 text-sm font-bold dark:border-slate-600 dark:bg-slate-900/70',
                          profile.interests.includes(item.key) && 'border-amber-400 bg-amber-100 text-amber-950',
                        )}
                        onClick={() =>
                          setProfile((value) => ({
                            ...value,
                            interests: value.interests.includes(item.key)
                              ? value.interests.filter((key) => key !== item.key)
                              : [...value.interests, item.key],
                          }))
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {apiError ? <p className="rounded-2xl bg-rose-100 p-3 text-sm font-bold text-rose-700">{apiError}</p> : null}
              <PrimaryButton disabled={!canContinueProfile} onClick={saveProfile} className="w-full sm:w-auto">
                ไปทำ Skill Quest <ChevronRight size={18} />
              </PrimaryButton>
            </div>
          </motion.section>
        ) : null}

        {step === 'quest' ? (
          <motion.section
            key="quest"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mx-auto grid w-full max-w-4xl gap-5"
          >
            <Mascot message={`ด่านที่ ${questIndex + 1}/${quests.length}: เลือกตามสัญชาตญาณได้เลย ระบบจะอ่านทักษะจากทางเลือกของคุณ`} />
            <div className="glass-panel rounded-[32px] p-6 sm:p-8">
              <p className="mb-3 text-sm font-bold text-amber-600">{quests[questIndex].city}</p>
              <h2 className="text-2xl font-black sm:text-4xl">{quests[questIndex].prompt}</h2>
              <div className="mt-6 grid gap-3">
                {quests[questIndex].options.map((option) => (
                  <OptionCard key={option.label} onClick={() => chooseQuest(option)}>
                    {option.label}
                  </OptionCard>
                ))}
              </div>
            </div>
          </motion.section>
        ) : null}

        {step === 'career' ? (
          <motion.section
            key="career"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5"
          >
            <Mascot message="เลือกการ์ดอาชีพที่อยากรู้จัก ระบบจะใช้เป็นสัญญาณความสนใจ ไม่ใช่การล็อกผลลัพธ์" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {careers.map((career) => (
                <button
                  key={career.id}
                  type="button"
                  onClick={() =>
                    setSelectedCareers((value) =>
                      value.includes(career.id)
                        ? value.filter((id) => id !== career.id)
                        : [...value, career.id],
                    )
                  }
                  className={cx(
                    'game-card rounded-[28px] p-5 text-left',
                    selectedCareers.includes(career.id) && 'border-teal-500 ring-4 ring-teal-400/20',
                  )}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                    {career.category}
                  </p>
                  <h3 className="mt-2 text-xl font-black">{career.career_name_th}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{career.career_name_en}</p>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                    {career.description}
                  </p>
                </button>
              ))}
            </div>
            {apiError ? <p className="rounded-2xl bg-rose-100 p-3 text-sm font-bold text-rose-700">{apiError}</p> : null}
            <PrimaryButton onClick={calculate} disabled={selectedCareers.length === 0}>
              วิเคราะห์อาชีพที่เหมาะกับฉัน <Award size={18} />
            </PrimaryButton>
          </motion.section>
        ) : null}

        {step === 'result' ? (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]"
          >
            <div className="glass-panel rounded-[32px] p-5">
              <h2 className="text-2xl font-black">Skill Radar</h2>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                    <Radar dataKey="score" fill="#0ea5a6" fillOpacity={0.34} stroke="#0f766e" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-4">
              <Mascot message="นี่คือ Top 3 ที่ระบบคำนวณจาก profile, พฤติกรรมในเกม, ทักษะ และ trend ของอาชีพ" />
              {recommendations.map((item) => (
                <article key={item.career_id} className="glass-panel rounded-[28px] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-amber-600">อันดับ {item.rank_no}</p>
                      <h3 className="text-2xl font-black">{item.career_name_th}</h3>
                      <p className="font-semibold text-slate-500">{item.category}</p>
                    </div>
                    <div className="rounded-2xl bg-teal-600 px-3 py-2 text-xl font-black text-white">
                      {Math.round(item.final_score)}%
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-700 dark:text-slate-200">{item.reason_text}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="font-black">ทักษะเด่นที่เกี่ยวข้อง</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{item.strengths}</p>
                    </div>
                    <div>
                      <p className="font-black">ควรพัฒนาเพิ่ม</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{item.growth_areas}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm">
                    <b>Roadmap:</b> {item.roadmap}
                  </p>
                  <p className="mt-2 text-sm">
                    <b>โปรเจกต์ที่ควรลอง:</b> {item.project_idea}
                  </p>
                </article>
              ))}
              <div className="flex flex-wrap gap-3">
                <GhostButton onClick={() => window.print()}>
                  <Download size={17} /> บันทึกผลลัพธ์
                </GhostButton>
                <GhostButton onClick={() => navigator.share?.({ title: 'Career Quest 2026' })}>
                  <Sparkles size={17} /> แชร์ผลลัพธ์
                </GhostButton>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </Shell>
  );
}

function AdminApp() {
  const [csrfToken, setCsrfToken] = useState(localStorage.getItem('cq-admin-csrf') || '');
  const [login, setLogin] = useState({ username: 'admin', password: '' });
  const [dashboard, setDashboard] = useState(null);
  const [careers, setCareers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    career_name_th: '',
    career_name_en: '',
    category: '',
    description: '',
    required_skills_json: '[]',
    interest_tags_json: '[]',
    personality_tags_json: '[]',
    education_hint: '',
    roadmap: '',
    trend_score: 70,
    popularity_score: 70,
    source_name: '',
    source_url: '',
    active_status: 1,
  });
  const [message, setMessage] = useState('');

  async function loadAdmin() {
    const [dashboardPayload, careersPayload] = await Promise.all([api.adminDashboard(), api.getCareers()]);
    setDashboard(dashboardPayload);
    setCareers(careersPayload.careers || []);
  }

  async function submitLogin(event) {
    event.preventDefault();
    setMessage('');
    try {
      const payload = await api.adminLogin(login);
      localStorage.setItem('cq-admin-csrf', payload.csrfToken);
      setCsrfToken(payload.csrfToken);
      await loadAdmin();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitCareer(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await api.updateCareer(editingId, form, csrfToken);
      } else {
        await api.createCareer(form, csrfToken);
      }
      setMessage(editingId ? 'แก้ไขอาชีพเรียบร้อย' : 'บันทึกอาชีพเรียบร้อย');
      setEditingId(null);
      await loadAdmin();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deactivateCareer(id) {
    try {
      await api.deleteCareer(id, csrfToken);
      setMessage('ปิดใช้งานอาชีพเรียบร้อย');
      await loadAdmin();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function beginEdit(career) {
    setEditingId(career.id);
    setForm({
      career_name_th: career.career_name_th || '',
      career_name_en: career.career_name_en || '',
      category: career.category || '',
      description: career.description || '',
      required_skills_json: career.required_skills_json || '[]',
      interest_tags_json: career.interest_tags_json || '[]',
      personality_tags_json: career.personality_tags_json || '[]',
      education_hint: career.education_hint || '',
      roadmap: career.roadmap || '',
      trend_score: career.trend_score || 70,
      popularity_score: career.popularity_score || 70,
      source_name: career.source_name || '',
      source_url: career.source_url || '',
      active_status: career.active_status ?? 1,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function importCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(`${API_BASE}/admin/labor/import`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': csrfToken },
      body,
    });
    const payload = await response.json();
    setMessage(response.ok ? `import สำเร็จ ${payload.imported_rows} แถว` : payload.error);
  }

  useEffect(() => {
    if (csrfToken) {
      loadAdmin().catch(() => setCsrfToken(''));
    }
  }, [csrfToken]);

  if (!csrfToken) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <form className="glass-panel w-full max-w-md rounded-[32px] p-6" onSubmit={submitLogin}>
          <h1 className="text-3xl font-black">Admin Career Quest</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            เข้าสู่ระบบเพื่อจัดการอาชีพและข้อมูลแรงงาน
          </p>
          <input
            className="mt-6 w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-900"
            value={login.username}
            onChange={(event) => setLogin((value) => ({ ...value, username: event.target.value }))}
            placeholder="username"
          />
          <input
            className="mt-3 w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-900"
            type="password"
            value={login.password}
            onChange={(event) => setLogin((value) => ({ ...value, password: event.target.value }))}
            placeholder="password"
          />
          {message ? <p className="mt-3 rounded-2xl bg-rose-100 p-3 text-sm font-bold text-rose-700">{message}</p> : null}
          <PrimaryButton className="mt-5 w-full">Login</PrimaryButton>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-teal-700">Career Quest Admin</p>
          <h1 className="text-3xl font-black">Dashboard & Content</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
            href={`${API_BASE}/admin/export/summary`}
          >
            <Download size={18} /> Export CSV
          </a>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-bold text-white">
            <FileUp size={18} /> Import Labor CSV
            <input className="hidden" type="file" accept=".csv" onChange={importCsv} />
          </label>
        </div>
      </header>
      {message ? <p className="mb-4 rounded-2xl bg-amber-100 p-3 text-sm font-bold text-amber-900">{message}</p> : null}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['ผู้เล่นทั้งหมด', dashboard?.total_players || 0],
          ['ผู้เล่นวันนี้', dashboard?.players_today || 0],
          ['เล่นครบ', dashboard?.completed_sessions || 0],
          ['อาชีพ active', careers.length],
        ].map(([label, value]) => (
          <div key={label} className="glass-panel rounded-[24px] p-5">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </div>
        ))}
      </section>
      <section className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <form className="glass-panel rounded-[28px] p-5" onSubmit={submitCareer}>
          <h2 className="text-xl font-black">{editingId ? 'แก้ไขอาชีพ' : 'เพิ่มอาชีพ'}</h2>
          {['career_name_th', 'career_name_en', 'category', 'source_name', 'source_url'].map((key) => (
            <input
              key={key}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-900"
              value={form[key]}
              onChange={(event) => setForm((value) => ({ ...value, [key]: event.target.value }))}
              placeholder={key}
            />
          ))}
          <textarea
            className="mt-3 min-h-24 w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-900"
            value={form.description}
            onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
            placeholder="description"
          />
          <textarea
            className="mt-3 min-h-24 w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-900"
            value={form.roadmap}
            onChange={(event) => setForm((value) => ({ ...value, roadmap: event.target.value }))}
            placeholder="roadmap"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton>{editingId ? 'บันทึกการแก้ไข' : 'บันทึกอาชีพ'}</PrimaryButton>
            {editingId ? (
              <GhostButton type="button" onClick={() => setEditingId(null)}>
                ยกเลิก
              </GhostButton>
            ) : null}
          </div>
        </form>
        <div className="glass-panel rounded-[28px] p-5">
          <h2 className="text-xl font-black">อาชีพในระบบ</h2>
          <div className="mt-4 grid gap-3">
            {careers.map((career) => (
              <article key={career.id} className="rounded-2xl border border-slate-300/70 p-4 dark:border-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black">{career.career_name_th}</h3>
                    <p className="text-sm text-slate-500">{career.category}</p>
                  </div>
                  <BarChart3 className="text-teal-600" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <GhostButton type="button" onClick={() => beginEdit(career)}>
                    <Edit3 size={16} /> แก้ไข
                  </GhostButton>
                  <GhostButton type="button" onClick={() => deactivateCareer(career.id)}>
                    ปิดใช้งาน
                  </GhostButton>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return window.location.pathname.startsWith('/admin') ? <AdminApp /> : <GameApp />;
}
