import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonModal, IonButton, IonButtons, IonHeader, IonToolbar, IonTitle, IonBackButton } from '@ionic/angular/standalone';
import { ScheduleService } from '../../services/schedule.service';
import { DaySchedule } from '../../models';
import { TEMPLATES } from '../../constants';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
  standalone: true,
  imports: [IonContent, IonModal, IonButton, IonButtons, IonHeader, IonToolbar, IonTitle, IonBackButton, NgFor, NgIf, FormsModule]
})
export class EditPage implements OnInit {
  schedule = signal<DaySchedule[]>([]);
  newActivity: Record<string, string> = {};
  showTemplateSheet = signal<boolean>(false);
  showCopySheet = signal<boolean>(false);
  templateTarget: { day: string; slot: string } | null = null;
  copySourceDay = signal<string>('');
  copyTargetDays = signal<Record<string, boolean>>({});
  templateCategories = Object.entries(TEMPLATES);
  allDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  constructor(private schedSvc: ScheduleService) {}

  ngOnInit(): void { this.load(); }
  ionViewWillEnter(): void { this.load(); }

  load(): void {
    this.schedule.set(this.schedSvc.getSchedule());
  }

  save(): void {
    this.schedSvc.saveSchedule(this.schedule());
  }

  toggleRest(dayIndex: number, value: boolean): void {
    const s = [...this.schedule()];
    s[dayIndex] = { ...s[dayIndex], rest: value };
    this.schedule.set(s);
    this.save();
  }

  updateGoal(dayIndex: number, field: 'stepGoal' | 'calGoal', value: string): void {
    const s = [...this.schedule()];
    s[dayIndex] = { ...s[dayIndex], [field]: parseInt(value) || 0 };
    this.schedule.set(s);
    this.save();
  }

  addActivity(dayIndex: number, slot: string): void {
    const key = `${dayIndex}_${slot}`;
    const name = (this.newActivity[key] || '').trim();
    if (!name) return;
    const s = [...this.schedule()];
    const day = { ...s[dayIndex] };
    (day as any)[slot] = [...(day as any)[slot], name];
    s[dayIndex] = day;
    this.schedule.set(s);
    this.save();
    this.newActivity[key] = '';
  }

  deleteActivity(dayIndex: number, slot: string, actIndex: number): void {
    const s = [...this.schedule()];
    const day = { ...s[dayIndex] };
    const list = [...(day as any)[slot]];
    list.splice(actIndex, 1);
    (day as any)[slot] = list;
    s[dayIndex] = day;
    this.schedule.set(s);
    this.save();
  }

  renameActivity(dayIndex: number, slot: string, actIndex: number, value: string): void {
    const s = [...this.schedule()];
    const day = { ...s[dayIndex] };
    const list = [...(day as any)[slot]];
    list[actIndex] = value;
    (day as any)[slot] = list;
    s[dayIndex] = day;
    this.schedule.set(s);
    this.save();
  }

  openTemplates(day: string, slot: string): void {
    this.templateTarget = { day, slot };
    this.showTemplateSheet.set(true);
  }

  addFromTemplate(activity: string): void {
    if (!this.templateTarget) return;
    const { day, slot } = this.templateTarget;
    const s = [...this.schedule()];
    const idx = s.findIndex(d => d.day === day);
    if (idx < 0) return;
    const d = { ...s[idx] };
    (d as any)[slot] = [...(d as any)[slot], activity];
    s[idx] = d;
    this.schedule.set(s);
    this.save();
    this.showTemplateSheet.set(false);
  }

  openCopySheet(day: string): void {
    this.copySourceDay.set(day);
    this.copyTargetDays.set({});
    this.showCopySheet.set(true);
  }

  executeCopy(): void {
    const targets = Object.entries(this.copyTargetDays()).filter(([,v]) => v).map(([k]) => k);
    const src = this.schedule().find(s => s.day === this.copySourceDay());
    if (!src) return;
    const updated = this.schedule().map(s => {
      if (!targets.includes(s.day)) return s;
      return {
        ...s,
        morning: [...new Set([...s.morning, ...src.morning])],
        afternoon: [...new Set([...s.afternoon, ...src.afternoon])],
        evening: [...new Set([...s.evening, ...src.evening])]
      };
    });
    this.schedule.set(updated);
    this.save();
    this.showCopySheet.set(false);
  }

  getSlot(day: DaySchedule, slot: string): string[] {
    return (day as any)[slot] as string[];
  }

  setCopyTarget(day: string, checked: boolean): void {
    this.copyTargetDays.set({ ...this.copyTargetDays(), [day]: checked });
  }

  trackByDay(_: number, s: DaySchedule): string { return s.day; }
}
