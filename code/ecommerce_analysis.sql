-- 英国电商：MySQL 8.0 清洗、订单层、月度指标与 RFM 分群
CREATE DATABASE IF NOT EXISTS ecommerce_analytics
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE ecommerce_analytics;

DROP TABLE IF EXISTS online_retail_raw;
CREATE TABLE online_retail_raw (
    invoice_no     VARCHAR(20),
    stock_code     VARCHAR(30),
    description    VARCHAR(255),
    quantity       INT,
    invoice_date   DATETIME,
    unit_price     DECIMAL(12, 4),
    customer_id    BIGINT NULL,
    country        VARCHAR(80)
);

-- 使用 MySQL Workbench Import Wizard 导入 data.csv 后执行以下步骤。

-- 1. 去重并建立有效交易明细；ROW_NUMBER 保留一条完全相同的记录
DROP TABLE IF EXISTS retail_clean;
CREATE TABLE retail_clean AS
WITH ranked AS (
    SELECT r.*,
           ROW_NUMBER() OVER (
               PARTITION BY invoice_no, stock_code, description, quantity,
                            invoice_date, unit_price, customer_id, country
               ORDER BY invoice_no
           ) AS duplicate_rank
    FROM online_retail_raw r
)
SELECT
    invoice_no,
    stock_code,
    TRIM(description) AS description,
    quantity,
    invoice_date,
    unit_price,
    customer_id,
    TRIM(country) AS country,
    ROUND(quantity * unit_price, 2) AS sales,
    DATE_FORMAT(invoice_date, '%Y-%m') AS sales_month
FROM ranked
WHERE duplicate_rank = 1
  AND customer_id IS NOT NULL
  AND invoice_no NOT LIKE 'C%'
  AND quantity > 0
  AND unit_price > 0
  AND invoice_date IS NOT NULL;

CREATE INDEX idx_retail_customer ON retail_clean(customer_id);
CREATE INDEX idx_retail_invoice ON retail_clean(invoice_no);
CREATE INDEX idx_retail_date ON retail_clean(invoice_date);

-- 2. 订单级分析表：一张发票聚合为一笔订单
DROP TABLE IF EXISTS retail_orders;
CREATE TABLE retail_orders AS
SELECT
    invoice_no,
    MIN(customer_id) AS customer_id,
    MIN(invoice_date) AS order_date,
    MIN(country) AS country,
    COUNT(*) AS item_lines,
    SUM(quantity) AS units,
    ROUND(SUM(sales), 2) AS order_value
FROM retail_clean
GROUP BY invoice_no;

ALTER TABLE retail_orders ADD PRIMARY KEY(invoice_no);

-- 3. 经营总览
SELECT
    COUNT(*) AS valid_lines,
    COUNT(DISTINCT invoice_no) AS orders,
    COUNT(DISTINCT customer_id) AS customers,
    ROUND(SUM(sales), 2) AS revenue,
    ROUND(SUM(sales) / COUNT(DISTINCT invoice_no), 2) AS aov
FROM retail_clean;

-- 4. 月度趋势
SELECT
    sales_month,
    ROUND(SUM(sales), 2) AS revenue,
    COUNT(DISTINCT invoice_no) AS orders,
    COUNT(DISTINCT customer_id) AS active_customers,
    ROUND(SUM(sales) / COUNT(DISTINCT invoice_no), 2) AS aov
FROM retail_clean
GROUP BY sales_month
ORDER BY sales_month;

-- 5. 国家贡献及份额
WITH country_metrics AS (
    SELECT country,
           SUM(sales) AS revenue,
           COUNT(DISTINCT invoice_no) AS orders,
           COUNT(DISTINCT customer_id) AS customers
    FROM retail_clean
    GROUP BY country
)
SELECT
    country,
    ROUND(revenue, 2) AS revenue,
    ROUND(revenue / SUM(revenue) OVER () * 100, 2) AS revenue_share_pct,
    orders,
    customers
FROM country_metrics
ORDER BY revenue DESC;

-- 6. 客户 RFM；观察时点为最后交易日 + 1 天
DROP TABLE IF EXISTS customer_rfm;
CREATE TABLE customer_rfm AS
WITH snapshot AS (
    SELECT DATE_ADD(DATE(MAX(invoice_date)), INTERVAL 1 DAY) AS snapshot_date
    FROM retail_clean
), base AS (
    SELECT
        customer_id,
        DATEDIFF((SELECT snapshot_date FROM snapshot), DATE(MAX(invoice_date))) AS recency,
        COUNT(DISTINCT invoice_no) AS frequency,
        ROUND(SUM(sales), 2) AS monetary
    FROM retail_clean
    GROUP BY customer_id
), scored AS (
    SELECT base.*,
           5 - NTILE(4) OVER (ORDER BY recency) AS r_score,
           NTILE(4) OVER (ORDER BY frequency) AS f_score,
           NTILE(4) OVER (ORDER BY monetary) AS m_score
    FROM base
)
SELECT *,
       CASE
           WHEN r_score >= 3 AND f_score >= 3 AND m_score >= 3 THEN '高价值'
           WHEN r_score >= 3 AND f_score >= 2 THEN '潜力'
           WHEN r_score <= 2 AND (f_score >= 3 OR m_score >= 3) THEN '流失风险'
           ELSE '一般'
       END AS segment
FROM scored;

-- 7. 分群规模、收入贡献和中位数近似画像
SELECT
    segment,
    COUNT(*) AS customers,
    ROUND(COUNT(*) / SUM(COUNT(*)) OVER () * 100, 2) AS customer_share_pct,
    ROUND(SUM(monetary), 2) AS revenue,
    ROUND(SUM(monetary) / SUM(SUM(monetary)) OVER () * 100, 2) AS revenue_share_pct,
    ROUND(AVG(recency), 1) AS avg_recency,
    ROUND(AVG(frequency), 1) AS avg_frequency
FROM customer_rfm
GROUP BY segment
ORDER BY revenue DESC;
