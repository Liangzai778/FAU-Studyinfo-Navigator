import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { DegreePage } from '../features/degree/DegreePage';
import { ExamsPage } from '../features/exams/ExamsPage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';
import { PlannerPage } from '../features/planner/PlannerPage';
import { ResourcesPage } from '../features/resources/ResourcesPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="degree" element={<DegreePage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
