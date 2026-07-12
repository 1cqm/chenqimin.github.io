"""广告投放 A/B 实验：从原始用户记录到统计检验与分层指标。"""
from pathlib import Path

import numpy as np
import pandas as pd
from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep


DATA_PATH = Path("data/marketing_AB.csv")
OUTPUT_DIR = Path("outputs/ab_test")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# 1. 读取并统一字段 -----------------------------------------------------------
df = pd.read_csv(DATA_PATH, index_col=0)
df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_", regex=False)
df["converted"] = df["converted"].astype("boolean")
df["total_ads"] = pd.to_numeric(df["total_ads"], errors="coerce").astype("Int64")
df["most_ads_hour"] = pd.to_numeric(df["most_ads_hour"], errors="coerce").astype("Int64")


# 2. 数据质量检查 -------------------------------------------------------------
quality = pd.Series({
    "rows": len(df),
    "missing_cells": int(df.isna().sum().sum()),
    "exact_duplicates": int(df.duplicated().sum()),
    "duplicate_user_ids": int(df["user_id"].duplicated().sum()),
    "invalid_groups": int((~df["test_group"].isin(["ad", "psa"])).sum()),
    "invalid_hours": int((~df["most_ads_hour"].between(0, 23)).sum()),
    "nonpositive_exposure": int((df["total_ads"] <= 0).sum()),
}, name="value")

assert quality["duplicate_user_ids"] == 0, "同一用户出现多次，会破坏独立性假设"
assert quality["invalid_groups"] == 0


# 3. 构建分析宽表与曝光分箱 ---------------------------------------------------
bins = [0, 5, 10, 20, 50, 100, np.inf]
labels = ["1-5", "6-10", "11-20", "21-50", "51-100", "100+"]
df["exposure_bin"] = pd.cut(df["total_ads"], bins=bins, labels=labels)
df["is_ad"] = df["test_group"].eq("ad").astype("int8")
df["converted_int"] = df["converted"].astype("int8")


# 4. 实验总览 ---------------------------------------------------------------
overview = (
    df.groupby("test_group", observed=True)
      .agg(
          users=("user_id", "nunique"),
          conversions=("converted_int", "sum"),
          conversion_rate=("converted_int", "mean"),
          avg_ads=("total_ads", "mean"),
          median_ads=("total_ads", "median"),
      )
      .reset_index()
)

ad = overview.set_index("test_group").loc["ad"]
psa = overview.set_index("test_group").loc["psa"]
count = np.array([ad["conversions"], psa["conversions"]])
nobs = np.array([ad["users"], psa["users"]])


# 5. 双样本比例 Z 检验与 95% 置信区间 ---------------------------------------
z_stat, p_value = proportions_ztest(count=count, nobs=nobs, alternative="two-sided")
ci_low, ci_high = confint_proportions_2indep(
    count1=int(count[0]), nobs1=int(nobs[0]),
    count2=int(count[1]), nobs2=int(nobs[1]),
    method="wald", compare="diff", alpha=0.05,
)

absolute_lift = ad["conversion_rate"] - psa["conversion_rate"]
relative_lift = absolute_lift / psa["conversion_rate"]
test_result = pd.DataFrame([{
    "absolute_lift": absolute_lift,
    "relative_lift": relative_lift,
    "z_stat": z_stat,
    "p_value": p_value,
    "ci_low": ci_low,
    "ci_high": ci_high,
}])


# 6. 星期、小时与曝光频次拆解 -----------------------------------------------
def segment_metrics(dimension: str) -> pd.DataFrame:
    return (
        df.groupby([dimension, "test_group"], observed=True)
          .agg(
              users=("user_id", "nunique"),
              conversions=("converted_int", "sum"),
              conversion_rate=("converted_int", "mean"),
              avg_exposure=("total_ads", "mean"),
          )
          .reset_index()
    )


by_day = segment_metrics("most_ads_day")
by_hour = segment_metrics("most_ads_hour")
by_exposure = segment_metrics("exposure_bin")


# 7. 输出 Tableau / 审核文件 --------------------------------------------------
quality.to_csv(OUTPUT_DIR / "quality_checks.csv", header=True)
overview.to_csv(OUTPUT_DIR / "experiment_overview.csv", index=False)
test_result.to_csv(OUTPUT_DIR / "z_test_result.csv", index=False)
by_day.to_csv(OUTPUT_DIR / "conversion_by_day.csv", index=False)
by_hour.to_csv(OUTPUT_DIR / "conversion_by_hour.csv", index=False)
by_exposure.to_csv(OUTPUT_DIR / "conversion_by_exposure.csv", index=False)

print(overview.to_string(index=False))
print(test_result.to_string(index=False))
