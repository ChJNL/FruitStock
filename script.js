/* =====================================================================
   확장 기능이 적용된 주식 모의투자 시뮬레이터
   -----------------------------------------------------------------
   추가 기능:
   1. 시작 자본금 100,000원
   2. 개별 주식 차트 (클릭 시 단독 표시)
   3. 부도/상장폐지 시스템 (100원 이하 경고, 0원 폐지)
   4. 튜토리얼 모달 (처음 1회)
===================================================================== */

/* =====================================================================
   종목 목록
===================================================================== */
const stocks = [
  {
    id: 'taesung-elec', ticker: 'TSEC', emoji: '📱', name: '태성전자',
    category: '우량주', badgeClass: 'badge-blue-chip', chartColor: '#c7c9d1',
    price: 45000, prevPrice: 45000, dayStartPrice: 45000,
    tickVolatility: 0.008, dailyDrift: 0.004, todayTickDrift: 0,
    tags: ['it'], delisted: false,
    priceHistory: [45000],
  },
  {
    id: 'nexttech', ticker: 'NEXT', emoji: '💻', name: '넥스트테크',
    category: '우량주', badgeClass: 'badge-blue-chip', chartColor: '#4ecb8f',
    price: 38000, prevPrice: 38000, dayStartPrice: 38000,
    tickVolatility: 0.010, dailyDrift: 0.005, todayTickDrift: 0,
    tags: ['it', 'growth'], delisted: false,
    priceHistory: [38000],
  },
  {
    id: 'nextbio', ticker: 'NBIO', emoji: '🧬', name: '넥스트바이오랩',
    category: '성장주', badgeClass: 'badge-growth', chartColor: '#e0668f',
    price: 28000, prevPrice: 28000, dayStartPrice: 28000,
    tickVolatility: 0.025, dailyDrift: 0, todayTickDrift: 0,
    tags: ['biotech'], delisted: false,
    priceHistory: [28000],
  },
  {
    id: 'healthmed', ticker: 'HLMD', emoji: '💊', name: '헬스메드',
    category: '성장주', badgeClass: 'badge-growth', chartColor: '#f2994a',
    price: 22000, prevPrice: 22000, dayStartPrice: 22000,
    tickVolatility: 0.018, dailyDrift: 0.002, todayTickDrift: 0,
    tags: ['biotech', 'healthcare'], delisted: false,
    priceHistory: [22000],
  },
  {
    id: 'globalbank', ticker: 'GBNK', emoji: '🏦', name: '글로벌은행',
    category: '우량주', badgeClass: 'badge-blue-chip', chartColor: '#9b6fd1',
    price: 32000, prevPrice: 32000, dayStartPrice: 32000,
    tickVolatility: 0.006, dailyDrift: 0.003, todayTickDrift: 0,
    tags: ['finance'], delisted: false,
    priceHistory: [32000],
  },
  {
    id: 'shimsecurities', ticker: 'SHIM', emoji: '📈', name: '신용증권',
    category: '우량주', badgeClass: 'badge-blue-chip', chartColor: '#4a9aa4',
    price: 25000, prevPrice: 25000, dayStartPrice: 25000,
    tickVolatility: 0.010, dailyDrift: 0, todayTickDrift: 0,
    tags: ['finance'], delisted: false,
    priceHistory: [25000],
  },
  {
    id: 'daedongindu', ticker: 'DAEI', emoji: '🏗️', name: '대동산업',
    category: '가치주', badgeClass: 'badge-value', chartColor: '#e5c76b',
    price: 18000, prevPrice: 18000, dayStartPrice: 18000,
    tickVolatility: 0.015, dailyDrift: 0, todayTickDrift: 0,
    tags: ['manufacturing'], delisted: false,
    priceHistory: [18000],
  },
  {
    id: 'steelfuture', ticker: 'STFL', emoji: '⚙️', name: '강철미래',
    category: '가치주', badgeClass: 'badge-value', chartColor: '#b0e0e6',
    price: 16000, prevPrice: 16000, dayStartPrice: 16000,
    tickVolatility: 0.020, dailyDrift: -0.002, todayTickDrift: 0,
    tags: ['manufacturing'], delisted: false,
    priceHistory: [16000],
  },
  {
    id: 'agrifood', ticker: 'AGRF', emoji: '🌾', name: '농산식품',
    category: '배당주', badgeClass: 'badge-value', chartColor: '#90ee90',
    price: 14000, prevPrice: 14000, dayStartPrice: 14000,
    tickVolatility: 0.012, dailyDrift: 0.003, todayTickDrift: 0,
    tags: ['food', 'dividend'], delisted: false,
    priceHistory: [14000],
  },
  {
    id: 'snackworld', ticker: 'SNCK', emoji: '🍪', name: '스낵월드',
    category: '배당주', badgeClass: 'badge-value', chartColor: '#ffd700',
    price: 20000, prevPrice: 20000, dayStartPrice: 20000,
    tickVolatility: 0.014, dailyDrift: 0.002, todayTickDrift: 0,
    tags: ['food', 'dividend'], delisted: false,
    priceHistory: [20000],
  },
  {
    id: 'mediahub', ticker: 'MHUB', emoji: '🎬', name: '미디어허브',
    category: '성장주', badgeClass: 'badge-growth', chartColor: '#ff69b4',
    price: 19000, prevPrice: 19000, dayStartPrice: 19000,
    tickVolatility: 0.022, dailyDrift: 0, todayTickDrift: 0,
    tags: ['entertainment'], delisted: false,
    priceHistory: [19000],
  },
];

