import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type TabName = "메인 대시보드" | "전체 재고 조회" | "악성 재고 조회" | "향후 수요 및 잔여 재고 분석" | "AI 전략 생성" | "전략 기록" | "통계";
type Strategy = "transfer" | "exposure" | "discount" | "return";
type CollaborationTool = "slack" | "teams";
type RiskStatus = "위험" | "주의" | "관찰";
type InventoryStatus = "양호" | "위험" | "악성";
type AnalysisMode = "individual" | "integrated";

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
  channel: "오프라인" | "온라인";
  brand: string;
  inventoryStatus: InventoryStatus;
};

type StrategyRecord = {
  id: string;
  title: string;
  productSkus: string[];
  mode: AnalysisMode;
  createdAt: string;
  summary: string;
  margin: string;
  status: "공유 완료" | "검토 중" | "초안";
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
  { sku: "TR-FS-24071", name: "프리미엄 레인부츠", category: "패션", branch: "무역센터점", contract: "특약매입", stock: 428, weeks: 7, salesDelta: -42, risk: 91, transition: 78, status: "위험", event: "장마 종료 예상 D-18", channel: "오프라인", brand: "헌터", inventoryStatus: "악성" },
  { sku: "PN-FD-10428", name: "애플망고 선물세트", category: "식품", branch: "판교점", contract: "직매입", stock: 186, weeks: 3, salesDelta: -31, risk: 88, transition: 71, status: "위험", event: "판매기한 D-12", channel: "오프라인", brand: "현대식품관", inventoryStatus: "악성" },
  { sku: "MC-EL-33082", name: "프리미엄 에어서큘레이터", category: "가전", branch: "더현대 서울", contract: "직매입", stock: 214, weeks: 9, salesDelta: -18, risk: 76, transition: 54, status: "주의", event: "폭염 수요 둔화", channel: "오프라인", brand: "발뮤다", inventoryStatus: "위험" },
  { sku: "US-LV-88210", name: "오크 사이드 테이블", category: "가구", branch: "울산점", contract: "특약매입", stock: 91, weeks: 14, salesDelta: -23, risk: 69, transition: 42, status: "주의", event: "보관 100일 초과", channel: "오프라인", brand: "무토", inventoryStatus: "악성" },
  { sku: "HD-BT-55219", name: "비건 선케어 듀오", category: "뷰티", branch: "본점", contract: "특약매입", stock: 312, weeks: 6, salesDelta: -9, risk: 57, transition: 31, status: "관찰", event: "시즌 종료 D-39", channel: "오프라인", brand: "달바", inventoryStatus: "위험" },
  { sku: "ON-FS-11902", name: "캐시미어 블렌드 코트", category: "패션", branch: "온라인몰", contract: "직매입", stock: 126, weeks: 2, salesDelta: 14, risk: 24, transition: 18, status: "관찰", event: "판매 정상", channel: "온라인", brand: "타임", inventoryStatus: "양호" },
  { sku: "BS-FD-77126", name: "프리미엄 올리브오일", category: "식품", branch: "부산점", contract: "직매입", stock: 74, weeks: 2, salesDelta: 6, risk: 21, transition: 16, status: "관찰", event: "수요 안정", channel: "오프라인", brand: "오로바일렌", inventoryStatus: "양호" },
  { sku: "ON-EL-44918", name: "무선 스틱 청소기", category: "가전", branch: "온라인몰", contract: "특약매입", stock: 338, weeks: 11, salesDelta: -27, risk: 82, transition: 63, status: "위험", event: "신제품 교체 D-21", channel: "온라인", brand: "다이슨", inventoryStatus: "악성" },
  { sku: "HD-LV-50117", name: "세라믹 테이블 램프", category: "가구", branch: "본점", contract: "특약매입", stock: 48, weeks: 3, salesDelta: 2, risk: 32, transition: 22, status: "관찰", event: "판매 정상", channel: "오프라인", brand: "앤트레디션", inventoryStatus: "양호" },
  { sku: "ON-BT-90812", name: "시그니처 향수 세트", category: "뷰티", branch: "온라인몰", contract: "직매입", stock: 207, weeks: 8, salesDelta: -16, risk: 71, transition: 51, status: "주의", event: "검색 유입 감소", channel: "온라인", brand: "딥티크", inventoryStatus: "위험" },
];

const navItems: [string, TabName][] = [
  ["⌂", "메인 대시보드"],
  ["▦", "전체 재고 조회"],
  ["!", "악성 재고 조회"],
  ["◇", "향후 수요 및 잔여 재고 분석"],
  ["✦", "AI 전략 생성"],
  ["▤", "전략 기록"],
  ["↗", "통계"],
];

