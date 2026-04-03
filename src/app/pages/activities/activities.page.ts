import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgFor } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonIcon } from '@ionic/angular/standalone';

const CATEGORIES = [
  { id: 'strength',     label: 'Strength Training',   icon: 'barbell',             sub: 'Weights, resistance, functional' },
  { id: 'flexibility',  label: 'Flexibility',          icon: 'leaf-outline',        sub: 'Stretching, yoga, mobility flow' },
  { id: 'mobility',     label: 'Mobility',             icon: 'repeat-outline',      sub: 'Joint mobility, range of motion' },
  { id: 'cardio',       label: 'Cardio',               icon: 'bicycle',             sub: 'Running, cycling, swimming, HIIT' },
  { id: 'balance',      label: 'Balance & Stability',  icon: 'body',                sub: 'Core, proprioception' },
  { id: 'pt_exercises', label: 'PT Exercises',         icon: 'medkit',              sub: 'Prescribed therapy exercises' },
  { id: 'other',        label: 'Other',                icon: 'ellipsis-horizontal', sub: 'Custom activities' },
];

@Component({
  selector: 'app-activities',
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonIcon, NgFor]
})
export class ActivitiesPage implements OnInit {
  categories = CATEGORIES;
  selectedDay = signal<string>('');

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.selectedDay.set(params['day'] || '');
    });
  }

  goToCategory(catId: string) {
    const queryParams: Record<string, string> = {};
    if (this.selectedDay()) queryParams['day'] = this.selectedDay();
    this.router.navigate(['/activities', catId], { queryParams });
  }
}
