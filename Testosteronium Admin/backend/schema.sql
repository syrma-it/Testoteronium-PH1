-- Testosteronium Asset Tracker — MySQL schema
-- Run once against your MySQL server:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS testosteronium
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE testosteronium;

-- Devices reporting in through the agent (Windows / Linux / macOS)
CREATE TABLE IF NOT EXISTS tracked_assets (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  hostname      VARCHAR(120)  NOT NULL,
  username      VARCHAR(120),
  ip_address    VARCHAR(45)   NOT NULL,
  mac_address   VARCHAR(17),
  serial_number VARCHAR(120),
  os_name       VARCHAR(80),
  os_version    VARCHAR(80),
  cpu           VARCHAR(120),
  ram_gb        DECIMAL(6,1),
  disk_gb       DECIMAL(8,1),
  status        ENUM('online','offline') NOT NULL DEFAULT 'online',
  first_seen    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_mac (mac_address)
) ENGINE=InnoDB;

-- Records added by a human — direct entry or Excel/CSV import
CREATE TABLE IF NOT EXISTS manual_assets (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  asset_type    VARCHAR(80),
  owner         VARCHAR(120),
  location      VARCHAR(150),
  serial_number VARCHAR(120),
  notes         TEXT,
  source        ENUM('manual','excel_import') NOT NULL DEFAULT 'manual',
  is_deleted    TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Devices seen on the network that aren't claimed in either table above.
-- Repopulated by each network scan; old unclaimed entries expire naturally
-- since a fresh scan is the source of truth for "currently on the network".
CREATE TABLE IF NOT EXISTS fetching_assets (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ip_address    VARCHAR(45)  NOT NULL,
  mac_address   VARCHAR(17)  NOT NULL,
  vendor_guess  VARCHAR(120),
  os_guess      VARCHAR(80),
  connection    VARCHAR(40)  DEFAULT 'LAN/Wi-Fi',
  first_seen    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_mac (mac_address)
) ENGINE=InnoDB;