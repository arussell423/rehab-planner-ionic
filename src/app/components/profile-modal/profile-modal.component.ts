import { Component, Input, Output, EventEmitter, signal, OnChanges } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons } from '@ionic/angular/standalone';
import { Profile } from '../../models';
import { THEMES, AVATAR_EMOJIS, Theme } from '../../constants';

@Component({
  selector: 'app-profile-modal',
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss'],
  standalone: true,
  imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, NgFor, FormsModule]
})
export class ProfileModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() profile: Profile | null = null;
  @Output() saved = new EventEmitter<Profile>();
  @Output() cancelled = new EventEmitter<void>();

  name = signal<string>('');
  selectedEmoji = signal<string>('👤');
  selectedTheme = signal<Theme>('blue');
  themes = THEMES;
  avatarEmojis = AVATAR_EMOJIS;

  ngOnChanges(): void {
    if (this.isOpen) {
      this.name.set(this.profile?.name || '');
      this.selectedEmoji.set(this.profile?.emoji || '👤');
      this.selectedTheme.set(this.profile?.theme || 'blue');
    }
  }

  save(): void {
    const n = this.name().trim();
    if (!n) return;
    this.saved.emit({
      id: this.profile?.id || `p_${Date.now()}`,
      name: n,
      emoji: this.selectedEmoji(),
      theme: this.selectedTheme(),
      appName: this.profile?.appName || 'Rehab Planner'
    });
  }

  themeColor(t: string): string {
    const map: Record<string, string> = { blue:'#2563eb', green:'#16a34a', purple:'#7c3aed', rose:'#e11d48', orange:'#ea580c' };
    return map[t] || '#2563eb';
  }
}
