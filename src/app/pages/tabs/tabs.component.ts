import { Component, OnInit, signal } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonLabel,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton
} from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { ThemeService } from '../../services/theme.service';
import { Profile } from '../../models';
import { OnboardingModalComponent } from '../../components/onboarding-modal/onboarding-modal.component';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  standalone: true,
  imports: [
    IonTabs, IonTabBar, IonTabButton, IonLabel,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    NgFor, NgIf,
    OnboardingModalComponent
  ]
})
export class TabsComponent implements OnInit {
  profiles = signal<Profile[]>([]);
  activeProfileId = signal<string>('default');
  appName = signal<string>('Rehab Planner');
  isDark = signal<boolean>(false);
  showOnboarding = signal<boolean>(false);

  constructor(public profileService: ProfileService, public themeService: ThemeService) {}

  ngOnInit(): void {
    if (this.profileService.isFirstLaunch()) {
      this.showOnboarding.set(true);
    }
    this.refresh();
    this.isDark = this.themeService.isDark;
  }

  refresh(): void {
    this.profiles.set(this.profileService.profiles());
    this.activeProfileId.set(this.profileService.activeProfileId());
    this.appName.set(this.profileService.getActiveProfile().appName || 'Rehab Planner');
  }

  switchProfile(id: string): void {
    this.profileService.switchProfile(id);
    this.themeService.apply();
    this.refresh();
  }

  toggleDark(): void {
    this.themeService.toggleDark();
  }

  onOnboardingDone(): void {
    this.showOnboarding.set(false);
    this.themeService.apply();
    this.refresh();
  }
}
