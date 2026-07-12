"""英国电商：订单清洗、经营指标与 RFM 用户分层。"""
from pathlib import Path

import numpy as np
import pandas as pd


DATA_PATH = Path("data/data.csv")
OUTPUT_DIR = Path("outputs/ecommerce")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# 1. 读取、类型转换与质量画像 -------------------------------------------------
raw = pd.read_csv(DATA_PATH, encoding="latin1")
raw["InvoiceDate"] = pd.to_datetime(raw["InvoiceDate"], errors="coerce")

quality = pd.Series({
    "raw_rows": len(raw),
    "exact_duplicates": int(raw.duplicated().sum()),
    "missing_customer_id": int(raw["CustomerID"].isna().sum()),
    "missing_description": int(raw["Description"].isna().sum()),
    "cancelled_rows": int(raw["InvoiceNo"].astype(str).str.startswith("C").sum()),
    "nonpositive_quantity": int((raw["Quantity"] <= 0).sum()),
    "nonpositive_price": int((raw["UnitPrice"] <= 0).sum()),
}, name="value")


# 2. 逐层清洗；每一步都保留行数，方便解释保留率 ------------------------------
steps = [("原始明细", len(raw))]
df = raw.drop_duplicates().copy()
steps.append(("删除精确重复", len(df)))
df = df[df["CustomerID"].notna()]
steps.append(("保留可识别客户", len(df)))
df = df[~df["InvoiceNo"].astype(str).str.startswith("C")]
steps.append(("排除取消订单", len(df)))
df = df[(df["Quantity"] > 0) & (df["UnitPrice"] > 0) & df["InvoiceDate"].notna()]
steps.append(("保留有效交易", len(df)))

df["CustomerID"] = df["CustomerID"].astype("int64")
df["Sales"] = df["Quantity"] * df["UnitPrice"]
df["Month"] = df["InvoiceDate"].dt.to_period("M").astype(str)


# 3. 构建订单级数据集 ---------------------------------------------------------
orders = (
    df.groupby("InvoiceNo", observed=True)
      .agg(
          customer_id=("CustomerID", "first"),
          order_date=("InvoiceDate", "min"),
          country=("Country", "first"),
          item_lines=("StockCode", "size"),
          units=("Quantity", "sum"),
          order_value=("Sales", "sum"),
      )
      .reset_index()
)


# 4. 月度、国家与商品表现 -----------------------------------------------------
monthly = (
    df.groupby("Month", observed=True)
      .agg(revenue=("Sales", "sum"), orders=("InvoiceNo", "nunique"),
           active_customers=("CustomerID", "nunique"), units=("Quantity", "sum"))
      .reset_index()
)
monthly["aov"] = monthly["revenue"] / monthly["orders"]

country = (
    df.groupby("Country", observed=True)
      .agg(revenue=("Sales", "sum"), orders=("InvoiceNo", "nunique"),
           customers=("CustomerID", "nunique"))
      .sort_values("revenue", ascending=False)
      .reset_index()
)

products = (
    df.groupby(["StockCode", "Description"], observed=True)
      .agg(revenue=("Sales", "sum"), units=("Quantity", "sum"),
           orders=("InvoiceNo", "nunique"))
      .sort_values("revenue", ascending=False)
      .reset_index()
)


# 5. RFM：观察时点 = 数据集中最后交易日期 + 1 天 ----------------------------
snapshot = df["InvoiceDate"].max().normalize() + pd.Timedelta(days=1)
rfm = (
    df.groupby("CustomerID", observed=True)
      .agg(
          Recency=("InvoiceDate", lambda x: (snapshot - x.max().normalize()).days),
          Frequency=("InvoiceNo", "nunique"),
          Monetary=("Sales", "sum"),
      )
)

# rank(method='first') 可避免大量并列 Frequency 导致 qcut 边界重复
rfm["R"] = pd.qcut(rfm["Recency"].rank(method="first", ascending=True), 4,
                     labels=[4, 3, 2, 1]).astype(int)
rfm["F"] = pd.qcut(rfm["Frequency"].rank(method="first"), 4,
                     labels=[1, 2, 3, 4]).astype(int)
rfm["M"] = pd.qcut(rfm["Monetary"].rank(method="first"), 4,
                     labels=[1, 2, 3, 4]).astype(int)

conditions = [
    (rfm.R >= 3) & (rfm.F >= 3) & (rfm.M >= 3),
    (rfm.R >= 3) & (rfm.F >= 2),
    (rfm.R <= 2) & ((rfm.F >= 3) | (rfm.M >= 3)),
]
rfm["Segment"] = np.select(
    conditions, ["高价值", "潜力", "流失风险"], default="一般"
)


# 6. 分群画像与业务动作 -------------------------------------------------------
segment_profile = (
    rfm.groupby("Segment", observed=True)
       .agg(customers=("Recency", "size"), median_recency=("Recency", "median"),
            median_frequency=("Frequency", "median"), revenue=("Monetary", "sum"))
       .reset_index()
)
segment_profile["customer_share"] = segment_profile.customers / len(rfm)
segment_profile["revenue_share"] = segment_profile.revenue / rfm.Monetary.sum()


# 7. 输出可复用分析层 ---------------------------------------------------------
quality.to_csv(OUTPUT_DIR / "quality_checks.csv", header=True)
pd.DataFrame(steps, columns=["step", "rows"]).to_csv(OUTPUT_DIR / "cleaning_funnel.csv", index=False)
orders.to_parquet(OUTPUT_DIR / "orders.parquet", index=False)
rfm.reset_index().to_parquet(OUTPUT_DIR / "customer_rfm.parquet", index=False)
monthly.to_csv(OUTPUT_DIR / "monthly_metrics.csv", index=False)
country.to_csv(OUTPUT_DIR / "country_metrics.csv", index=False)
products.to_csv(OUTPUT_DIR / "product_metrics.csv", index=False)
segment_profile.to_csv(OUTPUT_DIR / "rfm_segments.csv", index=False)

print(f"有效明细：{len(df):,}；订单：{len(orders):,}；客户：{len(rfm):,}")
print(segment_profile.to_string(index=False))
