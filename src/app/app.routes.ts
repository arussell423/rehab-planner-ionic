import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: 'activities', loadComponent: () => import('./pages/activities/activities.page').then(m => m.ActivitiesPage) },
  { path: 'activities/:category', loadComponent: () => import('./pages/activity-category/activity-category.page').then(m => m.ActivityCategoryPage) },
  { path: 'metrics', loadComponent: () => import('./pages/metrics/metrics.page').then(m => m.MetricsPage) },
  { path: 'progress', loadComponent: () => import('./pages/progress/progress.page').then(m => m.ProgressPage) },
  { path: 'history', loadComponent: () => import('./pages/history/history.page').then(m => m.HistoryPage) },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },
];
