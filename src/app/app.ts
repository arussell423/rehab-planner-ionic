import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barbell, flame, walk, statsChart, calendarOutline, settingsOutline,
  chevronBack, chevronForward, checkmarkCircle, addCircleOutline, close,
  heart, body, bicycle, basketball, medkit, ellipsisHorizontal,
  moonOutline, sunnyOutline, trashOutline, pencilOutline, checkmark,
  arrowBack, timeOutline, repeatOutline, scaleOutline, fitnessOutline,
  leafOutline, waterOutline, bedOutline, analyticsOutline, trophyOutline,
  documentAttachOutline, cloudUploadOutline,
  heartOutline, syncOutline, informationCircleOutline, warningOutline,
  checkmarkCircleOutline, playCircleOutline
} from 'ionicons/icons';
import { ThemeService } from './services/theme.service';
import { PinLockComponent } from './components/pin-lock/pin-lock.component';

@Component({
  selector: 'app-root',
  template: `
    <app-pin-lock *ngIf="showLock()" (unlocked)="onUnlocked()"></app-pin-lock>
    <ion-app [style.display]="showLock() ? 'none' : ''">
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  standalone: true,
  imports: [IonApp, IonRouterOutlet, NgIf, PinLockComponent]
})
export class App implements OnInit {
  showLock = signal<boolean>(false);

  constructor(private themeSvc: ThemeService) {
    addIcons({
      barbell, flame, walk, statsChart, calendarOutline, settingsOutline,
      chevronBack, chevronForward, checkmarkCircle, addCircleOutline, close,
      heart, body, bicycle, basketball, medkit, ellipsisHorizontal,
      moonOutline, sunnyOutline, trashOutline, pencilOutline, checkmark,
      arrowBack, timeOutline, repeatOutline, scaleOutline, fitnessOutline,
      leafOutline, waterOutline, bedOutline, analyticsOutline, trophyOutline,
      documentAttachOutline, cloudUploadOutline,
      heartOutline, syncOutline, informationCircleOutline, warningOutline,
      checkmarkCircleOutline, playCircleOutline
    });
  }

  ngOnInit() {
    this.themeSvc.apply();
    const pin = localStorage.getItem('rp_pin');
    if (pin) this.showLock.set(true);
  }

  onUnlocked(): void {
    this.showLock.set(false);
  }
}