const tabRoutes: Record<TabName, string> = {
  "메인 대시보드": "/",
  "전체 재고 조회": "/inventory",
  "악성 재고 조회": "/bad-stock",
  "향후 수요 및 잔여 재고 분석": "/demand",
  "AI 전략 생성": "/strategy",
  "전략 기록": "/history",
  "통계": "/statistics",
};

const routeTabs = Object.fromEntries(
  Object.entries(tabRoutes).map(([tab, route]) => [route, tab]),
) as Record<string, TabName>;

const branches = ["전체 지점", "본점", "더현대 서울", "무역센터점", "판교점", "부산점", "울산점"];
const riskStatusOptions: RiskStatus[] = ["위험", "주의", "관찰"];
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
  "메인 대시보드": { eyebrow: "HYUNDAI DEPARTMENT STORE · INVENTORY CONTROL", title: "재고 운영 대시보드", subtitle: "전체 재고 상태와 악성 전환 위험, 최근 AI 전략 효과를 한눈에 확인합니다." },
  "전체 재고 조회": { eyebrow: "MASTER INVENTORY · SEARCH & FILTER", title: "전체 재고 조회", subtitle: "지점, 브랜드, 카테고리와 상태를 조합해 모든 재고를 탐색합니다." },
  "악성 재고 조회": { eyebrow: "BAD STOCK · PRIORITY CONTROL", title: "악성 재고 조회", subtitle: "즉시 대응이 필요한 악성 재고와 최근 생성 전략을 확인합니다." },
  "향후 수요 및 잔여 재고 분석": { eyebrow: "DEMAND FORECAST · REMAINING STOCK", title: "향후 수요 및 잔여 재고 분석", subtitle: "판매·재고·시즌 신호를 결합해 향후 수요와 잔여 재고를 예측합니다." },
  "AI 전략 생성": { eyebrow: "AI MARGIN OPTIMIZER · GENERATION LAB", title: "AI 전략 생성", subtitle: "악성 재고를 다중 선택하고 개별 또는 통합 전략을 생성합니다." },
  "전략 기록": { eyebrow: "STRATEGY ARCHIVE · HISTORY", title: "전략 기록", subtitle: "개별·통합 분석으로 생성된 모든 전략과 변경 이력을 확인합니다." },
  "통계": { eyebrow: "INVENTORY ANALYTICS · PERFORMANCE", title: "재고 운영 통계", subtitle: "카테고리별 재고 건전성과 AI 전략의 누적 효과를 분석합니다." },
};

