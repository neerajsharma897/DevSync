import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import ChatPage from './pages/ChatPage';
import { ProfilePage, AdminPage, NotFoundPage } from './pages/OtherPages';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import WorkspacePickerPage from './pages/WorkspacePickerPage';
import InviteAcceptancePage from './pages/InviteAcceptancePage';
import WorkspaceMembersPage from './pages/WorkspaceMembersPage';
import WorkspaceSettingsPage from './pages/WorkspaceSettingsPage';
import ProjectListPage from './pages/ProjectListPage';
import NotificationsPage from './pages/NotificationsPage';
import SearchPage from './pages/SearchPage';
import { AuthGuard, GuestGuard } from './components/auth/AuthGuard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
        <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/invites/:inviteId" element={<InviteAcceptancePage />} />
        
        {/* Workspace Picker Route */}
        <Route path="/workspaces" element={<AuthGuard><WorkspacePickerPage /></AuthGuard>} />
        
        {/* App Routes */}
        <Route path="/" element={<AuthGuard><AppLayout /></AuthGuard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="members" element={<WorkspaceMembersPage />} />
          <Route path="settings" element={<WorkspaceSettingsPage />} />
          <Route path="projects" element={<ProjectListPage />} />
          <Route path="projects/:id/*" element={<ProjectPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:id" element={<ChatPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
