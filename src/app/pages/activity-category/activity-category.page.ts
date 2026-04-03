import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonModal, IonIcon
} from '@ionic/angular/standalone';
import { ScheduleService } from '../../services/schedule.service';
import { Activity, ActivityCategory } from '../../models';

const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Strength Training', flexibility: 'Flexibility', mobility: 'Mobility',
  cardio: 'Cardio', balance: 'Balance & Stability', pt_exercises: 'PT Exercises', other: 'Other'
};

@Component({
  selector: 'app-activity-category',
  templateUrl: './activity-category.page.html',
  styleUrls: ['./activity-category.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonModal, IonIcon, NgFor, NgIf, FormsModule]
})
export class ActivityCategoryPage implements OnInit {
  category = signal<string>('');
  categoryLabel = signal<string>('');
  selectedDay = signal<string>('Monday');
  activities = signal<Activity[]>([]);
  showForm = signal<boolean>(false);

  // Form fields
  formName = '';
  formTimeOfDay: 'morning' | 'afternoon' | 'evening' = 'morning';
  formSets: number | null = null;
  formReps: number | null = null;
  formDuration: number | null = null;
  formLaps: number | null = null;
  formDistance: number | null = null;
  formNotes = '';

  constructor(private route: ActivatedRoute, private schedSvc: ScheduleService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.category.set(params['category'] || 'other');
      this.categoryLabel.set(CATEGORY_LABELS[params['category']] || 'Activities');
    });
    this.route.queryParams.subscribe(params => {
      const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      this.selectedDay.set(params['day'] || DAY_NAMES[new Date().getDay()]);
      this.loadActivities();
    });
  }

  ionViewWillEnter() { this.loadActivities(); }

  loadActivities() {
    const schedule = this.schedSvc.getSchedule();
    const sched = schedule.find(s => s.day === this.selectedDay());
    const all = sched?.activities || [];
    this.activities.set(all.filter(a => a.category === this.category()));
  }

  toggleComplete(activity: Activity) {
    const schedule = this.schedSvc.getSchedule();
    const dayIdx = schedule.findIndex(s => s.day === this.selectedDay());
    if (dayIdx === -1) return;
    const day = { ...schedule[dayIdx] };
    day.activities = (day.activities || []).map(a =>
      a.id === activity.id ? { ...a, completed: !a.completed, completedAt: !a.completed ? new Date().toISOString() : undefined } : a
    );
    schedule[dayIdx] = day;
    this.schedSvc.saveSchedule(schedule);
    this.loadActivities();
  }

  deleteActivity(activityId: string) {
    this.schedSvc.removeStructuredActivity(this.selectedDay(), activityId);
    this.loadActivities();
  }

  openForm() {
    this.formName = ''; this.formTimeOfDay = 'morning';
    this.formSets = null; this.formReps = null; this.formDuration = null;
    this.formLaps = null; this.formDistance = null; this.formNotes = '';
    this.showForm.set(true);
  }

  saveActivity() {
    if (!this.formName.trim()) return;
    const activity: Activity = {
      id: `act_${Date.now()}`,
      name: this.formName.trim(),
      category: this.category() as ActivityCategory,
      timeOfDay: this.formTimeOfDay,
      completed: false,
      ...(this.formSets != null && { sets: this.formSets }),
      ...(this.formReps != null && { reps: this.formReps }),
      ...(this.formDuration != null && { duration: this.formDuration }),
      ...(this.formLaps != null && { laps: this.formLaps }),
      ...(this.formDistance != null && { distance: this.formDistance }),
      ...(this.formNotes.trim() && { notes: this.formNotes.trim() }),
    };
    this.schedSvc.addStructuredActivity(this.selectedDay(), activity);
    this.showForm.set(false);
    this.loadActivities();
  }

  activityChips(a: Activity): string {
    const parts: string[] = [];
    if (a.sets && a.reps) parts.push(`${a.sets} × ${a.reps} reps`);
    else if (a.sets) parts.push(`${a.sets} sets`);
    else if (a.reps) parts.push(`${a.reps} reps`);
    if (a.duration) parts.push(`${a.duration} min`);
    if (a.laps) parts.push(`${a.laps} laps`);
    if (a.distance) parts.push(`${a.distance} km`);
    return parts.join(' · ');
  }
}
