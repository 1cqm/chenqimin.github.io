const realData = {
  ab: {
    groups: [
      { name: '实验组 Ad', users: 564577, conversions: 14423, rate: 2.5547, avgAds: 24.82, medianAds: 13 },
      { name: '对照组 PSA', users: 23524, conversions: 420, rate: 1.7854, avgAds: 24.76, medianAds: 12 }
    ],
    exposure: [
      ['1–5', 0.2512, 0.2799, 169962, 7861], ['6–10', 0.4853, 0.6735, 79537, 3415],
      ['11–20', 0.8400, 0.8193, 123334, 4150], ['21–50', 2.9154, 2.1777, 125541, 5235],
      ['51–100', 11.6311, 5.7744, 44149, 1853], ['100+', 17.1352, 11.8812, 22054, 1010]
    ],
    days: [
      ['一',3.3241,2.2559],['二',3.0440,1.4448],['三',2.5356,1.5759],['四',2.1637,2.0230],
      ['五',2.2465,1.6303],['六',2.1307,1.3996],['日',2.4620,2.0595]
    ]
  },
  ecom: {
    clean: [['原始明细',541909],['删除精确重复',536641],['保留可识别客户',401604],['排除取消订单',392732],['保留有效交易',392692]],
    monthly: [
      ['10/12',570423],['11/01',568101],['11/02',446085],['11/03',594082],['11/04',468374],
      ['11/05',677355],['11/06',660046],['11/07',598963],['11/08',644051],['11/09',950690],
      ['11/10',1035642],['11/11',1156206],['11/12*',517190]
    ],
    segments: [
      {name:'高价值',customers:1312,customerShare:30.24,revenueShare:72.88,recency:15,frequency:6,action:'会员维护 · 专属权益'},
      {name:'潜力',customers:601,customerShare:13.85,revenueShare:5.58,recency:22,frequency:2,action:'交叉销售 · 二次转化'},
      {name:'一般',customers:1501,customerShare:34.60,revenueShare:5.00,recency:157,frequency:1,action:'低成本培育'},
      {name:'流失风险',customers:924,customerShare:21.30,revenueShare:16.54,recency:100,frequency:3,action:'召回优惠 · 流失预警'}
    ],
    countries: [['英国',7285025],['荷兰',285446],['爱尔兰',265262],['德国',228678],['法国',208934]]
  }
};

