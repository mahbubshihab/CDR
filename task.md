# Task List - Decoupling Workspace & Analytics

- [x] Create directory structure for `src/features/analytics/`
  - [x] `src/features/analytics/components/`
  - [x] `src/features/analytics/subfeatures/`
- [x] Move target subfeatures from `workspace/subfeatures/` to `analytics/subfeatures/`
  - [x] executive-dashboard, advanced-analysis, graph-analytics, raw-logs, mfc-analysis, network-analysis, ownership-intelligence, international-intelligence, imei-summary, imsi-summary, location-summary, location-intelligence
- [x] Create `AnalyticsWorkspace.tsx` under `src/features/analytics/components/`
- [x] Simplify `Workspace.tsx` under `src/features/workspace/components/` (Screenshot 2 only)
- [x] Update `App.tsx` routing to switch between Workspace and AnalyticsWorkspace
- [x] Update import paths in all migrated subfeature components
- [x] Verify build compilation (`npm run build`)
- [ ] Commit all changes and push to GitHub remote main branch
