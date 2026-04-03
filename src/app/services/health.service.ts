import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';

export interface HealthSnapshot {
  steps?: number;
  calories?: number;
  source: 'apple_health' | 'google_health' | 'manual';
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  isSyncing = signal<boolean>(false);
  lastSync = signal<Date | null>(null);

  /** True only when running inside a native Capacitor app (iOS or Android) */
  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  get platform(): string {
    return Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
  }

  /**
   * Attempt to read today's steps and active calories from the platform
   * health store. Returns null on web (PWA) — the UI should fall back to
   * manual entry in that case.
   */
  async getTodaySnapshot(date: Date = new Date()): Promise<HealthSnapshot | null> {
    if (!this.isNative) return null;

    this.isSyncing.set(true);
    try {
      if (this.platform === 'ios') {
        return await this.readAppleHealth(date);
      } else if (this.platform === 'android') {
        return await this.readAndroidHealth(date);
      }
      return null;
    } catch (e) {
      console.warn('[HealthService] Error reading health data:', e);
      return null;
    } finally {
      this.isSyncing.set(false);
      this.lastSync.set(new Date());
    }
  }

  private async readAppleHealth(date: Date): Promise<HealthSnapshot | null> {
    // Lazy-import so web builds don't try to resolve the native module
    const { CapacitorHealthkit } = await import('@perfood/capacitor-healthkit');

    const availResult = await CapacitorHealthkit.isAvailable();
    const available = (availResult as any)?.value ?? availResult;
    if (!available) return null;

    await CapacitorHealthkit.requestAuthorization({
      all: [],
      read: ['steps', 'calories'],
      write: []
    });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [stepsResult, calResult] = await Promise.all([
      CapacitorHealthkit.queryHKitSampleType({
        sampleName: 'stepCount',
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        limit: 0
      }),
      CapacitorHealthkit.queryHKitSampleType({
        sampleName: 'activeEnergyBurned',
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        limit: 0
      })
    ]);

    const steps = stepsResult.resultData?.reduce(
      (sum: number, s: any) => sum + (s.quantity ?? 0), 0
    );
    const calories = calResult.resultData?.reduce(
      (sum: number, s: any) => sum + (s.quantity ?? 0), 0
    );

    return {
      steps: steps ? Math.round(steps) : undefined,
      calories: calories ? Math.round(calories) : undefined,
      source: 'apple_health'
    };
  }

  private async readAndroidHealth(date: Date): Promise<HealthSnapshot | null> {
    // Android Health Connect support — to be wired up when the Android
    // platform is added (requires @capacitor/health-connect plugin).
    // For now returns null so the UI shows the "connect" prompt.
    return null;
  }
}
