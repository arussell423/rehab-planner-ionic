import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgFor, NgIf } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { ScheduleService } from '../../services/schedule.service';
import { DayData } from '../../models';
import { PAIN_EMOJIS } from '../../constants';

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.page.html',
  styleUrls: ['./metrics.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, NgFor, NgIf]
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
  painEmojis = PAIN_EMOJIS;

  constructor(
    private route: ActivatedRoute,
    private schedSvc: ScheduleService,
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

  setWeightUnit(unit: 'kg' | 'lbs'): void {
    this.weightUnit.set(unit);
    this.schedSvc.saveWeightUnit(unit);
  }

  stars(rating: number): boolean[] {
    return [1,2,3,4,5].map(i => i <= rating);
  }

  get painEmoji(): string {
    return PAIN_EMOJIS[this.dayData()?.pain ?? 0];
  }
}
