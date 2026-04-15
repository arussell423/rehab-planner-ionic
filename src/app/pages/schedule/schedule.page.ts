import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonModal, IonButton, IonButtons, IonHeader, IonToolbar, IonTitle, IonIcon } from '@ionic/angular/standalone';
import { ScheduleService } from '../../services/schedule.service';
import { ProfileService } from '../../services/profile.service';
import { DayData, DaySchedule } from '../../models';
import { REST_QUOTES, PAIN_EMOJIS, TEMPLATES } from '../../constants';
import { WorkoutSessionComponent, SessionActivity } from '../../components/workout-session/workout-session.component';
import { BodyMapComponent } from '../../components/body-map/body-map.component';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: true,
  imports: [IonContent, IonModal, IonButton, IonButtons, IonHeader, IonToolbar, IonTitle, IonIcon, NgFor, NgIf, FormsModule, WorkoutSessionComponent, BodyMapComponent]
})
export class SchedulePage implements OnInit {
  private readonly DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  today = signal<string>('Monday');
  selectedDay = signal<string>('Monday');
  todaySchedule = signal<DaySchedule | null>(null);
  dayData = signal<DayData | null>(null);
  restQuote = signal<string>('');
  donePct = signal<number>(0);
  doneCount = signal<number>(0);
  totalCount = signal<number>(0);
  medications = signal<string[]>([]);
  weightUnit = signal<'kg' | 'lbs'>('kg');
  painEmojis = PAIN_EMOJIS;
  templateCategories = Object.entries(TEMPLATES);
  showTemplateSheet = signal<boolean>(false);
  showCopySheet = signal<boolean>(false);
  copyTargetDays = signal<Record<string, boolean>>({});
  currentSlot = signal<string>('morning');
  toast = signal<string>('');
  toastVisible = signal<boolean>(false);
  private undoData: { dayName: string; data: DayData; slot: string; index: number; activity: string } | null = null;
  private confettiShown: Record<string, boolean> = {};
  allSchedule = signal<DaySchedule[]>([]);
  macroSvg = signal<SafeHtml>('');
  allDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  showSession = signal<boolean>(false);
  sessionActivities = signal<SessionActivity[]>([]);

