import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgFor, NgIf } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { ScheduleService } from '../../services/schedule.service';
import { StreakResult, PersonalRecords } from '../../models';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss'],
  standalone: true,
  imports: [IonContent, NgFor, NgIf]
})
export class ProgressPage implements OnInit {
  streak = signal<StreakResult>({ current: 0, best: 0 });
  records = signal<PersonalRecords>({ bestSteps: 0, bestSleep: '0', bestWeek: 0 });
  weekCompletion = signal<{ day: string; done: number; total: number; pct: number; rest: boolean }[]>([]);
  macroSvg = signal<SafeHtml>('');
  painSvg = signal<SafeHtml>('');

  constructor(private schedSvc: ScheduleService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void { this.load(); }
  ionViewWillEnter(): void { this.load(); }

  load(): void {
    this.streak.set(this.schedSvc.getStreak());
    this.records.set(this.schedSvc.getPersonalRecords());

    const schedule = this.schedSvc.getSchedule();
    const wdata = this.schedSvc.getWeekData();
    this.weekCompletion.set(schedule.map(s => {
      if (s.rest) return { day: s.day, done: 0, total: 0, pct: 0, rest: true };
      const ddata = wdata[s.day] || {};
      const total = s.morning.length + s.afternoon.length + s.evening.length;
      const done = Object.values((ddata as any).activities || {}).filter(Boolean).length;
      return { day: s.day, done, total, pct: total ? Math.round((done / total) * 100) : 0, rest: false };
    }));

    // Macro donut
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const todayName = dayNames[new Date().getDay()];
    const dayData = this.schedSvc.getDayData(todayName);
    const c = parseInt(dayData.carbs) || 0;
    const p = parseInt(dayData.protein) || 0;
    const f = parseInt(dayData.fat) || 0;
    if (c + p + f > 0) {
      const svg = this.schedSvc.svgDonut([
        { label: 'Carbs', value: c, color: '#f59e0b' },
        { label: 'Protein', value: p, color: '#3b82f6' },
        { label: 'Fat', value: f, color: '#10b981' }
      ]);
      this.macroSvg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
    }

    // Pain chart
    const painData: number[] = [];
    const painLabels: string[] = [];
    schedule.forEach(s => {
      const d = wdata[s.day];
      if (d && d.pain != null) { painData.push(d.pain); painLabels.push(s.short); }
    });
    if (painData.length >= 2) {
      const svg = this.schedSvc.svgLineChart(painData, painLabels, '#ef4444', 350, 200);
      this.painSvg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
    }
  }
}
