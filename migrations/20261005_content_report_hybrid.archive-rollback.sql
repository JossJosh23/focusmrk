-- Optional, data-preserving rollback. FIRST deploy the previous application version.
-- This script archives the feature tables; it never deletes rows or snapshots.
-- Do not run while the hybrid report code is active (it initializes these tables).
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.focus_report_manual_metrics_20261005_archive') IS NOT NULL THEN
    RAISE EXCEPTION 'Archived hybrid data already exists. Stop and inspect before rollback.';
  END IF;
END $$;
ALTER TABLE IF EXISTS focus_report_metric_audit RENAME TO focus_report_metric_audit_20261005_archive;
ALTER TABLE IF EXISTS focus_report_editorial RENAME TO focus_report_editorial_20261005_archive;
ALTER TABLE IF EXISTS focus_report_goals RENAME TO focus_report_goals_20261005_archive;
ALTER TABLE IF EXISTS focus_report_manual_metrics RENAME TO focus_report_manual_metrics_20261005_archive;
ALTER INDEX IF EXISTS focus_manual_metric_active_scope RENAME TO focus_manual_metric_active_scope_20261005_archive;
ALTER INDEX IF EXISTS focus_report_goal_active_scope RENAME TO focus_report_goal_active_scope_20261005_archive;
COMMIT;