const projects = {
  ab: {
    next: 'ecom', nextName: '英国电商用户价值分析', accent: '#49dbe8', cover: 'assets/cover-ab.png',
    kicker: 'PROJECT 01 · EXPERIMENTATION · 2026.05', title: '广告投放 A/B 实验<br>与用户转化分析',
    intro: '以 588,101 名用户的真实实验记录为证据，完成从数据可信度、指标体系到显著性检验和场景拆解的闭环。核心问题不是“哪组更高”，而是“差异是否可靠、幅度有多大、在什么条件下发生”。',
    source: 'marketing_AB.csv · 22.0 MB · 用户级原始表',
    metrics: [
      ['588,101','独立用户','每行一名用户，用户 ID 无重复'],['2.555%','实验组转化率','14,423 / 564,577'],
      ['+0.769pp','绝对提升','95% CI：+0.595～+0.943pp'],['+43.1%','相对提升','Z=7.37 · P≈1.7×10⁻¹³']
    ],
    question: '新广告相对公益广告（PSA）是否带来统计显著且具有业务意义的转化增量？曝光频次、主要曝光星期和小时又如何影响结果解读？',
    steps: [
      {n:'01',icon:'database',title:'明确数据粒度与实验单位',why:'A/B 检验要求观测相互独立，因此第一步不是算转化率，而是确认“一行是否真的代表一名用户”。',do:'读取 588,101 行、6 个业务字段；检查 user_id 唯一性、分组枚举、布尔标签和曝光时间范围。',out:'0 个重复用户、0 个缺失单元格、0 个非法分组；数据可用于用户级比例检验。'},
      {n:'02',icon:'shield',title:'完成质量检查与类型转换',why:'字符串布尔值、小时字段或索引列若处理错误，会直接改变转化人数和分组结果。',do:'移除导出索引；字段改为 snake_case；converted 转为布尔型；total_ads 与 hour 转为数值型；加入断言。',out:'实验组 564,577 人，对照组 23,524 人；分配比例不均衡但两组均有足够样本。'},
      {n:'03',icon:'layers',title:'构建用户分析宽表',why:'Tableau 和 SQL 下钻需要稳定、可复用的维度，而不能每张图重复写临时逻辑。',do:'保留 group、converted、total_ads、day、hour；将曝光次数划分为 1–5、6–10、11–20、21–50、51–100、100+。',out:'形成实验总览、星期、小时、曝光频次四类统一指标表。'},
      {n:'04',icon:'sigma',title:'建立统计检验',why:'两个样本比例看起来不同，不等于总体效果不同；需要量化随机误差。',do:'以 pooled standard error 构造双侧 Z 检验；以未合并标准误计算转化率差值的 95% Wald 置信区间。',out:'差值 +0.769pp，95% CI 完全大于 0；P≈1.7×10⁻¹³，拒绝“转化率相同”的原假设。'},
      {n:'05',icon:'grid',title:'拆解时间与曝光频次',why:'整体均值可能掩盖局部差异，小样本时段也可能产生异常高低值。',do:'按星期、小时和曝光频次同时计算 users、conversions、rate 和 avg_exposure；所有图表都保留分母。',out:'周一实验组转化率最高（3.324%）；凌晨 PSA 样本很小，页面明确提示不可过度解读。'},
      {n:'06',icon:'compass',title:'转化为投放决策',why:'统计显著性只回答“差异存在”，业务还需要知道如何投放与监控。',do:'将整体效果、时段、频次和样本量放在同一叙事中，设置低样本标签和曝光上限监控。',out:'支持优先测试高表现时段，并监控重复曝光；曝光—转化关系仅解释为相关，不声称因果。'}
    ],
    codeTabs: [
      {label:'Python · 完整分析',file:'source/01_ab_analysis.py'}, {label:'MySQL · 指标体系',file:'source/01_ab_mysql.sql'}
    ],
    code: `<span class="cm"># 1) 数据质量：先验证实验单位</span>\ndf = pd.read_csv(DATA_PATH, index_col=<span class="num">0</span>)\ndf.columns = df.columns.str.strip().str.lower().str.replace(<span class="str">' '</span>, <span class="str">'_'</span>)\ndf[<span class="str">'converted'</span>] = df[<span class="str">'converted'</span>].astype(<span class="str">'boolean'</span>)\n\nassert df[<span class="str">'user_id'</span>].is_unique\nassert df[<span class="str">'test_group'</span>].isin([<span class="str">'ad'</span>, <span class="str">'psa'</span>]).all()\nassert df[<span class="str">'most_ads_hour'</span>].between(<span class="num">0</span>, <span class="num">23</span>).all()\n\n<span class="cm"># 2) 曝光分箱与分层指标</span>\nbins = [<span class="num">0, 5, 10, 20, 50, 100</span>, np.inf]\nlabels = [<span class="str">'1-5'</span>, <span class="str">'6-10'</span>, <span class="str">'11-20'</span>, <span class="str">'21-50'</span>, <span class="str">'51-100'</span>, <span class="str">'100+'</span>]\ndf[<span class="str">'exposure_bin'</span>] = pd.cut(df.total_ads, bins=bins, labels=labels)\n\noverview = df.groupby(<span class="str">'test_group'</span>).agg(\n    users=(<span class="str">'user_id'</span>, <span class="str">'nunique'</span>),\n    conversions=(<span class="str">'converted'</span>, <span class="str">'sum'</span>),\n    conversion_rate=(<span class="str">'converted'</span>, <span class="str">'mean'</span>),\n    avg_ads=(<span class="str">'total_ads'</span>, <span class="str">'mean'</span>)\n)\n\n<span class="cm"># 3) 双样本比例 Z 检验 + 差值置信区间</span>\ncount = overview[<span class="str">'conversions'</span>].to_numpy()\nnobs = overview[<span class="str">'users'</span>].to_numpy()\nz_stat, p_value = proportions_ztest(count, nobs)\nci_low, ci_high = confint_proportions_2indep(\n    count1=count[<span class="num">0</span>], nobs1=nobs[<span class="num">0</span>],\n    count2=count[<span class="num">1</span>], nobs2=nobs[<span class="num">1</span>],\n    method=<span class="str">'wald'</span>, compare=<span class="str">'diff'</span>\n)`,
    outcomes: [
      ['效果成立','实验组转化率显著高于 PSA；置信区间表明真实绝对提升大概率位于 0.595～0.943pp。'],
      ['优先解释幅度','43.1% 的相对提升很醒目，但业务容量规划应同时使用 +0.769pp 的绝对提升。'],
      ['避免错误因果','高曝光人群转化率更高，但用户兴趣可能同时影响曝光和转化，不能据此断言“多投一定更好”。']
    ]
  },
  ecom: {
    next: 'battery', nextName: '手机电池续航优化', accent: '#63d6a1', cover: 'assets/cover-ecommerce.png',
    kicker: 'PROJECT 02 · CUSTOMER ANALYTICS · 2026.05', title: '英国电商用户行为<br>与用户价值分析',
    intro: '从 541,909 条订单明细中剔除无法归属客户、取消、重复和无效交易，重建订单与客户两层分析数据；再用 RFM 将交易历史转化为可运营的客户资产视图。',
    source: 'data.csv · 45.6 MB · 订单商品明细',
    metrics: [
      ['541,909','原始明细','8 字段 · 2010-12 至 2011-12'],['392,692','有效交易行','清洗保留率 72.46%'],
      ['£8.887M','有效销售额','18,532 笔订单 · AOV £479.56'],['4,338','可识别客户','高价值客群贡献 72.88% 销售额']
    ],
    question: '在取消订单、客户缺失和异常交易混杂的流水中，哪些市场和月份真正贡献收入？如何把 4,000+ 客户转化为可执行的分层运营策略？',
    steps: [
      {n:'01',icon:'database',title:'确认订单明细粒度',why:'同一 InvoiceNo 可以包含多件商品；直接把每行当订单会夸大订单量并压低客单价。',do:'识别 InvoiceNo + StockCode 的明细结构，解析 InvoiceDate，检查 CustomerID、Quantity、UnitPrice 和取消标记。',out:'541,909 条明细、8 个字段；时间覆盖 2010-12-01 至 2011-12-09。'},
      {n:'02',icon:'filter',title:'建立可审计的清洗漏斗',why:'删除规则若一次性执行，读者无法判断数据在哪一步损失，也无法复核保留率。',do:'依次删除 5,268 个精确重复，排除 135,080 条缺失 CustomerID，识别 9,288 条取消记录，再约束数量和价格为正。',out:'最终保留 392,692 条有效明细，占原始数据 72.46%。'},
      {n:'03',icon:'layers',title:'构建订单级与客户级数据',why:'经营指标和用户价值需要不同粒度；把两者混在一起容易出现重复聚合。',do:'订单级聚合 order_value、units、item_lines；客户级聚合订单数、累计消费和最近购买日期。',out:'18,532 笔订单、4,338 名客户；平均订单金额 £479.56。'},
      {n:'04',icon:'chart',title:'拆解经营表现',why:'总销售额不能说明增长来自时间、市场、商品还是客户。',do:'按月计算销售额、订单量、活跃客户和 AOV；按国家和商品计算收入、销量与订单覆盖。',out:'英国贡献 £7.285M，占有效销售额 81.97%；2011 年 11 月销售额 £1.156M。'},
      {n:'05',icon:'grid',title:'计算 RFM 并分位数评分',why:'不同客户的最近购买、购买频次和金额量纲不同，需要转换到可比较的评分。',do:'观察时点设为最后交易日 + 1 天；计算 Recency、Frequency、Monetary；用四分位排名解决大量并列频次。',out:'R 中位数 51 天、F 中位数 2 单、M 中位数 £668.57。'},
      {n:'06',icon:'compass',title:'把分群映射为运营动作',why:'分群只有连接到触达策略才具有业务价值。',do:'将高 R/F/M 定义为高价值；近期但频次较低为潜力；历史价值高但近期沉默为流失风险。',out:'1,312 名高价值客户贡献 72.88% 销售额；924 名流失风险客户适合优先召回。'}
    ],
    codeTabs: [{label:'Python · 清洗与 RFM',file:'source/02_ecommerce_rfm.py'}],
    code: `<span class="cm"># 1) 逐层清洗：保留每一步行数</span>\nraw = pd.read_csv(DATA_PATH, encoding=<span class="str">'latin1'</span>)\nraw[<span class="str">'InvoiceDate'</span>] = pd.to_datetime(raw[<span class="str">'InvoiceDate'</span>], errors=<span class="str">'coerce'</span>)\nsteps = [(<span class="str">'原始明细'</span>, len(raw))]\n\ndf = raw.drop_duplicates().copy()\nsteps.append((<span class="str">'删除精确重复'</span>, len(df)))\ndf = df[df.CustomerID.notna()]\nsteps.append((<span class="str">'保留可识别客户'</span>, len(df)))\ndf = df[~df.InvoiceNo.astype(str).str.startswith(<span class="str">'C'</span>)]\ndf = df[(df.Quantity > <span class="num">0</span>) & (df.UnitPrice > <span class="num">0</span>)]\n\n<span class="cm"># 2) 订单级数据：避免把商品行误当订单</span>\ndf[<span class="str">'Sales'</span>] = df.Quantity * df.UnitPrice\norders = df.groupby(<span class="str">'InvoiceNo'</span>).agg(\n    customer_id=(<span class="str">'CustomerID'</span>, <span class="str">'first'</span>),\n    order_date=(<span class="str">'InvoiceDate'</span>, <span class="str">'min'</span>),\n    units=(<span class="str">'Quantity'</span>, <span class="str">'sum'</span>),\n    order_value=(<span class="str">'Sales'</span>, <span class="str">'sum'</span>)\n)\n\n<span class="cm"># 3) RFM：最后交易日 + 1 天为统一观察点</span>\nsnapshot = df.InvoiceDate.max().normalize() + pd.Timedelta(days=<span class="num">1</span>)\nrfm = df.groupby(<span class="str">'CustomerID'</span>).agg(\n    Recency=(<span class="str">'InvoiceDate'</span>, <span class="kw">lambda</span> x: (snapshot-x.max().normalize()).days),\n    Frequency=(<span class="str">'InvoiceNo'</span>, <span class="str">'nunique'</span>),\n    Monetary=(<span class="str">'Sales'</span>, <span class="str">'sum'</span>)\n)\nrfm[<span class="str">'R'</span>] = pd.qcut(rfm.Recency.rank(method=<span class="str">'first'</span>), <span class="num">4</span>, labels=[<span class="num">4,3,2,1</span>])\nrfm[<span class="str">'F'</span>] = pd.qcut(rfm.Frequency.rank(method=<span class="str">'first'</span>), <span class="num">4</span>, labels=[<span class="num">1,2,3,4</span>])\nrfm[<span class="str">'M'</span>] = pd.qcut(rfm.Monetary.rank(method=<span class="str">'first'</span>), <span class="num">4</span>, labels=[<span class="num">1,2,3,4</span>])`,
    outcomes: [
      ['收入高度集中','英国贡献 81.97% 销售额；市场扩张分析应把英国作为基准，而不是与小样本国家直接横比。'],
      ['旺季清晰但需注明截断','9–11 月销售额连续走高；2011 年 12 月只到 9 日，不能与完整月份直接比较。'],
      ['客户价值可运营','30.24% 的高价值客户贡献 72.88% 收入，会员维护的优先级明显高于无差别促销。']
    ]
  },
  battery: {
    next: 'ab', nextName: '广告投放 A/B 实验', accent: '#6d8cff', cover: 'assets/cover-battery.png',
    kicker: 'PROJECT 03 · SCIENTIFIC MODELING · 2025.12—2026.02', title: '手机电池续航影响因素<br>分析与优化',
    intro: '把“耗电快”拆成屏幕、CPU、网络、基础功耗和环境温度五类因素，用 SOC—温度电热耦合微分方程描述反馈，再在性能与安全约束下搜索更长续航方案。',
    source: '项目建模说明 · 当前未附原始数据文件',
    metrics: [['50K+','时序记录','项目描述中的数据规模'],['5','核心因素','屏幕 / CPU / 网络 / 温度 / 模式'],['2','耦合状态','SOC 与电池温度'],['1','优化目标','在约束下最大化 TTE']],
    question: '如何同时解释设备负载导致的能量消耗和热量累积，并在不牺牲最低性能、不过热的前提下延长剩余续航时间？',
    steps: [
      {n:'01',icon:'database',title:'对齐电量、温度与负载时序',why:'不同传感器采样频率和时间戳不一致时，直接拼接会制造虚假相关。',do:'统一时间粒度，按设备和时间排序；处理缺失段、重复时间戳和异常跳变；构造 SOC 变化率与温升率。',out:'得到可用于参数估计的连续场景片段，并保留缺失插值标记。'},
      {n:'02',icon:'layers',title:'拆分功耗模块',why:'总功耗需要可解释，才能知道应该优化屏幕、CPU 还是网络。',do:'基础功耗为常数；屏幕功耗随亮度线性变化；CPU 使用频率/负载的三次项；网络按状态切换。',out:'P_total = P_base + P_screen + P_cpu + P_network。'},
      {n:'03',icon:'sigma',title:'建立 SOC—温度耦合方程',why:'功耗会升温，温度又会影响放电效率；两个过程必须联合求解。',do:'SOC 方程描述容量消耗；热方程平衡发热与对环境散热；效率函数引入偏离参考温度的损失。',out:'得到 dSOC/dt 与 dT/dt 两状态 ODE，可输出整个放电轨迹。'},
      {n:'04',icon:'tune',title:'估计参数并验证',why:'机理形式正确并不代表参数适合真实设备。',do:'最小化预测 SOC/温度与实测值的联合误差；训练/验证按时间片划分，避免未来信息泄漏。',out:'获得容量、发热、散热和温度效率系数，并检查残差是否存在系统偏差。'},
      {n:'05',icon:'chart',title:'敏感性与场景仿真',why:'优化前需要确认哪个控制变量对 TTE 最敏感。',do:'分别改变亮度、CPU、网络和环境温度；保持其他变量不变，比较 TTE 与最高温度。',out:'输出敏感性排序和多场景轨迹；页面模拟器用于解释机制，不冒充真实设备预测。'},
      {n:'06',icon:'compass',title:'执行约束优化',why:'最低功耗方案可能无法满足使用需求，因此必须加入性能和安全边界。',do:'目标为最大化 TTE；约束亮度、CPU 最低水平和温度上限；使用 SLSQP 搜索可行解。',out:'形成“降低负载波动、适度亮度、减少热积累”的可执行策略。'}
    ],
    codeTabs: [{label:'Python · ODE 与优化',file:'source/03_battery_model.py'}],
    code: `<span class="cm"># 1) 可解释的模块化功耗</span>\n<span class="kw">def</span> <span class="fn">total_power</span>(brightness, cpu_load, network, p):\n    <span class="kw">return</span> (p.base_power\n            + p.screen_power * brightness\n            + p.cpu_power * cpu_load ** <span class="num">3</span>\n            + p.network_power * network)\n\n<span class="cm"># 2) SOC—温度电热耦合方程</span>\n<span class="kw">def</span> <span class="fn">coupled_ode</span>(t, state, controls, ambient, p):\n    soc, temperature = state\n    power = total_power(*controls, p)\n    efficiency = p.eta_ref * (\n        <span class="num">1</span> - p.temp_coeff * (temperature-p.reference_temp)**<span class="num">2</span>\n    )\n    efficiency = np.clip(efficiency, <span class="num">0.70</span>, <span class="num">1.00</span>)\n    d_soc = -power / (p.capacity_wh * efficiency)\n    d_temp = (p.heat_coeff*power\n              - p.cool_coeff*(temperature-ambient)) / p.thermal_mass\n    <span class="kw">return</span> [d_soc, d_temp]\n\n<span class="cm"># 3) 事件终止：SOC 下降到 5%</span>\nresult = solve_ivp(\n    coupled_ode, (<span class="num">0, 24</span>), [<span class="num">1.0</span>, ambient],\n    args=(controls, ambient, params),\n    events=empty_event, dense_output=<span class="kw">True</span>, max_step=<span class="num">0.05</span>\n)\n\n<span class="cm"># 4) 性能下限 + 温度惩罚的约束优化</span>\noptimum = minimize(\n    objective, x0=[<span class="num">0.55, 0.55</span>],\n    bounds=[(<span class="num">0.20, 1.00</span>), (<span class="num">0.30, 1.00</span>)], method=<span class="str">'SLSQP'</span>\n)`,
    outcomes: [['模型可解释','每个功耗模块对应可控制变量，方便把数学结果翻译为设备策略。'],['验证优先于复杂度','通过留出时间片和残差检查判断参数是否稳定，而不是只展示拟合曲线。'],['边界明确','当前页面未接入该项目原始数据，模拟值仅解释模型机制；真实结论需由实测参数校准。']]
  }
};

