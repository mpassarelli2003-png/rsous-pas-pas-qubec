import { useEffect } from 'react';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet, useLocation } from '@tanstack/react-router';
import { Toaster } from '@blinkdotnew/ui';
import { SharedAppLayout } from './layouts/shared-app-layout';

// Import pages
import { HomePage } from './pages/HomePage';
import { SelectPage } from './pages/SelectPage';
import { SolvePage } from './pages/SolvePage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminPage } from './pages/AdminPage';
import { z } from 'zod';

const selectSearchSchema = z.object({
  examMode: z.boolean().optional(),
});

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.querySelector<HTMLElement>('.app-main-scroll')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    scrollTop();
    requestAnimationFrame(scrollTop);
  }, [location.pathname, location.searchStr]);

  return null;
}

const rootRoute = createRootRoute({
  component: () => (
    <SharedAppLayout appName="Résous Pas à Pas">
      <ScrollToTop />
      <Outlet />
      <Toaster position="top-right" />
    </SharedAppLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const selectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/select',
  component: SelectPage,
  validateSearch: (search) => selectSearchSchema.parse(search),
});

const solveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/solve/$problemId',
  component: SolvePage,
});

const progressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/progress',
  component: ProgressPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  component: AdminLoginPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  selectRoute,
  solveRoute,
  progressRoute,
  settingsRoute,
  adminLoginRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}