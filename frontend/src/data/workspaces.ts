export const workspaces = [
  {
    id: 'ws_1',
    name: 'DevSync Labs',
    slug: 'devsync-labs',
    ownerId: 'usr_1',
    logoUrl: null,
    plan: 'Pro',
    storageUsed: 245, // MB
    storageLimit: 1024, // MB
    memberCount: 6,
    projectCount: 3,
    createdAt: '2025-09-01',
    deletedAt: null,
  }
];

export const workspaceMembers = [
  { workspaceId: 'ws_1', userId: 'usr_1', role: 'owner', joinedAt: '2025-09-01' },
  { workspaceId: 'ws_1', userId: 'usr_2', role: 'admin', joinedAt: '2025-09-05' },
  { workspaceId: 'ws_1', userId: 'usr_3', role: 'admin', joinedAt: '2025-09-08' },
  { workspaceId: 'ws_1', userId: 'usr_4', role: 'member', joinedAt: '2025-09-12' },
  { workspaceId: 'ws_1', userId: 'usr_5', role: 'member', joinedAt: '2025-09-15' },
  { workspaceId: 'ws_1', userId: 'usr_6', role: 'member', joinedAt: '2025-09-20' },
];