let current = 0, timer;
const slides = [...document.querySelectorAll('.slide')];
const progress = document.querySelector('#progress');
function showSlide(i){current=(i+slides.length)%slides.length;slides.forEach((s,n)=>s.classList.toggle('active',n===current));progress.style.transform=`translateX(${current*100}%)`;resetTimer()}
function resetTimer(){clearInterval(timer);timer=setInterval(()=>showSlide(current+1),6500)}
document.querySelector('#prev').onclick=()=>showSlide(current-1);
document.querySelector('#next').onclick=()=>showSlide(current+1);
let touchX=0;document.querySelector('.slides').addEventListener('pointerdown',e=>touchX=e.clientX);document.querySelector('.slides').addEventListener('pointerup',e=>{if(Math.abs(e.clientX-touchX)>45)showSlide(current+(e.clientX<touchX?1:-1))});resetTimer();

const fmt=n=>n.toLocaleString('en-US');
function abCharts(){return `<div class="visual-shell"><div class="visual-tabs"><button class="viz-tab active" data-chart="ab-overview">实验总览</button><button class="viz-tab" data-chart="ab-exposure">曝光频次</button><button class="viz-tab" data-chart="ab-day">星期对比</button></div><div id="chartStage"></div></div>`}
function ecomCharts(){return `<div class="visual-shell"><div class="visual-tabs"><button class="viz-tab active" data-chart="ec-clean">清洗漏斗</button><button class="viz-tab" data-chart="ec-month">月度趋势</button><button class="viz-tab" data-chart="ec-rfm">RFM 分群</button><button class="viz-tab" data-chart="ec-country">市场贡献</button></div><div id="chartStage"></div></div>`}
function batteryCharts(){return `<div class="visual-shell"><div class="sim-controls"><label>屏幕亮度 <output id="brightOut">55%</output><input id="brightIn" type="range" min="10" max="100" value="55"></label><label>CPU 负载 <output id="cpuOut">45%</output><input id="cpuIn" type="range" min="10" max="100" value="45"></label><label>环境温度 <output id="tempOut">25°C</output><input id="tempIn" type="range" min="5" max="40" value="25"></label></div><div class="sim-kpis"><div><small>估算 TTE</small><strong id="tteOut">8.4h</strong></div><div><small>功耗指数</small><strong id="powerOut">1.00×</strong></div><div><small>热风险</small><strong id="riskOut">LOW</strong></div></div><div class="battery-layout"><div><div class="chart-title"><b>SOC 与温度轨迹</b><span>简化模型 · 参数变化实时更新</span></div><div class="trajectory" id="batteryTrajectory"></div></div><div><div class="chart-title"><b>局部敏感性</b><span>对 TTE 的相对影响，模型演示</span></div><div class="sensitivity"><i style="--w:84%"><span>CPU 负载</span><b>高</b></i><i style="--w:62%"><span>屏幕亮度</span><b>中高</b></i><i style="--w:38%"><span>环境温度</span><b>中</b></i><i style="--w:27%"><span>网络状态</span><b>低中</b></i></div></div></div><p class="data-note">说明：该项目未提供原始数据，本组件只用于解释模型机制，不是设备级真实预测。</p></div>`}

