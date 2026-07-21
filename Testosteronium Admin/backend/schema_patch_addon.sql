-- Run this against your existing `testosteronium` database:
--   mysql -u root -p testosteronium < schema_patch_addon.sql
--
-- Note: run this file only ONCE. MySQL doesn't support
-- "ADD COLUMN IF NOT EXISTS" (that's a MariaDB-only feature), so running
-- this twice will error on the ALTER TABLE line with "duplicate column" —
-- that's expected and harmless if it happens.

USE testosteronium;

CREATE TABLE IF NOT EXISTS enrollment_tokens (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  token        VARCHAR(64)  NOT NULL UNIQUE,
  label        VARCHAR(150),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME NOT NULL,
  used_at      DATETIME NULL,
  used_by_mac  VARCHAR(17) NULL
) ENGINE=InnoDB;

ALTER TABLE tracked_assets
  ADD COLUMN enrolled_via_token VARCHAR(64) NULL;