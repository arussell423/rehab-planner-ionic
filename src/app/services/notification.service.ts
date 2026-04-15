import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

export interface NotificationPrefs {
  enabled: boolean;
  morningTime: string;   // HH:MM
  afternoonTime: string;
  eveningTime: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  prefs = signal<NotificationPrefs>({
    enabled: false,
    morningTime: '08:00',
    afternoonTime: '12:30',
    eveningTime: '18:00'
  });

  private scheduledTimeouts: ReturnType<typeof setTimeout>[] = [];

  constructor(private storage: StorageService) {
    this.prefs.set(this.storage.getJson('rp_notif_prefs', this.prefs()));
  }

  get permissionState(): string {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  }

  async requestPermission(): Promise<string> {
    if (typeof Notification === 'undefined') return 'unsupported';
    const result = await Notification.requestPermission();
    return result;
  }

  savePrefs(prefs: NotificationPrefs): void {
    this.prefs.set(prefs);
    this.storage.setJson('rp_notif_prefs', prefs);
    if (prefs.enabled) this.scheduleForToday(); else this.clearScheduled();
  }

  scheduleForToday(): void {
    this.clearScheduled();
    const p = this.prefs();
    if (!p.enabled || this.permissionState !== 'granted') return;

    const schedule = (label: string, timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      const diff = target.getTime() - now.getTime();
      if (diff > 0) {
        const t = setTimeout(() => {
          new Notification('Rehab Planner', {
            body: `Time for your ${label} exercises! 💪`,
            icon: '/logo-toolbar-sage.png',
            tag: `rehab-${label}`
          });
        }, diff);
        this.scheduledTimeouts.push(t);
      }
    };

    schedule('morning', p.morningTime);
    schedule('afternoon', p.afternoonTime);
    schedule('evening', p.eveningTime);
  }

  private clearScheduled(): void {
    this.scheduledTimeouts.forEach(t => clearTimeout(t));
    this.scheduledTimeouts = [];
  }
}