function renderABChart(type){const s=document.querySelector('#chartStage');if(type==='ab-overview'){const [ad,psa]=realData.ab.groups;s.innerHTML=`<div class="chart-title"><b>实验组与对照组转化表现</b><span>用户级数据 · n=588,101 · 误差区间为转化率差值 95% CI</span></div><div class="comparison-bars">${[ad,psa].map((g,i)=>`<div class="compare-row"><div><strong>${g.name}</strong><small>${fmt(g.users)} 人 · ${fmt(g.conversions)} 转化</small></div><div class="bar-track"><i class="${i?'outline':''}" style="width:${g.rate/3*100}%"></i></div><b>${g.rate.toFixed(3)}%</b></div>`).join('')}</div><div class="effect-strip"><span>PSA 基线 1.785%</span><i><b style="left:59.5%;width:34.8%"></b><em style="left:76.9%"></em></i><span>差值 +0.769pp</span></div><div class="chart-callout"><strong>P≈1.7×10⁻¹³</strong><span>差值 95% CI：+0.595～+0.943pp；区间未跨越 0。</span></div>`}
 else if(type==='ab-exposure'){const max=18;s.innerHTML=`<div class="chart-title"><b>不同曝光频次下的转化率</b><span>纵轴：转化率；每根柱保留样本量。高曝光与转化为相关关系，不代表因果。</span></div><div class="grouped-bars">${realData.ab.exposure.map(d=>`<div class="group-col"><div class="bar-pair"><i style="height:${d[1]/max*100}%"><em>${d[1].toFixed(2)}%</em><small>n=${fmt(d[3])}</small></i><i class="outline" style="height:${d[2]/max*100}%"><em>${d[2].toFixed(2)}%</em><small>n=${fmt(d[4])}</small></i></div><b>${d[0]}</b></div>`).join('')}</div><div class="legend"><span><i></i>实验组 Ad</span><span><i class="outline"></i>对照组 PSA</span></div>`}
 else{s.innerHTML=`<div class="chart-title"><b>主要曝光星期 × 分组转化率</b><span>色深表示转化率；格内给出精确值。星期不是随机分配变量。</span></div><div class="heatmap"><div></div>${realData.ab.days.map(d=>`<b>周${d[0]}</b>`).join('')}<strong>Ad</strong>${realData.ab.days.map(d=>`<i style="--a:${Math.min(1,d[1]/3.5)}">${d[1].toFixed(2)}%</i>`).join('')}<strong>PSA</strong>${realData.ab.days.map(d=>`<i class="outline" style="--a:${Math.min(1,d[2]/3.5)}">${d[2].toFixed(2)}%</i>`).join('')}</div><p class="chart-insight">周一实验组转化率最高（3.324%）；对照组在部分凌晨小时的样本量不足 100，小时级结果需要低样本标记。</p>`}}