const initialStrategyRecords: StrategyRecord[] = [
  { id: "ST-0724-018", title: "프리미엄 레인부츠 재고 이동 전략", productSkus: ["TR-FS-24071"], mode: "individual", createdAt: "오늘 10:24", summary: "무역센터점 재고 180개를 부산점으로 이동해 정상가 판매를 유지합니다.", margin: "₩19.8M", status: "공유 완료" },
  { id: "ST-0724-017", title: "식품 판매기한 대응 통합 전략", productSkus: ["PN-FD-10428", "BS-FD-77126"], mode: "integrated", createdAt: "오늘 09:48", summary: "판매기한과 지점 수요를 기준으로 타임세일과 점간 이동을 함께 실행합니다.", margin: "₩14.6M", status: "검토 중" },
  { id: "ST-0723-041", title: "에어서큘레이터 노출 강화 전략", productSkus: ["MC-EL-33082"], mode: "individual", createdAt: "어제 16:32", summary: "더현대 서울 1층 시즌존 노출을 7일간 확대합니다.", margin: "₩12.6M", status: "공유 완료" },
  { id: "ST-0723-038", title: "온라인 가전 악성재고 처리 전략", productSkus: ["ON-EL-44918"], mode: "individual", createdAt: "어제 14:10", summary: "신제품 교체 전에 온라인 전용 번들 할인으로 220개 소진을 목표로 합니다.", margin: "₩16.2M", status: "초안" },
  { id: "ST-0722-029", title: "리빙 장기재고 통합 반품 전략", productSkus: ["US-LV-88210", "HD-LV-50117"], mode: "integrated", createdAt: "7월 22일", summary: "특약매입 상품의 반품 가능 수량을 통합해 입점사와 협상합니다.", margin: "₩7.9M", status: "공유 완료" },
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
  const activeTab = routeTabs[location.pathname] ?? "메인 대시보드";
  const [selectedSku, setSelectedSku] = useState(products[0].sku);
  const [branch, setBranch] = useState("전체 지점");
  const [category, setCategory] = useState("전체 카테고리");
  const [strategy, setStrategy] = useState<Strategy>("transfer");
  const [discount, setDiscount] = useState(12);
  const [quantity, setQuantity] = useState(180);
  const [period, setPeriod] = useState(10);
  const [riskStatuses, setRiskStatuses] = useState<RiskStatus[]>(riskStatusOptions);
  const [collaborationTool, setCollaborationTool] = useState<CollaborationTool>("slack");
  const [collaborationTarget, setCollaborationTarget] = useState("#재고-전략-협업");
  const [shared, setShared] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportGeneratedAt, setReportGeneratedAt] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [toast, setToast] = useState("");
  const [tourStep, setTourStep] = useState<number | null>(location.pathname === "/" ? 0 : null);
  const [inventoryChannel, setInventoryChannel] = useState("전체 채널");
  const [inventoryBrand, setInventoryBrand] = useState("전체 브랜드");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("전체 카테고리");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState("전체 상태");
  const [detailSku, setDetailSku] = useState<string | null>(null);
  const [strategyRecords, setStrategyRecords] = useState(initialStrategyRecords);
  const [selectedStrategyRecordId, setSelectedStrategyRecordId] = useState(initialStrategyRecords[0].id);
  const [strategyRecordFilter, setStrategyRecordFilter] = useState<"전체" | AnalysisMode>("전체");
  const [selectedStrategySkus, setSelectedStrategySkus] = useState<string[]>([]);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("individual");
  const [generatingStrategies, setGeneratingStrategies] = useState(false);

  const selected = products.find((product) => product.sku === selectedSku) ?? products[0];
  const filtered = products.filter((product) =>
    (branch === "전체 지점" || product.branch === branch) &&
    (category === "전체 카테고리" || product.category === category)
  );
  const riskFiltered = filtered.filter((product) => riskStatuses.includes(product.status));
  const collaborationContact = collaborationContacts[collaborationTarget];
  const malignantProducts = products.filter((product) => product.inventoryStatus === "악성");
  const inventoryItems = products.filter((product) =>
    (inventoryChannel === "전체 채널" || product.channel === inventoryChannel) &&
    (inventoryBrand === "전체 브랜드" || product.brand === inventoryBrand) &&
    (inventoryCategoryFilter === "전체 카테고리" || product.category === inventoryCategoryFilter) &&
    (inventoryStatusFilter === "전체 상태" || product.inventoryStatus === inventoryStatusFilter)
  );
  const detailProduct = products.find((product) => product.sku === detailSku) ?? null;
  const detailRecords = strategyRecords.filter((record) => detailSku && record.productSkus.includes(detailSku));
  const currentStrategyRecord = strategyRecords.find((record) => record.id === selectedStrategyRecordId) ?? strategyRecords[0];
  const visibleStrategyRecords = strategyRecordFilter === "전체"
    ? strategyRecords
    : strategyRecords.filter((record) => record.mode === strategyRecordFilter);

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
      notify(activeTab === "향후 수요 및 잔여 재고 분석" ? "최신 판매·시즌 신호로 위험 확률을 갱신했습니다." : "전 지점 수요와 비용을 반영해 최적 전략을 갱신했습니다.");
    }, 900);
  }

  function selectProduct(sku: string, goTo?: TabName) {
    setSelectedSku(sku);
    setStrategy("transfer");
    setShared(false);
    if (goTo) navigate(tabRoutes[goTo]);
  }

  function openTab(tab: TabName) {
    navigate(tabRoutes[tab]);
  }

  function openInventoryDetail(sku: string) {
    const latest = strategyRecords.find((record) => record.productSkus.includes(sku));
    setDetailSku(sku);
    if (latest) setSelectedStrategyRecordId(latest.id);
  }

  function toggleStrategySku(sku: string) {
    setSelectedStrategySkus((current) =>
      current.includes(sku) ? current.filter((item) => item !== sku) : [...current, sku]
    );
  }

  function generateBulkStrategies() {
    if (selectedStrategySkus.length === 0) {
      notify("전략을 생성할 악성 재고를 한 건 이상 선택해주세요.");
      return;
    }
    setGeneratingStrategies(true);
    window.setTimeout(() => {
      const stamp = Date.now().toString().slice(-5);
      const newRecords: StrategyRecord[] = analysisMode === "individual"
        ? selectedStrategySkus.map((sku, index) => {
            const product = products.find((item) => item.sku === sku) ?? products[0];
            return {
              id: `ST-${stamp}-${index + 1}`,
              title: `${product.name} 개별 처리 전략`,
              productSkus: [sku],
              mode: "individual",
              createdAt: "방금 전",
              summary: `${product.branch}의 판매 속도와 계약 조건을 반영해 최적 처리안을 생성했습니다.`,
              margin: `₩${(8.4 + index * 3.1).toFixed(1)}M`,
              status: "초안",
            };
          })
        : [{
            id: `ST-${stamp}-01`,
            title: `${selectedStrategySkus.length}개 재고 통합 처리 전략`,
            productSkus: selectedStrategySkus,
            mode: "integrated",
            createdAt: "방금 전",
            summary: "선택 재고의 지점 수요와 물류 비용을 통합해 이동·할인 실행 순서를 최적화했습니다.",
            margin: `₩${(selectedStrategySkus.length * 11.7).toFixed(1)}M`,
            status: "초안",
          }];
      setStrategyRecords((current) => [...newRecords, ...current]);
      setSelectedStrategyRecordId(newRecords[0].id);
      setGeneratingStrategies(false);
      notify(`${newRecords.length}건의 ${analysisMode === "individual" ? "개별" : "통합"} 전략을 생성했습니다.`);
      navigate(tabRoutes["전략 기록"]);
    }, 900);
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
              <span>{icon}</span>{label}{label === "악성 재고 조회" && <em>{malignantProducts.length}</em>}
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
            {(activeTab === "메인 대시보드" || activeTab === "향후 수요 및 잔여 재고 분석") && <button className="primary-button" data-tour={activeTab === "메인 대시보드" ? "analyze" : undefined} onClick={runAnalysis} disabled={analyzing}><span>✦</span>{analyzing ? "분석 중…" : activeTab === "향후 수요 및 잔여 재고 분석" ? "예측 다시 실행" : "최적 전략 분석"}</button>}
          </div>
        </header>

        {(activeTab === "메인 대시보드" || activeTab === "향후 수요 및 잔여 재고 분석") && (
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

        {activeTab === "메인 대시보드" && (
          <>
            <section className="kpi-grid" aria-label="핵심 운영 지표" data-tour="kpis">
              <article className="kpi-card critical"><div className="kpi-head"><span>악성재고 전환 예상액</span><i>향후 30일</i></div><div className="kpi-value"><b>₩3.12</b><em>억원</em></div><div className="kpi-foot"><strong>▲ 8.6%</strong><span>조기 대응이 필요한 증가세</span></div><div className="mini-bars">{[38,42,49,44,61,57,74,68,82,93].map((height,index)=><i key={index} style={{height:`${height}%`}} />)}</div></article>
              <article className="kpi-card"><div className="kpi-head"><span>사전 경보 SKU</span><i>전환확률 ≥ 50%</i></div><div className="kpi-value"><b>34</b><em>개</em></div><div className="kpi-foot"><strong className="down">12개 선제 대응</strong><span>오늘 신규 6개</span></div><div className="ring"><span>71<small>%</small></span></div></article>
              <article className="kpi-card"><div className="kpi-head"><span>지점 이동 후보</span><i>마진 개선 가능</i></div><div className="kpi-value"><b>18</b><em>건</em></div><div className="kpi-foot"><strong className="neutral">부산점 7건</strong><span>수요 초과 지점</span></div><div className="days-track"><i style={{width:"72%"}} /><b>72</b><span>100%</span></div></article>
              <article className="kpi-card savings"><div className="kpi-head"><span>예방 가능 손실</span><i>AI 추정</i></div><div className="kpi-value"><b>₩1.46</b><em>억원</em></div><div className="kpi-foot"><strong className="down">+ 21.8%</strong><span>이번 달 누적 효과</span></div><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /></div></article>
            </section>
            <section className="new-dashboard-grid">
              <article className="panel watch-panel" data-tour="risk-table">
                <div className="panel-head"><div><p className="eyebrow">EARLY WARNING · RISK TRANSITION</p><h2>악성재고 전환 예측</h2></div><button onClick={() => openTab("향후 수요 및 잔여 재고 분석")}>상세 예측 <span>→</span></button></div>
                <ProductTable items={filtered} selectedSku={selectedSku} onSelect={(sku) => selectProduct(sku)} />
              </article>
              <article className="panel signal-panel">
                <div className="panel-head"><div><p className="eyebrow">WHY NOW?</p><h2>위험 전환 근거</h2></div><span className="confidence">예측 신뢰도 <b>89%</b></span></div>
                <RiskSignals product={selected} />
              </article>
              <article className="panel branch-panel" data-tour="store-map">
                <div className="panel-head"><div><p className="eyebrow">STORE DEMAND MAP</p><h2>지점별 이동 타당성</h2></div><button onClick={() => openTab("전체 재고 조회")}>재고 탐색 <span>→</span></button></div>
                <BranchList />
              </article>
              <article className="panel log-panel">
                <div className="panel-head"><div><p className="eyebrow">AI TRACEABILITY</p><h2>최근 MCP 실행</h2></div><span className="live-badge"><i /> LIVE</span></div>
                <CompactLogs logs={mcpLogs.slice(0, 4)} />
                <button className="log-button" onClick={() => openTab("통계")}>운영 통계 보기 <span>↗</span></button>
              </article>
            </section>
          </>
        )}

        {activeTab === "향후 수요 및 잔여 재고 분석" && (
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
                <button className="full-action" onClick={() => { openTab("AI 전략 생성"); setSelectedStrategySkus([selected.sku]); notify(`${selected.name} 전략 분석을 시작했습니다.`); }}>이 상품의 예방 전략 설계 →</button>
              </article>
            </aside>
          </section>
        )}

        {activeTab === "전체 재고 조회" && (
          <InventoryLookup
            items={inventoryItems}
            totalCount={products.length}
            records={strategyRecords}
            filters={
              <div className="inventory-master-filters">
                <label><span>채널</span><select value={inventoryChannel} onChange={(event) => setInventoryChannel(event.target.value)}><option>전체 채널</option><option>오프라인</option><option>온라인</option></select></label>
                <label><span>브랜드</span><select value={inventoryBrand} onChange={(event) => setInventoryBrand(event.target.value)}><option>전체 브랜드</option>{[...new Set(products.map((product) => product.brand))].map((brandName) => <option key={brandName}>{brandName}</option>)}</select></label>
                <label><span>상품 카테고리</span><select value={inventoryCategoryFilter} onChange={(event) => setInventoryCategoryFilter(event.target.value)}><option>전체 카테고리</option>{[...new Set(products.map((product) => product.category))].map((categoryName) => <option key={categoryName}>{categoryName}</option>)}</select></label>
                <label><span>재고 상태</span><select value={inventoryStatusFilter} onChange={(event) => setInventoryStatusFilter(event.target.value)}><option>전체 상태</option><option>양호</option><option>위험</option><option>악성</option></select></label>
                <button onClick={() => { setInventoryChannel("전체 채널"); setInventoryBrand("전체 브랜드"); setInventoryCategoryFilter("전체 카테고리"); setInventoryStatusFilter("전체 상태"); }}>필터 초기화</button>
              </div>
            }
            onOpenDetail={openInventoryDetail}
          />
        )}

        {activeTab === "악성 재고 조회" && (
          <InventoryLookup
            items={malignantProducts}
            totalCount={malignantProducts.length}
            records={strategyRecords}
            malignant
            onOpenDetail={openInventoryDetail}
          />
        )}

        {activeTab === "AI 전략 생성" && (
          <section className="strategy-page">
            <article className="bulk-strategy-builder">
              <div className="bulk-builder-head">
                <div><p className="eyebrow">MULTI SELECT · GENERATION MODE</p><h2>분석할 악성 재고 선택</h2><span>여러 건을 선택한 뒤 상품별 개별 전략 또는 하나의 통합 전략으로 생성할 수 있습니다.</span></div>
                <strong>{selectedStrategySkus.length}<small>건 선택</small></strong>
              </div>
              <div className="bulk-builder-grid">
                <div className="bulk-product-list">
                  {malignantProducts.map((product) => (
                    <button key={product.sku} className={selectedStrategySkus.includes(product.sku) ? "selected" : ""} onClick={() => toggleStrategySku(product.sku)}>
                      <i>{selectedStrategySkus.includes(product.sku) ? "✓" : ""}</i>
                      <span><b>{product.name}</b><small>{product.sku} · {product.branch} · {product.brand}</small></span>
                      <em>{product.stock}개</em>
                      <strong>{product.transition}%</strong>
                    </button>
                  ))}
                </div>
                <aside className="analysis-mode-panel">
                  <span>분석 방식</span>
                  <button className={analysisMode === "individual" ? "selected" : ""} onClick={() => setAnalysisMode("individual")}><i>01</i><span><b>각각 분석</b><small>{selectedStrategySkus.length || "N"}개 선택 시 전략 {selectedStrategySkus.length || "N"}건 생성</small></span></button>
                  <button className={analysisMode === "integrated" ? "selected" : ""} onClick={() => setAnalysisMode("integrated")}><i>02</i><span><b>통합 분석</b><small>{selectedStrategySkus.length || "N"}개를 묶어 전략 1건 생성</small></span></button>
                  <button className="generate-bulk-button" disabled={generatingStrategies} onClick={generateBulkStrategies}>✦ {generatingStrategies ? "전략 생성 중…" : "선택 재고 전략 생성"}</button>
                </aside>
              </div>
            </article>
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

        {activeTab === "전략 기록" && (
          <section className="strategy-history-page">
            <div className="history-filter">
              {(["전체", "individual", "integrated"] as const).map((mode) => (
                <button key={mode} className={strategyRecordFilter === mode ? "active" : ""} onClick={() => setStrategyRecordFilter(mode)}>
                  {mode === "전체" ? "전체 기록" : mode === "individual" ? "개별 분석" : "통합 분석"}
                  <span>{mode === "전체" ? strategyRecords.length : strategyRecords.filter((record) => record.mode === mode).length}</span>
                </button>
              ))}
            </div>
            <div className="history-layout">
              <article className="panel strategy-record-list">
                <div className="record-list-head"><span>생성 전략</span><span>분석 유형</span><span>예상 마진</span><span>상태</span></div>
                {visibleStrategyRecords.map((record) => (
                  <button key={record.id} className={selectedStrategyRecordId === record.id ? "selected" : ""} onClick={() => setSelectedStrategyRecordId(record.id)}>
                    <span><small>{record.id} · {record.createdAt}</small><b>{record.title}</b><em>{record.summary}</em></span>
                    <i className={`mode-badge ${record.mode}`}>{record.mode === "individual" ? "개별" : "통합"} · {record.productSkus.length} SKU</i>
                    <strong>{record.margin}</strong>
                    <u>{record.status}</u>
                  </button>
                ))}
              </article>
              <StrategyRecordDetail record={currentStrategyRecord} />
            </div>
          </section>
        )}

        {activeTab === "통계" && (
          <InventoryStatistics products={products} records={strategyRecords} />
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
      {detailProduct && (
        <InventoryStrategyDetail
          product={detailProduct}
          records={detailRecords}
          selectedRecordId={selectedStrategyRecordId}
          onSelectRecord={setSelectedStrategyRecordId}
          onClose={() => setDetailSku(null)}
          onCreateStrategy={() => {
            setSelectedStrategySkus([detailProduct.sku]);
            setDetailSku(null);
            navigate(tabRoutes["AI 전략 생성"]);
          }}
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

function InventoryLookup({
  items,
  totalCount,
  records,
  filters,
  malignant = false,
  onOpenDetail,
}: {
  items: Product[];
  totalCount: number;
  records: StrategyRecord[];
  filters?: React.ReactNode;
  malignant?: boolean;
  onOpenDetail: (sku: string) => void;
}) {
  return (
    <section className="inventory-master-page">
      <div className="inventory-master-summary">
        <div><p className="eyebrow">{malignant ? "BAD STOCK · ACTION REQUIRED" : "MASTER INVENTORY · LIVE DATA"}</p><h2>{malignant ? "악성 재고 우선 대응 목록" : "전 지점 통합 재고 목록"}</h2><span>{malignant ? "악성 상태 재고만 모아 최근 분석 전략과 함께 보여줍니다." : "필터를 조합해 원하는 재고를 찾고 기존 분석 전략을 확인할 수 있습니다."}</span></div>
        <div><span>조회 결과<b>{items.length}<small>건</small></b></span><span>전체 재고<b>{items.reduce((sum, item) => sum + item.stock, 0).toLocaleString()}<small>개</small></b></span><span>전략 보유<b>{items.filter((item) => records.some((record) => record.productSkus.includes(item.sku))).length}<small>건</small></b></span></div>
      </div>
      {filters}
      <article className="panel inventory-master-table">
        <div className="inventory-table-head"><span>상품 / SKU</span><span>채널 · 지점</span><span>브랜드 / 카테고리</span><span>재고</span><span>상태</span><span>최근 전략</span></div>
        {items.map((product) => {
          const latest = records.find((record) => record.productSkus.includes(product.sku));
          return (
            <button key={product.sku} onClick={() => onOpenDetail(product.sku)}>
              <span><i>{product.category.slice(0, 1)}</i><span><b>{product.name}</b><small>{product.sku} · {product.contract}</small></span></span>
              <span><b>{product.channel}</b><small>{product.branch}</small></span>
              <span><b>{product.brand}</b><small>{product.category}</small></span>
              <span><b>{product.stock.toLocaleString()}개</b><small>{product.weeks}주 커버</small></span>
              <em className={`inventory-status ${product.inventoryStatus}`}>{product.inventoryStatus}</em>
              <span className="latest-strategy">{latest ? <><b>{latest.title}</b><small>{latest.createdAt} · {latest.mode === "individual" ? "개별" : "통합"}</small></> : <><b>분석 기록 없음</b><small>전략 생성 필요</small></>}<i>→</i></span>
            </button>
          );
        })}
        {items.length === 0 && <div className="inventory-empty">조건에 맞는 재고가 없습니다. 필터를 초기화해보세요.</div>}
      </article>
      <p className="inventory-table-caption">총 {totalCount}건 기준 · 행을 선택하면 가장 최근 전략과 이전 생성 기록이 열립니다.</p>
    </section>
  );
}

function InventoryStrategyDetail({
  product,
  records,
  selectedRecordId,
  onSelectRecord,
  onClose,
  onCreateStrategy,
}: {
  product: Product;
  records: StrategyRecord[];
  selectedRecordId: string;
  onSelectRecord: (id: string) => void;
  onClose: () => void;
  onCreateStrategy: () => void;
}) {
  const current = records.find((record) => record.id === selectedRecordId) ?? records[0];
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  return (
    <div className="inventory-detail-modal" role="dialog" aria-modal="true" aria-label={`${product.name} 전략 기록`}>
      <button className="inventory-detail-backdrop" onClick={onClose} aria-label="상세 닫기" />
      <article className="inventory-detail-sheet">
        <header><div><p>{product.sku} · {product.brand}</p><h2>{product.name}</h2><span>{product.channel} · {product.branch} · {product.category}</span></div><button onClick={onClose} aria-label="닫기">×</button></header>
        <div className="inventory-detail-body">
          <main>
            <div className="detail-stock-metrics"><div><span>현재 재고</span><b>{product.stock}<small>개</small></b></div><div><span>재고 커버</span><b>{product.weeks}<small>주</small></b></div><div><span>전환 확률</span><b>{product.transition}<small>%</small></b></div><div><span>상태</span><em className={`inventory-status ${product.inventoryStatus}`}>{product.inventoryStatus}</em></div></div>
            {current ? (
              <section className="latest-strategy-detail">
                <p>SELECTED STRATEGY · {current.id}</p><div><span>{current.mode === "individual" ? "개별 분석" : `통합 분석 · ${current.productSkus.length} SKU`}</span><em>{current.status}</em></div>
                <h3>{current.title}</h3><p>{current.summary}</p>
                <dl><div><dt>예상 실질 마진</dt><dd>{current.margin}</dd></div><div><dt>생성 시각</dt><dd>{current.createdAt}</dd></div><div><dt>계약 정책</dt><dd>검증 완료</dd></div></dl>
              </section>
            ) : (
              <section className="no-strategy-detail"><span>✦</span><h3>아직 생성된 전략이 없습니다</h3><p>AI 전략 생성을 시작해 처리안과 예상 마진을 비교해보세요.</p></section>
            )}
            <button className="full-action" onClick={onCreateStrategy}>이 재고로 새 AI 전략 생성 →</button>
          </main>
          <aside><div><p>STRATEGY HISTORY</p><h3>이전 생성 기록</h3><span>최신순 · {records.length}건</span></div>{records.map((record, index) => <button key={record.id} className={current?.id === record.id ? "selected" : ""} onClick={() => onSelectRecord(record.id)}><i>{String(index + 1).padStart(2, "0")}</i><span><small>{record.createdAt}</small><b>{record.title}</b><em>{record.mode === "individual" ? "개별 분석" : "통합 분석"} · {record.margin}</em></span></button>)}{records.length === 0 && <p className="history-empty">생성 기록 없음</p>}</aside>
        </div>
      </article>
    </div>
  );
}

function StrategyRecordDetail({ record }: { record: StrategyRecord }) {
  const related = products.filter((product) => record.productSkus.includes(product.sku));
  return (
    <aside className="panel strategy-record-detail">
      <div className="panel-head"><div><p className="eyebrow">STRATEGY DETAIL · {record.id}</p><h2>{record.title}</h2></div><i className={`mode-badge ${record.mode}`}>{record.mode === "individual" ? "개별 분석" : "통합 분석"}</i></div>
      <p className="record-summary">{record.summary}</p>
      <div className="record-impact"><span>예상 실질 마진<b>{record.margin}</b></span><span>분석 재고<b>{record.productSkus.length}<small> SKU</small></b></span><span>현재 상태<b>{record.status}</b></span></div>
      <h3>분석 대상 재고</h3>
      <div className="record-products">{related.map((product) => <div key={product.sku}><i>{product.category.slice(0, 1)}</i><span><b>{product.name}</b><small>{product.sku} · {product.branch}</small></span><em className={`inventory-status ${product.inventoryStatus}`}>{product.inventoryStatus}</em></div>)}</div>
      <div className="record-timeline"><span className="done"><i>✓</i>재고 데이터 수집</span><span className="done"><i>✓</i>수요·비용 분석</span><span className="current"><i>3</i>{record.status === "초안" ? "담당자 공유 대기" : "담당자 협업 진행"}</span></div>
    </aside>
  );
}

function InventoryStatistics({ products: inventory, records }: { products: Product[]; records: StrategyRecord[] }) {
  const badCount = inventory.filter((product) => product.inventoryStatus === "악성").length;
  const riskCount = inventory.filter((product) => product.inventoryStatus === "위험").length;
  const totalStock = inventory.reduce((sum, product) => sum + product.stock, 0);
  const categories = [...new Set(inventory.map((product) => product.category))];
  return (
    <section className="statistics-page">
      <div className="statistics-kpis"><article><span>통합 재고</span><b>{totalStock.toLocaleString()}<small>개</small></b><em>10 SKU 기준</em></article><article className="bad"><span>악성 재고 비중</span><b>{Math.round(badCount / inventory.length * 100)}<small>%</small></b><em>{badCount}건 우선 대응</em></article><article><span>위험 관찰 재고</span><b>{riskCount}<small>건</small></b><em>향후 30일 모니터링</em></article><article className="positive"><span>누적 전략 생성</span><b>{records.length}<small>건</small></b><em>통합 {records.filter((record) => record.mode === "integrated").length}건 포함</em></article></div>
      <div className="statistics-grid">
        <article className="panel category-health"><div className="panel-head"><div><p className="eyebrow">CATEGORY HEALTH</p><h2>카테고리별 재고 건전성</h2></div><span>재고 수량 기준</span></div>{categories.map((categoryName) => { const categoryItems = inventory.filter((item) => item.category === categoryName); const categoryStock = categoryItems.reduce((sum, item) => sum + item.stock, 0); const badStock = categoryItems.filter((item) => item.inventoryStatus === "악성").reduce((sum, item) => sum + item.stock, 0); const ratio = Math.round(badStock / categoryStock * 100); return <div className="category-health-row" key={categoryName}><b>{categoryName}</b><span><i style={{ width: `${ratio}%` }} /></span><em>{categoryStock.toLocaleString()}개</em><strong>{ratio}% 악성</strong></div>; })}</article>
        <article className="panel strategy-performance"><div className="panel-head"><div><p className="eyebrow">STRATEGY PERFORMANCE</p><h2>AI 전략 운영 효과</h2></div></div><div className="performance-hero"><span>예상 손실 방어</span><b>₩1.46<small>억원</small></b><em>전월 대비 +21.8%</em></div><dl><div><dt>지점 이동</dt><dd><i style={{ width: "84%" }} /><b>84%</b></dd></div><div><dt>노출 강화</dt><dd><i style={{ width: "67%" }} /><b>67%</b></dd></div><div><dt>한정 할인</dt><dd><i style={{ width: "58%" }} /><b>58%</b></dd></div><div><dt>반품 협의</dt><dd><i style={{ width: "41%" }} /><b>41%</b></dd></div></dl></article>
      </div>
    </section>
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

function BranchList() {
  return <div className="branch-list"><div className="origin"><i>MC</i><p><b>무역센터점</b><span>재고 428 · 주 21개 판매</span></p><em>공급 과다 <b>+206%</b></em></div><div className="recommended"><i>BS</i><p><b>부산점</b><span>재고 38 · 주 56개 판매</span></p><em>추천 이동 <b>180개</b></em></div><div><i>PN</i><p><b>판교점</b><span>재고 62 · 주 31개 판매</span></p><em>이동 후보 <b>70개</b></em></div><div><i>US</i><p><b>울산점</b><span>재고 51 · 주 28개 판매</span></p><em>이동 후보 <b>40개</b></em></div></div>;
}

function CompactLogs({ logs }: { logs: McpLog[] }) {
  return <div className="log-list">{logs.map((log, index) => <div className={log.source === "AI" ? "ai-log" : ""} key={log.id}><time>{log.time}</time><i className={index === 1 ? "gold" : index === 2 ? "blue" : "green"}>{log.source.slice(0,2)}</i><p><b>{log.tool}</b><span>{log.description}</span></p><em>{log.duration}</em></div>)}</div>;
}
