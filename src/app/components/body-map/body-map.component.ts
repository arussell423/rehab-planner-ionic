import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

export interface BodyZone {
  id: string;
  label: string;
  cx: number;
  cy: number;
  r: number;
  side: 'front' | 'back';
}

const ZONES: BodyZone[] = [
  { id: 'head',        label: 'Head',          cx: 100, cy: 25,  r: 18, side: 'front' },
  { id: 'neck',        label: 'Neck',          cx: 100, cy: 50,  r: 10, side: 'front' },
  { id: 'chest',       label: 'Chest',         cx: 100, cy: 85,  r: 22, side: 'front' },
  { id: 'l-shoulder',  label: 'L Shoulder',    cx: 66,  cy: 70,  r: 13, side: 'front' },
  { id: 'r-shoulder',  label: 'R Shoulder',    cx: 134, cy: 70,  r: 13, side: 'front' },
  { id: 'abdomen',     label: 'Abdomen',       cx: 100, cy: 122, r: 20, side: 'front' },
  { id: 'l-arm',       label: 'L Arm',         cx: 54,  cy: 112, r: 13, side: 'front' },
  { id: 'r-arm',       label: 'R Arm',         cx: 146, cy: 112, r: 13, side: 'front' },
  { id: 'l-thigh',     label: 'L Thigh',       cx: 83,  cy: 168, r: 16, side: 'front' },
  { id: 'r-thigh',     label: 'R Thigh',       cx: 117, cy: 168, r: 16, side: 'front' },
  { id: 'l-knee',      label: 'L Knee',        cx: 83,  cy: 205, r: 12, side: 'front' },
  { id: 'r-knee',      label: 'R Knee',        cx: 117, cy: 205, r: 12, side: 'front' },
  { id: 'l-lower-leg', label: 'L Lower Leg',   cx: 83,  cy: 238, r: 12, side: 'front' },
  { id: 'r-lower-leg', label: 'R Lower Leg',   cx: 117, cy: 238, r: 12, side: 'front' },
  { id: 'upper-back',  label: 'Upper Back',    cx: 100, cy: 80,  r: 22, side: 'back'  },
  { id: 'lower-back',  label: 'Lower Back',    cx: 100, cy: 120, r: 20, side: 'back'  },
  { id: 'glutes',      label: 'Glutes',        cx: 100, cy: 155, r: 18, side: 'back'  },
  { id: 'l-hamstring', label: 'L Hamstring',   cx: 83,  cy: 190, r: 14, side: 'back'  },
  { id: 'r-hamstring', label: 'R Hamstring',   cx: 117, cy: 190, r: 14, side: 'back'  },
  { id: 'l-calf',      label: 'L Calf',        cx: 83,  cy: 232, r: 12, side: 'back'  },
  { id: 'r-calf',      label: 'R Calf',        cx: 117, cy: 232, r: 12, side: 'back'  },
];

@Component({
  selector: 'app-body-map',
  templateUrl: './body-map.component.html',
  styleUrls: ['./body-map.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf]
})
export class BodyMapComponent implements OnChanges {
  @Input() painAreas: string[] = [];
  @Output() painAreasChange = new EventEmitter<string[]>();

  view: 'front' | 'back' = 'front';
  zones = ZONES;

  ngOnChanges(): void {}

  get frontZones() { return this.zones.filter(z => z.side === 'front'); }
  get backZones()  { return this.zones.filter(z => z.side === 'back'); }
  get visibleZones() { return this.view === 'front' ? this.frontZones : this.backZones; }

  isActive(id: string): boolean { return this.painAreas.includes(id); }

  toggle(id: string): void {
    const current = [...this.painAreas];
    const idx = current.indexOf(id);
    if (idx >= 0) current.splice(idx, 1); else current.push(id);
    this.painAreasChange.emit(current);
  }

  getActiveLabels(): string {
    return this.painAreas
      .map(id => this.zones.find(z => z.id === id)?.label)
      .filter(Boolean)
      .join(', ') || 'None';
  }
}