function renderEcomChart(type){const s=document.querySelector('#chartStage');if(type==='ec-clean'){const max=541909;s.innerHTML=`<div class="chart-title"><b>订单明细清洗漏斗</b><span>每一步为上一层数据继续筛选；最终保留 72.46%。</span></div><div class="clean-funnel">${realData.ecom.clean.map((d,i)=>`<div style="width:${55+d[1]/max*45}%"><span>${i+1}. ${d[0]}</span><b>${fmt(d[1])}</b><em>${(d[1]/max*100).toFixed(1)}%</em></div>`).join('')}</div><div class="quality-chips"><span>CustomerID 缺失 <b>135,080</b></span><span>重复 <b>5,268</b></span><span>取消记录 <b>9,288</b></span><span>非正数量 <b>10,624</b></span></div>`}
 else if(type==='ec-month'){const max=Math.max(...realData.ecom.monthly.map(d=>d[1]));s.innerHTML=`<div class="chart-title"><b>月度有效销售额</b><span>GBP · 取消/无效交易已排除；2011-12 仅包含 1–9 日。</span></div><div class="month-bars">${realData.ecom.monthly.map((d,i)=>`<div class="month ${i===12?'partial':''}"><i style="height:${d[1]/max*100}%"><em>£${(d[1]/1000).toFixed(0)}k</em></i><b>${d[0]}</b></div>`).join('')}</div><p class="chart-insight">2011 年 9–11 月销售额连续走高，11 月达到 £1.156M；12 月为截断月份，不与完整月份直接比较。</p>`}
 else if(type==='ec-rfm'){s.innerHTML=`<div class="chart-title"><b>RFM 客群：客户占比 vs 收入贡献</b><span>面积按客户占比近似；卡片内给出收入贡献、R/F 中位数与建议动作。</span></div><div class="segment-map">${realData.ecom.segments.map((d,i)=>`<article class="seg s${i}" style="flex:${d.customerShare}"><small>${d.customers} 人 · ${d.customerShare}% 客户</small><strong>${d.name}</strong><b>${d.revenueShare}% 收入</b><p>R=${d.recency} 天 · F=${d.frequency} 单</p><em>${d.action}</em></article>`).join('')}</div>`}
 else{const max=realData.ecom.countries[0][1];s.innerHTML=`<div class="chart-title"><b>Top 5 市场销售额</b><span>GBP · 有效交易口径；横向条从 0 开始。</span></div><div class="country-bars">${realData.ecom.countries.map(d=>`<div><span>${d[0]}</span><i><b style="width:${d[1]/max*100}%"></b></i><strong>£${d[1]>=1e6?(d[1]/1e6).toFixed(3)+'M':(d[1]/1000).toFixed(0)+'k'}</strong></div>`).join('')}</div><p class="chart-insight">英国占有效销售额 81.97%。其他市场的客户数和订单数更小，比较时应同时查看分母。</p>`}}

