BEGIN;
CREATE TABLE IF NOT EXISTS focus_account_insights (
  company_id TEXT NOT NULL,
  social_account_id TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  scope TEXT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY(company_id,social_account_id,captured_at,scope),
  FOREIGN KEY(company_id,social_account_id) REFERENCES focus_content_accounts(company_id,id)
);
COMMIT;
