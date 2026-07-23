"use client";

import { useMemo, useState } from "react";

type Inventory = {
  company: string;
  companyCode: string;
  product: string;
  sku: string;
  stock: number;
  days: number;
  risk: number;
  riskLabel: string;
  sales: string;
  accent: string;
};

const inventory: Inventory[] = [
  { company: "현대그린푸드", companyCode: "GF", product: "그리팅 밸런스 건강식 12팩", sku: "GF-250612", stock: 1840, days: 17, risk: 94, riskLabel: "판매 기한 임박", sales: "-38%", accent: "green" },
  { company: "현대홈쇼핑", companyCode: "HS", product: "프리미엄 온열 마사지기", sku: "HS-410872", stock: 620, days: 86, risk: 89, riskLabel: "과잉 재고", sales: "-26%", accent: "blue" },
  { company: "현대리바트", companyCode: "LV", product: "테라 사계절 쿠션 세트", sku: "LV-331024", stock: 1320, days: 112, risk: 84, riskLabel: "시즌 종료 임박", sales: "-31%", accent: "gold" },
  { company: "현대그린푸드", companyCode: "GF", product: "저당 견과 에너지바 24입", sku: "GF-250418", stock: 2460, days: 31, risk: 78, riskLabel: "판매 속도 저하", sales: "-19%", accent: "green" },
];

const navItems = [
  ["⌂", "통합 대시보드"],
  ["◇", "위험 재고"],
  ["⌁", "수요 예측"],
  ["✦", "AI 전략"],
  ["▤", "시뮬레이션"],
  ["↗", "실행 로그"],
];

