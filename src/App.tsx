import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type TabName = "운영 요약" | "위험 예측" | "지점 재고" | "AI 전략" | "승인 관리" | "MCP 로그";
type Strategy = "transfer" | "exposure" | "discount" | "return";
type ApprovalStatus = "대기" | "승인" | "반려";
type CollaborationTool = "slack" | "teams";
type RiskStatus = "위험" | "주의" | "관찰";

type TourStep = {
  target: string;
  eyebrow: string;
  title: string;
  description: string;
};

type Product = {
  sku: string;
  name: string;
  category: string;
  branch: string;
  contract: "직매입" | "특약매입";
  stock: number;
  weeks: number;
  salesDelta: number;
  risk: number;
  transition: number;
  status: RiskStatus;
  event: string;
};

type Approval = {
  id: string;
  product: string;
  action: string;
  route: string;
  margin: string;
  requester: string;
  requestedAt: string;
  status: ApprovalStatus;
};

type McpLog = {
  id: string;
  time: string;
  source: string;
  tool: string;
  description: string;
  duration: string;
  status: "성공" | "검증";
  request: string;
  response: string;
};

const products: Product[] = [
  { sku: "TR-FS-24071", name: "프리미엄 레인부츠", category: "패션", branch: "무역센터점", contract: "특약매입", stock: 428, weeks: 7, salesDelta: -42, risk: 91, transition: 78, status: "위험", event: "장마 종료 예상 D-18" },
  { sku: "PN-FD-10428", name: "애플망고 선물세트", category: "식품", branch: "판교점", contract: "직매입", stock: 186, weeks: 3, salesDelta: -31, risk: 88, transition: 71, status: "위험", event: "판매기한 D-12" },
  { sku: "MC-EL-33082", name: "프리미엄 에어서큘레이터", category: "가전", branch: "더현대 서울", contract: "직매입", stock: 214, weeks: 9, salesDelta: -18, risk: 76, transition: 54, status: "주의", event: "폭염 수요 둔화" },
  { sku: "US-LV-88210", name: "오크 사이드 테이블", category: "가구", branch: "울산점", contract: "특약매입", stock: 91, weeks: 14, salesDelta: -23, risk: 69, transition: 42, status: "주의", event: "보관 100일 초과" },
  { sku: "HD-BT-55219", name: "비건 선케어 듀오", category: "뷰티", branch: "본점", contract: "특약매입", stock: 312, weeks: 6, salesDelta: -9, risk: 57, transition: 31, status: "관찰", event: "시즌 종료 D-39" },
];

const navItems: [string, TabName][] = [
  ["⌂", "운영 요약"],
  ["◇", "위험 예측"],
  ["⇄", "지점 재고"],
  ["✦", "AI 전략"],
  ["▤", "승인 관리"],
  ["↗", "MCP 로그"],
];

const tabRoutes: Record<TabName, string> = {
  "운영 요약": "/",
  "위험 예측": "/risk",
  "지점 재고": "/inventory",
  "AI 전략": "/strategy",
  "승인 관리": "/approvals",
  "MCP 로그": "/logs",
};

const routeTabs = Object.fromEntries(
  Object.entries(tabRoutes).map(([tab, route]) => [route, tab]),
) as Record<string, TabName>;

const branches = ["전체 지점", "본점", "더현대 서울", "무역센터점", "판교점", "부산점", "울산점"];
const riskStatusOptions: RiskStatus[] = ["위험", "주의", "관찰"];
const inventoryCategories = [
  { name: "패션", code: "FS", skuCount: "7,842", stock: "18.4만", risk: 12, balance: 68, description: "의류 · 잡화 · 시즌 상품" },
  { name: "식품", code: "FD", skuCount: "4,126", stock: "7.2만", risk: 8, balance: 81, description: "신선 · 가공 · 선물세트" },
  { name: "가전", code: "EL", skuCount: "3,918", stock: "5.4만", risk: 5, balance: 76, description: "생활 · 계절 · 디지털" },
  { name: "가구", code: "LV", skuCount: "2,746", stock: "3.1만", risk: 4, balance: 73, description: "리빙 · 가구 · 홈데코" },
  { name: "뷰티", code: "BT", skuCount: "6,050", stock: "9.6만", risk: 5, balance: 88, description: "화장품 · 향수 · 케어" },
];
const strategyMeta: Record<Strategy, { name: string; summary: string }> = {
  transfer: { name: "부산점 재고 이동", summary: "수요가 유지되는 부산점으로 재고를 이동해 정상가 판매 기회를 확보합니다." },
  exposure: { name: "메인 노출 강화", summary: "정상가를 유지하면서 시즌존 노출을 확대해 브랜드와 마진을 함께 보호합니다." },
  discount: { name: "점내 한정 할인", summary: "무역센터점 한정 할인을 통해 재고 소진 속도를 우선적으로 높입니다." },
  return: { name: "입점사 반품 협의", summary: "특약매입 계약 조건을 기반으로 잔여 재고의 반품 가능성을 협의합니다." },
};
const collaborationContacts: Record<string, { name: string; title: string; department: string; phone: string; initials: string; status: string }> = {
  "#재고-전략-협업": { name: "이주영", title: "책임 매니저", department: "상품기획팀 · 재고전략파트", phone: "02-3467-8124", initials: "이", status: "지금 연락 가능" },
  "#상품기획-의사결정": { name: "김영만", title: "수석 매니저", department: "영업전략실 · 의사결정지원팀", phone: "02-3467-8041", initials: "김", status: "회의 중 · 11:30 복귀" },
  "#부산점-운영": { name: "박서현", title: "영업 매니저", department: "부산점 · 영업지원팀", phone: "051-667-0128", initials: "박", status: "지금 연락 가능" },
  "상품기획팀 · 재고 전략": { name: "이주영", title: "책임 매니저", department: "상품기획팀 · 재고전략파트", phone: "02-3467-8124", initials: "이", status: "Teams 접속 중" },
  "영업전략실 · 의사결정": { name: "김영만", title: "수석 매니저", department: "영업전략실 · 의사결정지원팀", phone: "02-3467-8041", initials: "김", status: "회의 중 · 11:30 복귀" },
  "부산점 · 운영 채널": { name: "박서현", title: "영업 매니저", department: "부산점 · 영업지원팀", phone: "051-667-0128", initials: "박", status: "Teams 접속 중" },
};

const tourSteps: TourStep[] = [
  {
    target: "[data-tour='navigation']",
    eyebrow: "01 · CONTROL MAP",
    title: "의사결정 흐름을 한눈에",
    description: "예측부터 재고 이동, 전략 승인, 실행 로그까지 모든 업무가 이 메뉴 안에서 연결됩니다.",
  },
  {
    target: "[data-tour='kpis']",
    eyebrow: "02 · MORNING BRIEF",
    title: "오늘의 위험부터 확인하세요",
    description: "전환 예상액과 경보 SKU, 예방 가능 손실을 요약해 우선 대응할 규모를 바로 보여줍니다.",
  },
  {
    target: "[data-tour='risk-table']",
    eyebrow: "03 · EARLY WARNING",
    title: "악성재고가 되기 전에 감지",
    description: "상품을 선택하면 판매 둔화, 계절성, 재고 과잉을 결합한 전환 확률과 근거가 함께 갱신됩니다.",
  },
  {
    target: "[data-tour='store-map']",
    eyebrow: "04 · STORE NETWORK",
    title: "지점 간 수요 차이를 기회로",
    description: "과잉 재고를 수요가 남은 지점과 연결해 할인보다 마진이 높은 이동안을 찾습니다.",
  },
  {
    target: "[data-tour='analyze']",
    eyebrow: "05 · AI ACTION",
    title: "최적 전략을 실행해보세요",
    description: "AI가 이동·노출·할인·반품안을 같은 비용 기준으로 비교합니다. 언제든 ‘가이드’로 다시 볼 수 있어요.",
  },
];

