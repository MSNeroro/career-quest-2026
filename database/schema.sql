CREATE DATABASE IF NOT EXISTS career_quest_2026
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE career_quest_2026;

CREATE TABLE IF NOT EXISTS players (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  consent_status TINYINT(1) NOT NULL DEFAULT 0,
  gender ENUM('male', 'female', 'not_specified') NOT NULL DEFAULT 'not_specified',
  age_range VARCHAR(24) NULL,
  education_level VARCHAR(64) NULL,
  province VARCHAR(128) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_players_created_at (created_at),
  INDEX idx_players_province (province),
  INDEX idx_players_age_range (age_range)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id BIGINT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NULL,
  total_score DECIMAL(6,2) NOT NULL DEFAULT 0,
  completed_status TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_sessions_player
    FOREIGN KEY (player_id) REFERENCES players(id)
    ON DELETE CASCADE,
  INDEX idx_sessions_started_at (started_at),
  INDEX idx_sessions_completed (completed_status)
);

CREATE TABLE IF NOT EXISTS player_answers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL,
  question_key VARCHAR(128) NOT NULL,
  answer_value TEXT NULL,
  answer_label TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_answers_session
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    ON DELETE CASCADE,
  INDEX idx_answers_question_key (question_key)
);

CREATE TABLE IF NOT EXISTS game_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  event_key VARCHAR(128) NOT NULL,
  event_value TEXT NULL,
  score_key VARCHAR(64) NULL,
  score_value DECIMAL(8,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_session
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    ON DELETE CASCADE,
  INDEX idx_events_type (event_type),
  INDEX idx_events_key (event_key)
);

CREATE TABLE IF NOT EXISTS skill_scores (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL UNIQUE,
  analytical DECIMAL(6,2) NOT NULL DEFAULT 0,
  creativity DECIMAL(6,2) NOT NULL DEFAULT 0,
  technology DECIMAL(6,2) NOT NULL DEFAULT 0,
  communication DECIMAL(6,2) NOT NULL DEFAULT 0,
  empathy DECIMAL(6,2) NOT NULL DEFAULT 0,
  independence DECIMAL(6,2) NOT NULL DEFAULT 0,
  service_minded DECIMAL(6,2) NOT NULL DEFAULT 0,
  business DECIMAL(6,2) NOT NULL DEFAULT 0,
  content DECIMAL(6,2) NOT NULL DEFAULT 0,
  health_care DECIMAL(6,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_skill_scores_session
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS careers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  career_name_th VARCHAR(255) NOT NULL,
  career_name_en VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  required_skills_json LONGTEXT NOT NULL CHECK (JSON_VALID(required_skills_json)),
  interest_tags_json LONGTEXT NOT NULL CHECK (JSON_VALID(interest_tags_json)),
  personality_tags_json LONGTEXT NOT NULL CHECK (JSON_VALID(personality_tags_json)),
  education_hint TEXT NULL,
  roadmap TEXT NULL,
  trend_score DECIMAL(5,2) NOT NULL DEFAULT 70,
  popularity_score DECIMAL(5,2) NOT NULL DEFAULT 70,
  source_name VARCHAR(255) NULL,
  source_url VARCHAR(500) NULL,
  active_status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_careers_active (active_status),
  INDEX idx_careers_category (category)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL,
  career_id BIGINT UNSIGNED NOT NULL,
  final_score DECIMAL(6,2) NOT NULL,
  reason_text TEXT NULL,
  rank_no INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendations_session
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_recommendations_career
    FOREIGN KEY (career_id) REFERENCES careers(id),
  INDEX idx_recommendations_rank (session_id, rank_no)
);

CREATE TABLE IF NOT EXISTS labor_market_datasets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dataset_name VARCHAR(255) NOT NULL,
  dataset_year INT NOT NULL,
  source_name VARCHAR(255) NULL,
  source_url VARCHAR(500) NULL,
  uploaded_by VARCHAR(128) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_labor_datasets_year (dataset_year)
);

CREATE TABLE IF NOT EXISTS labor_market_rows (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dataset_id BIGINT UNSIGNED NOT NULL,
  metric_key VARCHAR(128) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  area_type ENUM('in_municipal', 'outside_municipal', 'total') NOT NULL DEFAULT 'total',
  sex ENUM('male', 'female', 'all') NOT NULL DEFAULT 'all',
  value DECIMAL(18,2) NOT NULL,
  unit VARCHAR(64) NOT NULL DEFAULT 'คน',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_labor_rows_dataset
    FOREIGN KEY (dataset_id) REFERENCES labor_market_datasets(id)
    ON DELETE CASCADE,
  INDEX idx_labor_rows_metric (metric_key),
  INDEX idx_labor_rows_area_sex (area_type, sex)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
