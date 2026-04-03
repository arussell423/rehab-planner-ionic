import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import { Theme } from '../constants';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal<boolean>(false);
  currentTheme = signal<Theme>('sage');

  constructor(private storage: StorageService, private profileService: ProfileService) {}

  apply(): void {
    const savedDark = this.storage.get('rp_dark_mode');
    const isDark = savedDark === 'true';
    const profile = this.profileService.getActiveProfile();
    const theme = (profile.theme || 'sage') as Theme;
    this.isDark.set(isDark);
    this.currentTheme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (isDark) {
      document.documentElement.setAttribute('data-dark', 'true');
      document.documentElement.removeAttribute('data-light');
    } else {
      document.documentElement.removeAttribute('data-dark');
    }
  }

  setTheme(theme: Theme): void {
    this.profileService.updateProfile(this.profileService.activeProfileId(), { theme });
    this.currentTheme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleDark(): void {
    const nowDark = !this.isDark();
    this.storage.set('rp_dark_mode', nowDark ? 'true' : 'false');
    this.isDark.set(nowDark);
    if (nowDark) {
      document.documentElement.setAttribute('data-dark', 'true');
      document.documentElement.removeAttribute('data-light');
    } else {
      document.documentElement.removeAttribute('data-dark');
    }
  }
}
