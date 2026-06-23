import { Sprint } from '../types';

export const sprints: Sprint[] = [
  {
    id: 'sprint_1',
    projectId: 'proj_1',
    name: 'Sprint 12: Foundation Polish',
    startDate: '2026-04-10',
    endDate: '2026-04-24',
    status: 'active',
    summary: null,
    contributionReport: null,
    closedAt: null,
  },
  {
    id: 'sprint_0',
    projectId: 'proj_1',
    name: 'Sprint 11: Core API',
    startDate: '2026-03-27',
    endDate: '2026-04-09',
    status: 'closed',
    summary: {
      content: 'Successfully completed 95% of planned tasks. Backend performance optimized by 30%.',
    },
    contributionReport: {
      team: 'Outstanding performance across the board.',
    },
    closedAt: '2026-04-09',
  }
];