export default function Home() {
  const [selectedSku, setSelectedSku] = useState(inventory[0].sku);
  const [discount, setDiscount] = useState(18);
  const [period, setPeriod] = useState(14);
  const [company, setCompany] = useState("전체 계열사");
  const [generating, setGenerating] = useState(false);
  const [approved, setApproved] = useState(false);
  const [toast, setToast] = useState("");

  const selected = inventory.find((item) => item.sku === selectedSku) ?? inventory[0];
  const projectedDays = useMemo(() => Math.max(9, 54 - discount - Math.round(period / 5)), [discount, period]);
  const saving = useMemo(() => Math.round(118 + discount * 3.8 + period * 1.7), [discount, period]);
  const sellThrough = useMemo(() => Math.min(93, 48 + discount * 1.45 + period * 0.65), [discount, period]);

  const filtered = company === "전체 계열사" ? inventory : inventory.filter((item) => item.company === company);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function generateStrategy() {
    setGenerating(true);
    setApproved(false);
    window.setTimeout(() => {
      setGenerating(false);
      notify("3개 계열사 데이터를 분석해 전략을 갱신했습니다.");
    }, 850);
  }

  function approveStrategy() {
    setApproved(true);
    notify("전략 ST-2026-0713-04가 승인되었습니다.");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">H</div>
          <div><strong>H·GROUP</strong><span>AI INVENTORY</span></div>
        </div>

        <p className="nav-label">COMMAND CENTER</p>
        <nav aria-label="주요 메뉴">
          {navItems.map(([icon, label], index) => (
            <button className={`nav-item ${index === 0 ? "active" : ""}`} key={label} onClick={() => notify(`${label} 화면은 PoC 확장 영역입니다.`)}>
              <span>{icon}</span>{label}{label === "AI 전략" && <em>3</em>}
            </button>
          ))}
        </nav>

        <div className="sidebar-divider" />
        <p className="nav-label">DATA SOURCES</p>
        <div className="source-list">
          <div><i className="green" />현대그린푸드<span>연결됨</span></div>
          <div><i className="blue" />현대홈쇼핑<span>연결됨</span></div>
          <div><i className="gold" />현대리바트<span>연결됨</span></div>
        </div>

        <div className="side-status">
          <div className="status-orbit"><span>AI</span></div>
          <div><b>의사결정 엔진</b><small><i /> 정상 작동 중</small></div>
        </div>

        <div className="profile">
          <div className="avatar">김</div>
          <div><b>김영만 관리자</b><small>그룹 상품기획팀</small></div>
          <button aria-label="프로필 메뉴">•••</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">EXECUTIVE COMMAND CENTER</p>
            <h1>재고 전략 관제실</h1>
            <p className="subtitle">그룹 재고의 위험을 먼저 읽고, 실행 가능한 소진 전략으로 전환합니다.</p>
          </div>
          <div className="header-actions">
            <button className="icon-button" aria-label="알림" onClick={() => notify("확인하지 않은 위험 알림이 4건 있습니다.")}>♢<span>4</span></button>
            <div className="updated"><span>최근 동기화</span><b>오늘 09:42</b></div>
            <button className="primary-button" onClick={generateStrategy} disabled={generating}>
              <span>✦</span>{generating ? "전략 분석 중…" : "AI 전략 생성"}
            </button>
          </div>
        </header>

        <div className="filterbar">
          <div className="filter-summary"><span className="live-dot" />3개 계열사 데이터 통합 중 <b>·</b> 총 8,240개 SKU</div>
          <div className="filters">
            <label><span>계열사</span><select value={company} onChange={(e) => setCompany(e.target.value)}><option>전체 계열사</option><option>현대그린푸드</option><option>현대홈쇼핑</option><option>현대리바트</option></select></label>
            <label><span>기준일</span><input type="date" defaultValue="2026-07-13" /></label>
            <button className="refresh" onClick={() => notify("최신 Mock 데이터로 동기화했습니다.")} aria-label="새로고침">↻</button>
          </div>
        </div>

        <section className="kpi-grid" aria-label="핵심 지표">
          <article className="kpi-card critical">
            <div className="kpi-head"><span>위험 재고 금액</span><i>전월 대비</i></div>
            <div className="kpi-value"><b>₩2.84</b><em>억원</em></div>
            <div className="kpi-foot"><strong>▲ 12.4%</strong><span>주의가 필요한 증가세</span></div>
            <div className="mini-bars">{[36,54,45,62,58,76,68,86,79,96].map((h, i) => <i key={i} style={{height:`${h}%`}} />)}</div>
          </article>
          <article className="kpi-card">
            <div className="kpi-head"><span>고위험 SKU</span><i>Risk ≥ 80</i></div>
            <div className="kpi-value"><b>128</b><em>개</em></div>
            <div className="kpi-foot"><strong className="down">▼ 8개</strong><span>지난주 대비 감소</span></div>
            <div className="ring"><span>68<small>%</small></span></div>
          </article>
          <article className="kpi-card">
            <div className="kpi-head"><span>예상 평균 소진 기간</span><i>현재 판매 속도</i></div>
            <div className="kpi-value"><b>54</b><em>일</em></div>
            <div className="kpi-foot"><strong className="neutral">목표 35일</strong><span>19일 단축 필요</span></div>
            <div className="days-track"><i style={{width:"64%"}} /><b>54</b><span>90일</span></div>
          </article>
          <article className="kpi-card savings">
            <div className="kpi-head"><span>전략 적용 예상 절감</span><i>AI 추정</i></div>
            <div className="kpi-value"><b>₩1.82</b><em>억원</em></div>
            <div className="kpi-foot"><strong className="down">+ 24.1%</strong><span>손실 비용 절감</span></div>
            <div className="sparkline"><i /><i /><i /><i /><i /><i /><i /></div>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel risk-panel">
            <div className="panel-head">
              <div><p className="eyebrow">RISK PRIORITY</p><h2>소진 우선 재고</h2></div>
              <button onClick={() => notify("전체 128개 고위험 SKU 목록을 준비했습니다.")}>전체 보기 <span>→</span></button>
            </div>
            <div className="table-head"><span>상품 / 계열사</span><span>재고</span><span>보관일</span><span>판매 추이</span><span>위험도</span></div>
            <div className="inventory-list">
              {filtered.map((item, index) => (
                <button className={`inventory-row ${selectedSku === item.sku ? "selected" : ""}`} onClick={() => {setSelectedSku(item.sku); setApproved(false);}} key={item.sku}>
                  <span className="product-cell"><i className={`company-badge ${item.accent}`}>{item.companyCode}</i><span><b>{item.product}</b><small>{item.company} · {item.sku}</small></span></span>
                  <span><b>{item.stock.toLocaleString()}</b><small>개</small></span>
                  <span><b>{item.days}</b><small>일</small></span>
                  <span className="sales-down">{item.sales}</span>
                  <span className="risk-score"><b>{item.risk}</b><i><em style={{width:`${item.risk}%`}} /></i><small>{item.riskLabel}</small></span>
                  <span className="row-index">0{index + 1}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="panel forecast-panel">
            <div className="panel-head">
              <div><p className="eyebrow">DEMAND FORECAST · 8 WEEKS</p><h2>판매 수요 예측</h2></div>
              <span className="confidence">예측 신뢰도 <b>87%</b></span>
            </div>
            <div className="forecast-meta"><b>{selected.product}</b><span>현재 추세 유지 시 잔여 <strong>1,124개</strong></span></div>
            <div className="chart" aria-label="8주 수요 예측 차트">
              <div className="chart-y"><span>240</span><span>160</span><span>80</span><span>0</span></div>
              <div className="chart-area">
                {[55,62,58,49,43,35,31,28].map((value, i) => <div className="chart-col" key={i}><span className="forecast-range" style={{height:`${value + 25}%`, bottom:"8%"}} /><i style={{height:`${value}%`}} /><em>{i + 1}주</em></div>)}
                <div className="target-line"><span>재고 안전선</span></div>
              </div>
            </div>
            <div className="chart-legend"><span><i className="actual" />실제 판매</span><span><i className="predicted" />AI 예측</span><span><i className="range" />예측 범위</span></div>
          </article>

          <article className="panel strategy-panel">
            <div className="strategy-ribbon"><span>✦</span><b>AI RECOMMENDED</b><em>전략 ID · ST-2026-0713-04</em></div>
            <div className="panel-head strategy-title">
              <div><p className="eyebrow">CROSS-COMPANY BUNDLE</p><h2>웰니스 홈케어 패키지</h2></div>
              <span className="fit-score">적합도 <b>92</b></span>
            </div>
            <p className="strategy-copy">건강식 구매 고객의 홈케어 관심도와 세 상품의 물류 호환성을 근거로 구성했습니다.</p>
            <div className="bundle-products">
              <div><i className="company-badge green">GF</i><span><b>그리팅 밸런스 건강식</b><small>필수 소진 상품 · 위험도 94</small></span></div>
              <b className="plus">＋</b>
              <div><i className="company-badge blue">HS</i><span><b>프리미엄 온열 마사지기</b><small>동반 상품 · 위험도 89</small></span></div>
              <b className="plus">＋</b>
              <div><i className="company-badge gold">LV</i><span><b>테라 사계절 쿠션</b><small>동반 상품 · 위험도 84</small></span></div>
            </div>
            <div className="strategy-reasons">
              <span>✓ 타겟 고객 중첩 <b>86%</b></span><span>✓ 소비 상황 연관성 <b>홈 웰니스</b></span><span>✓ 물류 호환 <b>양호</b></span>
            </div>
            <div className="controls-row">
              <label><span>제안 할인율 <b>{discount}%</b></span><input aria-label="할인율" type="range" min="10" max="30" value={discount} onChange={(e) => {setDiscount(Number(e.target.value)); setApproved(false);}} /></label>
              <label><span>판매 기간</span><select value={period} onChange={(e) => {setPeriod(Number(e.target.value)); setApproved(false);}}><option value="7">7일</option><option value="14">14일</option><option value="21">21일</option><option value="28">28일</option></select></label>
            </div>
            <div className="strategy-actions">
              <button className="secondary-button" onClick={() => notify("선택한 조건으로 시뮬레이션을 다시 계산했습니다.")}>효과 다시 계산</button>
              <button className={`approve-button ${approved ? "approved" : ""}`} onClick={approveStrategy}>{approved ? "✓ 승인 완료" : "전략 승인"}</button>
            </div>
          </article>

          <article className="panel simulation-panel">
            <div className="panel-head">
              <div><p className="eyebrow">BEFORE / AFTER SIMULATION</p><h2>전략 효과 시뮬레이션</h2></div>
              <span className="simulation-tag">Mock AI · v1.4</span>
            </div>
            <div className="sim-highlight">
              <div><span>예상 재고 소진 기간</span><p><del>54일</del><b>{projectedDays}일</b></p><small><i /> {54 - projectedDays}일 단축</small></div>
              <div><span>예상 손실 절감액</span><p><b>₩{saving.toLocaleString()}<em>백만</em></b></p><small><i /> 적용 전 대비 +{Math.round(saving / 8)}%</small></div>
              <div><span>예상 판매 소진율</span><p><b>{Math.round(sellThrough)}<em>%</em></b></p><small><i /> 목표 대비 +{Math.round(sellThrough - 68)}%p</small></div>
            </div>
            <div className="comparison-bars">
              <div><span>전략 적용 전</span><i><em style={{width:"68%"}} /></i><b>68%</b></div>
              <div className="after"><span>전략 적용 후</span><i><em style={{width:`${sellThrough}%`}} /></i><b>{Math.round(sellThrough)}%</b></div>
            </div>
            <p className="sim-note">과거 24개월 판매 데이터와 계절성, 할인 탄력도를 반영한 추정치입니다. 실제 성과와 차이가 발생할 수 있습니다.</p>
          </article>

          <article className="panel log-panel">
            <div className="panel-head">
              <div><p className="eyebrow">AI TRACEABILITY</p><h2>MCP 실행 근거</h2></div>
              <span className="live-badge"><i /> LIVE</span>
            </div>
            <div className="log-list">
              <div><time>09:42:18</time><i className="green">GF</i><p><b>inventory.get_expiring</b><span>판매 기한 30일 이내 · 184건</span></p><em>238ms</em></div>
              <div><time>09:42:19</time><i className="blue">HS</i><p><b>sales.get_velocity</b><span>최근 12주 판매 속도 조회</span></p><em>184ms</em></div>
              <div><time>09:42:20</time><i className="gold">LV</i><p><b>logistics.check_compatibility</b><span>배송 방식 · 리드타임 검증</span></p><em>312ms</em></div>
              <div className="ai-log"><time>09:42:21</time><i>AI</i><p><b>strategy.simulate_bundle</b><span>12개 후보군 · 48개 조합 분석</span></p><em>1.8s</em></div>
            </div>
            <button className="log-button" onClick={() => notify("실행 로그 상세 화면은 다음 단계에서 연결할 수 있습니다.")}>전체 실행 로그 보기 <span>↗</span></button>
          </article>
        </section>

        <footer><span>AI 산출 결과는 의사결정 참고용이며, 관리자의 검토와 승인 후 적용됩니다.</span><b>HYUNDAI DEPARTMENT STORE GROUP · POC 2026</b></footer>
      </section>

      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
