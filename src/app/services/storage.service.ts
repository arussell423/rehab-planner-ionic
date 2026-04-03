import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  getJson<T>(key: string, fallback: T): T {
    const v = localStorage.getItem(key);
    try { return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }

  setJson(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  keys(): string[] {
    return Object.keys(localStorage);
  }

  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}