/* =====================================================================
   뉴스 풀
===================================================================== */
const NEWS_POOL = [
  { id: 'market-rally', type: 'market', text: '🌍 글로벌 경기 강세, 전 종목 급등', 
    changeRange: [0.05, 0.12] },
  { id: 'market-crash', type: 'market', text: '📉 금리 인상 우려, 전 종목 약세',
    changeRange: [-0.12, -0.05] },
  { id: 'it-boom', type: 'tag', tag: 'it', text: '💻 AI 산업 호황, IT주 급등',
    changeRange: [0.08, 0.18] },
  { id: 'it-slowdown', type: 'tag', tag: 'it', text: '💻 반도체 수급 악화, IT주 조정',
    changeRange: [-0.10, -0.03] },
  { id: 'biotech-approval', type: 'tag', tag: 'biotech', text: '🧬 신약 임상 성공, 바이오 폭등',
    changeRange: [0.15, 0.35] },
  { id: 'biotech-scandal', type: 'tag', tag: 'biotech', text: '🧬 임상 부작용 발생, 바이오 급락',
    changeRange: [-0.25, -0.08] },
  { id: 'finance-rally', type: 'tag', tag: 'finance', text: '🏦 금리 인상, 금융주 수혜',
    changeRange: [0.06, 0.15] },
  { id: 'food-inflation', type: 'tag', tag: 'food', text: '🌾 농산물 가격 상승, 식품주 강세',
    changeRange: [0.04, 0.12] },
  { id: 'manufacturing-recovery', type: 'tag', tag: 'manufacturing', text: '⚙️ 수출 호조, 제조업 강세',
    changeRange: [0.06, 0.14] },
  { id: 'entertainment-hit', type: 'tag', tag: 'entertainment', text: '🎬 영화 대박, 엔터주 급등',
    changeRange: [0.10, 0.25] },
  { id: 'nextbio-jackpot', type: 'stock', targetId: 'nextbio', text: '🚀 넥스트바이오, 신약 승인! 주가 폭등',
    changeRange: [2.0, 6.0] },
  { id: 'taesung-scandal', type: 'stock', targetId: 'taesung-elec', text: '📰 태성전자, 부실 회계 의혹',
    changeRange: [-0.15, -0.05] },
];

