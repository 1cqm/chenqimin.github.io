const DATA={
ab:{
 accent:'#34b7c5',label:'PROJECT 01 · EXPERIMENTATION · 2026.05',title:'广告投放 A/B 实验<br>与用户转化分析',
 intro:'以 588,101 名用户级实验记录为证据，判断新广告是否真正带来增量，并把整体结果拆解到曝光强度与主要投放时段。',
 question:'新广告相对 PSA 是否产生统计可靠、业务可解释的转化提升？',
 metrics:[['588,101','独立用户','用户 ID 无重复'],['2.555%','实验组转化率','14,423 次转化'],['+0.769pp','绝对提升','95% CI +0.595～+0.943pp'],['1.705×10⁻¹³','双侧 P 值','Z = 7.370']],
 reasons:[['WHY','可量化投放增量','广告投放需要区分真实效果与随机波动，避免只看表面转化率。'],['DECISION','支持上线与预算判断','结论需要同时给出绝对提升、相对提升、置信区间和风险边界。'],['SCOPE','定位可优化环节','继续从星期、小时和曝光频次寻找下一轮测试方向。']],
 steps:[
  ['选题与业务背景','广告素材或投放策略改变后，需要验证新广告是否值得扩大投放。','把“广告看起来更好”改写为可检验的转化率差异。','明确实验组 Ad、对照组 PSA 与用户级分析单位。'],
  ['提出分析问题','整体差异只是第一层，还要判断统计可靠性和场景差异。','定义转化率、绝对提升、相对提升、Z 检验和 95% CI。','形成整体、星期、小时、曝光频次四层问题树。'],
  ['数据质量检查','实验检验依赖独立观测，重复用户会破坏假设。','检查缺失、重复用户、分组枚举、小时范围和曝光正值。','588,101 行、0 缺失、0 重复用户、0 非法分组。'],
  ['宽表与指标体系','分析维度需要统一口径，避免 Python、MySQL、Tableau 各算一套。','构建 group、converted、total_ads、day、hour 和 exposure_bin。','形成实验总览和三类诊断聚合表。'],
  ['统计模型','样本比例差异需要控制随机误差。','使用 pooled standard error 的双样本比例 Z 检验，并计算差值 Wald CI。','Z=7.370，P=1.705×10⁻¹³，区间完全高于 0。'],
  ['分层解释','局部比例容易被样本量和用户选择影响。','按星期、小时和曝光区间同时展示转化率与分母。','周一实验组 3.324%；高曝光与高转化只解释为相关。'],
  ['结论与下一步','显著性不能自动变成预算建议。','把绝对增量用于容量估算，把时段和频次作为新实验假设。','建议扩大投放前设置频控、成本和长期质量护栏。']
 ],
 image:'assets/dashboard-ab-v4.png',imageNote:'广告实验分析总览 · 指标来自 marketing_AB.csv 复算',
 visualLabels:[['样本量','588,101'],['AD CVR','2.555%'],['PSA CVR','1.785%'],['绝对提升','+0.769pp'],['P VALUE','1.705×10⁻¹³'],['95% CI','+0.595～+0.943pp']],
 charts:[['ab-overview','实验总览'],['ab-frequency','曝光频次'],['ab-day','星期表现']],
 codes:[
  ['PYTHON · 141 LINES','完整清洗、宽表、分箱、Z 检验、CI 和分层输出','code/ab_analysis.py',`df = pd.read_csv(DATA_PATH, index_col=0)\nassert df['user_id'].is_unique\n\noverview = df.groupby('test_group').agg(\n    users=('user_id','nunique'),\n    conversions=('converted','sum'),\n    conversion_rate=('converted','mean')\n)\nz_stat, p_value = proportions_ztest(count, nobs)`],
  ['MYSQL 8.0 · 74 LINES','分析宽表、索引、总览、曝光、星期和小时指标','code/ab_analysis.sql',`CREATE TABLE ab_user_wide AS\nSELECT CAST(\`user id\` AS UNSIGNED) AS user_id,\n       LOWER(TRIM(\`test group\`)) AS test_group,\n       CASE WHEN converted='True' THEN 1 ELSE 0 END AS converted,\n       CAST(\`total ads\` AS UNSIGNED) AS total_ads\nFROM marketing_ab_raw;`]
 ],
 recommendations:[['01','确认上线价值','实验组较 PSA 高 0.769pp；置信区间表明提升不是偶然波动。'],['02','用绝对提升估算预算','43.1% 相对提升适合沟通，增量用户与 ROI 应基于 +0.769pp 计算。'],['03','继续做频控实验','当前曝光—转化是相关关系；用随机化频控试验寻找收益递减点。']],
 caveat:'test_group 分配约为 96% / 4%，不影响比例检验成立，但对照组的细分时段精度更低；小时级低样本结果必须标记。'
},
ecommerce:{
 accent:'#1f785f',label:'PROJECT 02 · CUSTOMER ANALYTICS · 2026.05',title:'英国电商用户行为<br>与用户价值分析',
 intro:'从 541,909 条商品明细开始，重建可信的有效交易、订单和客户三层数据，再用月度、市场、商品与 RFM 回答增长从哪里来。',
 question:'哪些市场、月份和客户贡献核心价值？应该对不同客户采取什么运营动作？',
 metrics:[['541,909','原始明细','8 个字段'],['392,692','有效交易行','保留率 72.46%'],['£8.887M','有效销售额','18,532 笔订单'],['72.88%','高价值客群收入','由 30.24% 客户贡献']],
 reasons:[['WHY','流水不等于洞察','取消、重复、匿名客户和异常数量会直接扭曲收入与客单价。'],['DECISION','识别增长结构','需要区分旺季、核心市场、商品贡献和客户集中度。'],['ACTION','连接用户运营','RFM 把交易历史转成维护、交叉销售和召回策略。']],
 steps:[
  ['选题与业务背景','交易明细规模大，但经营者真正需要的是市场和客户决策。','从订单流水建立可审计的经营分析层。','确定销售额、订单、AOV、活跃客户与 RFM 为核心对象。'],
  ['提出分析问题','总收入不能解释增长来自哪里。','拆成时间、国家、商品、客户四个问题。','建立“规模—结构—集中度—运营动作”的分析框架。'],
  ['数据质量检查','CustomerID 缺失和取消订单会破坏客户价值分析。','识别 135,080 条缺失客户、5,268 条重复、9,288 条取消记录。','同时检查非正 Quantity、UnitPrice 和日期有效性。'],
  ['构建分析数据层','商品行、订单和客户是三个不同粒度。','先生成 Sales，再按 InvoiceNo 聚合订单，按 CustomerID 聚合客户。','保留 392,692 条有效明细、18,532 单、4,338 客户。'],
  ['经营指标分析','需要从趋势、市场和商品寻找收入来源。','按月计算收入、订单、活跃客户、AOV；按国家和商品排行。','英国贡献 81.97%；2011-11 收入达到 £1.156M。'],
  ['RFM 模型','不同客户的近期、频次、金额量纲不同。','以最后交易日 +1 天为观察点，计算 R/F/M 并做四分位评分。','1,312 名高价值客户贡献 72.88% 收入。'],
  ['结论与运营建议','客户分层必须落到具体动作。','高价值维护、潜力交叉销售、一般培育、流失风险召回。','2011-12 仅 1–9 日，不能与完整月份直接比较。']
 ],
 image:'assets/dashboard-ecommerce-v4.png',imageNote:'电商经营与用户价值总览 · 指标来自 data.csv 复算',
 visualLabels:[['有效销售额','£8.887M'],['有效订单','18,532'],['客户数','4,338'],['AOV','£479.56'],['英国收入占比','81.97%'],['高价值收入占比','72.88%']],
 charts:[['ec-month','月度趋势'],['ec-country','市场排名'],['ec-rfm','RFM 构成']],
 codes:[
  ['PYTHON · 145 LINES','逐步清洗、订单层、月度指标、国家/商品分析和 RFM','code/ecommerce_rfm.py',`raw = pd.read_csv(DATA_PATH, encoding=args.encoding)\ndf = raw.drop_duplicates()\ndf = df[df.CustomerID.notna()]\ndf = df[~df.InvoiceNo.astype(str).str.startswith('C')]\ndf = df[(df.Quantity > 0) & (df.UnitPrice > 0)]\ndf['Sales'] = df.Quantity * df.UnitPrice`],
  ['MYSQL 8.0 · COMPLETE PIPELINE','DDL、去重、有效交易、订单层、趋势、市场和 RFM','code/ecommerce_analysis.sql',`WITH ranked AS (\n  SELECT r.*, ROW_NUMBER() OVER (\n    PARTITION BY invoice_no, stock_code, quantity,\n                 invoice_date, unit_price, customer_id\n  ) AS duplicate_rank\n  FROM online_retail_raw r\n)\nSELECT * FROM ranked WHERE duplicate_rank = 1;`]
 ],
 recommendations:[['01','保护核心客群','1,312 名高价值客户贡献 72.88% 收入，优先会员权益和流失预警。'],['02','强化旺季准备','9–11 月销售连续增强，库存和触达计划应提前到三季度末。'],['03','分开评估海外市场','英国占 81.97%；其他国家需结合客户数、订单数和获客成本判断扩张。']],
 caveat:'数据日期为 2010-12-01 至 2011-12-09。2011 年 12 月是未完成月份；商品 PAPER CRAFT, LITTLE BIRDIE 的高收入来自单笔大单，应单独标记异常集中。'
},
battery:{
 accent:'#7a5bd1',label:'PROJECT 03 · SCIENTIFIC MODELING · 2025.12—2026.02',title:'手机电池续航影响因素<br>分析与优化',
 intro:'把“耗电快”拆解为屏幕、CPU、网络、基础功耗和环境温度，通过 SOC—温度耦合微分方程描述能耗与热反馈，再做敏感性与约束优化。',
 question:'怎样在满足最低性能和温度安全范围的条件下，最大化剩余续航时间 TTE？',
 metrics:[['50K+','项目时序记录','来自原项目描述'],['5','核心影响因素','屏幕/CPU/网络/温度/模式'],['2','耦合状态变量','SOC + Battery Temp'],['1','优化目标','最大化 TTE']],
 reasons:[['WHY','续航是系统问题','功耗造成温升，温度又反馈到放电效率，不能用单变量线性外推。'],['MODEL','需要机理可解释','模块化功耗和耦合 ODE 能把参数变化连接到物理过程。'],['DECISION','优化必须有边界','最低性能、亮度和最高温度共同约束可行方案。']],
 steps:[
  ['选题与业务背景','手机续航受多因素共同影响，单一平均功耗无法解释场景差异。','把问题定义为能量消耗、热反馈和性能约束的联合优化。','输出 TTE、最高温度和关键因素敏感性。'],
  ['提出研究问题','哪些因素最敏感？温度如何反馈？优化是否会牺牲性能？','建立因素—状态—约束—目标的问题图。','屏幕、CPU、网络、环境温度和使用模式进入模型。'],
  ['时序质量与特征','不同传感器采样频率不一致会制造虚假相关。','按设备与分钟对齐，检查 SOC 跳变、温度范围和时间间隔。','构造 SOC/温度变化率、CPU 三次功耗代理和网络负载指数。'],
  ['功耗模块建模','总功耗需要可解释，才能知道该优化什么。','P_total=P_base+P_screen+P_cpu+P_network。','屏幕使用线性函数，CPU 使用负载/频率三次非线性。'],
  ['电—热耦合 ODE','功耗提升温度，温度改变电池效率。','联合求解 dSOC/dt 与 dT/dt，并在 SOC=5% 时终止。','得到完整放电轨迹、TTE 和最高温度。'],
  ['敏感性与参数估计','模型形式正确不代表参数适合真实设备。','用时间留出集校准容量、发热、散热和效率系数，并逐项扰动。','比较亮度、CPU、网络和环境温度对 TTE 的影响。'],
  ['约束优化与建议','最低功耗方案可能无法满足用户性能要求。','使用 SLSQP，在亮度、CPU 下限和 42°C 上限内最大化 TTE。','形成降低负载波动、适度亮度和减少热积累的策略。']
 ],
 image:'assets/dashboard-battery-v4.png',imageNote:'电—热耦合模型总览 · 当前数值为脚本默认参数模拟',
 visualLabels:[['数据状态','机制演示'],['基线 TTE','4.26h'],['优化 TTE','10.03h'],['模拟提升','+135.4%'],['最高温度','25.76°C'],['终止阈值','SOC 5%']],
 charts:[['bt-sim','场景模拟'],['bt-sens','敏感性排序']],
 codes:[
  ['PYTHON · 99 LINES','模块化功耗、耦合 ODE、事件终止、场景仿真和 SLSQP','code/battery_model.py',`def coupled_ode(t, state, controls, ambient, p):\n    soc, temperature = state\n    power = total_power(*controls, p)\n    efficiency = p.eta_ref * (\n        1 - p.temp_coeff*(temperature-p.reference_temp)**2\n    )\n    return [d_soc, d_temp]`],
  ['MYSQL 8.0 · FEATURE LAYER','原始遥测 DDL、质量规则、分钟对齐和场景特征','code/battery_feature_engineering.sql',`WITH minute_aligned AS (\n  SELECT device_id, minute_at,\n         AVG(soc_pct) AS soc_pct,\n         AVG(battery_temp_c) AS battery_temp_c,\n         AVG(cpu_load_pct) AS cpu_load_pct\n  FROM battery_telemetry_raw\n  GROUP BY device_id, minute_at\n)\nSELECT * FROM minute_aligned;`]
 ],
 recommendations:[['01','降低高频负载波动','CPU 三次功耗使高负载尖峰的成本高于平稳运行。'],['02','亮度采用场景化策略','室内降低亮度可直接减少屏幕功耗，同时不影响核心计算性能。'],['03','把温度作为控制变量','减少热量积累可同时改善安全边界和放电效率。']],
 caveat:'本轮只提供了广告和电商两份原始 CSV，没有提供电池项目原始时序数据。因此电池页的交互数值是机制演示，不作为真实设备性能结论；完整结论需要原始数据校准。'
}}