  constructor(private schedSvc: ScheduleService, private profileSvc: ProfileService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void { this.load(); }
  ionViewWillEnter(): void { this.load(); }

  load(): void {
    const todayName = this.DAY_NAMES[new Date().getDay()];
    this.today.set(todayName);
    this.selectedDay.set(todayName);
    this.loadDay(todayName);
  }

  loadDay(dayName: string): void {
    const schedule = this.schedSvc.getSchedule();
    this.allSchedule.set(schedule);
    const sched = schedule.find(s => s.day === dayName) || schedule[0];
    this.todaySchedule.set(sched);
    const data = this.schedSvc.getDayData(dayName);
    this.dayData.set(data);
    this.medications.set(this.schedSvc.getMedications());
    this.weightUnit.set(this.schedSvc.getWeightUnit());
    this.restQuote.set(REST_QUOTES[Math.floor(Math.random() * REST_QUOTES.length)]);
    this.calcProgress(sched, data);
    this.buildMacroChart(data);
  }

  navigateDay(dir: number): void {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const cur = days.indexOf(this.selectedDay());
    const next = days[(cur + dir + 7) % 7];
    this.selectedDay.set(next);
    this.loadDay(next);
  }

  get isToday(): boolean { return this.selectedDay() === this.today(); }

  calcProgress(sched: DaySchedule, data: DayData): void {
    const total = sched.morning.length + sched.afternoon.length + sched.evening.length;
    const done = Object.values(data.activities || {}).filter(Boolean).length;
    this.totalCount.set(total);
    this.doneCount.set(done);
    this.donePct.set(total ? Math.round((done / total) * 100) : 0);
  }

  buildMacroChart(data: DayData): void {
    const c = parseInt(data.carbs) || 0;
    const p = parseInt(data.protein) || 0;
    const f = parseInt(data.fat) || 0;
    if (c + p + f > 0) {
      const svg = this.schedSvc.svgDonut([
        { label: 'Carbs', value: c, color: '#f59e0b' },
        { label: 'Protein', value: p, color: '#3b82f6' },
        { label: 'Fat', value: f, color: '#10b981' }
      ]);
      this.macroSvg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
    }
  }

  toggleActivity(key: string, checked: boolean): void {
    const data = { ...this.dayData()! };
    data.activities = { ...data.activities, [key]: checked };
    this.dayData.set(data);
    this.schedSvc.saveDayData(this.selectedDay(), data);
    this.calcProgress(this.todaySchedule()!, data);
    this.checkConfetti(data);
  }

  checkConfetti(data: DayData): void {
    const sched = this.todaySchedule()!;
    if (sched.rest || !this.isToday) return;
    const total = sched.morning.length + sched.afternoon.length + sched.evening.length;
    const done = Object.values(data.activities || {}).filter(Boolean).length;
    const steps = parseInt(data.steps) || 0;
    const key = `${this.selectedDay()}_${new Date().toISOString().slice(0, 10)}`;
    if (done === total && total > 0 && steps >= sched.stepGoal && !this.confettiShown[key]) {
      this.launchConfetti();
      this.confettiShown[key] = true;
    }
  }

  launchConfetti(): void {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;pointer-events:none';
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;
    const COLORS = ['#2563eb','#16a34a','#7c3aed','#e11d48','#ea580c','#f59e0b'];
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width, y: -10,
      vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4,
      w: 8 + Math.random() * 8, h: 5 + Math.random() * 5,
      rot: Math.random() * 360, rotV: (Math.random() - .5) * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
    const start = Date.now();
    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
        if (p.y > canvas.height) p.y = -10;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
      });
      if (Date.now() - start < 3500) requestAnimationFrame(frame); else canvas.remove();
    };
    requestAnimationFrame(frame);
  }

  saveField(field: keyof DayData, value: string | number): void {
    const data = { ...this.dayData()!, [field]: value };
    this.dayData.set(data as DayData);
    this.schedSvc.saveDayData(this.selectedDay(), data as DayData);
    if (field === 'steps') this.checkConfetti(data as DayData);
    if (['carbs','protein','fat'].includes(field as string)) this.buildMacroChart(data as DayData);
  }

  saveMed(med: string, checked: boolean): void {
    const data = { ...this.dayData()! };
    data.meds = { ...data.meds, [med]: checked };
    this.dayData.set(data);
    this.schedSvc.saveDayData(this.selectedDay(), data);
  }

  setSleepQuality(val: number): void { this.saveField('sleep', val); }
  setPain(val: number): void { this.saveField('pain', val); }

  addActivityFromTemplate(activity: string): void {
    const slot = this.currentSlot();
    const sched = { ...this.todaySchedule()! };
    (sched as any)[slot] = [...(sched as any)[slot], activity];
    this.todaySchedule.set(sched);
    const schedule = this.schedSvc.getSchedule().map(s => s.day === this.selectedDay() ? sched : s);
    this.schedSvc.saveSchedule(schedule);
    this.showTemplateSheet.set(false);
    this.calcProgress(sched, this.dayData()!);
  }

  deleteActivity(slot: string, index: number): void {
    const sched = { ...this.todaySchedule()! };
    const activities: string[] = [...(sched as any)[slot]];
    const activity = activities[index];
    activities.splice(index, 1);
    (sched as any)[slot] = activities;
    this.todaySchedule.set(sched);
    const schedule = this.schedSvc.getSchedule().map(s => s.day === this.selectedDay() ? sched : s);
    this.schedSvc.saveSchedule(schedule);
    this.undoData = { dayName: this.selectedDay(), data: this.dayData()!, slot, index, activity };
    this.showToast(`"${activity}" deleted. <span class="undo-link">Undo</span>`);
    this.calcProgress(sched, this.dayData()!);
  }

  undo(): void {
    if (!this.undoData) return;
    const { slot, index, activity } = this.undoData;
    const sched = { ...this.todaySchedule()! };
    const list: string[] = [...(sched as any)[slot]];
    list.splice(index, 0, activity);
    (sched as any)[slot] = list;
    this.todaySchedule.set(sched);
    const schedule = this.schedSvc.getSchedule().map(s => s.day === this.selectedDay() ? sched : s);
    this.schedSvc.saveSchedule(schedule);
    this.undoData = null;
    this.hideToast();
    this.calcProgress(sched, this.dayData()!);
  }

  showToast(msg: string): void {
    this.toast.set(msg); this.toastVisible.set(true);
    setTimeout(() => this.hideToast(), 5000);
  }

  hideToast(): void { this.toastVisible.set(false); }

  executeCopy(): void {
    const targets = Object.entries(this.copyTargetDays()).filter(([,v]) => v).map(([k]) => k);
    const schedule = this.schedSvc.getSchedule();
    const src = schedule.find(s => s.day === this.selectedDay());
    if (!src) return;
    const updated = schedule.map(s => {
      if (!targets.includes(s.day)) return s;
      return {
        ...s,
        morning: [...new Set([...s.morning, ...src.morning])],
        afternoon: [...new Set([...s.afternoon, ...src.afternoon])],
        evening: [...new Set([...s.evening, ...src.evening])]
      };
    });
    this.schedSvc.saveSchedule(updated);
    this.showCopySheet.set(false);
    this.showToast(`Copied to ${targets.join(', ')}`);
  }

  activityKey(day: string, slot: string, i: number): string {
    return `${day}_${slot}_${i}`;
  }

  stars(rating: number): boolean[] {
    return [1,2,3,4,5].map(i => i <= rating);
  }

  get painEmoji(): string {
    return PAIN_EMOJIS[this.dayData()?.pain ?? 0];
  }

  setWeightUnit(unit: 'kg' | 'lbs'): void {
    this.weightUnit.set(unit);
    this.schedSvc.saveWeightUnit(unit);
  }

  savePainAreas(areas: string[]): void {
    const data = { ...this.dayData()!, painAreas: areas };
    this.dayData.set(data as any);
    this.schedSvc.saveDayData(this.selectedDay(), data as any);
  }

  setCopyTarget(day: string, checked: boolean): void {
    const cur = this.copyTargetDays();
    this.copyTargetDays.set({ ...cur, [day]: checked });
  }

  getSlot(sched: DaySchedule, slot: string): string[] {
    return (sched as any)[slot] as string[];
  }

  isActivityDone(key: string): boolean {
    return !!(this.dayData()?.activities?.[key]);
  }

  startSession(): void {
    const sched = this.todaySchedule();
    if (!sched) return;
    const activities: SessionActivity[] = [];
    (['morning', 'afternoon', 'evening'] as const).forEach(slot => {
      const slotActs: string[] = (sched as any)[slot] || [];
      slotActs.forEach((name, i) => {
        const key = this.activityKey(this.selectedDay(), slot, i);
        const structured = (sched.activities || []).find(a => a.name === name && a.timeOfDay === slot);
        activities.push({
          key,
          name,
          slot,
          completed: this.isActivityDone(key),
          sets: structured?.sets,
          reps: structured?.reps,
          duration: structured?.duration,
          weightLoad: structured?.weightLoad,
          notes: structured?.notes,
        });
      });
    });
    this.sessionActivities.set(activities);
    this.showSession.set(true);
  }

  onSessionActivityToggled(event: { key: string; completed: boolean }): void {
    this.toggleActivity(event.key, event.completed);
  }

  onSessionClosed(): void {
    this.showSession.set(false);
  }
}