const pageMeta: Record<TabName, { eyebrow: string; title: string; subtitle: string }> = {
  "운영 요약": { eyebrow: "HYUNDAI DEPARTMENT STORE · INVENTORY CONTROL", title: "악성재고 예방 관제실", subtitle: "악성재고가 되기 전에 감지하고, 실질 마진이 가장 높은 대응을 찾습니다." },
  "위험 예측": { eyebrow: "EARLY WARNING · PREDICTIVE RISK", title: "악성재고 전환 예측", subtitle: "판매·재고·시즌·외부 신호를 결합해 위험 전환 시점과 원인을 확인합니다." },
  "지점 재고": { eyebrow: "STORE NETWORK · INVENTORY BALANCE", title: "지점 재고 재배치", subtitle: "과잉 지점과 수요 초과 지점을 연결하고 이동 비용까지 검증합니다." },
  "AI 전략": { eyebrow: "AI MARGIN OPTIMIZER · ACTION LAB", title: "재고 처리 전략 연구소", subtitle: "처리안을 비교하고 조건을 조정한 뒤 담당자 협업 채널로 판단 근거를 공유합니다." },
  "승인 관리": { eyebrow: "HUMAN IN THE LOOP · GOVERNANCE", title: "전략 승인 관리", subtitle: "AI 제안의 계약 권한, 가격 정책, 예상 효과를 확인하고 승인하거나 반려합니다." },
  "MCP 로그": { eyebrow: "TRACEABILITY · TOOL EXECUTION", title: "AI 판단 근거 로그", subtitle: "AI가 어떤 지점 데이터와 비용 정책을 사용했는지 실행 단계별로 추적합니다." },
};

const initialApprovals: Approval[] = [
  { id: "DC-0723-011", product: "프리미엄 레인부츠", action: "부산점 재고 이동", route: "무역센터점 → 부산점 · 180개", margin: "₩19.8M", requester: "최우진", requestedAt: "10:24", status: "대기" },
  { id: "DC-0723-009", product: "애플망고 선물세트", action: "식품관 타임세일", route: "판교점 · 15% · 3일", margin: "₩8.4M", requester: "김영만", requestedAt: "09:48", status: "대기" },
  { id: "DC-0722-031", product: "프리미엄 에어서큘레이터", action: "메인 노출 강화", route: "더현대 서울 · 1층 · 7일", margin: "₩12.6M", requester: "이주영", requestedAt: "어제", status: "대기" },
  { id: "DC-0722-028", product: "오크 사이드 테이블", action: "입점사 반품 협의", route: "울산점 · 잔여 91개", margin: "₩3.1M", requester: "김준하", requestedAt: "어제", status: "대기" },
];

