export interface Profile {
  id: string;
  name: string;
  emoji: string;
  theme: 'blue' | 'green' | 'purple' | 'rose' | 'orange';
  appName: string;
}

export interface DaySchedule {
  day: string;
  short: string;
  morning: string[];
  afternoon: string[];
  evening: string[];
  rest: boolean;
  stepGoal: number;
  calGoal: number;
}

export interface DayData {
  activities: Record<string, boolean>;
  steps: string;
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
  sleepHrs: string;
  sleep: number;
  pain: number;
  weight: string;
  weightUnit: 'kg' | 'lbs';
  meds: Record<string, boolean>;
  notes: string;
  therapistNotes: string;
}

export interface WeekData {
  [dayName: string]: DayData;
}

export interface StreakResult {
  current: number;
  best: number;
}

export interface PersonalRecords {
  bestSteps: number;
  bestSleep: string;
  bestWeek: number;
}

export interface HistoryPoint {
  weekLabel: string;
  value: number;
}
