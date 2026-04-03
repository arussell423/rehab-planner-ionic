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
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';

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
  showImport = signal<boolean>(false);
  importedActivities = signal<Partial<Activity>[]>([]);
  importError = signal<string>('');

  // Form fields
  formName = '';
  formTimeOfDay: 'morning' | 'afternoon' | 'evening' = 'morning';
  formSets: number | null = null;
  formReps: number | null = null;
  formDuration: number | null = null;
  formLaps: number | null = null;
  formDistance: number | null = null;
  formWeightKg: number | null = null;   // always stored in kg
  formWeightUnit: 'kg' | 'lbs' = 'kg'; // display unit
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
    this.formLaps = null; this.formDistance = null;
    this.formWeightKg = null; this.formWeightUnit = 'kg';
    this.formNotes = '';
    this.showForm.set(true);
  }

  get formWeightDisplay(): number | null {
    if (this.formWeightKg == null) return null;
    return this.formWeightUnit === 'lbs'
      ? Math.round(this.formWeightKg * 2.20462 * 10) / 10
      : this.formWeightKg;
  }

  setWeightDisplay(val: string) {
    const n = parseFloat(val);
    if (isNaN(n)) { this.formWeightKg = null; return; }
    this.formWeightKg = this.formWeightUnit === 'lbs'
      ? Math.round((n / 2.20462) * 10) / 10
      : n;
  }

  toggleWeightUnit() {
    this.formWeightUnit = this.formWeightUnit === 'kg' ? 'lbs' : 'kg';
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
      ...(this.formWeightKg != null && { weightLoad: this.formWeightKg }),
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
    if (a.weightLoad) parts.push(`${a.weightLoad} kg`);
    if (a.duration) parts.push(`${a.duration} min`);
    if (a.laps) parts.push(`${a.laps} laps`);
    if (a.distance) parts.push(`${a.distance} km`);
    return parts.join(' · ');
  }

  openImport() {
    this.importedActivities.set([]);
    this.importError.set('');
    this.showImport.set(true);
  }

  async onImportFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.importError.set('');
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        await this.parseExcel(file);
      } else if (ext === 'docx') {
        await this.parseDocx(file);
      } else {
        this.importError.set('Unsupported file type. Please use .xlsx, .xls, .csv or .docx');
      }
    } catch (e) {
      this.importError.set('Could not read file. Please check the format and try again.');
    }
    // Reset file input so same file can be re-selected
    (event.target as HTMLInputElement).value = '';
  }

  private async parseExcel(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Auto-detect header row
    const headerIdx = rows.findIndex(r =>
      r.some(c => /name|exercise|activity/i.test(String(c)))
    );
    const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows.slice(1);
    const headers = headerIdx >= 0
      ? rows[headerIdx].map(h => String(h).toLowerCase().trim())
      : ['name','sets','reps','duration','notes'];

    const col = (row: any[], ...keys: string[]) => {
      for (const k of keys) {
        const i = headers.findIndex(h => h.includes(k));
        if (i >= 0 && row[i] !== '') return row[i];
      }
      return undefined;
    };

    const parsed: Partial<Activity>[] = dataRows
      .filter(r => r.some(c => c !== ''))
      .map(r => ({
        name: String(col(r, 'name', 'exercise', 'activity') ?? r[0] ?? '').trim(),
        sets:     this.numOrUndef(col(r, 'sets')),
        reps:     this.numOrUndef(col(r, 'reps', 'rep')),
        duration: this.numOrUndef(col(r, 'duration', 'time', 'min')),
        weightLoad: this.numOrUndef(col(r, 'weight', 'load', 'kg', 'lbs')),
        notes:    String(col(r, 'notes', 'note', 'comment') ?? '').trim() || undefined,
      }))
      .filter(a => a.name);

    if (parsed.length === 0) {
      this.importError.set('No exercises found. Make sure the file has a "Name" column.');
      return;
    }
    this.importedActivities.set(parsed);
  }

  private async parseDocx(file: File) {
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    const lines = result.value
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 2 && l.length < 120);

    const parsed: Partial<Activity>[] = lines.map(line => {
      // Try to extract sets×reps pattern like "3x10" or "3 x 10" or "3 sets 10 reps"
      const setsReps = line.match(/(\d+)\s*[x×]\s*(\d+)/i);
      const name = line.replace(/[\d]+\s*[x×]\s*[\d]+/i, '').replace(/\s+/g, ' ').trim();
      return {
        name: name || line,
        sets: setsReps ? parseInt(setsReps[1]) : undefined,
        reps: setsReps ? parseInt(setsReps[2]) : undefined,
      };
    }).filter(a => a.name);

    if (parsed.length === 0) {
      this.importError.set('No exercises found in the document.');
      return;
    }
    this.importedActivities.set(parsed);
  }

  private numOrUndef(val: any): number | undefined {
    const n = parseFloat(String(val));
    return isNaN(n) ? undefined : n;
  }

  confirmImport() {
    const toAdd = this.importedActivities().map(a => ({
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: a.name!,
      category: this.category() as ActivityCategory,
      timeOfDay: 'morning' as const,
      completed: false,
      ...(a.sets       != null && { sets: a.sets }),
      ...(a.reps       != null && { reps: a.reps }),
      ...(a.duration   != null && { duration: a.duration }),
      ...(a.weightLoad != null && { weightLoad: a.weightLoad }),
      ...(a.notes      && { notes: a.notes }),
    }));
    toAdd.forEach(a => this.schedSvc.addStructuredActivity(this.selectedDay(), a));
    this.showImport.set(false);
    this.loadActivities();
  }

  removeImported(i: number) {
    const updated = [...this.importedActivities()];
    updated.splice(i, 1);
    this.importedActivities.set(updated);
  }
}
