-- 广告 A/B 实验指标体系（MySQL 8.0+）
-- 原始表粒度：每行一个 user_id；test_group ∈ ('ad', 'psa')

CREATE DATABASE IF NOT EXISTS marketing_analytics;
USE marketing_analytics;

-- 1. 清洗并构建分析宽表
DROP TABLE IF EXISTS ab_user_wide;
CREATE TABLE ab_user_wide AS
SELECT
    CAST(`user id` AS UNSIGNED) AS user_id,
    TRIM(LOWER(`test group`)) AS test_group,
    CASE WHEN LOWER(CAST(converted AS CHAR)) = 'true' THEN 1 ELSE 0 END AS converted,
    CAST(`total ads` AS UNSIGNED) AS total_ads,
    TRIM(`most ads day`) AS most_ads_day,
    CAST(`most ads hour` AS UNSIGNED) AS most_ads_hour,
    CASE
        WHEN `total ads` BETWEEN 1 AND 5 THEN '01_1-5'
        WHEN `total ads` BETWEEN 6 AND 10 THEN '02_6-10'
        WHEN `total ads` BETWEEN 11 AND 20 THEN '03_11-20'
        WHEN `total ads` BETWEEN 21 AND 50 THEN '04_21-50'
        WHEN `total ads` BETWEEN 51 AND 100 THEN '05_51-100'
        ELSE '06_100+'
    END AS exposure_bin
FROM marketing_ab_raw
WHERE `user id` IS NOT NULL
  AND LOWER(TRIM(`test group`)) IN ('ad', 'psa')
  AND `total ads` > 0
  AND `most ads hour` BETWEEN 0 AND 23;

ALTER TABLE ab_user_wide ADD PRIMARY KEY (user_id);
CREATE INDEX idx_ab_group ON ab_user_wide(test_group);
CREATE INDEX idx_ab_time ON ab_user_wide(most_ads_day, most_ads_hour);

-- 2. 实验组总览
SELECT
    test_group,
    COUNT(*) AS users,
    SUM(converted) AS conversions,
    ROUND(AVG(converted) * 100, 4) AS conversion_rate_pct,
    ROUND(AVG(total_ads), 2) AS avg_ads,
    MIN(total_ads) AS min_ads,
    MAX(total_ads) AS max_ads
FROM ab_user_wide
GROUP BY test_group;

-- 3. 曝光频次拆解：同时保留样本量，避免小样本比例误导
SELECT
    exposure_bin,
    test_group,
    COUNT(*) AS users,
    SUM(converted) AS conversions,
    ROUND(AVG(converted) * 100, 4) AS conversion_rate_pct,
    ROUND(AVG(total_ads), 2) AS avg_ads
FROM ab_user_wide
GROUP BY exposure_bin, test_group
ORDER BY exposure_bin, test_group;

-- 4. 星期 × 分组
SELECT
    most_ads_day,
    test_group,
    COUNT(*) AS users,
    ROUND(AVG(converted) * 100, 4) AS conversion_rate_pct
FROM ab_user_wide
GROUP BY most_ads_day, test_group;

-- 5. 小时 × 分组；为低样本时段增加可靠性标签
SELECT
    most_ads_hour,
    test_group,
    COUNT(*) AS users,
    ROUND(AVG(converted) * 100, 4) AS conversion_rate_pct,
    CASE WHEN COUNT(*) < 100 THEN 'LOW_SAMPLE' ELSE 'OK' END AS sample_flag
FROM ab_user_wide
GROUP BY most_ads_hour, test_group
ORDER BY most_ads_hour, test_group;
