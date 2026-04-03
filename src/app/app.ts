import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barbell, flame, walk, statsChart, calendarOutline, settingsOutline,
  chevronBack, chevronForward, checkmarkCircle, addCircleOutline, close,
  heart, body, bicycle, basketball, medkit, ellipsisHorizontal,
  moonOutline, sunnyOutline, trashOutline, pencilOutline, checkmark,
  arrowBack, timeOutline, repeatOutline, scaleOutline, fitnessOutline,
  leafOutline, waterOutline, bedOutline, analyticsOutline, trophyOutline,
  documentAttachOutline, cloudUploadOutline
} from 'ionicons/icons';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`,
  standalone: true,
  imports: [IonApp, IonRouterOutlet]
})
export class App implements OnInit {
  constructor(private themeSvc: ThemeService) {
    addIcons({
      barbell, flame, walk, statsChart, calendarOutline, settingsOutline,
      chevronBack, chevronForward, checkmarkCircle, addCircleOutline, close,
      heart, body, bicycle, basketball, medkit, ellipsisHorizontal,
      moonOutline, sunnyOutline, trashOutline, pencilOutline, checkmark,
      arrowBack, timeOutline, repeatOutline, scaleOutline, fitnessOutline,
      leafOutline, waterOutline, bedOutline, analyticsOutline, trophyOutline,
      documentAttachOutline, cloudUploadOutline
    });
  }
  ngOnInit() { this.themeSvc.apply(); }
}