/* =====================================================================
   업적 목록
===================================================================== */
const ACHIEVEMENTS = [
  { id: 'first-buy', emoji: '🌱', name: '첫 투자', desc: '생애 첫 주식을 매수했다',
    check: (s) => s.everBought },
  { id: 'first-sell', emoji: '💵', name: '첫 수익 실현', desc: '생애 첫 매도를 완료했다',
    check: (s) => s.everSold },
  { id: 'millionaire', emoji: '👑', name: '천만 자산가', desc: '순자산이 1천만 원을 넘었다',
    check: (s) => s.totalAssets >= 10000000 },
  { id: 'trader', emoji: '💎', name: '활동적인 투자자', desc: '한 종목을 10회 이상 거래했다',
    check: (s) => s.tradeCount >= 10 },
  { id: 'survivor-5', emoji: '📅', name: '1주일 생존', desc: '5일 동안 시장에서 살아남았다',
    check: (s) => s.dayCount >= 5 },
  { id: 'collector', emoji: '🏆', name: '모든 걸 가졌다', desc: '상점의 모든 아이템을 구매했다',
    check: (s) => s.ownedItemsCount >= SHOP_ITEMS.length },
];

/* =====================================================================
   사치품 상점
===================================================================== */
const SHOP_ITEMS = [
  { id: 'luxury-watch', emoji: '⌚', name: '명품 시계', price: 5000000, desc: '손목 위의 자산 증명서' },
  { id: 'sports-car', emoji: '🏎️', name: '슈퍼카', price: 10000000, desc: '질주 본능을 채워줄 스피드' },
  { id: 'apartment', emoji: '🏢', name: '강남 오피스텔', price: 20000000, desc: '도시 한복판의 부동산' },
  { id: 'yacht', emoji: '🛥️', name: '개인 요트', price: 50000000, desc: '주말은 바다 위에서' },
  { id: 'private-jet', emoji: '✈️', name: '프라이빗 제트', price: 100000000, desc: '세계 어디로든 한 번에' },
];

/* =====================================================================
   상수 정의
===================================================================== */
const START_CASH = 100000;                // 10만원으로 변경
const DAY_DURATION_MS = 3 * 60 * 1000;
const PRICE_TICK_MS = 10 * 1000;
const TICKS_PER_DAY = DAY_DURATION_MS / PRICE_TICK_MS;
const HINT_COST = 100;
const DIVIDEND_RATE = 0.02;
const DAILY_PRICE_LIMIT = 0.30;
const BANKRUPT_THRESHOLD = 100;           // 부도 경고 기준 (100원)
const DELISTING_PRICE = 0;                // 상장폐지 기준 (0원)
const SAVE_KEY = 'stockSimulatorSave';
const TUTORIAL_SHOWN_KEY = 'tutorialShown';

/* =====================================================================
   플레이어 상태
===================================================================== */
const player = {
  cash: START_CASH,
  holdings: {},
  ownedItems: [],
  unlockedAchievements: [],
  everBought: false,
  everSold: false,
  tradeCount: 0,
};

stocks.forEach((s) => { player.holdings[s.id] = 0; });

let dayCount = 1;
let dayEndAt = Date.now() + DAY_DURATION_MS;
let hintPurchasedToday = false;
let todaysNews = pickRandomNews();
let tomorrowsNews = pickRandomNews();
let tickIndexToday = 0;
let lastPriceTickElapsed = 0;
let priceChart = null;
let newsModalShown = false;
let selectedStockId = null;      // 선택된 종목 ID
let bankruptcyWarnings = {};     // 부도 경고 상태 추적

/* =====================================================================
   DOM 요소
===================================================================== */
const dom = {
  dayNumber: document.getElementById('dayNumber'),
  timerText: document.getElementById('timerText'),
  timerFill: document.getElementById('timerFill'),
  cashValue: document.getElementById('cashValue'),
  totalValue: document.getElementById('totalValue'),
  holdingsList: document.getElementById('holdingsList'),
  hintText: document.getElementById('hintText'),
  hintBtn: document.getElementById('hintBtn'),
  stockTableBody: document.getElementById('stockTableBody'),
  shopGrid: document.getElementById('shopGrid'),
  achvGrid: document.getElementById('achvGrid'),
  toast: document.getElementById('toast'),
  resetBtn: document.getElementById('resetBtn'),
  newsModal: document.getElementById('newsModal'),
  newsModalText: document.getElementById('newsModalText'),
  newsCloseBtn: document.getElementById('newsCloseBtn'),
  tutorialModal: document.getElementById('tutorialModal'),
  tutorialCloseBtn: document.getElementById('tutorialCloseBtn'),
  chartInfo: document.getElementById('chartInfo'),
  chartWrap: document.getElementById('chartWrap'),
  priceChart: document.getElementById('priceChart'),
};

