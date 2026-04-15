import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { IonModal, IonIcon } from '@ionic/angular/standalone';

export interface SessionActivity {
  key: string;
  name: string;
  slot: string;
  completed: boolean;
  sets?: number;
  reps?: number;
  duration?: number;
  weightLoad?: number;
  notes?: string;
}

@Component({
  selector: 'app-workout-session',
  templateUrl: './workout-session.component.html',
  styleUrls: ['./workout-session.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, IonModal, IonIcon]
})
export class WorkoutSessionComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() activities: SessionActivity[] = [];
  @Output() activityToggled = new EventEmitter<{ key: string; completed: boolean }>();
  @Output() closed = new EventEmitter<void>();

  currentIndex = signal(0);
  localCompleted = signal<Record<string, boolean>>({});

  // Timer
  restDuration = signal(60);
  timerSeconds = signal(0);
  timerRunning = signal(false);
  private timerInterval: any = null;

  readonly REST_OPTIONS = [30, 60, 90, 120];

  ngOnChanges(): void {
    if (this.isOpen) {
      this.currentIndex.set(0);
      const map: Record<string, boolean> = {};
      this.activities.forEach(a => map[a.key] = a.completed);
      this.localCompleted.set(map);
      this.stopTimer();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  get current(): SessionActivity | null {
    return this.activities[this.currentIndex()] || null;
  }

  get totalCount(): number { return this.activities.length; }
  get completedCount(): number { return Object.values(this.localCompleted()).filter(Boolean).length; }
  get progressPct(): number { return this.totalCount ? Math.round((this.completedCount / this.totalCount) * 100) : 0; }
  get isFirst(): boolean { return this.currentIndex() === 0; }
  get isLast(): boolean { return this.currentIndex() === this.activities.length - 1; }
  get isCurrentDone(): boolean { return !!(this.current && this.localCompleted()[this.current.key]); }

  prev(): void {
    if (!this.isFirst) {
      this.currentIndex.update(i => i - 1);
      this.stopTimer();
    }
  }

  next(): void {
    if (!this.isLast) {
      this.currentIndex.update(i => i + 1);
      this.stopTimer();
    }
  }

  toggleCurrent(): void {
    if (!this.current) return;
    const key = this.current.key;
    const newVal = !this.localCompleted()[key];
    this.localCompleted.update(m => ({ ...m, [key]: newVal }));
    this.activityToggled.emit({ key, completed: newVal });
    if (newVal && !this.isLast) {
      setTimeout(() => { this.currentIndex.update(i => i + 1); this.stopTimer(); }, 400);
    }
  }

  startTimer(): void {
    this.timerSeconds.set(this.restDuration());
    this.timerRunning.set(true);
    this.clearInterval();
    this.timerInterval = setInterval(() => {
      const s = this.timerSeconds() - 1;
      if (s <= 0) { this.timerSeconds.set(0); this.stopTimer(); }
      else { this.timerSeconds.set(s); }
    }, 1000);
  }

  stopTimer(): void {
    this.timerRunning.set(false);
    this.timerSeconds.set(0);
    this.clearInterval();
  }

  setRestDuration(s: number): void {
    this.restDuration.set(s);
    if (this.timerRunning()) this.startTimer();
  }

  private clearInterval(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  activityChips(a: SessionActivity): string {
    const parts: string[] = [];
    if (a.sets && a.reps) parts.push(`${a.sets} × ${a.reps}`);
    else if (a.sets) parts.push(`${a.sets} sets`);
    else if (a.reps) parts.push(`${a.reps} reps`);
    if (a.weightLoad) parts.push(`${a.weightLoad} kg`);
    if (a.duration) parts.push(`${a.duration} min`);
    return parts.join(' · ');
  }

  formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  slotLabel(slot: string): string {
    return slot === 'morning' ? 'Morning' : slot === 'afternoon' ? 'Afternoon' : 'Evening';
  }

  close(): void {
    this.stopTimer();
    this.closed.emit();
  }
}
