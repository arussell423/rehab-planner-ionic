export const REST_QUOTES = [
  "Rest is not quitting — it's fueling your comeback. 💪",
  "Champions are built in recovery. 🏆",
  "Your body heals while you rest. Trust the process. 🌟",
  "Active recovery is still progress. 🚀",
  "Rest days are where strength is built. 💎",
  "Healing takes courage. You have it. ❤️",
  "Every step forward counts, even when standing still. 🌱",
  "Your comeback story starts with taking care of yourself. ✨",
  "Rest, recharge, return stronger. ⚡",
  "Patience with yourself is strength. 🧘",
  "Your body is doing incredible work healing right now. 🌿",
  "Recovery is a marathon, not a sprint. Keep going. 🏃",
  "Today's rest is tomorrow's victory. 🥇",
  "Believe in your body's ability to heal. 💫",
  "Small steps forward are still forward. 👣",
  "Your best is yet to come. 🌅",
  "Healing is not linear, and that's okay. 🌈",
  "Every rest day brings you closer to your goal. 🎯",
  "Take care of your body — it's the only place you have to live. 🏠",
  "You are stronger than you think. 💪",
  "Recovery day: recharge your body, refuel your mind. 🔋",
  "Progress is progress, no matter how small. 🌻"
];

export const TEMPLATES: Record<string, string[]> = {
  '🚴 Cardio': ['Bike 20min', 'Treadmill Walk 15min', 'Stationary Bike 30min', 'Elliptical 20min', 'Swimming Laps'],
  '💪 Strength': ['Resistance Band Arms', 'Leg Press', 'Seated Row', 'Chest Press', 'Shoulder Press', 'Squats (assisted)'],
  '🤸 Flexibility': ['Full Body Stretch 10min', 'Hip Flexor Stretch', 'Hamstring Stretch', 'Shoulder Mobility', 'Foam Rolling'],
  '🏊 Pool Therapy': ['Aqua Walking', 'Water Resistance Kicks', 'Pool Jogging', 'Arm Circles in Water'],
  '⚖️ Balance': ['Standing Balance 30s', 'Single Leg Stand', 'Balance Board', 'Heel-to-Toe Walk'],
  '🧘 Recovery': ['Deep Breathing', 'Meditation 10min', 'Ice/Heat Therapy', 'Compression Therapy']
};

export const PAIN_EMOJIS = ['😊','🙂','😐','😕','😟','😣','😖','😫','😩','🤯','💀'];
export const AVATAR_EMOJIS = ['🧑‍⚕️','👤','💪','🏃','🧘','🏊','🚴','🤸','👩','👨','🦸','⭐','🌟','💫','🎯','🏆'];
export const THEMES = ['sage', 'teal', 'blue', 'green', 'purple', 'rose', 'orange'] as const;
export type Theme = typeof THEMES[number];

export const CHART_COLORS: Record<string, string> = {
  steps: '#3b82f6',
  calories: '#10b981',
  sleep: '#a78bfa',
  completion: '#f59e0b',
  pain: '#ef4444'
};

export const DEFAULT_SCHEDULE = [
  { day: 'Monday',    short: 'Mon', morning: [], afternoon: [], evening: [], rest: false, stepGoal: 5000, calGoal: 1200 },
  { day: 'Tuesday',   short: 'Tue', morning: [], afternoon: [], evening: [], rest: false, stepGoal: 5000, calGoal: 1200 },
  { day: 'Wednesday', short: 'Wed', morning: [], afternoon: [], evening: [], rest: true,  stepGoal: 0,    calGoal: 0    },
  { day: 'Thursday',  short: 'Thu', morning: [], afternoon: [], evening: [], rest: false, stepGoal: 5000, calGoal: 1200 },
  { day: 'Friday',    short: 'Fri', morning: [], afternoon: [], evening: [], rest: false, stepGoal: 5000, calGoal: 1200 },
  { day: 'Saturday',  short: 'Sat', morning: [], afternoon: [], evening: [], rest: false, stepGoal: 5000, calGoal: 1200 },
  { day: 'Sunday',    short: 'Sun', morning: [], afternoon: [], evening: [], rest: true,  stepGoal: 0,    calGoal: 0    }
];
