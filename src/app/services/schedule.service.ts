import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import { DaySchedule, DayData, WeekData, StreakResult, PersonalRecords, HistoryPoint } from '../models';
import { DEFAULT_SCHEDULE } from '../constants';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private storage: StorageService, private profile: ProfileService) {}

  getSchedule(): DaySchedule[] {
    return this.storage.getJson<DaySchedule[]>(this.profile.scheduleKey(), JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)));
  }

  saveSchedule(schedule: DaySchedule[]): void {
    this.storage.setJson(this.profile.scheduleKey(), schedule);
  }

  getMondayOfWeek(d: Date): Date {
    const day = d.getDay() || 7;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - (day - 1));
  }

  getWeekData(): WeekData {
    const mon = this.getMondayOfWeek(new Date());
    return this.storage.getJson<WeekData>(this.profile.weekDataKey(mon), {});
  }

  saveWeekData(data: WeekData): void {
    const mon = this.getMondayOfWeek(new Date());
    this.storage.setJson(this.profile.weekDataKey(mon), data);
  }

  getDayData(dayName: string): DayData {
    const w = this.getWeekData();
    return w[dayName] || {
      activities: {}, steps: '', calories: '', carbs: '', protein: '', fat: '',
      sleepHrs: '', sleep: 0, pain: 0, weight: '', weightUnit: 'kg',
      meds: {}, notes: '', therapistNotes: ''
    };
  }

  saveDayData(dayName: string, data: DayData): void {
    const w = this.getWeekData();
    w[dayName] = data;
    this.saveWeekData(w);
  }

  getMedications(): string[] {
    return this.storage.getJson<string[]>(this.profile.medsKey(), []);
  }

  saveMedications(meds: string[]): void {
    this.storage.setJson(this.profile.medsKey(), meds);
  }

  getWeightUnit(): 'kg' | 'lbs' {
    return (this.storage.get('rp_weight_unit') as 'kg' | 'lbs') || 'kg';
  }

  saveWeightUnit(unit: 'kg' | 'lbs'): void {
    this.storage.set('rp_weight_unit', unit);
  }

  getStreak(): StreakResult {
    const prefix = this.profile.profileDataPrefix();
    const schedule = this.getSchedule();
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    let current = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const mon = this.getMondayOfWeek(new Date(d));
      const key = prefix + mon.toISOString().slice(0, 10);
      const wdata = this.storage.getJson<WeekData>(key, {});
      const dayName = dayNames[d.getDay()];
      const dayData = wdata[dayName];
      const sched = schedule.find(s => s.day === dayName);

      if (sched?.rest) { current++; d.setDate(d.getDate() - 1); continue; }
      if (dayData) {
        const done = Object.values(dayData.activities || {}).filter(Boolean).length;
        if (done > 0) { current++; d.setDate(d.getDate() - 1); continue; }
      }
      if (i === 0 && !dayData) { d.setDate(d.getDate() - 1); continue; }
      break;
    }

    const bestKey = this.profile.bestStreakKey();
    const best = Math.max(current, parseInt(this.storage.get(bestKey) || '0'));
    this.storage.set(bestKey, String(best));
    return { current, best };
  }

  getPersonalRecords(): PersonalRecords {
    const prefix = this.profile.profileDataPrefix();
    let bestSteps = 0, bestSleep = 0, bestWeek = 0;
    const allWeeks: WeekData[] = [];

    this.storage.keys().forEach(k => {
      if (!k.startsWith(prefix)) return;
      const dateStr = k.slice(prefix.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
      const wdata = this.storage.getJson<WeekData>(k, {});
      allWeeks.push(wdata);
      Object.values(wdata).forEach(d => {
        if (d.steps) bestSteps = Math.max(bestSteps, parseInt(d.steps) || 0);
        if (d.sleepHrs) bestSleep = Math.max(bestSleep, parseFloat(d.sleepHrs) || 0);
      });
    });

    const schedule = this.getSchedule();
    allWeeks.forEach(wdata => {
      let done = 0, total = 0;
      schedule.forEach(s => {
        if (s.rest) return;
        const ddata = wdata[s.day];
        const acts = s.morning.length + s.afternoon.length + s.evening.length;
        total += acts;
        if (ddata) done += Object.values(ddata.activities || {}).filter(Boolean).length;
      });
      if (total) bestWeek = Math.max(bestWeek, Math.round((done / total) * 100));
    });

    return { bestSteps, bestSleep: bestSleep.toFixed(1), bestWeek };
  }

  getHistoryData(metric: string): HistoryPoint[] {
    const prefix = this.profile.profileDataPrefix();
    const weekMap: Record<string, WeekData> = {};

    this.storage.keys().forEach(k => {
      if (!k.startsWith(prefix)) return;
      const dateStr = k.slice(prefix.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
      weekMap[dateStr] = this.storage.getJson<WeekData>(k, {});
    });

    const sorted = Object.keys(weekMap).sort().slice(-8);
    const schedule = this.getSchedule();

    return sorted.map(dateStr => {
      const wdata = weekMap[dateStr];
      const days = Object.values(wdata);
      let val = 0, count = 0;

      if (metric === 'completion') {
        let done = 0, total = 0;
        schedule.forEach(s => {
          if (s.rest) return;
          const ddata = wdata[s.day];
          const acts = s.morning.length + s.afternoon.length + s.evening.length;
          total += acts;
          if (ddata) done += Object.values(ddata.activities || {}).filter(Boolean).length;
        });
        return { weekLabel: dateStr.slice(5), value: total ? Math.round((done / total) * 100) : 0 };
      }

      days.forEach(d => {
        if (metric === 'steps' && d.steps) { val += parseFloat(d.steps) || 0; count++; }
        else if (metric === 'calories' && d.calories) { val += parseFloat(d.calories) || 0; count++; }
        else if (metric === 'sleep' && d.sleepHrs) { val += parseFloat(d.sleepHrs) || 0; count++; }
        else if (metric === 'pain' && d.pain != null) { val += parseFloat(String(d.pain)) || 0; count++; }
      });

      return { weekLabel: dateStr.slice(5), value: count ? Math.round((val / count) * 10) / 10 : 0 };
    });
  }

  exportJSON(): void {
    const data: Record<string, unknown> = {};
    this.storage.keys().filter(k => k.startsWith('rp_')).forEach(k => {
      data[k] = this.storage.get(k);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rehab-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  importJSON(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target?.result as string);
          Object.entries(data).forEach(([k, v]) => this.storage.set(k, v as string));
          resolve();
        } catch { reject(new Error('Invalid backup file')); }
      };
      reader.readAsText(file);
    });
  }

  exportCSV(): void {
    const schedule = this.getSchedule();
    const wdata = this.getWeekData();
    const rows = [['Day', 'Morning', 'Afternoon', 'Evening', 'Steps', 'Calories', 'Sleep', 'Pain', 'Weight']];
    schedule.forEach(s => {
      const d = wdata[s.day] || {};
      rows.push([
        s.day,
        s.morning.join('; '),
        s.afternoon.join('; '),
        s.evening.join('; '),
        (d as DayData).steps || '',
        (d as DayData).calories || '',
        (d as DayData).sleepHrs || '',
        String((d as DayData).pain || ''),
        (d as DayData).weight || ''
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rehab-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  resetSchedule(): void {
    this.saveSchedule(JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)));
  }

  clearWeekData(): void {
    const mon = this.getMondayOfWeek(new Date());
    this.storage.setJson(this.profile.weekDataKey(mon), {});
  }

  svgLineChart(dataPoints: number[], labels: string[], color: string, width = 350, height = 220): string {
    if (dataPoints.length < 2) return '';
    const pad = { l: 45, r: 15, t: 15, b: 35 };
    const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
    const max = Math.max(...dataPoints) * 1.1 || 1;
    const pts = dataPoints.map((v, i) => {
      const x = pad.l + (i / (dataPoints.length - 1)) * W;
      const y = pad.t + H - (v / max) * H;
      return [x, y];
    });
    const polyline = pts.map(p => p.join(',')).join(' ');
    const area = `${pad.l},${pad.t + H} ` + pts.map(p => p.join(',')).join(' ') + ` ${pad.l + W},${pad.t + H}`;
    let svg = `<svg viewBox="0 0 ${width} ${height}" style="width:100%;max-width:${width}px">`;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * H;
      svg += `<line x1="${pad.l}" y1="${y}" x2="${pad.l + W}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`;
    }
    svg += `<polygon points="${area}" fill="${color}" opacity="0.15"/>`;
    svg += `<polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach((p, i) => {
      svg += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${color}" stroke="white" stroke-width="2"><title>${labels[i]}: ${dataPoints[i]}</title></circle>`;
    });
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * H;
      const val = Math.round(max - (i / 4) * max);
      svg += `<text x="${pad.l - 5}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--text2)">${val}</text>`;
    }
    labels.forEach((l, i) => {
      const x = pad.l + (i / (labels.length - 1)) * W;
      svg += `<text x="${x}" y="${pad.t + H + 20}" text-anchor="middle" font-size="10" fill="var(--text2)">${l}</text>`;
    });
    svg += '</svg>';
    return svg;
  }

  svgDonut(segments: { label: string; value: number; color: string }[]): string {
    const total = segments.reduce((s, x) => s + x.value, 0);
    if (!total) return '';
    const r = 45, cx = 60, cy = 60, stroke = 28;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    let svg = `<svg viewBox="0 0 120 170" style="width:120px;margin:0 auto;display:block">`;
    segments.forEach(seg => {
      const pct = seg.value / total;
      const dash = pct * circ;
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${stroke}" stroke-dasharray="${dash} ${circ}" stroke-dashoffset="${-offset * circ}" transform="rotate(-90 ${cx} ${cy})"><title>${seg.label}: ${Math.round(pct * 100)}%</title></circle>`;
      offset += pct;
    });
    svg += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" fill="var(--text)">${total}g</text>`;
    let ly = 135;
    segments.forEach(seg => {
      svg += `<text x="10" y="${ly}" font-size="10" fill="${seg.color}">■ ${seg.label} ${seg.value}g</text>`;
      ly += 14;
    });
    svg += '</svg>';
    return svg;
  }
}
