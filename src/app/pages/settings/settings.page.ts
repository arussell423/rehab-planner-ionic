import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonToggle, IonItem, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { ScheduleService } from '../../services/schedule.service';
import { ProfileService } from '../../services/profile.service';
import { ThemeService } from '../../services/theme.service';
import { Profile } from '../../models';
import { THEMES, AVATAR_EMOJIS, Theme } from '../../constants';
import { ProfileModalComponent } from '../../components/profile-modal/profile-modal.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonToggle, IonItem, IonLabel, IonIcon, NgFor, NgIf, FormsModule, ProfileModalComponent]
})
export class SettingsPage implements OnInit {
  profiles = signal<Profile[]>([]);
  activeProfileId = signal<string>('default');
  currentTheme = signal<Theme>('blue');
  isDark = signal<boolean>(false);
  medications = signal<string[]>([]);
  weightUnit = signal<'kg' | 'lbs'>('kg');
  newMed = signal<string>('');
  appName = signal<string>('Rehab Planner');
  showProfileModal = signal<boolean>(false);
  editingProfile = signal<Profile | null>(null);
  themes = THEMES;
  avatarEmojis = AVATAR_EMOJIS;
  toast = signal<string>('');

  constructor(
    private schedSvc: ScheduleService,
    public profileSvc: ProfileService,
    public themeSvc: ThemeService
  ) {}

  ngOnInit(): void { this.load(); }
  ionViewWillEnter(): void { this.load(); }

  load(): void {
    this.profiles.set(this.profileSvc.profiles());
    this.activeProfileId.set(this.profileSvc.activeProfileId());
    const p = this.profileSvc.getActiveProfile();
    this.currentTheme.set(p.theme);
    this.appName.set(p.appName || 'Rehab Planner');
    this.isDark.set(this.themeSvc.isDark());
    this.medications.set(this.schedSvc.getMedications());
    this.weightUnit.set(this.schedSvc.getWeightUnit());
  }

  setTheme(t: Theme): void {
    this.themeSvc.setTheme(t);
    this.currentTheme.set(t);
  }

  toggleDark(): void {
    this.themeSvc.toggleDark();
    this.isDark.set(this.themeSvc.isDark());
  }

  saveAppName(name: string): void {
    this.profileSvc.updateProfile(this.activeProfileId(), { appName: name });
    this.appName.set(name);
  }

  switchProfile(id: string): void {
    this.profileSvc.switchProfile(id);
    this.themeSvc.apply();
    this.load();
  }

  openAddProfile(): void { this.editingProfile.set(null); this.showProfileModal.set(true); }
  openEditProfile(p: Profile): void { this.editingProfile.set(p); this.showProfileModal.set(true); }

  onProfileSaved(p: Profile): void {
    if (this.editingProfile()) {
      this.profileSvc.updateProfile(p.id, p);
    } else {
      this.profileSvc.createProfile(p.name, p.emoji, p.theme);
    }
    this.showProfileModal.set(false);
    this.load();
  }

  deleteProfile(id: string): void {
    this.profileSvc.deleteProfile(id);
    this.load();
  }

  addMed(): void {
    const name = this.newMed().trim();
    if (!name) return;
    const meds = [...this.medications(), name];
    this.schedSvc.saveMedications(meds);
    this.medications.set(meds);
    this.newMed.set('');
  }

  removeMed(i: number): void {
    const meds = [...this.medications()];
    meds.splice(i, 1);
    this.schedSvc.saveMedications(meds);
    this.medications.set(meds);
  }

  setWeightUnit(unit: 'kg' | 'lbs'): void {
    this.weightUnit.set(unit);
    this.schedSvc.saveWeightUnit(unit);
  }

  exportJSON(): void { this.schedSvc.exportJSON(); }
  exportCSV(): void { this.schedSvc.exportCSV(); }
  printSchedule(): void { window.print(); }

  importJSON(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.schedSvc.importJSON(file).then(() => {
      this.showToast('Backup imported!');
      this.load();
    }).catch(() => this.showToast('Import failed. Invalid file.'));
  }

  resetSchedule(): void {
    if (confirm('Reset schedule to defaults?')) {
      this.schedSvc.resetSchedule();
      this.showToast('Schedule reset!');
    }
  }

  clearWeekData(): void {
    if (confirm('Clear this week\'s logged data?')) {
      this.schedSvc.clearWeekData();
      this.showToast('Week data cleared!');
    }
  }

  showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }

  themeColor(t: string): string {
    const map: Record<string, string> = {
      blue: '#2563eb', green: '#16a34a', purple: '#7c3aed',
      rose: '#e11d48', orange: '#ea580c', sage: '#6b9955'
    };
    return map[t] || '#6b9955';
  }
}
