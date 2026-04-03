import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { ProfileService } from './profile.service';
import { Theme } from '../constants';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal<boolean>(true);
  currentTheme = signal<Theme>('teal');

  constructor(private storage: StorageService, private profileService: ProfileService) {}

  apply(): void {
    const light = this.storage.get('rp_dark_mode') === 'false';
    const profile = this.profileService.getActiveProfile();
    const theme = profile.theme || 'teal';
    this.isDark.set(!light);
    this.currentTheme.set(theme as Theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (light) {
      document.documentElement.setAttribute('data-light', 'true');
    } else {
      document.documentElement.removeAttribute('data-light');
    }
  }

  setTheme(theme: Theme): void {
    this.profileService.updateProfile(this.profileService.activeProfileId(), { theme });
    this.currentTheme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleDark(): void {
    const wasLight = this.storage.get('rp_dark_mode') === 'false';
    const nowLight = !wasLight;
    this.storage.set('rp_dark_mode', nowLight ? 'false' : 'true');
    this.isDark.set(!nowLight);
    if (nowLight) {
      document.documentElement.setAttribute('data-light', 'true');
    } else {
      document.documentElement.removeAttribute('data-light');
    }
  }
}
