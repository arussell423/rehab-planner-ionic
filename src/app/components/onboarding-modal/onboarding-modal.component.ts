import { Component, Input, Output, EventEmitter, signal, OnChanges } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons } from '@ionic/angular/standalone';
import { ProfileService } from '../../services/profile.service';
import { THEMES, AVATAR_EMOJIS, Theme } from '../../constants';

@Component({
  selector: 'app-onboarding-modal',
  templateUrl: './onboarding-modal.component.html',
  styleUrls: ['./onboarding-modal.component.scss'],
  standalone: true,
  imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonContent, NgFor, FormsModule]
})
export class OnboardingModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() done = new EventEmitter<void>();

  name = signal<string>('');
  selectedEmoji = signal<string>('👤');
  selectedTheme = signal<Theme>('blue');
  themes = THEMES;
  avatarEmojis = AVATAR_EMOJIS;

  constructor(private profileSvc: ProfileService) {}

  ngOnChanges(): void {
    if (this.isOpen) { this.name.set(''); this.selectedEmoji.set('👤'); this.selectedTheme.set('blue'); }
  }

  finish(): void {
    const n = this.name().trim() || 'My Profile';
    const profiles = [{ id: 'default', name: n, emoji: this.selectedEmoji(), theme: this.selectedTheme(), appName: 'Rehab Planner' }];
    this.profileSvc.saveProfiles(profiles);
    localStorage.setItem('rp_active_profile', 'default');
    this.done.emit();
  }

  themeColor(t: string): string {
    const map: Record<string, string> = { blue:'#2563eb', green:'#16a34a', purple:'#7c3aed', rose:'#e11d48', orange:'#ea580c' };
    return map[t] || '#2563eb';
  }
}
