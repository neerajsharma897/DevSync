import { Channel } from '../types';

export const channels: Channel[] = [
  {
    id: 'chan_1',
    workspaceId: 'ws_1',
    projectId: 'proj_1',
    name: 'general',
    isPrivate: false,
    isDirectMessage: false,
    createdBy: 'usr_1',
    createdAt: '2025-09-01',
  },
  {
    id: 'chan_2',
    workspaceId: 'ws_1',
    projectId: 'proj_1',
    name: 'design-feedback',
    isPrivate: false,
    isDirectMessage: false,
    createdBy: 'usr_4',
    createdAt: '2025-09-12',
  },
  {
    id: 'chan_3',
    workspaceId: 'ws_1',
    projectId: 'proj_1',
    name: 'infrastructure',
    isPrivate: true,
    isDirectMessage: false,
    createdBy: 'usr_5',
    createdAt: '2025-09-15',
  },
  {
    id: 'dm_1',
    workspaceId: 'ws_1',
    projectId: null,
    name: 'Sarah Chen',
    isPrivate: true,
    isDirectMessage: true,
    createdBy: 'usr_1',
    createdAt: '2025-09-05',
  },
  {
    id: 'dm_2',
    workspaceId: 'ws_1',
    projectId: null,
    name: 'Marcus Johnson',
    isPrivate: true,
    isDirectMessage: true,
    createdBy: 'usr_1',
    createdAt: '2025-09-08',
  }
];
