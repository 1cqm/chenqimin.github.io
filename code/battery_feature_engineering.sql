-- 手机电池项目：MySQL 8.0 时序清洗与特征工程
-- 说明：建模与 ODE 求解由 Python 完成；SQL 负责原始遥测质量检查和特征层。
CREATE DATABASE IF NOT EXISTS battery_analytics;
USE battery_analytics;

DROP TABLE IF EXISTS battery_telemetry_raw;
CREATE TABLE battery_telemetry_raw (
    device_id          VARCHAR(64) NOT NULL,
    observed_at        DATETIME(3) NOT NULL,
    soc_pct            DECIMAL(6, 3),
    battery_temp_c     DECIMAL(6, 3),
    cpu_load_pct       DECIMAL(6, 3),
    cpu_frequency_ghz  DECIMAL(6, 3),
    screen_brightness  DECIMAL(6, 3),
    network_state      VARCHAR(20),
    ambient_temp_c     DECIMAL(6, 3),
    usage_mode         VARCHAR(30),
    PRIMARY KEY(device_id, observed_at)
);

-- 1. 业务规则检查：结果必须为 0 或被单独审查
SELECT
    SUM(soc_pct NOT BETWEEN 0 AND 100) AS invalid_soc,
    SUM(battery_temp_c NOT BETWEEN -10 AND 70) AS invalid_battery_temp,
    SUM(cpu_load_pct NOT BETWEEN 0 AND 100) AS invalid_cpu_load,
    SUM(screen_brightness NOT BETWEEN 0 AND 100) AS invalid_brightness,
    SUM(network_state NOT IN ('offline','wifi','4g','5g')) AS invalid_network
FROM battery_telemetry_raw;

-- 2. 统一到分钟粒度，避免不同传感器采样频率造成重复权重
DROP TABLE IF EXISTS battery_minute_features;
CREATE TABLE battery_minute_features AS
WITH minute_aligned AS (
    SELECT
        device_id,
        TIMESTAMP(DATE(observed_at), MAKETIME(HOUR(observed_at), MINUTE(observed_at), 0)) AS minute_at,
        AVG(soc_pct) AS soc_pct,
        AVG(battery_temp_c) AS battery_temp_c,
        AVG(cpu_load_pct) AS cpu_load_pct,
        AVG(cpu_frequency_ghz) AS cpu_frequency_ghz,
        AVG(screen_brightness) / 100.0 AS brightness_ratio,
        MAX(network_state) AS network_state,
        AVG(ambient_temp_c) AS ambient_temp_c,
        MAX(usage_mode) AS usage_mode
    FROM battery_telemetry_raw
    WHERE soc_pct BETWEEN 0 AND 100
      AND battery_temp_c BETWEEN -10 AND 70
      AND cpu_load_pct BETWEEN 0 AND 100
      AND screen_brightness BETWEEN 0 AND 100
    GROUP BY device_id, minute_at
), lagged AS (
    SELECT m.*,
           LAG(soc_pct) OVER (PARTITION BY device_id ORDER BY minute_at) AS prev_soc,
           LAG(battery_temp_c) OVER (PARTITION BY device_id ORDER BY minute_at) AS prev_temp,
           LAG(minute_at) OVER (PARTITION BY device_id ORDER BY minute_at) AS prev_minute
    FROM minute_aligned m
)
SELECT
    *,
    TIMESTAMPDIFF(SECOND, prev_minute, minute_at) / 60.0 AS delta_minutes,
    (soc_pct - prev_soc) /
      NULLIF(TIMESTAMPDIFF(SECOND, prev_minute, minute_at) / 3600.0, 0) AS soc_change_per_hour,
    (battery_temp_c - prev_temp) /
      NULLIF(TIMESTAMPDIFF(SECOND, prev_minute, minute_at) / 3600.0, 0) AS temp_change_per_hour,
    CASE network_state
      WHEN '5g' THEN 1.00 WHEN '4g' THEN 0.75 WHEN 'wifi' THEN 0.45 ELSE 0.05
    END AS network_load_index,
    POWER(cpu_frequency_ghz, 3) * cpu_load_pct / 100.0 AS cpu_power_proxy
FROM lagged
WHERE prev_minute IS NOT NULL
  AND TIMESTAMPDIFF(MINUTE, prev_minute, minute_at) BETWEEN 1 AND 5;

CREATE INDEX idx_battery_mode ON battery_minute_features(usage_mode, minute_at);

-- 3. 场景级特征，为 Python 参数估计和敏感性分析提供输入
SELECT
    device_id,
    usage_mode,
    DATE(minute_at) AS observed_date,
    COUNT(*) AS minutes_observed,
    ROUND(AVG(brightness_ratio), 4) AS avg_brightness,
    ROUND(AVG(cpu_load_pct), 2) AS avg_cpu_load,
    ROUND(AVG(cpu_power_proxy), 4) AS avg_cpu_power_proxy,
    ROUND(AVG(network_load_index), 4) AS avg_network_load,
    ROUND(AVG(ambient_temp_c), 2) AS avg_ambient_temp,
    ROUND(MAX(battery_temp_c), 2) AS max_battery_temp,
    ROUND(AVG(soc_change_per_hour), 4) AS avg_soc_change_per_hour,
    ROUND(AVG(temp_change_per_hour), 4) AS avg_temp_change_per_hour
FROM battery_minute_features
GROUP BY device_id, usage_mode, DATE(minute_at);
