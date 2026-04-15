import { Component, signal, Output, EventEmitter } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-pin-lock',
  templateUrl: './pin-lock.component.html',
  styleUrls: ['./pin-lock.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf]
})
export class PinLockComponent {
  @Output() unlocked = new EventEmitter<void>();

  entered = signal<string>('');
  error = signal<boolean>(false);
  shake = signal<boolean>(false);

  readonly DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  press(d: string): void {
    if (d === '⌫') { this.entered.update(v => v.slice(0, -1)); this.error.set(false); return; }
    if (d === '') return;
    if (this.entered().length >= 4) return;
    const next = this.entered() + d;
    this.entered.set(next);
    if (next.length === 4) setTimeout(() => this.check(next), 100);
  }

  private check(pin: string): void {
    const stored = localStorage.getItem('rp_pin');
    if (pin === stored) {
      this.unlocked.emit();
    } else {
      this.error.set(true);
      this.shake.set(true);
      this.entered.set('');
      setTimeout(() => this.shake.set(false), 600);
    }
  }

  get dots(): boolean[] {
    return [0,1,2,3].map(i => i < this.entered().length);
  }
}
