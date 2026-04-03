import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/schedule', pathMatch: 'full' },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.component').then(m => m.TabsComponent),
    children: [
      { path: 'schedule', loadComponent: () => import('./pages/schedule/schedule.page').then(m => m.SchedulePage) },
      { path: 'progress', loadComponent: () => import('./pages/progress/progress.page').then(m => m.ProgressPage) },
      { path: 'history', loadComponent: () => import('./pages/history/history.page').then(m => m.HistoryPage) },
      { path: 'edit', loadComponent: () => import('./pages/edit/edit.page').then(m => m.EditPage) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },
      { path: '', redirectTo: 'schedule', pathMatch: 'full' }
    ]
  }
];