function polyline(values,color){const w=720,h=230,p=10,min=Math.min(...values),max=Math.max(...values);return `<polyline points="${values.map((v,i)=>`${p+i*(w-2*p)/(values.length-1)},${h-p-(v-min)/(max-min||1)*(h-2*p)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3" vector-effect="non-scaling-stroke"/>`}
function initBattery(){const brightIn=document.getElementById('brightIn'),cpuIn=document.getElementById('cpuIn'),tempIn=document.getElementById('tempIn'),brightOut=document.getElementById('brightOut'),cpuOut=document.getElementById('cpuOut'),tempOut=document.getElementById('tempOut'),tteOut=document.getElementById('tteOut'),powerOut=document.getElementById('powerOut'),riskOut=document.getElementById('riskOut'),batteryTrajectory=document.getElementById('batteryTrajectory'),els=[brightIn,cpuIn,tempIn];const update=()=>{const b=+brightIn.value,c=+cpuIn.value,t=+tempIn.value;const idx=.32+.0057*b+.00009*c*c+.008*Math.max(0,t-25),hours=8.4/idx;brightOut.value=b+'%';cpuOut.value=c+'%';tempOut.value=t+'°C';tteOut.textContent=hours.toFixed(1)+'h';powerOut.textContent=idx.toFixed(2)+'×';riskOut.textContent=t+8*idx>40?'HIGH':t+8*idx>34?'MED':'LOW';const soc=Array.from({length:24},(_,i)=>Math.max(0,100-i*idx*4.2)),thermal=Array.from({length:24},(_,i)=>t+(1-Math.exp(-i/5))*idx*8);batteryTrajectory.innerHTML=`<svg viewBox="0 0 720 230" preserveAspectRatio="none">${polyline(soc,'#6d8cff')}${polyline(thermal,'#ff805d')}</svg><div class="legend"><span><i style="background:#6d8cff"></i>SOC</span><span><i style="background:#ff805d"></i>Temperature</span></div>`};els.forEach(el=>el.oninput=update);update()}

function renderProject(id){const p=projects[id];if(!p)return;document.body.classList.add('detail');const view=document.querySelector('#projectView');view.classList.add('open');view.style.setProperty('--acid',p.accent);view.innerHTML=`<section class="project-hero"><img src="${p.cover}" alt="${p.title.replace('<br>','')}项目封面"><div class="project-title"><p class="crumb">${p.kicker}</p><h1>${p.title}</h1><p>${p.intro}</p><span class="source-pill">SOURCE · ${p.source}</span></div></section><main class="case v2"><div class="metric-row">${p.metrics.map(m=>`<div class="metric"><small>${m[1]}</small><strong>${m[0]}</strong><span>${m[2]}</span></div>`).join('')}</div><section class="case-section intro-section"><div class="case-label">01 / QUESTION</div><div class="case-copy"><h2>先把业务问题，<br>翻译成可验证问题。</h2><p class="lead">${p.question}</p><div class="answer-map"><div><small>INPUT</small><strong>${id==='ab'?'用户级实验记录':id==='ecom'?'订单商品明细':'设备时序与场景参数'}</strong></div><i>→</i><div><small>METHOD</small><strong>${id==='ab'?'质量检查 + 比例检验':id==='ecom'?'双层聚合 + RFM':'耦合 ODE + 优化'}</strong></div><i>→</i><div><small>OUTPUT</small><strong>${id==='ab'?'增量与投放依据':id==='ecom'?'经营洞察与客群动作':'TTE 与控制策略'}</strong></div></div></div></section><section class="case-section process-section"><div class="case-label">02 / PROCESS</div><div class="case-copy"><h2>六个环节，<br>每一步都说明为什么。</h2><p>下面不是工具清单，而是从原始证据走向结论的完整推理链。每一步都交代目的、处理和可验证输出。</p><div class="deep-steps">${p.steps.map(s=>`<article class="deep-step"><div class="step-mark"><span class="step-icon ${s.icon}"></span><b>${s.n}</b></div><div><h3>${s.title}</h3><dl><div><dt>为什么做</dt><dd>${s.why}</dd></div><div><dt>怎么做</dt><dd>${s.do}</dd></div><div><dt>得到什么</dt><dd>${s.out}</dd></div></dl></div></article>`).join('')}</div></div></section><section class="case-section"><div class="case-label">03 / EVIDENCE</div><div class="case-copy"><h2>不只展示结论，<br>还展示证据形状。</h2><p>${id==='battery'?'拖动参数观察状态轨迹如何变化；由于没有该项目原始文件，所有数值都明确标记为模型演示。':'所有图表均由本次提供的原始 CSV 重新计算，并保留样本量、时间范围或清洗口径。'}</p>${id==='ab'?abCharts():id==='ecom'?ecomCharts():batteryCharts()}</div></section><section class="case-section"><div class="case-label">04 / SOURCE CODE</div><div class="case-copy"><h2>代码不是装饰，<br>而是可复现的分析路径。</h2><p>页面展示核心逻辑；下方可直接打开完整源文件，包含读取、校验、清洗、建模、分层和输出步骤。</p><div class="code-actions">${p.codeTabs.map(t=>`<a href="${t.file}" target="_blank">${t.label} <b>↗</b></a>`).join('')}</div><div class="code-block expanded"><div class="code-top"><i class="dot"></i><i class="dot"></i><i class="dot"></i><span>${p.codeTabs[0].file.split('/').pop()}</span><em>CORE IMPLEMENTATION</em></div><pre><code>${p.code}</code></pre></div></div></section><section class="case-section"><div class="case-label">05 / OUTCOME</div><div class="case-copy"><h2>结论、动作与边界，<br>放在一起才可信。</h2><div class="outcomes">${p.outcomes.map((o,i)=>`<article class="outcome"><small>0${i+1}</small><strong>${o[0]}</strong><p>${o[1]}</p></article>`).join('')}</div><div class="method-note"><b>阅读原则</b><p>数字说明“数据中观察到了什么”；统计或模型说明“在什么假设下可以相信”；限制说明“哪些话不能从这些结果推出”。</p></div></div></section><div class="next-case"><a class="back-home" href="#work">← 返回项目轮播</a><a href="#project/${p.next}">下一个：${p.nextName} ↗</a></div></main>`;window.scrollTo(0,0);requestAnimationFrame(()=>{if(id==='ab')renderABChart('ab-overview');if(id==='ecom')renderEcomChart('ec-clean');if(id==='battery')initBattery();document.querySelectorAll('.viz-tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.viz-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');id==='ab'?renderABChart(btn.dataset.chart):renderEcomChart(btn.dataset.chart)})})}

function route(){const hash=location.hash||'#home';if(hash.startsWith('#project/'))renderProject(hash.split('/')[1]);else{document.body.classList.remove('detail');document.querySelector('#projectView').classList.remove('open');if(hash==='#home')window.scrollTo(0,0)}}
window.addEventListener('hashchange',route);route();
