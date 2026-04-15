import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgFor, NgIf } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ScheduleService } from '../../services/schedule.service';
import { HealthService } from '../../services/health.service';
import { DayData } from '../../models';
import { PAIN_EMOJIS } from '../../constants';
import { OneRmCalculatorComponent } from '../../components/one-rm-calculator/one-rm-calculator.component';
@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.page.html',
  styleUrls: ['./metrics.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon, NgFor, NgIf, OneRmCalculatorComponent]
})
export class MetricsPage implements OnInit {
  private readonly DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  selectedDay = signal<string>('Monday');
  dayData = signal<DayData | null>(null);
  medications = signal<string[]>([]);
  weightUnit = signal<'kg' | 'lbs'>('kg');
  stepGoal = signal<number>(5000);
  calGoal = signal<number>(1200);
  macroSvg = signal<SafeHtml>('');
  macroMode = signal<'g' | '%'>('g');
  healthBanner = signal<string>('');
  healthBannerIcon = signal<string>('heart-outline');
  painEmojis = PAIN_EMOJIS;

  constructor(
    private route: ActivatedRoute,
    private schedSvc: ScheduleService,
    public healthSvc: HealthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const day = params['day'];
      if (day) {
        this.selectedDay.set(day);
      } else {
        this.selectedDay.set(this.DAY_NAMES[new Date().getDay()]);
      }
      this.load();
    });
  }

  ionViewWillEnter() { this.load(); }

  load() {
    const data = this.schedSvc.getDayData(this.selectedDay());
    this.dayData.set(data);
    this.medications.set(this.schedSvc.getMedications());
    this.weightUnit.set(this.schedSvc.getWeightUnit());
    const schedule = this.schedSvc.getSchedule();
    const sched = schedule.find(s => s.day === this.selectedDay());
    if (sched) { this.stepGoal.set(sched.stepGoal); this.calGoal.set(sched.calGoal); }
    this.buildMacroChart(data);
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
    } else {
      this.macroSvg.set('');
    }
  }

  saveField(field: keyof DayData, value: string | number): void {
    const data = { ...this.dayData()!, [field]: value };
    this.dayData.set(data as DayData);
    this.schedSvc.saveDayData(this.selectedDay(), data as DayData);
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

  /** Convert stored grams → % of calorie intake for display */
  macroToPercent(macro: 'carbs' | 'protein' | 'fat'): number | string {
    const kcal = parseFloat(this.dayData()?.calorieIntake ?? '');
    const grams = parseFloat((this.dayData() as any)?.[macro] ?? '');
    if (!kcal || !grams) return '';
    const kcalPerG = macro === 'fat' ? 9 : 4;
    return Math.round((grams * kcalPerG / kcal) * 100);
  }

  /** Save macros — converts % → grams when in % mode */
  saveMacro(macro: 'carbs' | 'protein' | 'fat', raw: string): void {
    const val = parseFloat(raw);
    if (isNaN(val)) { this.saveField(macro, ''); return; }
    if (this.macroMode() === '%') {
      const kcal = parseFloat(this.dayData()?.calorieIntake ?? '');
      if (!kcal) { this.saveField(macro, ''); return; }
      const kcalPerG = macro === 'fat' ? 9 : 4;
      const grams = Math.round((val / 100) * kcal / kcalPerG);
      this.saveField(macro, String(grams));
    } else {
      this.saveField(macro, String(val));
    }
  }

  setWeightUnit(unit: 'kg' | 'lbs'): void {
    this.weightUnit.set(unit);
    this.schedSvc.saveWeightUnit(unit);
  }

  async syncHealth(): Promise<void> {
    if (!this.healthSvc.isNative) {
      this.healthBannerIcon.set('information-circle-outline');
      this.healthBanner.set(
        'Health sync works when the app is installed natively on iOS or Android. ' +
        'On iPhone: install via Safari → Share → Add to Home Screen, then open from the icon.'
      );
      return;
    }
    const snap = await this.healthSvc.getTodaySnapshot();
    if (!snap) {
      this.healthBannerIcon.set('warning-outline');
      this.healthBanner.set('Could not read health data. Check permissions in your device Settings → Health → ART.');
      return;
    }
    const data = { ...this.dayData()! };
    if (snap.steps   != null) data.steps    = String(snap.steps);
    if (snap.calories != null) data.calories = String(snap.calories);
    this.dayData.set(data);
    this.schedSvc.saveDayData(this.selectedDay(), data);
    const src = snap.source === 'apple_health' ? 'Apple Health' : 'Google Health';
    this.healthBannerIcon.set('checkmark-circle-outline');
    this.healthBanner.set(`Synced from ${src} — ${snap.steps?.toLocaleString() ?? '—'} steps · ${snap.calories ?? '—'} kcal`);
    setTimeout(() => this.healthBanner.set(''), 5000);
  }

  stars(rating: number): boolean[] {
    return [1,2,3,4,5].map(i => i <= rating);
  }

  painColor(): string {
    const level = this.dayData()?.pain ?? 0;
    if (level <= 2) return '#22c55e';       // green
    if (level <= 4) return '#84cc16';       // lime
    if (level <= 6) return '#f59e0b';       // amber
    if (level <= 8) return '#f97316';       // orange
    return '#ef4444';                        // red
  }
}
