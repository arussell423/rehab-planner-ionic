import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: 'activities', loadComponent: () => import('./pages/activities/activities.page').then(m => m.ActivitiesPage) },
  { path: 'activities/:category', loadComponent: () => import('./pages/activity-category/activity-category.page').then(m => m.ActivityCategoryPage) },
  { path: 'metrics', loadComponent: () => import('./pages/metrics/metrics.page').then(m => m.MetricsPage) },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.component').then(m => m.TabsComponent),
    children: [
      { path: 'schedule', loadComponent: () => import('./pages/schedule/schedule.page').then(m => m.SchedulePage) },
      { path: 'progress', loadComponent: () => import('./pages/progress/progress.page').then(m => m.ProgressPage) },
      { path: 'history', loadComponent: () => import('./pages/history/history.page').then(m => m.HistoryPage) },
      { path: 'edit', loadComponent: () => import('./pages/edit/edit.page').then(m => m.EditPage) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },
      { path: '', redirectTo: 'schedule', pathMatch: 'full' },
    ]
  },
  // Flat redirects so existing goTo() calls and defaultHref values still work
  { path: 'schedule', redirectTo: '/tabs/schedule', pathMatch: 'full' },
  { path: 'progress', redirectTo: '/tabs/progress', pathMatch: 'full' },
  { path: 'history', redirectTo: '/tabs/history', pathMatch: 'full' },
  { path: 'settings', redirectTo: '/tabs/settings', pathMatch: 'full' },
  { path: 'edit', redirectTo: '/tabs/edit', pathMatch: 'full' },
];
