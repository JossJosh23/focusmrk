-- Additive migration, idempotent. Apply after existing report tables.
BEGIN;

CREATE TABLE IF NOT EXISTS focus_report_manual_metrics (
  company_id TEXT NOT NULL, id TEXT NOT NULL, social_account_id TEXT, publication_id TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('Instagram','Facebook','TikTok')),
  metric TEXT NOT NULL, level TEXT NOT NULL CHECK (level IN ('ACCOUNT','PUBLICATION','PERIOD','AD')),
  period_start DATE NOT NULL, period_end DATE NOT NULL, value NUMERIC NOT NULL,
  unit TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source = 'MANUAL'),
  official_source TEXT NOT NULL, data_date DATE NOT NULL, note TEXT NOT NULL DEFAULT '',
  preference TEXT NOT NULL DEFAULT 'API' CHECK (preference IN ('API','MANUAL')),
  entered_by TEXT NOT NULL, entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1, deleted_at TIMESTAMPTZ,
  PRIMARY KEY (company_id,id), CHECK (period_end >= period_start),
  CHECK ((level = 'PUBLICATION') = (publication_id IS NOT NULL)),
  CHECK (level != 'ACCOUNT' OR social_account_id IS NOT NULL),
  FOREIGN KEY(company_id,publication_id) REFERENCES focus_social_publications(company_id,id),
  FOREIGN KEY(company_id,social_account_id) REFERENCES focus_content_accounts(company_id,id)
);
CREATE UNIQUE INDEX IF NOT EXISTS focus_manual_metric_active_scope ON focus_report_manual_metrics
 (company_id,platform,metric,level,period_start,period_end,COALESCE(publication_id,''),COALESCE(social_account_id,'')) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS focus_report_metric_audit (
  id BIGSERIAL PRIMARY KEY, company_id TEXT NOT NULL, record_id TEXT NOT NULL,
  action TEXT NOT NULL, before_value JSONB, after_value JSONB,
  actor TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(company_id,record_id) REFERENCES focus_report_manual_metrics(company_id,id)
);
CREATE TABLE IF NOT EXISTS focus_report_editorial (
  company_id TEXT NOT NULL, publication_id TEXT NOT NULL, content_category TEXT,
  content_objective TEXT, updated_by TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(company_id,publication_id),
  FOREIGN KEY(company_id,publication_id) REFERENCES focus_social_publications(company_id,id)
);
CREATE TABLE IF NOT EXISTS focus_report_goals (
  company_id TEXT NOT NULL, id TEXT NOT NULL, platform TEXT NOT NULL DEFAULT 'Todas',
  period_start DATE NOT NULL, period_end DATE NOT NULL, metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL CHECK(target_value > 0),
  created_by TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1, deleted_at TIMESTAMPTZ,
  PRIMARY KEY(company_id,id), CHECK(period_end >= period_start)
);
CREATE UNIQUE INDEX IF NOT EXISTS focus_report_goal_active_scope ON focus_report_goals
 (company_id,platform,period_start,period_end,metric) WHERE deleted_at IS NULL;

COMMIT;
