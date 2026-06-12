import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCurrentWorkspaceStore } from '../../store/currentWorkspace.js';
import { Save, AlertTriangle, Image as ImageIcon } from 'lucide-react';

export const WorkspaceSettings = () => {
  const { slug } = useParams();
  const { name, slug: currentSlug } = useCurrentWorkspaceStore();

  const [wsName, setWsName] = useState(name || '');
  const [wsSlug, setWsSlug] = useState(currentSlug || '');

  return (
    <div className="h-full overflow-y-auto p-8 font-sans bg-gray-950 text-gray-200">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-8">Workspace Settings</h1>

        {/* General Settings */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-6">General Information</h2>

          <div className="space-y-6">
            <div className="flex items-start space-x-6">
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-gray-700 transition-colors group relative overflow-hidden">
                  <ImageIcon className="w-8 h-8 text-gray-500 group-hover:opacity-0 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-semibold">Change</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Workspace Name</label>
                  <input 
                    type="text" 
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Workspace URL Slug</label>
                  <div className="flex bg-gray-950 border border-gray-800 rounded-lg focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all overflow-hidden">
                    <span className="flex items-center px-4 bg-gray-900/80 text-gray-500 text-sm border-r border-gray-800">
                      devsync.com/w/
                    </span>
                    <input
                      type="text"
                      value={wsSlug}
                      onChange={(e) => setWsSlug(e.target.value)}
                      className="w-full px-4 py-2.5 bg-transparent outline-none text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Changing the slug will break all existing links to this workspace.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-800/60">
              <button className="flex items-center px-5 py-2.5 bg-white hover:bg-gray-200 text-gray-950 text-sm font-bold rounded-lg transition-colors">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-500 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Danger Zone
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Deleting this workspace will permanently remove all projects, channels, tasks, and messages associated with it. This action cannot be undone.
          </p>
          
          <div className="flex items-center justify-between p-4 bg-gray-950 border border-red-500/20 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-200">Delete Workspace</h4>
              <p className="text-xs text-gray-500">Permanently remove everything.</p>
            </div>
            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors">
              Delete Workspace
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
