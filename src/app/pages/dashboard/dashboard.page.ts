import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ScheduleService } from '../../services/schedule.service';
import { ProfileService } from '../../services/profile.service';
import { ThemeService } from '../../services/theme.service';
import { Profile, RehabPhase } from '../../models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, NgIf]
})
export class DashboardPage implements OnInit {
  private readonly DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  today = signal<string>('Monday');
  selectedDay = signal<string>('');
  streak = signal<number>(0);
  donePct = signal<number>(0);
  doneCount = signal<number>(0);
  totalCount = signal<number>(0);
  profile = signal<Profile | null>(null);
  readiness = signal<{ score: number; label: string; color: string }>({ score: 50, label: 'Moderate', color: '#f59e0b' });
  currentPhase = signal<RehabPhase | null>(null);
  todaySteps = signal<string>('');
  todayPain = signal<number>(0);
  isRestDay = signal<boolean>(false);

  constructor(
    private router: Router,
    private schedSvc: ScheduleService,
    public profileSvc: ProfileService,
    public themeSvc: ThemeService
  ) {}

  ngOnInit() { this.load(); }
  ionViewWillEnter() { this.load(); }

  load() {
    const todayName = this.DAY_NAMES[new Date().getDay()];
    this.today.set(todayName);
    if (!this.selectedDay()) this.selectedDay.set(todayName);
    const activeDay = this.selectedDay() || todayName;
    const schedule = this.schedSvc.getSchedule();
    const sched = schedule.find(s => s.day === activeDay) || schedule[0];
    const data = this.schedSvc.getDayData(activeDay);
    const total = sched.morning.length + sched.afternoon.length + sched.evening.length;
    const done = Object.values(data.activities || {}).filter(Boolean).length;
    this.totalCount.set(total);
    this.doneCount.set(done);
    this.donePct.set(total ? Math.round((done / total) * 100) : 0);
    this.streak.set(this.schedSvc.calcStreak());
    this.profile.set(this.profileSvc.getActiveProfile());
    this.readiness.set(this.schedSvc.getReadinessScore(activeDay));
    this.currentPhase.set(this.profileSvc.getCurrentPhase());
    this.todaySteps.set(data.steps || '');
    this.todayPain.set(data.pain || 0);
    this.isRestDay.set(sched.rest || false);
  }

  navigateDay(dir: number) {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const cur = days.indexOf(this.selectedDay());
    const next = days[(cur + dir + 7) % 7];
    this.selectedDay.set(next);
    this.load();
  }

  get isToday() { return this.selectedDay() === this.today(); }

  goTo(path: string) { this.router.navigate([path]); }
  goToSchedule() { this.router.navigate(['/schedule']); }

  toggleDark() { this.themeSvc.toggleDark(); }
}
