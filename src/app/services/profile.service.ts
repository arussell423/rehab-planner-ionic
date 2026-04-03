import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { Profile } from '../models';
import { DEFAULT_SCHEDULE, Theme } from '../constants';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  profiles = signal<Profile[]>([]);
  activeProfileId = signal<string>('default');

  constructor(private storage: StorageService) {
    this.load();
  }

  private load(): void {
    const profiles = this.storage.getJson<Profile[]>('rp_profiles', [
      { id: 'default', name: 'Default', emoji: '👤', theme: 'blue', appName: 'Rehab Planner' }
    ]);
    this.profiles.set(profiles);
    this.activeProfileId.set(this.storage.get('rp_active_profile') || 'default');
  }

  getActiveProfile(): Profile {
    const id = this.activeProfileId();
    return this.profiles().find(p => p.id === id) || this.profiles()[0];
  }

  switchProfile(id: string): void {
    this.storage.set('rp_active_profile', id);
    this.activeProfileId.set(id);
  }

  createProfile(name: string, emoji: string, theme: Theme): Profile {
    const id = `p_${Date.now()}`;
    const profile: Profile = { id, name, emoji, theme, appName: 'Rehab Planner' };
    const updated = [...this.profiles(), profile];
    this.profiles.set(updated);
    this.storage.setJson('rp_profiles', updated);
    // Initialize schedule for new profile
    this.storage.setJson(`rp_schedule_${id}`, DEFAULT_SCHEDULE);
    return profile;
  }

  updateProfile(id: string, changes: Partial<Profile>): void {
    const updated = this.profiles().map(p => p.id === id ? { ...p, ...changes } : p);
    this.profiles.set(updated);
    this.storage.setJson('rp_profiles', updated);
  }

  deleteProfile(id: string): void {
    if (this.profiles().length <= 1) return;
    const updated = this.profiles().filter(p => p.id !== id);
    this.profiles.set(updated);
    this.storage.setJson('rp_profiles', updated);
    if (this.activeProfileId() === id) {
      this.switchProfile(updated[0].id);
    }
  }

  saveProfiles(profiles: Profile[]): void {
    this.profiles.set(profiles);
    this.storage.setJson('rp_profiles', profiles);
  }

  isFirstLaunch(): boolean {
    return !this.storage.has('rp_profiles');
  }

  scheduleKey(): string {
    const id = this.activeProfileId();
    return id === 'default' ? 'rp_schedule' : `rp_schedule_${id}`;
  }

  weekDataKey(monday: Date): string {
    const id = this.activeProfileId();
    const s = monday.toISOString().slice(0, 10);
    return id === 'default' ? `rp_week_${s}` : `rp_week_${id}_${s}`;
  }

  medsKey(): string {
    const id = this.activeProfileId();
    return id === 'default' ? 'rp_medications' : `rp_medications_${id}`;
  }

  bestStreakKey(): string {
    const id = this.activeProfileId();
    return id === 'default' ? 'rp_best_streak' : `rp_best_streak_${id}`;
  }

  profileDataPrefix(): string {
    const id = this.activeProfileId();
    return id === 'default' ? 'rp_week_' : `rp_week_${id}_`;
  }
}