const mcpLogs: McpLog[] = [
  { id: "LOG-8421", time: "10:24:21", source: "AI", tool: "margin.optimize_actions", description: "4개 처리안 실질 마진 비교", duration: "1.4s", status: "성공", request: '{ "sku": "TR-FS-24071", "actions": 4, "horizon_days": 21 }', response: '{ "best": "store_transfer", "net_margin": 19.8, "confidence": 0.93 }' },
  { id: "LOG-8420", time: "10:24:20", source: "물류", tool: "logistics.estimate_transfer", description: "이동·포장·인건비 산출", duration: "203ms", status: "성공", request: '{ "from": "무역센터점", "to": "부산점", "qty": 180 }', response: '{ "transport": 3.4, "handling": 1.2, "insurance": 1.0, "total": 5.6 }' },
  { id: "LOG-8419", time: "10:24:19", source: "부산점", tool: "demand.forecast_by_store", description: "부산점 21일 예상 수요 분석", duration: "264ms", status: "성공", request: '{ "store": "부산점", "sku": "TR-FS-24071", "days": 21 }', response: '{ "demand": 312, "weekly_velocity": 56, "confidence": 0.89 }' },
  { id: "LOG-8418", time: "10:24:18", source: "무역센터점", tool: "inventory.get_store_stock", description: "현재고·판매속도·계약 조회", duration: "182ms", status: "성공", request: '{ "store": "무역센터점", "sku": "TR-FS-24071" }', response: '{ "stock": 428, "weekly_velocity": 21, "contract": "특약매입" }' },
  { id: "LOG-8417", time: "10:24:17", source: "정책", tool: "policy.validate_contract", description: "특약매입 이동·가격 권한 검증", duration: "97ms", status: "검증", request: '{ "sku": "TR-FS-24071", "action": "store_transfer" }', response: '{ "allowed": true, "requires_vendor_notice": true }' },
];

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = routeTabs[location.pathname] ?? "운영 요약";
  const [selectedSku, setSelectedSku] = useState(products[0].sku);
  const [branch, setBranch] = useState("전체 지점");
  const [category, setCategory] = useState("전체 카테고리");
  const [strategy, setStrategy] = useState<Strategy>("transfer");
  const [discount, setDiscount] = useState(12);
  const [quantity, setQuantity] = useState(180);
  const [period, setPeriod] = useState(10);
  const [riskStatuses, setRiskStatuses] = useState<RiskStatus[]>(riskStatusOptions);
  const [destination, setDestination] = useState("부산점");
  const [transferQty, setTransferQty] = useState(180);
  const [inventoryCategory, setInventoryCategory] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<"전체" | ApprovalStatus>("전체");
  const [approvals, setApprovals] = useState(initialApprovals);
  const [selectedApproval, setSelectedApproval] = useState(initialApprovals[0].id);
  const [logFilter, setLogFilter] = useState("전체");
  const [selectedLog, setSelectedLog] = useState(mcpLogs[0].id);
  const [collaborationTool, setCollaborationTool] = useState<CollaborationTool>("slack");
  const [collaborationTarget, setCollaborationTarget] = useState("#재고-전략-협업");
  const [shared, setShared] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportGeneratedAt, setReportGeneratedAt] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [toast, setToast] = useState("");
  const [tourStep, setTourStep] = useState<number | null>(location.pathname === "/" ? 0 : null);

  const selected = products.find((product) => product.sku === selectedSku) ?? products[0];
  const filtered = products.filter((product) =>
    (branch === "전체 지점" || product.branch === branch) &&
    (category === "전체 카테고리" || product.category === category)
  );
  const riskFiltered = filtered.filter((product) => riskStatuses.includes(product.status));
  const currentApproval = approvals.find((item) => item.id === selectedApproval) ?? approvals[0];
  const currentLog = mcpLogs.find((item) => item.id === selectedLog) ?? mcpLogs[0];
  const collaborationContact = collaborationContacts[collaborationTarget];
  const visibleApprovals = approvalFilter === "전체" ? approvals : approvals.filter((item) => item.status === approvalFilter);
  const visibleLogs = logFilter === "전체" ? mcpLogs : mcpLogs.filter((item) => item.source === logFilter);

  const simulation = useMemo(() => {
    const strategyFactor = { transfer: 1.18, exposure: 1.08, discount: 1.02, return: 0.74 }[strategy];
    const sold = Math.min(selected.stock, Math.round((quantity * strategyFactor) + discount * 2.2 + period * 1.6));
    const revenue = Math.round(sold * 0.168);
    const discountCost = Math.round(revenue * (discount / 100));
    const operationCost = strategy === "transfer" ? Math.round(quantity * 0.012) + 3.4 : strategy === "exposure" ? 5.8 : strategy === "discount" ? 2.1 : 1.4;
    const grossMargin = Math.max(0, Math.round((revenue * 0.42 - discountCost - operationCost) * 10) / 10);
    const preventedLoss = Math.round((sold * 0.061 + (selected.transition / 12)) * 10) / 10;
    return { sold, revenue, discountCost, operationCost, grossMargin, preventedLoss };
  }, [strategy, quantity, discount, period, selected]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function runAnalysis() {
    setAnalyzing(true);
    setShared(false);
    window.setTimeout(() => {
      setAnalyzing(false);
      notify(activeTab === "위험 예측" ? "최신 판매·시즌 신호로 위험 확률을 갱신했습니다." : "전 지점 수요와 비용을 반영해 최적 전략을 갱신했습니다.");
    }, 900);
  }

  function selectProduct(sku: string, goTo?: TabName) {
    setSelectedSku(sku);
    setStrategy("transfer");
    setShared(false);
    if (goTo) navigate(tabRoutes[goTo]);
  }

  function openTab(tab: TabName) {
    if (tab === "지점 재고") setInventoryCategory(null);
    navigate(tabRoutes[tab]);
  }

  function openInventoryCategory(categoryName: string) {
    const firstProduct = products.find((product) => product.category === categoryName);
    if (firstProduct) selectProduct(firstProduct.sku);
    setInventoryCategory(categoryName);
  }

  function startTour() {
    navigate("/");
    setTourStep(0);
  }

  function toggleRiskStatus(status: RiskStatus) {
    setRiskStatuses((current) => {
      if (current.includes(status)) {
        return current.length === 1 ? current : current.filter((item) => item !== status);
      }
      return riskStatusOptions.filter((item) => current.includes(item) || item === status);
    });
  }

  function updateApproval(id: string, status: ApprovalStatus) {
    setApprovals((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    notify(status === "승인" ? `${id} 전략을 승인했습니다.` : `${id} 전략을 반려했습니다.`);
  }

  function selectCollaborationTool(tool: CollaborationTool) {
    setCollaborationTool(tool);
    setCollaborationTarget(tool === "slack" ? "#재고-전략-협업" : "상품기획팀 · 재고 전략");
    setShared(false);
  }

  function shareStrategy() {
    const service = collaborationTool === "slack" ? "Slack" : "Teams";
    setShared(true);
    notify(`${service} ${collaborationTarget}에 전략 비교와 AI 판단 근거를 공유했습니다.`);
  }

  function generateStrategyReport() {
    setReportGeneratedAt(new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date()));
    setReportOpen(true);
  }

  function downloadStrategyReport() {
    const totalCost = simulation.discountCost + simulation.operationCost;
    const reportHtml = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${selected.name} AI 전략 레포트</title>
<style>
body{margin:0;padding:48px;color:#292622;background:#f4f0e8;font-family:Arial,"Noto Sans KR",sans-serif}
main{max-width:860px;margin:auto;background:#fff;padding:48px;border-top:8px solid #771b2c}
h1{margin:8px 0;font-family:Georgia,serif}h2{margin-top:34px;padding-bottom:9px;border-bottom:1px solid #ddd5ca}
.eyebrow{color:#771b2c;font-size:11px;font-weight:800;letter-spacing:.15em}.meta{color:#777;font-size:12px}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.metrics div{padding:16px;background:#f4f0e8}
.metrics span,.contact span{display:block;color:#777;font-size:11px}.metrics b{display:block;margin-top:8px;font:700 24px Georgia,serif}
.recommend{padding:22px;background:#342c2b;color:#fff}.recommend small{color:#c7beb5}.recommend b{display:block;margin:7px 0;font-size:22px}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:11px;border-bottom:1px solid #e5dfd6;text-align:right}th:first-child,td:first-child{text-align:left}
.contact{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:18px;background:#f4f0e8}.contact b{display:block;margin-top:5px}
footer{margin-top:38px;color:#888;font-size:10px;line-height:1.6}@media print{body{padding:0;background:#fff}main{box-shadow:none}}
</style></head><body><main>
<div class="eyebrow">HYUNDAI DEPARTMENT STORE · AI STRATEGY REPORT</div>
<h1>${selected.name} 재고 처리 전략</h1><p class="meta">보고서 ID MG-2026-0723-11 · ${reportGeneratedAt}</p>
<h2>Executive Summary</h2>
<div class="recommend"><small>AI 권고 전략 · 신뢰도 93%</small><b>${strategyMeta[strategy].name}</b><span>${strategyMeta[strategy].summary}</span></div>
<h2>예상 효과</h2><div class="metrics">
<div><span>예상 소진</span><b>${simulation.sold}개</b></div><div><span>예상 매출</span><b>₩${simulation.revenue}M</b></div>
<div><span>할인·운영비</span><b>-₩${totalCost.toFixed(1)}M</b></div><div><span>실질 마진</span><b>₩${simulation.grossMargin.toFixed(1)}M</b></div>
</div>
<h2>전략 비교</h2><table><thead><tr><th>전략</th><th>예상 효과</th><th>비용</th><th>실질 마진</th></tr></thead><tbody>
<tr><td>부산점 재고 이동</td><td>312개</td><td>₩5.6M</td><td>₩19.8M</td></tr>
<tr><td>메인 노출 강화</td><td>226개</td><td>₩5.8M</td><td>₩14.2M</td></tr>
<tr><td>점내 한정 할인</td><td>284개</td><td>₩8.2M</td><td>₩11.7M</td></tr>
<tr><td>입점사 반품 협의</td><td>${selected.stock}개</td><td>₩3.1M</td><td>₩4.8M</td></tr>
</tbody></table>
<h2>판단 근거</h2><ul><li>계절 종료 영향 92%</li><li>최근 판매속도 ${selected.salesDelta}%</li><li>현재 재고 ${selected.stock}개 · ${selected.weeks}주 커버</li><li>부산점 수요 편차 +64%</li></ul>
<h2>협업 담당자</h2><div class="contact"><div><span>담당자</span><b>${collaborationContact.name} ${collaborationContact.title}</b></div><div><span>소속 / 연락처</span><b>${collaborationContact.department} · ${collaborationContact.phone}</b></div></div>
<footer>본 레포트는 AI가 판매·재고·시즌·비용 정책 데이터를 기반으로 생성한 의사결정 참고 자료입니다. 실제 실행 전 계약 권한과 가격 정책을 확인해야 합니다.</footer>
</main></body></html>`;
    const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `AI-전략-레포트-${selected.sku}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("AI 전략 레포트 다운로드를 시작했습니다.");
  }

  const strategyCards = (
    <>
      <div className="comparison-legend" aria-hidden="true">
        <span>처리 전략</span><span>예상 효과</span><span>비용</span><span>실질 마진</span>
      </div>
      <div className="strategy-options">
        <button aria-pressed={strategy === "transfer"} className={strategy === "transfer" ? "selected" : ""} onClick={() => { setStrategy("transfer"); setShared(false); }}>
          <span className="option-top"><i>01</i><b>부산점 재고 이동</b><em className="best">AI 최적안</em></span>
          <span className="option-route">무역센터점 <strong>{quantity}개</strong> → 부산점</span>
          <span className="option-metrics"><i><small>예상 판매</small><b>312개</b></i><i><small>처리 비용</small><b>₩5.6M</b></i><i><small>실질 마진</small><b className="positive">₩19.8M</b></i></span>
        </button>
        <button aria-pressed={strategy === "exposure"} className={strategy === "exposure" ? "selected" : ""} onClick={() => { setStrategy("exposure"); setShared(false); }}>
          <span className="option-top"><i>02</i><b>메인 노출 강화</b><em>브랜드 보호</em></span>
          <span className="option-route">정상가 유지 · 1층 시즌존 {period}일</span>
          <span className="option-metrics"><i><small>예상 판매</small><b>226개</b></i><i><small>처리 비용</small><b>₩5.8M</b></i><i><small>실질 마진</small><b>₩14.2M</b></i></span>
        </button>
        <button aria-pressed={strategy === "discount"} className={strategy === "discount" ? "selected" : ""} onClick={() => { setStrategy("discount"); setShared(false); }}>
          <span className="option-top"><i>03</i><b>점내 한정 할인</b><em>소진 우선</em></span>
          <span className="option-route">무역센터점 한정 · {discount}% 할인</span>
          <span className="option-metrics"><i><small>예상 판매</small><b>284개</b></i><i><small>할인 손실</small><b>₩8.2M</b></i><i><small>실질 마진</small><b>₩11.7M</b></i></span>
        </button>
        <button aria-pressed={strategy === "return"} className={strategy === "return" ? "selected" : ""} onClick={() => { setStrategy("return"); setShared(false); }}>
          <span className="option-top"><i>04</i><b>입점사 반품 협의</b><em>특약매입</em></span>
          <span className="option-route">잔여 {selected.stock}개 반품 · 수수료 반영</span>
          <span className="option-metrics"><i><small>회수 가능</small><b>{selected.stock}개</b></i><i><small>정산 비용</small><b>₩3.1M</b></i><i><small>기회 마진</small><b>₩4.8M</b></i></span>
        </button>
      </div>
    </>
  );

  const simulator = (
    <>
      <div className="sim-controls">
        <label><span>할인율 <b>{discount}%</b></span><input aria-label="할인율" type="range" min="0" max="30" value={discount} onChange={(event) => { setDiscount(Number(event.target.value)); setShared(false); }} /></label>
        <label><span>처리 수량 <b>{quantity}개</b></span><input aria-label="처리 수량" type="range" min="60" max={selected.stock} step="10" value={Math.min(quantity, selected.stock)} onChange={(event) => { setQuantity(Number(event.target.value)); setShared(false); }} /></label>
        <label><span>운영 기간</span><select value={period} onChange={(event) => { setPeriod(Number(event.target.value)); setShared(false); }}><option value="7">7일</option><option value="10">10일</option><option value="14">14일</option><option value="21">21일</option></select></label>
      </div>
      <div className="margin-result">
        <div><span>예상 소진</span><b>{simulation.sold}<small>개</small></b></div>
        <div><span>예상 매출</span><b>₩{simulation.revenue}<small>M</small></b></div>
        <div><span>할인·운영비</span><b className="cost">-₩{(simulation.discountCost + simulation.operationCost).toFixed(1)}<small>M</small></b></div>
        <div className="primary-result"><span>예상 실질 마진</span><b>₩{simulation.grossMargin.toFixed(1)}<small>M</small></b></div>
      </div>
      <div className="prevented-loss"><span>방어 가능한 재고 손실</span><b>₩{simulation.preventedLoss.toFixed(1)}M</b><em>현재안 대비 +18.4%</em></div>
      <section className="collaboration-handoff" aria-label="담당자 협업 채널 선택">
        <div className="handoff-heading">
          <div><span>COLLABORATION HANDOFF</span><b>담당자에게 전략 공유</b></div>
          <small>전략 비교표 · 비용 시뮬레이션 · AI 판단 로그 포함</small>
        </div>
        <div className="collaboration-tools">
          <button className={collaborationTool === "slack" ? "selected" : ""} aria-pressed={collaborationTool === "slack"} onClick={() => selectCollaborationTool("slack")}>
            <span className="collab-logo slack-logo">#</span><span><b>Slack</b><small>채널로 공유</small></span><i>✓</i>
          </button>
          <button className={collaborationTool === "teams" ? "selected" : ""} aria-pressed={collaborationTool === "teams"} onClick={() => selectCollaborationTool("teams")}>
            <span className="collab-logo teams-logo">T</span><span><b>Teams</b><small>팀으로 공유</small></span><i>✓</i>
          </button>
        </div>
        <label className="collaboration-target">
          <span>공유 대상</span>
          <select value={collaborationTarget} onChange={(event) => { setCollaborationTarget(event.target.value); setShared(false); }}>
            {collaborationTool === "slack" ? (
              <><option>#재고-전략-협업</option><option>#상품기획-의사결정</option><option>#부산점-운영</option></>
            ) : (
              <><option>상품기획팀 · 재고 전략</option><option>영업전략실 · 의사결정</option><option>부산점 · 운영 채널</option></>
            )}
          </select>
        </label>
        {collaborationContact && (
          <article className="contact-card" aria-live="polite">
            <div className="contact-avatar"><span>{collaborationContact.initials}</span><i /></div>
            <div className="contact-identity">
              <span>담당자</span>
              <p><b>{collaborationContact.name}</b><em>{collaborationContact.title}</em></p>
              <small>{collaborationContact.department}</small>
            </div>
            <div className="contact-details">
              <span className="contact-availability"><i />{collaborationContact.status}</span>
              <a href={`tel:${collaborationContact.phone}`} aria-label={`${collaborationContact.name} 담당자 전화하기`}><small>내선 전화</small><b>{collaborationContact.phone}</b></a>
            </div>
          </article>
        )}
      </section>
      <div className="strategy-actions">
        <button className="secondary-button" onClick={() => notify("현재 조건으로 비용과 수요를 다시 계산했습니다.")}>효과 다시 계산</button>
        <button className={`share-strategy-button ${collaborationTool} ${shared ? "shared" : ""}`} onClick={shareStrategy}>
          {shared ? "✓ 담당자 공유 완료" : `${collaborationTool === "slack" ? "Slack" : "Teams"}으로 전략 공유`}
        </button>
      </div>
    </>
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">H</div><div><strong>THE HYUNDAI</strong><span>INVENTORY INTELLIGENCE</span></div></div>
        <p className="nav-label">DECISION CENTER</p>
        <nav aria-label="주요 메뉴" data-tour="navigation">
          {navItems.map(([icon, label]) => (
            <button className={`nav-item ${activeTab === label ? "active" : ""}`} key={label} onClick={() => openTab(label)}>
              <span>{icon}</span>{label}{label === "승인 관리" && <em>{approvals.filter((item) => item.status === "대기").length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <p className="nav-label">STORE NETWORK</p>
        <div className="source-list"><div><i className="green" />수도권 9개점<span>정상</span></div><div><i className="blue" />충청권 2개점<span>정상</span></div><div><i className="gold" />영남권 5개점<span>정상</span></div></div>
        <div className="side-status"><div className="status-orbit"><span>AI</span></div><div><b>마진 최적화 엔진</b><small><i /> 16개 지점 분석 중</small></div></div>
        <div className="profile"><div className="avatar">최</div><div><b>최우진 매니저</b><small>현대백화점 상품기획팀</small></div><button aria-label="프로필 메뉴">•••</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">{pageMeta[activeTab].eyebrow}</p><h1>{pageMeta[activeTab].title}</h1><p className="subtitle">{pageMeta[activeTab].subtitle}</p></div>
          <div className="header-actions">
            <button className="tour-trigger" onClick={startTour}><span>?</span> 가이드</button>
            <button className="icon-button" aria-label="알림" onClick={() => notify("새 위험 전환 알림 6건을 확인했습니다.")}>♢<span>6</span></button>
            <div className="updated"><span>마지막 데이터 동기화</span><b>오늘 10:24</b></div>
            {(activeTab === "운영 요약" || activeTab === "위험 예측" || activeTab === "AI 전략") && <button className="primary-button" data-tour={activeTab === "운영 요약" ? "analyze" : undefined} onClick={runAnalysis} disabled={analyzing}><span>✦</span>{analyzing ? "분석 중…" : activeTab === "위험 예측" ? "예측 다시 실행" : "최적 전략 분석"}</button>}
          </div>
        </header>

        {(activeTab === "운영 요약" || activeTab === "위험 예측" || activeTab === "지점 재고") && (
          <div className="filterbar">
            <div className="filter-summary"><span className="live-dot" />현대백화점 16개점 통합 재고 <b>·</b> 24,682 SKU <b>·</b> 직매입/특약매입 구분 적용</div>
            <div className="filters">
              <label><span>지점</span><select value={branch} onChange={(event) => setBranch(event.target.value)}>{branches.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>카테고리</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>전체 카테고리</option><option>패션</option><option>식품</option><option>가전</option><option>가구</option><option>뷰티</option></select></label>
              <label><span>기준일</span><input type="date" defaultValue="2026-07-23" /></label>
              <button className="refresh" onClick={() => notify("최신 Mock 재고 데이터로 동기화했습니다.")} aria-label="새로고침">↻</button>
            </div>
          </div>
        )}

        {activeTab === "운영 요약" && (
          <>
            <section className="kpi-grid" aria-label="핵심 운영 지표" data-tour="kpis">
              <article className="kpi-card critical"><div className="kpi-head"><span>악성재고 전환 예상액</span><i>향후 30일</i></div><div className="kpi-value"><b>₩3.12</b><em>억원</em></div><div className="kpi-foot"><strong>▲ 8.6%</strong><span>조기 대응이 필요한 증가세</span></div><div className="mini-bars">{[38,42,49,44,61,57,74,68,82,93].map((height,index)=><i key={index} style={{height:`${height}%`}} />)}</div></article>
              <article className="kpi-card"><div className="kpi-head"><span>사전 경보 SKU</span><i>전환확률 ≥ 50%</i></div><div className="kpi-value"><b>34</b><em>개</em></div><div className="kpi-foot"><strong className="down">12개 선제 대응</strong><span>오늘 신규 6개</span></div><div className="ring"><span>71<small>%</small></span></div></article>
              <article className="kpi-card"><div className="kpi-head"><span>지점 이동 후보</span><i>마진 개선 가능</i></div><div className="kpi-value"><b>18</b><em>건</em></div><div className="kpi-foot"><strong className="neutral">부산점 7건</strong><span>수요 초과 지점</span></div><div className="days-track"><i style={{width:"72%"}} /><b>72</b><span>100%</span></div></article>
              <article className="kpi-card savings"><div className="kpi-head"><span>예방 가능 손실</span><i>AI 추정</i></div><div className="kpi-value"><b>₩1.46</b><em>억원</em></div><div className="kpi-foot"><strong className="down">+ 21.8%</strong><span>이번 달 누적 효과</span></div><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /></div></article>
            </section>
            <section className="new-dashboard-grid">
              <article className="panel watch-panel" data-tour="risk-table">
                <div className="panel-head"><div><p className="eyebrow">EARLY WARNING · RISK TRANSITION</p><h2>악성재고 전환 예측</h2></div><button onClick={() => openTab("위험 예측")}>상세 예측 <span>→</span></button></div>
                <ProductTable items={filtered} selectedSku={selectedSku} onSelect={(sku) => selectProduct(sku)} />
              </article>
              <article className="panel signal-panel">
                <div className="panel-head"><div><p className="eyebrow">WHY NOW?</p><h2>위험 전환 근거</h2></div><span className="confidence">예측 신뢰도 <b>89%</b></span></div>
                <RiskSignals product={selected} />
              </article>
              <article className="panel branch-panel" data-tour="store-map">
                <div className="panel-head"><div><p className="eyebrow">STORE DEMAND MAP</p><h2>지점별 이동 타당성</h2></div><button onClick={() => openTab("지점 재고")}>재배치 설계 <span>→</span></button></div>
                <BranchList />
              </article>
              <article className="panel log-panel">
                <div className="panel-head"><div><p className="eyebrow">AI TRACEABILITY</p><h2>최근 MCP 실행</h2></div><span className="live-badge"><i /> LIVE</span></div>
                <CompactLogs logs={mcpLogs.slice(0, 4)} />
                <button className="log-button" onClick={() => openTab("MCP 로그")}>전체 판단 근거 보기 <span>↗</span></button>
              </article>
            </section>
          </>
        )}

        {activeTab === "위험 예측" && (
          <section className="tab-layout">
            <article className="panel tab-main">
              <div className="panel-head">
                <div><p className="eyebrow">RISK MODEL · 30 DAY HORIZON</p><h2>예측 대상 상품</h2></div>
                <div className="risk-status-filter">
                  <span>전환 상태</span>
                  <div className="risk-status-toggle" role="group" aria-label="전환 상태 필터">
                    {riskStatusOptions.map((status) => (
                      <button
                        key={status}
                        className={`${status} ${riskStatuses.includes(status) ? "active" : ""}`}
                        aria-pressed={riskStatuses.includes(status)}
                        onClick={() => toggleRiskStatus(status)}
                      >
                        <i />{status}<b>{filtered.filter((product) => product.status === status).length}</b>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <ProductTable items={riskFiltered} selectedSku={selectedSku} onSelect={(sku) => selectProduct(sku)} />
            </article>
            <aside className="tab-side">
              <article className="panel"><div className="panel-head"><div><p className="eyebrow">PREDICTION DETAIL</p><h2>전환 확률 상세</h2></div><span className={`risk-pill ${selected.status}`}>{selected.transition}% · {selected.status}</span></div><RiskSignals product={selected} /></article>
              <article className="panel prediction-timeline">
                <div className="panel-head"><div><p className="eyebrow">TRANSITION TIMELINE</p><h2>위험 전환 예상</h2></div></div>
                <div className="timeline-chart"><div><span>오늘</span><i className="safe" /><b>관찰</b></div><div><span>D+7</span><i className="warn" /><b>주의 61%</b></div><div><span>D+18</span><i className="danger" /><b>위험 78%</b></div><div><span>D+30</span><i className="dead" /><b>악성 전환</b></div></div>
                <button className="full-action" onClick={() => { openTab("AI 전략"); notify(`${selected.name} 전략 분석을 시작했습니다.`); }}>이 상품의 예방 전략 설계 →</button>
              </article>
            </aside>
          </section>
        )}

        {activeTab === "지점 재고" && inventoryCategory === null && (
          <section className="inventory-category-page">
            <div className="inventory-overview-head">
              <div><p className="eyebrow">CATEGORY INVENTORY · NETWORK OVERVIEW</p><h2>카테고리별 통합 재고</h2><span>카테고리를 선택하면 16개 지점의 수급 현황과 AI 추천 이동안을 확인할 수 있습니다.</span></div>
              <div className="inventory-overview-summary"><span>전체 SKU <b>24,682</b></span><span>위험 카테고리 <b>5</b></span><span>연결 지점 <b>16</b></span></div>
            </div>
            <div className="inventory-category-grid">
              {inventoryCategories.map((item, index) => (
                <button className={`inventory-category-card category-${index + 1}`} key={item.name} onClick={() => openInventoryCategory(item.name)}>
                  <span className="category-card-top"><i>{item.code}</i><span><b>{item.name}</b><small>{item.description}</small></span><em>{item.risk}개 위험</em></span>
                  <span className="category-card-metrics"><span><small>운영 SKU</small><b>{item.skuCount}</b></span><span><small>통합 재고</small><b>{item.stock}<em>개</em></b></span></span>
                  <span className="category-balance"><span><small>지점 재고 균형도</small><b>{item.balance}%</b></span><i><em style={{ width: `${item.balance}%` }} /></i></span>
                  <strong>지점별 수급 현황 보기 <span>→</span></strong>
                </button>
              ))}
            </div>
            <aside className="inventory-guide">
              <span>HOW TO READ</span>
              <p><b>01</b> 카테고리 선택</p><i>→</i><p><b>02</b> 상품별 지점 수급 확인</p><i>→</i><p><b>03</b> AI 추천 이동안 검증</p>
            </aside>
          </section>
        )}

        {activeTab === "지점 재고" && inventoryCategory !== null && (
          <>
            <div className="inventory-breadcrumb">
              <button onClick={() => setInventoryCategory(null)}>전체 카테고리</button><span>›</span><b>{inventoryCategory}</b><em>16개 지점 통합 수급 현황</em>
            </div>
          <section className="tab-layout inventory-tab">
            <article className="panel tab-main">
              <div className="panel-head"><div><p className="eyebrow">STORE INVENTORY MATRIX · {inventoryCategory.toUpperCase()}</p><h2>{selected.name} 지점별 수급 현황</h2></div><select className="product-select" value={selectedSku} onChange={(event) => selectProduct(event.target.value)}>{products.filter((product) => product.category === inventoryCategory).map((product) => <option value={product.sku} key={product.sku}>{product.name}</option>)}</select></div>
              <div className="store-cards">
                <StoreCard code="MC" name="무역센터점" stock={428} velocity={21} weeks={20.4} state="과잉" />
                <StoreCard code="BS" name="부산점" stock={38} velocity={56} weeks={0.7} state="부족" />
                <StoreCard code="PN" name="판교점" stock={62} velocity={31} weeks={2.0} state="적정" />
                <StoreCard code="US" name="울산점" stock={51} velocity={28} weeks={1.8} state="적정" />
                <StoreCard code="HD" name="본점" stock={73} velocity={24} weeks={3.0} state="적정" />
                <StoreCard code="SE" name="더현대 서울" stock={44} velocity={37} weeks={1.2} state="부족" />
              </div>
              <div className="transfer-flow">
                <div><span>출발 지점</span><b>무역센터점</b><small>가용 재고 368개</small></div><strong>→</strong><div><span>도착 지점</span><select value={destination} onChange={(event) => setDestination(event.target.value)}><option>부산점</option><option>더현대 서울</option><option>판교점</option><option>울산점</option></select><small>21일 예상 부족 274개</small></div><strong>×</strong><div><span>이동 수량</span><input type="number" min="10" max="368" value={transferQty} onChange={(event) => setTransferQty(Number(event.target.value))} /><small>권장 180개</small></div>
              </div>
            </article>
            <aside className="tab-side">
              <article className="panel transfer-summary">
                <div className="panel-head"><div><p className="eyebrow">TRANSFER VALIDATION</p><h2>이동 타당성 검증</h2></div><span className="confidence">추천도 <b>94%</b></span></div>
                <dl><div><dt>이동·포장 비용</dt><dd>₩{(3.4 + transferQty * 0.012).toFixed(1)}M</dd></div><div><dt>예상 추가 판매</dt><dd>{Math.round(transferQty * 0.86)}개</dd></div><div><dt>예상 실질 마진</dt><dd className="positive">₩{(transferQty * 0.11).toFixed(1)}M</dd></div><div><dt>재고 균형 개선</dt><dd>+{Math.min(96, Math.round(transferQty / 2))}%</dd></div></dl>
                <div className="approval-checks"><span>✓ 점간 이동 허용</span><span>✓ 도착점 보관 여유</span><span>✓ 입점사 통보 필요</span></div>
                <button className="full-action" onClick={() => notify(`무역센터점 → ${destination} ${transferQty}개 이동 요청을 등록했습니다.`)}>재고 이동 요청 등록</button>
              </article>
              <article className="panel"><div className="panel-head"><div><p className="eyebrow">RECOMMENDED ROUTES</p><h2>AI 추천 이동안</h2></div></div><BranchList /></article>
            </aside>
          </section>
          </>
        )}

        {activeTab === "AI 전략" && (
          <section className="strategy-page">
            <div className="strategy-toolbar">
              <label><span>분석 상품</span><select value={selectedSku} onChange={(event) => selectProduct(event.target.value)}>{products.map((product) => <option value={product.sku} key={product.sku}>{product.name} · {product.branch}</option>)}</select></label>
              <div><span>계약 유형</span><b className={`contract ${selected.contract === "직매입" ? "direct" : ""}`}>{selected.contract}</b></div>
              <div><span>전환 확률</span><b className="risk-value">{selected.transition}%</b></div>
              <button className="report-generate-button" onClick={generateStrategyReport}>▤ AI 전략 레포트</button>
              <button onClick={runAnalysis} disabled={analyzing}>✦ {analyzing ? "대안 분석 중…" : "대안 다시 생성"}</button>
            </div>
            <div className="strategy-page-grid">
              <article className="panel strategy-compare-panel"><div className="strategy-ribbon"><span>✦</span><b>AI MARGIN OPTIMIZER</b><em>분석 ID · MG-2026-0723-11</em></div><div className="panel-head strategy-title"><div><p className="eyebrow">ACTION COMPARISON</p><h2>{selected.name} 처리 전략 비교</h2></div><span className="fit-score">최적안 신뢰도 <b>93</b></span></div><p className="strategy-copy">할인 손실, 지점 이동비, 배송비, 진열비, 반품 가능 여부를 모두 차감한 실질 마진 기준입니다.</p>{strategyCards}</article>
              <article className="panel simulator-panel"><div className="panel-head"><div><p className="eyebrow">WHAT-IF SIMULATION</p><h2>선택 전략 조건 조정</h2></div><span className="simulation-tag">비용 정책 v2.1</span></div>{simulator}</article>
            </div>
          </section>
        )}

        {activeTab === "승인 관리" && (
          <section className="approval-page">
            <div className="approval-tabs">{(["전체", "대기", "승인", "반려"] as const).map((status) => <button className={approvalFilter === status ? "active" : ""} onClick={() => setApprovalFilter(status)} key={status}>{status}<span>{status === "전체" ? approvals.length : approvals.filter((item) => item.status === status).length}</span></button>)}</div>
            <div className="approval-grid">
              <article className="panel approval-list">
                <div className="approval-head"><span>전략 / 상품</span><span>예상 마진</span><span>요청자</span><span>상태</span></div>
                {visibleApprovals.map((item) => <button className={selectedApproval === item.id ? "selected" : ""} key={item.id} onClick={() => setSelectedApproval(item.id)}><span><small>{item.id} · {item.requestedAt}</small><b>{item.action}</b><em>{item.product} · {item.route}</em></span><strong>{item.margin}</strong><span>{item.requester}</span><i className={`approval-status ${item.status}`}>{item.status}</i></button>)}
              </article>
              <aside className="panel approval-detail">
                <div className="panel-head"><div><p className="eyebrow">APPROVAL DETAIL</p><h2>{currentApproval.id}</h2></div><span className={`approval-status ${currentApproval.status}`}>{currentApproval.status}</span></div>
                <div className="approval-hero"><span>AI 제안 전략</span><b>{currentApproval.action}</b><p>{currentApproval.product}<br />{currentApproval.route}</p></div>
                <dl><div><dt>예상 실질 마진</dt><dd>{currentApproval.margin}</dd></div><div><dt>예상 손실 방어</dt><dd>₩13.2M</dd></div><div><dt>전략 신뢰도</dt><dd>93%</dd></div><div><dt>정책 검증</dt><dd className="positive">3/3 통과</dd></div></dl>
                <div className="approval-checks stacked"><span>✓ 계약상 실행 권한 확인</span><span>✓ 최소 판매가격 정책 통과</span><span>✓ 가용 재고 및 물류 CAPA 확인</span></div>
                {currentApproval.status === "대기" ? <div className="decision-actions"><button onClick={() => updateApproval(currentApproval.id, "반려")}>반려</button><button onClick={() => updateApproval(currentApproval.id, "승인")}>전략 승인</button></div> : <button className="full-action" onClick={() => notify(`${currentApproval.id} 처리 이력을 확인했습니다.`)}>처리 이력 보기</button>}
              </aside>
            </div>
          </section>
        )}

        {activeTab === "MCP 로그" && (
          <section className="logs-page">
            <div className="log-filters">{["전체", "AI", "물류", "부산점", "무역센터점", "정책"].map((item) => <button className={logFilter === item ? "active" : ""} onClick={() => setLogFilter(item)} key={item}>{item}</button>)}<span><i /> 모든 MCP 연결 정상</span></div>
            <div className="logs-grid">
              <article className="panel detailed-log-list">
                <div className="approval-head"><span>시간 / 소스</span><span>도구 및 실행 내용</span><span>소요</span><span>상태</span></div>
                {visibleLogs.map((log) => <button className={selectedLog === log.id ? "selected" : ""} onClick={() => setSelectedLog(log.id)} key={log.id}><span><b>{log.time}</b><small>{log.source}</small></span><span><b>{log.tool}</b><small>{log.description}</small></span><em>{log.duration}</em><i className={`log-status ${log.status}`}>{log.status}</i></button>)}
              </article>
              <aside className="panel log-detail">
                <div className="panel-head"><div><p className="eyebrow">EXECUTION DETAIL</p><h2>{currentLog.id}</h2></div><span className={`log-status ${currentLog.status}`}>{currentLog.status}</span></div>
                <div className="log-meta"><div><span>도구</span><b>{currentLog.tool}</b></div><div><span>소스</span><b>{currentLog.source}</b></div><div><span>소요 시간</span><b>{currentLog.duration}</b></div></div>
                <div className="code-block"><span>REQUEST</span><pre>{currentLog.request}</pre></div>
                <div className="code-block response"><span>RESPONSE</span><pre>{currentLog.response}</pre></div>
                <div className="log-chain"><span className="done">1. 재고 조회</span><i>→</i><span className="done">2. 수요 예측</span><i>→</i><span className="done">3. 비용 계산</span><i>→</i><span className="current">4. 마진 최적화</span></div>
                <button className="full-action" onClick={() => notify(`${currentLog.id} 원본 실행 데이터를 내려받을 준비가 됐습니다.`)}>원본 실행 데이터 내보내기</button>
              </aside>
            </div>
          </section>
        )}

        <footer><span>특약매입 상품은 입점업체 협의가 필요하며, 모든 AI 전략은 계약·가격 정책 검증 후 실행됩니다.</span><b>HYUNDAI DEPARTMENT STORE · INVENTORY POC 2026</b></footer>
      </section>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
      {reportOpen && (
        <StrategyReport
          product={selected}
          strategy={strategy}
          simulation={simulation}
          contact={collaborationContact}
          generatedAt={reportGeneratedAt}
          onClose={() => setReportOpen(false)}
          onDownload={downloadStrategyReport}
        />
      )}
      {tourStep !== null && (
        <ProductTour
          step={tourStep}
          steps={tourSteps}
          onStepChange={setTourStep}
          onClose={() => setTourStep(null)}
        />
      )}
    </main>
  );
}

function StrategyReport({
  product,
  strategy,
  simulation,
  contact,
  generatedAt,
  onClose,
  onDownload,
}: {
  product: Product;
  strategy: Strategy;
  simulation: { sold: number; revenue: number; discountCost: number; operationCost: number; grossMargin: number; preventedLoss: number };
  contact: { name: string; title: string; department: string; phone: string };
  generatedAt: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  const totalCost = simulation.discountCost + simulation.operationCost;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <button className="report-backdrop" aria-label="레포트 닫기" onClick={onClose} />
      <article className="report-sheet">
        <header className="report-header">
          <div><p>HYUNDAI DEPARTMENT STORE · AI STRATEGY REPORT</p><h2 id="report-title">{product.name} 재고 처리 전략</h2><span>보고서 ID · MG-2026-0723-11 · {generatedAt}</span></div>
          <button onClick={onClose} aria-label="레포트 닫기">×</button>
        </header>
        <div className="report-content">
          <section className="report-recommendation">
            <div><span>AI RECOMMENDATION · 신뢰도 93%</span><h3>{strategyMeta[strategy].name}</h3><p>{strategyMeta[strategy].summary}</p></div>
            <strong>₩{simulation.grossMargin.toFixed(1)}<small>M</small><em>예상 실질 마진</em></strong>
          </section>
          <section className="report-section">
            <div className="report-section-title"><span>01</span><div><small>EXPECTED IMPACT</small><h3>예상 효과</h3></div></div>
            <div className="report-metrics"><div><span>예상 소진</span><b>{simulation.sold}<small>개</small></b></div><div><span>예상 매출</span><b>₩{simulation.revenue}<small>M</small></b></div><div><span>할인·운영비</span><b>-₩{totalCost.toFixed(1)}<small>M</small></b></div><div><span>손실 방어</span><b>₩{simulation.preventedLoss.toFixed(1)}<small>M</small></b></div></div>
          </section>
          <section className="report-section report-split">
            <div>
              <div className="report-section-title"><span>02</span><div><small>DECISION SIGNALS</small><h3>핵심 판단 근거</h3></div></div>
              <ul className="report-signals"><li><span>계절 종료 영향</span><b>92% · 매우 높음</b></li><li><span>최근 판매속도</span><b>{product.salesDelta}%</b></li><li><span>재고 과잉도</span><b>{product.stock}개 · {product.weeks}주</b></li><li><span>타점 수요 편차</span><b>부산 +64%</b></li></ul>
            </div>
            <div>
              <div className="report-section-title"><span>03</span><div><small>COLLABORATION OWNER</small><h3>실행 협업 담당자</h3></div></div>
              <div className="report-contact"><i>{contact.name.slice(0, 1)}</i><div><b>{contact.name} · {contact.title}</b><span>{contact.department}</span><strong>{contact.phone}</strong></div></div>
              <div className="report-policy"><span>✓ 계약 권한 확인</span><span>✓ 최소 마진율 통과</span><span>✓ 이동 가능 재고 확인</span></div>
            </div>
          </section>
          <p className="report-disclaimer">본 레포트는 AI가 판매·재고·시즌·비용 정책 데이터를 기반으로 생성한 의사결정 참고 자료입니다.</p>
        </div>
        <footer className="report-actions"><button onClick={onClose}>닫기</button><button onClick={onDownload}>↓ 레포트 다운로드</button></footer>
      </article>
    </div>
  );
}

function ProductTour({
  step,
  steps,
  onStepChange,
  onClose,
}: {
  step: number;
  steps: TourStep[];
  onStepChange: (step: number) => void;
  onClose: () => void;
}) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const current = steps[step];

  useEffect(() => {
    let retryTimer = 0;
    let settleTimer = 0;

    const updateTarget = () => {
      const target = document.querySelector(current.target);
      if (!target) {
        retryTimer = window.setTimeout(updateTarget, 80);
        return;
      }
      setTargetRect(target.getBoundingClientRect());
    };

    const target = document.querySelector(current.target);
    target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    updateTarget();
    settleTimer = window.setTimeout(updateTarget, 380);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.clearTimeout(retryTimer);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [current.target]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onStepChange(Math.min(steps.length - 1, step + 1));
      if (event.key === "ArrowLeft") onStepChange(Math.max(0, step - 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onStepChange, step, steps.length]);

  if (!targetRect) return null;

  const padding = 8;
  const spotlight = {
    top: Math.max(6, targetRect.top - padding),
    left: Math.max(6, targetRect.left - padding),
    width: Math.min(window.innerWidth - 12, targetRect.width + padding * 2),
    height: Math.min(window.innerHeight - 12, targetRect.height + padding * 2),
  };
  const tooltipWidth = Math.min(360, window.innerWidth - 24);
  const tooltipHeight = 280;
  const gap = 18;
  const roomRight = window.innerWidth - (spotlight.left + spotlight.width);
  const roomLeft = spotlight.left;
  let tooltipLeft = spotlight.left;
  let tooltipTop = spotlight.top + spotlight.height + gap;
  let side: "left" | "right" | "bottom" | "top" = "bottom";

  if (roomRight >= tooltipWidth + gap) {
    tooltipLeft = spotlight.left + spotlight.width + gap;
    tooltipTop = spotlight.top + Math.max(0, (spotlight.height - tooltipHeight) / 2);
    side = "right";
  } else if (roomLeft >= tooltipWidth + gap) {
    tooltipLeft = spotlight.left - tooltipWidth - gap;
    tooltipTop = spotlight.top + Math.max(0, (spotlight.height - tooltipHeight) / 2);
    side = "left";
  } else if (tooltipTop + tooltipHeight > window.innerHeight - 12) {
    tooltipTop = spotlight.top - tooltipHeight - gap;
    side = "top";
  }

  tooltipLeft = Math.max(12, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 12));
  tooltipTop = Math.max(12, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 12));

  return (
    <div className="product-tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="tour-scrim tour-scrim-top" style={{ height: spotlight.top }} />
      <div
        className="tour-scrim tour-scrim-left"
        style={{ top: spotlight.top, width: spotlight.left, height: spotlight.height }}
      />
      <div
        className="tour-scrim tour-scrim-right"
        style={{
          top: spotlight.top,
          left: spotlight.left + spotlight.width,
          height: spotlight.height,
        }}
      />
      <div
        className="tour-scrim tour-scrim-bottom"
        style={{ top: spotlight.top + spotlight.height }}
      />
      <div className="tour-spotlight" style={spotlight} />
      <section className={`tour-card tour-card-${side}`} style={{ left: tooltipLeft, top: tooltipTop, width: tooltipWidth }}>
        <header>
          <div className="tour-step-label"><span>{current.eyebrow}</span><b>{step + 1} / {steps.length}</b></div>
          <button onClick={onClose} aria-label="제품 둘러보기 닫기">×</button>
        </header>
        <div className="tour-card-body">
          <div className="tour-icon">{step === steps.length - 1 ? "✦" : String(step + 1).padStart(2, "0")}</div>
          <h2 id="tour-title">{current.title}</h2>
          <p>{current.description}</p>
        </div>
        <div className="tour-progress" aria-label={`총 ${steps.length}단계 중 ${step + 1}단계`}>
          {steps.map((item, index) => (
            <button
              key={item.title}
              className={index === step ? "active" : index < step ? "done" : ""}
              onClick={() => onStepChange(index)}
              aria-label={`${index + 1}단계로 이동`}
            />
          ))}
        </div>
        <footer>
          <button className="tour-skip" onClick={onClose}>건너뛰기</button>
          <div>
            {step > 0 && <button className="tour-back" onClick={() => onStepChange(step - 1)}>이전</button>}
            <button className="tour-next" autoFocus onClick={() => step === steps.length - 1 ? onClose() : onStepChange(step + 1)}>
              {step === steps.length - 1 ? "둘러보기 완료" : "다음"} <span>{step === steps.length - 1 ? "✓" : "→"}</span>
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ProductTable({ items, selectedSku, onSelect }: { items: Product[]; selectedSku: string; onSelect: (sku: string) => void }) {
  return (
    <>
      <div className="new-table-head"><span>상품 / 점포</span><span>계약</span><span>재고</span><span>판매 추이</span><span>전환 확률</span></div>
      <div className="inventory-list">
        {items.length > 0 ? items.map((product, index) => (
          <button className={`new-inventory-row ${selectedSku === product.sku ? "selected" : ""}`} onClick={() => onSelect(product.sku)} key={product.sku}>
            <span className="product-cell"><i className={`category-badge c${index + 1}`}>{product.category.slice(0, 1)}</i><span><b>{product.name}</b><small>{product.branch} · {product.sku}</small></span></span>
            <span><b className={`contract ${product.contract === "직매입" ? "direct" : ""}`}>{product.contract}</b><small>{product.contract === "직매입" ? "백화점 부담" : "입점사 부담"}</small></span>
            <span><b>{product.stock.toLocaleString()}</b><small>개 · {product.weeks}주</small></span>
            <span className="sales-down">{product.salesDelta}%</span>
            <span className="transition-score"><b>{product.transition}%</b><i><em style={{width:`${product.transition}%`}} /></i><small><strong className={`status ${product.status}`}>{product.status}</strong>{product.event}</small></span>
          </button>
        )) : <div className="empty-state">선택한 조건에 해당하는 상품이 없습니다.</div>}
      </div>
    </>
  );
}

function RiskSignals({ product }: { product: Product }) {
  return (
    <>
      <div className="signal-product"><span>{product.category}</span><div><b>{product.name}</b><small>{product.branch} · {product.contract}</small></div><em>Risk {product.risk}</em></div>
      <div className="signal-list"><div><span>계절 종료 영향</span><i><em style={{width:"92%"}} /></i><b>매우 높음</b></div><div><span>최근 판매속도</span><i><em style={{width:"78%"}} /></i><b>{product.salesDelta}%</b></div><div><span>재고 과잉도</span><i><em style={{width:"69%"}} /></i><b>{product.stock}개</b></div><div><span>타점 수요 편차</span><i><em style={{width:"84%"}} /></i><b>부산 +64%</b></div></div>
      <div className="weather-note"><span>☂</span><p><b>외부 수요 신호</b>평년보다 이른 장마 종료 전망으로 수도권 수요는 감소하지만 부산권은 3주간 수요가 유지될 가능성이 높습니다.</p></div>
    </>
  );
}

function StoreCard({ code, name, stock, velocity, weeks, state }: { code: string; name: string; stock: number; velocity: number; weeks: number; state: "과잉" | "부족" | "적정" }) {
  return <article className={`store-card ${state}`}><div><i>{code}</i><span><b>{name}</b><small>주간 판매 {velocity}개</small></span><em>{state}</em></div><p><span>현재고 <b>{stock}</b>개</span><span>재고 커버 <b>{weeks}</b>주</span></p><div className="stock-bar"><i style={{width:`${Math.min(100, weeks * 5)}%`}} /></div></article>;
}

function BranchList() {
  return <div className="branch-list"><div className="origin"><i>MC</i><p><b>무역센터점</b><span>재고 428 · 주 21개 판매</span></p><em>공급 과다 <b>+206%</b></em></div><div className="recommended"><i>BS</i><p><b>부산점</b><span>재고 38 · 주 56개 판매</span></p><em>추천 이동 <b>180개</b></em></div><div><i>PN</i><p><b>판교점</b><span>재고 62 · 주 31개 판매</span></p><em>이동 후보 <b>70개</b></em></div><div><i>US</i><p><b>울산점</b><span>재고 51 · 주 28개 판매</span></p><em>이동 후보 <b>40개</b></em></div></div>;
}

function CompactLogs({ logs }: { logs: McpLog[] }) {
  return <div className="log-list">{logs.map((log, index) => <div className={log.source === "AI" ? "ai-log" : ""} key={log.id}><time>{log.time}</time><i className={index === 1 ? "gold" : index === 2 ? "blue" : "green"}>{log.source.slice(0,2)}</i><p><b>{log.tool}</b><span>{log.description}</span></p><em>{log.duration}</em></div>)}</div>;
}
