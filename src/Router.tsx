// import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RecipeRedirect } from '@/components/Recipe/RecipeRedirect.tsx';
import IconsPreviewPage from '@/pages/IconsPreview';
import { ProtectedRoutes } from './ProtectedRoutes';
import { PricingPageContainer } from './enums/pricing-page.enum';
import { Recipe } from './pages/Recipe';
import { Settings } from './pages/Settings';
import { PricingTablePage } from './pages/PricingTablePage';
import { TeamInviteActivationPage } from './pages/TeamInviteActivationPage';
import { Dashboard } from './pages/Dashboard';
import { FileViewer } from './pages/FileViewer';
import { SignInPage } from './pages/SignInPage';
import type { User } from './types/auth.types';

// const Recipe = lazy(() => import('./pages/Recipe').then((module) => ({ default: module.Recipe })));
// const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));
// const PricingTablePage = lazy(() =>
//   import('./pages/PricingTablePage').then((module) => ({ default: module.PricingTablePage })),
// );
// const TeamInviteActivationPage = lazy(() =>
//   import('./pages/TeamInviteActivationPage').then((module) => ({ default: module.TeamInviteActivationPage })),
// );
// const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
// const FileViewer = lazy(() => import('./pages/FileViewer').then((module) => ({ default: module.FileViewer })));

export const Router = ({ currentUser, isSigningIn }: { currentUser: User | null; isSigningIn: boolean }) => {
  return (
    <Routes>
      {/* Protected Routes */}
      <Route element={<ProtectedRoutes user={currentUser} />}>
        <Route path="/settings" element={<Settings user={currentUser!} />} />
        {import.meta.env.MODE === 'development' && <Route path="/admin/icons_preview" element={<IconsPreviewPage />} />}
        <Route path="/pricing" element={<PricingTablePage container={PricingPageContainer.Page} />} />
      </Route>
      <Route path="/recipe/:recipeId" element={<RecipeRedirect />} />
      <Route path="/flow/:recipeId" element={<Recipe user={currentUser} />} />
      <Route path="/activation" element={<TeamInviteActivationPage />} />
      <Route path="/view/*" element={<FileViewer />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route
        path="/"
        element={currentUser && !isSigningIn ? <Dashboard user={currentUser} /> : <Navigate to="/signin" replace />}
      />
      <Route
        path="/folders/:folderId"
        element={currentUser && !isSigningIn ? <Dashboard user={currentUser} /> : <Navigate to="/signin" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
