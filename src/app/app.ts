import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet></ion-router-outlet></ion-app>',
  standalone: true,
  imports: [IonApp, IonRouterOutlet]
})
export class App implements OnInit {
  constructor(private theme: ThemeService) {}
  ngOnInit() { this.theme.apply(); }
}
