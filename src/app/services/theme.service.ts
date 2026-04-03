import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import { Theme } from '../constants';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal<boolean>(false);
  currentTheme = signal<Theme>('blue');

  constructor(private storage: StorageService, private profileService: ProfileService) {}

  apply(): void {
    const dark = this.storage.get('rp_dark_mode') === 'true';
    const profile = this.profileService.getActiveProfile();
    this.isDark.set(dark);
    this.currentTheme.set(profile.theme);
    document.documentElement.setAttribute('data-theme', profile.theme);
    document.documentElement.setAttribute('data-dark', String(dark));
  }

  setTheme(theme: Theme): void {
    this.profileService.updateProfile(this.profileService.activeProfileId(), { theme });
    this.currentTheme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleDark(): void {
    const dark = this.storage.get('rp_dark_mode') !== 'true';
    this.storage.set('rp_dark_mode', String(dark));
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-dark', String(dark));
  }
}
