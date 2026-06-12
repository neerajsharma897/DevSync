import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useProjectStore } from '../store/useProjectStore';

const AppLayout: React.FC = () => {
  const { fetchWorkspaces, currentWorkspace } = useWorkspaceStore();
  const { fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchProjects();
    }
  }, [currentWorkspace, fetchProjects]);

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-white/0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
