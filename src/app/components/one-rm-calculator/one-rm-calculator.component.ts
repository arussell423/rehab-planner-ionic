import { Component, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons } from '@ionic/angular/standalone';

interface RmRow { pct: number; weight: number; }

@Component({
  selector: 'app-one-rm-calculator',
  templateUrl: './one-rm-calculator.component.html',
  styleUrls: ['./one-rm-calculator.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons]
})
export class OneRmCalculatorComponent {
  isOpen = signal(false);
  weight = signal<number | null>(null);
  reps = signal<number | null>(null);
  unit = signal<'kg' | 'lbs'>('kg');
  oneRm = signal<number | null>(null);
  table = signal<RmRow[]>([]);

  open(): void { this.isOpen.set(true); }
  close(): void { this.isOpen.set(false); }

  calculate(): void {
    const w = this.weight();
    const r = this.reps();
    if (!w || !r || r < 1) { this.oneRm.set(null); this.table.set([]); return; }
    // Epley formula
    const rm = r === 1 ? w : Math.round(w * (1 + r / 30));
    this.oneRm.set(rm);
    this.table.set([100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50]
      .map(pct => ({ pct, weight: Math.round(rm * pct / 100) })));
  }

  setUnit(u: 'kg' | 'lbs'): void { this.unit.set(u); }
}
