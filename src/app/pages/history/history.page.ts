import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgFor, NgIf } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { ScheduleService } from '../../services/schedule.service';
import { HistoryPoint } from '../../models';
import { CHART_COLORS } from '../../constants';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonContent, NgFor, NgIf]
})
export class HistoryPage implements OnInit {
  metrics = ['steps','calories','sleep','completion','pain'];
  metricLabels: Record<string, string> = { steps:'Steps', calories:'Calories', sleep:'Sleep', completion:'Completion', pain:'Pain' };
  currentMetric = signal<string>('steps');
  chartSvg = signal<SafeHtml>('');
  hasData = signal<boolean>(false);
  avg = signal<number>(0);
  best = signal<number>(0);
  trend = signal<number>(0);
  historyData = signal<HistoryPoint[]>([]);

  constructor(private schedSvc: ScheduleService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void { this.load(); }
  ionViewWillEnter(): void { this.load(); }

  load(): void {
    const data = this.schedSvc.getHistoryData(this.currentMetric());
    this.historyData.set(data);
    if (data.length >= 2) {
      const vals = data.map(d => d.value);
      const labels = data.map(d => d.weekLabel);
      const color = CHART_COLORS[this.currentMetric()] || '#3b82f6';
      const svg = this.schedSvc.svgLineChart(vals, labels, color, 350, 220);
      this.chartSvg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
      this.hasData.set(true);
      this.avg.set(Math.round(vals.reduce((a,b) => a+b, 0) / vals.length));
      this.best.set(Math.round(Math.max(...vals)));
      this.trend.set(Math.round((vals[vals.length-1] - vals[0]) / vals.length * 10) / 10);
    } else {
      this.hasData.set(false);
    }
  }

  selectMetric(m: string): void {
    this.currentMetric.set(m);
    this.load();
  }

  trendLabel(): string {
    const t = this.trend();
    return `${t > 0 ? '+' : ''}${t}`;
  }
}