const AB={groups:[['实验组 Ad',564577,14423,2.5547],['对照组 PSA',23524,420,1.7854]],freq:[['1–5',.2512,.2799],['6–10',.4853,.6735],['11–20',.84,.8193],['21–50',2.9154,2.1777],['51–100',11.6311,5.7744],['100+',17.1352,11.8812]],day:[['周一',3.3241,2.2559],['周二',3.044,1.4448],['周三',2.5356,1.5759],['周四',2.1637,2.023],['周五',2.2465,1.6303],['周六',2.1307,1.3996],['周日',2.462,2.0595]]};
const EC={month:[['10/12',570423],['11/01',568101],['11/02',446085],['11/03',594082],['11/04',468374],['11/05',677355],['11/06',660046],['11/07',598963],['11/08',644051],['11/09',950690],['11/10',1035642],['11/11',1156206],['11/12*',517190]],country:[['英国',7285025],['荷兰',285446],['爱尔兰',265262],['德国',228678],['法国',208934],['澳大利亚',138454]],segments:[['高价值',72.88,'#155c4a'],['流失风险',16.54,'#ef765d'],['潜力',5.58,'#d8a92e'],['一般',5.00,'#55a6a6']]};
const fmt=n=>n.toLocaleString('en-US');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

function rootHTML(p){return `<section class="project-hero" style="--accent:${p.accent}"><div class="project-hero-grid"><div><p class="project-breadcrumb">${p.label}</p><h1>${p.title}</h1><p class="intro">${p.intro}</p></div><div class="hero-question"><small>CORE QUESTION</small><p>${p.question}</p></div></div></section><section class="project-kpis" style="--accent:${p.accent}">${p.metrics.map(m=>`<div><small>${m[1]}</small><strong>${m[0]}</strong><span>${m[2]}</span></div>`).join('')}</section><section class="project-section" style="--accent:${p.accent}"><div class="project-section-head"><span>01 · WHY THIS TOPIC</span><div><h2>为什么选择这个项目？</h2><p>从业务决策出发定义分析价值，而不是从工具或图表出发。</p></div></div><div class="reason-grid">${p.reasons.map(x=>`<article class="reason-card"><small>${x[0]}</small><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join('')}</div></section><section class="project-section" id="process" style="--accent:${p.accent}"><div class="project-section-head"><span>02 · END-TO-END FLOW</span><div><h2>点击流程节点，查看每一步。</h2><p>流程按照“为什么做—具体动作—可验证输出”组织，让非数据背景的读者也能理解。</p></div></div><div class="flow-wrap"><div class="flow-map" id="flowMap">${p.steps.map((s,i)=>`<button class="flow-node ${i===0?'active':''}" data-step="${i}"><b>0${i+1}</b><span>${s[0]}</span><small>点击查看详情 →</small></button>`).join('')}</div><aside class="flow-detail" id="flowDetail"></aside></div></section><section class="project-section" style="--accent:${p.accent}"><div class="project-section-head"><span>03 · VISUAL EVIDENCE</span><div><h2>仪表盘总览 + 精确数据图表。</h2><p>主视觉采用专业 BI 信息层级；关键指标由复算结果直接标注，下方交互图表保留口径、范围和分母。</p></div></div><figure class="dashboard-image"><div class="dashboard-canvas"><img src="${p.image}" alt="${p.imageNote}"><div class="visual-kpi-grid">${p.visualLabels.map(v=>`<div><small>${v[0]}</small><strong>${v[1]}</strong></div>`).join('')}</div></div><figcaption class="dashboard-caption"><span>${p.imageNote}</span><span class="verified-badge">SOURCE-CHECKED VALUES · DETAILS BELOW</span></figcaption></figure><div class="chart-console"><div class="chart-tabs">${p.charts.map((c,i)=>`<button class="${i===0?'active':''}" data-chart="${c[0]}">${c[1]}</button>`).join('')}</div><div class="chart-stage" id="chartStage"></div></div></section><section class="project-section" id="code" style="--accent:${p.accent}"><div class="project-section-head"><span>04 · COMPLETE CODE</span><div><h2>Python 与 MySQL，完整可查看。</h2><p>网页仅展示关键片段；按钮打开完整源文件，包含清洗、建表、指标、模型与输出。</p></div></div><div class="code-grid">${p.codes.map(c=>`<article class="code-card"><small>${c[0]}</small><h3>${c[1]}</h3><p>网站随附完整源码，可直接下载、审阅或继续运行。</p><pre>${esc(c[3])}</pre><a href="${c[2]}" target="_blank">打开完整源代码 <b>↗</b></a></article>`).join('')}</div></section><section class="project-section" style="--accent:${p.accent}"><div class="project-section-head"><span>05 · CONCLUSION & ACTION</span><div><h2>结论必须连接到下一步行动。</h2><p>每条建议都对应前面的数据证据，并把不能推出的结论明确写出来。</p></div></div><div class="recommend-grid">${p.recommendations.map(r=>`<article class="recommend-card"><span>${r[0]}</span><h3>${r[1]}</h3><p>${r[2]}</p></article>`).join('')}</div><div class="caveat"><b>必须保留的分析边界</b><p>${p.caveat}</p></div></section>`}

function showStep(p,i){const s=p.steps[i];document.querySelector('#flowDetail').innerHTML=`<small>STEP 0${i+1}</small><h3>${s[0]}</h3><dl><div><dt>为什么做</dt><dd>${s[1]}</dd></div><div><dt>具体动作</dt><dd>${s[2]}</dd></div><div><dt>可验证输出</dt><dd>${s[3]}</dd></div></dl>`;document.querySelectorAll('.flow-node').forEach((b,n)=>b.classList.toggle('active',n===i))}
function chartHeader(title,sub){return `<div class="chart-header"><h3>${title}</h3><p>${sub}</p></div>`}
function lineSVG(values,color='#167d9a'){const w=800,h=250,p=12,min=Math.min(...values),max=Math.max(...values);return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${values.map((v,i)=>`${p+i*(w-2*p)/(values.length-1)},${h-p-(v-min)/(max-min||1)*(h-2*p)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="4" vector-effect="non-scaling-stroke"/>${values.map((v,i)=>`<circle cx="${p+i*(w-2*p)/(values.length-1)}" cy="${h-p-(v-min)/(max-min||1)*(h-2*p)}" r="3" fill="${color}"/>`).join('')}</svg>`}
function renderChart(id,p){const s=document.querySelector('#chartStage');if(id==='ab-overview'){const max=3;s.innerHTML=chartHeader('实验组与对照组转化率','用户级实验 · n=588,101 · 柱形从 0 开始')+`<div class="bar-chart">${AB.groups.map((g,i)=>`<div class="bar-row"><span>${g[0]}<br><small>n=${fmt(g[1])}</small></span><div class="bar-track"><i class="${i?'outline':''}" style="width:${g[3]/max*100}%"></i></div><b>${g[3].toFixed(3)}%</b></div>`).join('')}</div><div class="note-box">绝对提升 +0.769pp；相对提升 +43.1%；95% CI +0.595～+0.943pp；P=1.705×10⁻¹³。</div>`}
 else if(id==='ab-frequency'){const max=18;s.innerHTML=chartHeader('曝光频次区间转化率','两组并列柱；格内转化率。曝光是实验后的行为变量，不能直接解释因果。')+`<div class="group-chart">${AB.freq.map(d=>`<div class="group-item"><div class="pair"><i style="height:${d[1]/max*100}%"><em>${d[1].toFixed(2)}%</em></i><i class="outline" style="height:${d[2]/max*100}%"><em>${d[2].toFixed(2)}%</em></i></div><b>${d[0]}</b></div>`).join('')}</div><div class="legend"><span><i style="background:${p.accent}"></i>Ad</span><span><i style="border:2px solid ${p.accent}"></i>PSA</span></div>`}
 else if(id==='ab-day'){s.innerHTML=chartHeader('主要曝光星期转化率','7 个星期点；同一刻度比较 Ad 与 PSA。')+`<div class="group-chart">${AB.day.map(d=>`<div class="group-item"><div class="pair"><i style="height:${d[1]/3.5*100}%"><em>${d[1].toFixed(2)}%</em></i><i class="outline" style="height:${d[2]/3.5*100}%"><em>${d[2].toFixed(2)}%</em></i></div><b>${d[0]}</b></div>`).join('')}</div><div class="note-box">周一实验组转化率 3.324%，为星期维度最高；星期并非随机分配变量，适合生成新假设，不直接视为时段因果效果。</div>`}
 else if(id==='ec-month'){const vals=EC.month.map(x=>x[1]);s.innerHTML=chartHeader('月度有效销售额','GBP · 2010-12 至 2011-12；最后一个月仅含 1–9 日')+`<div class="line-chart">${lineSVG(vals,p.accent)}</div><div class="legend">${EC.month.map(x=>`<span>${x[0]}</span>`).join('')}</div><div class="note-box">2011 年 9–11 月连续增长，11 月为 £1.156M；12 月为不完整月份，不与完整月份直接比较。</div>`}
 else if(id==='ec-country'){const max=EC.country[0][1];s.innerHTML=chartHeader('Top 6 国家有效销售额','GBP · 取消、匿名客户与无效价格/数量已排除')+`<div class="bar-chart">${EC.country.map(d=>`<div class="bar-row"><span>${d[0]}</span><div class="bar-track"><i style="width:${d[1]/max*100}%"></i></div><b>£${d[1]>=1e6?(d[1]/1e6).toFixed(2)+'M':Math.round(d[1]/1000)+'k'}</b></div>`).join('')}</div><div class="note-box">英国贡献 £7.285M，占总有效销售额 81.97%。其他市场应结合客户数与订单数评估，不只看销售总额。</div>`}
 else if(id==='ec-rfm'){const grad=`conic-gradient(${EC.segments.map((x,i)=>`${x[2]} ${EC.segments.slice(0,i).reduce((a,b)=>a+b[1],0)}% ${EC.segments.slice(0,i+1).reduce((a,b)=>a+b[1],0)}%`).join(',')})`;s.innerHTML=chartHeader('RFM 分群收入贡献','4,338 名有效客户 · 分位数评分')+`<div class="donut-layout"><div class="donut" style="background:${grad}"><div class="donut-center"><b>£8.89M</b><span>VALID SALES</span></div></div><div class="segment-list">${EC.segments.map(x=>`<div><i style="background:${x[2]}"></i><span>${x[0]}</span><b>${x[1].toFixed(2)}%</b></div>`).join('')}</div></div><div class="note-box">高价值客户 1,312 人，占客户 30.24%，贡献收入 72.88%；客户维护优先级显著高于无差别促销。</div>`}
 else if(id==='bt-sim'){s.innerHTML=chartHeader('续航场景模拟器','机制演示 · 未使用原始电池数据校准')+`<div class="sim-controls"><label>屏幕亮度 <output id="bo">55%</output><input id="bi" type="range" min="10" max="100" value="55"></label><label>CPU 负载 <output id="co">45%</output><input id="ci" type="range" min="10" max="100" value="45"></label><label>环境温度 <output id="to">25°C</output><input id="ti" type="range" min="5" max="40" value="25"></label></div><div class="sim-kpis"><div><small>估算 TTE</small><strong id="tte">—</strong></div><div><small>功耗指数</small><strong id="pow">—</strong></div><div><small>热风险</small><strong id="risk">—</strong></div></div><div class="line-chart" id="simline"></div><div class="note-box">该组件用于解释参数方向，不作为真实设备续航预测。提供原始时序数据后才能校准容量、发热和散热系数。</div>`;initSim(p)}
 else{s.innerHTML=chartHeader('局部敏感性排序','模型机制演示 · 对 TTE 的相对影响')+`<div class="bar-chart">${[['CPU 负载',84],['屏幕亮度',62],['环境温度',38],['网络状态',27],['基础功耗',21]].map(d=>`<div class="bar-row"><span>${d[0]}</span><div class="bar-track"><i style="width:${d[1]}%"></i></div><b>${d[1]}</b></div>`).join('')}</div><div class="note-box">CPU 采用三次非线性功耗项，因此高负载尖峰会快速放大功耗；最终排序必须由真实参数估计与敏感性分析验证。</div>`}}
function initSim(p){const bi=document.querySelector('#bi'),ci=document.querySelector('#ci'),ti=document.querySelector('#ti'),bo=document.querySelector('#bo'),co=document.querySelector('#co'),to=document.querySelector('#to'),tte=document.querySelector('#tte'),pow=document.querySelector('#pow'),risk=document.querySelector('#risk'),sim=document.querySelector('#simline');const update=()=>{const b=+bi.value,c=+ci.value,t=+ti.value,idx=.32+.0057*b+.00009*c*c+.008*Math.max(0,t-25),hours=8.4/idx;bo.value=b+'%';co.value=c+'%';to.value=t+'°C';tte.textContent=hours.toFixed(1)+'h';pow.textContent=idx.toFixed(2)+'×';risk.textContent=t+8*idx>40?'HIGH':t+8*idx>34?'MED':'LOW';const soc=Array.from({length:24},(_,i)=>Math.max(0,100-i*idx*4.1));sim.innerHTML=lineSVG(soc,p.accent)};[bi,ci,ti].forEach(x=>x.oninput=update);update()}

const key=document.body.dataset.project,p=DATA[key];document.documentElement.style.setProperty('--accent',p.accent);document.querySelector('#projectRoot').innerHTML=rootHTML(p);showStep(p,0);document.querySelectorAll('.flow-node').forEach(b=>b.onclick=()=>showStep(p,+b.dataset.step));document.querySelectorAll('.chart-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chart-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderChart(b.dataset.chart,p)});renderChart(p.charts[0][0],p);