/* =====================================================================
   유틸리티 함수
===================================================================== */

function formatWon(amount) {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

function formatPercent(ratio) {
  const sign = ratio > 0 ? '+' : '';
  return `${sign}${(ratio * 100).toFixed(1)}%`;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function pickRandomNews() {
  return NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
}

function newsAffectsStock(news, stock) {
  if (news.type === 'market') return true;
  if (news.type === 'tag') return stock.tags.includes(news.tag);
  if (news.type === 'stock') return stock.id === news.targetId;
  return false;
}

function findStock(stockId) {
  return stocks.find((s) => s.id === stockId);
}

function computeTotalAssets() {
  const stockValue = stocks.reduce((sum, s) => {
    if (!s.delisted) sum += s.price * player.holdings[s.id];
    return sum;
  }, 0);
  return player.cash + stockValue;
}

function commit() {
  renderAll();
  checkAchievements();
  saveGame();
}

/* =====================================================================
   저장 / 불러오기
===================================================================== */

function saveGame() {
  const saveData = {
    cash: player.cash,
    holdings: player.holdings,
    ownedItems: player.ownedItems,
    unlockedAchievements: player.unlockedAchievements,
    everBought: player.everBought,
    everSold: player.everSold,
    tradeCount: player.tradeCount,
    dayCount,
    dayEndAt,
    hintPurchasedToday,
    todaysNewsId: todaysNews.id,
    tomorrowsNewsId: tomorrowsNews.id,
    stocks: stocks.map((s) => ({
      id: s.id,
      price: s.price,
      prevPrice: s.prevPrice,
      dayStartPrice: s.dayStartPrice,
      todayTickDrift: s.todayTickDrift,
      delisted: s.delisted,
      priceHistory: s.priceHistory.slice(-TICKS_PER_DAY),
    })),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;

  const data = JSON.parse(raw);

  player.cash = data.cash;
  player.holdings = data.holdings;
  player.ownedItems = data.ownedItems;
  player.unlockedAchievements = data.unlockedAchievements;
  player.everBought = data.everBought;
  player.everSold = data.everSold;
  player.tradeCount = data.tradeCount || 0;

  dayCount = data.dayCount;
  dayEndAt = data.dayEndAt;
  hintPurchasedToday = data.hintPurchasedToday;

  todaysNews = NEWS_POOL.find((n) => n.id === data.todaysNewsId) || pickRandomNews();
  tomorrowsNews = NEWS_POOL.find((n) => n.id === data.tomorrowsNewsId) || pickRandomNews();

  data.stocks.forEach((saved) => {
    const stock = findStock(saved.id);
    if (stock) {
      stock.price = saved.price;
      stock.prevPrice = saved.prevPrice;
      stock.dayStartPrice = saved.dayStartPrice;
      stock.todayTickDrift = saved.todayTickDrift;
      stock.delisted = saved.delisted;
      stock.priceHistory = saved.priceHistory || [saved.price];
    }
  });

  if (Date.now() >= dayEndAt) {
    resolveDayEnd();
  } else {
    const elapsed = DAY_DURATION_MS - (dayEndAt - Date.now());
    lastPriceTickElapsed = Math.floor(elapsed / PRICE_TICK_MS);
  }

  return true;
}

function resetGame() {
  const ok = confirm('정말 초기화할까요? 모든 자산과 업적 기록이 사라져요.');
  if (!ok) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

/* =====================================================================
   튜토리얼 관련
===================================================================== */

function checkAndShowTutorial() {
  if (localStorage.getItem(TUTORIAL_SHOWN_KEY)) {
    return; // 이미 본 경우
  }
  dom.tutorialModal.classList.add('visible');
}

function closeTutorial() {
  dom.tutorialModal.classList.remove('visible');
  localStorage.setItem(TUTORIAL_SHOWN_KEY, 'true');
}

/* =====================================================================
   렌더링
===================================================================== */

function renderDayBadge() {
  dom.dayNumber.textContent = dayCount;
}

function renderWallet() {
  dom.cashValue.textContent = formatWon(player.cash);
  dom.totalValue.textContent = formatWon(computeTotalAssets());

  const owned = stocks.filter((s) => player.holdings[s.id] > 0 && !s.delisted);
  dom.holdingsList.innerHTML = owned.length === 0
    ? '<li class="holding-empty">아직 보유한 종목이 없어요</li>'
    : owned.map((stock) => `
        <li class="holding-row">
          <span>${stock.emoji} ${stock.name}</span>
          <span class="mono">${player.holdings[stock.id]}주</span>
        </li>
      `).join('');
}

function renderMarket() {
  dom.stockTableBody.innerHTML = stocks
    .filter((stock) => !stock.delisted)  // 상장폐지된 종목 제외
    .map((stock) => {
      const diff = stock.price - stock.prevPrice;
      const ratio = stock.prevPrice ? diff / stock.prevPrice : 0;

      const isUp = diff > 0;
      const isDown = diff < 0;
      const isBankrupt = stock.price <= BANKRUPT_THRESHOLD;

      let flashClass = '';
      let changeClass = '';
      let arrow = '-';

      if (isBankrupt) {
        flashClass = 'flash-danger';
        changeClass = 'change-danger';
        arrow = '💀';
      } else {
        flashClass = isUp ? 'flash-up' : isDown ? 'flash-down' : '';
        changeClass = isUp ? 'change-up' : isDown ? 'change-down' : 'change-flat';
        arrow = isUp ? '▲' : isDown ? '▼' : '-';
      }

      const canBuy = player.cash >= stock.price && !isBankrupt;
      const canSell = player.holdings[stock.id] > 0;

      return `
        <tr>
          <td>
            <div class="stock-name-cell" data-stock-id="${stock.id}">
              <span class="stock-emoji">${stock.emoji}</span>
              <div>
                <div class="stock-name">${stock.name}</div>
                <div class="stock-ticker mono">${stock.ticker}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${isBankrupt ? 'badge-delisted' : stock.badgeClass}">
              ${isBankrupt ? '⚠️ 부도' : stock.category}
            </span>
          </td>
          <td class="mono price-cell ${flashClass}">${stock.price.toLocaleString()}원</td>
          <td>
            <span class="change-badge ${changeClass}">
              ${arrow} ${isBankrupt ? '위험' : formatPercent(ratio)}
            </span>
          </td>
          <td class="mono">${player.holdings[stock.id]}주</td>
          <td>
            <div class="trade-controls">
              <input type="number" class="qty-input mono" id="qty-${stock.id}" value="1" min="1">
              <button class="btn buy-btn" data-action="buy" data-id="${stock.id}" ${canBuy ? '' : 'disabled'}>매수</button>
              <button class="btn sell-btn" data-action="sell" data-id="${stock.id}" ${canSell ? '' : 'disabled'}>매도</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
}

function renderShop() {
  dom.shopGrid.innerHTML = SHOP_ITEMS.map((item) => {
    const owned = player.ownedItems.includes(item.id);
    const canBuy = !owned && player.cash >= item.price;
    return `
      <div class="shop-item ${owned ? 'owned' : 'locked'}">
        <span class="item-emoji">${item.emoji}</span>
        <div class="item-name">${item.name}</div>
        <div class="item-price mono">${formatWon(item.price)}</div>
        ${owned
          ? '<span class="owned-tag">✓ 보유중</span>'
          : `<button class="btn buy-item-btn" data-item="${item.id}" ${canBuy ? '' : 'disabled'}>구매</button>`}
      </div>
    `;
  }).join('');
}

function renderAchievements() {
  dom.achvGrid.innerHTML = ACHIEVEMENTS.map((ach) => {
    const unlocked = player.unlockedAchievements.includes(ach.id);
    return `
      <div class="achv-item ${unlocked ? 'unlocked' : 'locked'}">
        <span class="item-emoji">${ach.emoji}</span>
        <div class="item-name">${ach.name}</div>
        <div class="item-desc">${unlocked ? ach.desc : '???'}</div>
      </div>
    `;
  }).join('');
}

function renderHint() {
  dom.hintBtn.disabled = hintPurchasedToday || player.cash < HINT_COST;
  dom.hintBtn.textContent = hintPurchasedToday ? '오늘은 이미 정보를 샀어요' : `정보 구매 (${HINT_COST}원)`;
  dom.hintText.textContent = hintPurchasedToday
    ? `"${tomorrowsNews.text}"`
    : '"아직 정보를 사지 않았어요..."';
}

function renderAll() {
  renderDayBadge();
  renderWallet();
  renderMarket();
  renderShop();
  renderAchievements();
  renderHint();
  updateChartDisplay();
}

/* =====================================================================
   차트 관련
===================================================================== */

function initChart() {
  // 초기화 시 아무것도 선택되지 않은 상태
  selectedStockId = null;
  dom.chartWrap.style.display = 'none';
  dom.chartInfo.style.display = 'block';
}

function updateChartDisplay() {
  if (!selectedStockId) {
    dom.chartWrap.style.display = 'none';
    dom.chartInfo.style.display = 'block';
    return;
  }

  const stock = findStock(selectedStockId);
  if (!stock || stock.delisted) {
    selectedStockId = null;
    dom.chartWrap.style.display = 'none';
    dom.chartInfo.style.display = 'block';
    return;
  }

  dom.chartInfo.style.display = 'none';
  dom.chartWrap.style.display = 'block';

  const isUp = stock.price > stock.dayStartPrice;
  const lineColor = isUp ? '#e0483e' : '#4f83cc';  // 빨강 / 파랑

  if (!priceChart) {
    const ctx = dom.priceChart.getContext('2d');
    priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: `${stock.name} (${isUp ? '상승' : '하락'})`,
            data: [],
            borderColor: lineColor,
            backgroundColor: 'transparent',
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            ticks: { color: '#8b8f9e', maxRotation: 0 },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            ticks: {
              color: '#8b8f9e',
              callback: (v) => `${v}원`,
            },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
        },
        plugins: {
          legend: {
            labels: { color: '#c7c9d1', boxWidth: 12, font: { size: 12 } },
          },
        },
      },
    });
  }

  // 기존 데이터 초기화
  priceChart.data.labels = [];
  priceChart.data.datasets[0].data = [];
  priceChart.data.datasets[0].borderColor = lineColor;
  priceChart.data.datasets[0].label = `${stock.name} (${isUp ? '상승 추세' : '하락 추세'})`;

  // 새로운 데이터 입력
  stock.priceHistory.forEach((price, index) => {
    priceChart.data.labels.push(`${index * 10}s`);
    priceChart.data.datasets[0].data.push(price);
  });

  priceChart.update();
}

function handleStockNameClick(event) {
  const nameCell = event.target.closest('.stock-name-cell');
  if (!nameCell) return;

  const stockId = nameCell.dataset.stockId;
  const stock = findStock(stockId);

  if (stock && !stock.delisted) {
    selectedStockId = stockId;
    updateChartDisplay();
  }
}

/* =====================================================================
   매수 / 매도
===================================================================== */

function buyStock(stockId, qty) {
  const stock = findStock(stockId);
  
  if (stock.delisted) {
    alert('상장폐지된 종목입니다!');
    return;
  }

  if (stock.price <= BANKRUPT_THRESHOLD) {
    alert('부도 위험이 있는 종목은 매수할 수 없습니다!');
    return;
  }

  const cost = stock.price * qty;

  if (player.cash < cost) {
    alert('현금이 부족해요!');
    return;
  }

  player.cash -= cost;
  player.holdings[stockId] += qty;
  player.everBought = true;
  player.tradeCount += 1;
  commit();
}

function sellStock(stockId, qty) {
  if (player.holdings[stockId] < qty) {
    alert('보유한 수량보다 많이 팔 수 없어요!');
    return;
  }

  const stock = findStock(stockId);
  player.holdings[stockId] -= qty;
  player.cash += stock.price * qty;
  player.everSold = true;
  player.tradeCount += 1;
  commit();
}

function handleMarketClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const stockId = button.dataset.id;
  const qtyInput = document.getElementById(`qty-${stockId}`);
  const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);

  if (button.dataset.action === 'buy') {
    buyStock(stockId, qty);
  } else {
    sellStock(stockId, qty);
  }
}

/* =====================================================================
   정보상 (힌트)
===================================================================== */

function buyHint() {
  if (hintPurchasedToday) return;
  if (player.cash < HINT_COST) {
    alert('정보상에게 낼 돈이 부족해요!');
    return;
  }

  player.cash -= HINT_COST;
  hintPurchasedToday = true;
  commit();
}

/* =====================================================================
   사치품 상점
===================================================================== */

function buyItem(itemId) {
  if (player.ownedItems.includes(itemId)) return;

  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (player.cash < item.price) {
    alert('돈이 부족해요!');
    return;
  }

  player.cash -= item.price;
  player.ownedItems.push(itemId);
  commit();
}

function handleShopClick(event) {
  const button = event.target.closest('button[data-item]');
  if (!button) return;
  buyItem(button.dataset.item);
}

/* =====================================================================
   업적 & 토스트
===================================================================== */

function getAchievementState() {
  return {
    totalAssets: computeTotalAssets(),
    ownedItemsCount: player.ownedItems.length,
    dayCount,
    everBought: player.everBought,
    everSold: player.everSold,
    tradeCount: player.tradeCount,
  };
}

function checkAchievements() {
  const state = getAchievementState();
  ACHIEVEMENTS.forEach((ach) => {
    if (player.unlockedAchievements.includes(ach.id)) return;
    if (ach.check(state)) {
      player.unlockedAchievements.push(ach.id);
      queueToast(`🏆 업적 달성! <strong>${ach.name}</strong> — ${ach.desc}`);
    }
  });
}

let toastQueue = [];
let toastBusy = false;

function queueToast(html) {
  toastQueue.push(html);
  if (!toastBusy) playNextToast();
}

function playNextToast() {
  if (toastQueue.length === 0) {
    toastBusy = false;
    return;
  }
  toastBusy = true;

  const html = toastQueue.shift();
  dom.toast.innerHTML = html;
  dom.toast.classList.add('visible');

  setTimeout(() => {
    dom.toast.classList.remove('visible');
    setTimeout(playNextToast, 400);
  }, 3200);
}

/* =====================================================================
   뉴스 모달
===================================================================== */

function showNewsModal(news) {
  dom.newsModalText.textContent = news.text;
  dom.newsModal.classList.add('visible');
  newsModalShown = true;
}

function closeNewsModal() {
  dom.newsModal.classList.remove('visible');
  newsModalShown = false;
}

/* =====================================================================
   부도 & 상장폐지 관리
===================================================================== */

function checkBankruptcy(stock) {
  const isBankrupt = stock.price <= BANKRUPT_THRESHOLD;
  const wasWarned = bankruptcyWarnings[stock.id];

  if (isBankrupt && !wasWarned) {
    bankruptcyWarnings[stock.id] = true;
    queueToast(`⚠️ <strong>${stock.name}</strong> 부도 경고! 주가 100원 이하로 추락했습니다.`);
  }

  // 0원 도달 시 상장폐지
  if (stock.price <= DELISTING_PRICE && !stock.delisted) {
    stock.delisted = true;
    delete player.holdings[stock.id];
    queueToast(`💀 <strong>${stock.name}</strong> 상장폐지! 모든 주식이 휴지조각이 되었습니다.`);
  }
}

/* =====================================================================
   시세 틱 & 하루 진행
===================================================================== */

function applyTodaysNewsTrend(news) {
  stocks.forEach((stock) => {
    if (!stock.delisted && newsAffectsStock(news, stock)) {
      const dayTotalTarget = randomFloat(news.changeRange[0], news.changeRange[1]);
      stock.todayTickDrift = dayTotalTarget / TICKS_PER_DAY;
    } else {
      stock.todayTickDrift = 0;
    }
  });
}

function runPriceTick() {
  tickIndexToday += 1;

  stocks.forEach((stock) => {
    if (stock.delisted) return;

    stock.prevPrice = stock.price;

    // 틱당 변동률 계산
    const noise = randomFloat(-stock.tickVolatility, stock.tickVolatility);
    const baselineDrift = stock.dailyDrift / TICKS_PER_DAY;
    const changeRatio = noise + baselineDrift + stock.todayTickDrift;

    // 가격 업데이트
    let newPrice = Math.max(1, Math.round(stock.price * (1 + changeRatio)));

    // 일일 상한선 리미트 적용 (±30%)
    const maxPrice = Math.round(stock.dayStartPrice * 1.30);
    const minPrice = Math.round(stock.dayStartPrice * 0.70);
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

    stock.price = newPrice;
    stock.priceHistory.push(newPrice);

    // 부도 체크
    checkBankruptcy(stock);
  });

  updateChartDisplay();
  commit();
}

function updateTimerDisplay(remainingMs) {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  dom.timerText.textContent = `${mm}:${ss}`;

  const percent = Math.max(0, Math.min(100, (remainingMs / DAY_DURATION_MS) * 100));
  dom.timerFill.style.width = `${percent}%`;
}

function resolveDayEnd() {
  // 배당금 지급
  stocks.forEach((stock) => {
    if (!stock.delisted && stock.tags.includes('dividend')) {
      const qty = player.holdings[stock.id];
      if (qty > 0) {
        const dividend = Math.round(qty * stock.price * DIVIDEND_RATE);
        player.cash += dividend;
        queueToast(`${stock.emoji} ${stock.name} 배당금 ${formatWon(dividend)} 지급!`);
      }
    }
  });

  // 다음 날 뉴스 설정
  todaysNews = tomorrowsNews;
  tomorrowsNews = pickRandomNews();
  applyTodaysNewsTrend(todaysNews);

  // 차트 & 날짜 리셋
  stocks.forEach((s) => {
    if (!s.delisted) {
      s.dayStartPrice = s.price;
      s.priceHistory = [s.price];
    }
  });
  
  selectedStockId = null;
  tickIndexToday = 0;
  lastPriceTickElapsed = 0;
  bankruptcyWarnings = {};

  dayCount += 1;
  hintPurchasedToday = false;
  dayEndAt = Date.now() + DAY_DURATION_MS;

  showNewsModal(todaysNews);
  commit();
}

function tickClock() {
  const remaining = dayEndAt - Date.now();
  updateTimerDisplay(Math.max(0, remaining));

  if (remaining <= 0) {
    resolveDayEnd();
    return;
  }

  const elapsed = DAY_DURATION_MS - remaining;
  const tickSlot = Math.floor(elapsed / PRICE_TICK_MS);

  if (tickSlot !== lastPriceTickElapsed) {
    lastPriceTickElapsed = tickSlot;
    runPriceTick();
  }
}

/* =====================================================================
   초기화
===================================================================== */

function init() {
  initChart();

  const hasSave = loadGame();
  if (!hasSave) {
    applyTodaysNewsTrend(todaysNews);
    stocks.forEach((s) => { 
      s.dayStartPrice = s.price;
      s.priceHistory = [s.price];
    });
    saveGame();
    showNewsModal(todaysNews);
    checkAndShowTutorial();
  }

  renderAll();

  dom.stockTableBody.addEventListener('click', (e) => {
    handleStockNameClick(e);
    handleMarketClick(e);
  });

  dom.shopGrid.addEventListener('click', handleShopClick);
  dom.hintBtn.addEventListener('click', buyHint);
  dom.newsCloseBtn.addEventListener('click', closeNewsModal);
  dom.tutorialCloseBtn.addEventListener('click', closeTutorial);
  dom.resetBtn.addEventListener('click', resetGame);

  dom.newsModal.addEventListener('click', (e) => {
    if (e.target === dom.newsModal) {
      closeNewsModal();
    }
  });

  dom.tutorialModal.addEventListener('click', (e) => {
    if (e.target === dom.tutorialModal) {
      closeTutorial();
    }
  });

  setInterval(tickClock, 1000);
}

init();