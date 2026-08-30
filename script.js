/* =====================================================================
   🍓 과일 주식 모의투자 - 스마트폰 시스템
   -----------------------------------------------------------------
   새로운 구조:
   1. 메인 화면: 헤더 + 타이머/뉴스 바 + 거래 영역
   2. 스마트폰 모달: 사용법/업적/사치품/자산정보
===================================================================== */

/* =====================================================================
   종목 목록 (과일/디저트 테마)
===================================================================== */
const stocks = [
  {
    id: 'apple-mango', ticker: 'AMNG', emoji: '🍎', name: '애플망고',
    category: '우량주', price: 45000, prevPrice: 45000, dayStartPrice: 45000,
    tickVolatility: 0.008, dailyDrift: 0.004, todayTickDrift: 0,
    tags: ['tech'], delisted: false, priceHistory: [45000],
  },
  {
    id: 'strawberry-soft', ticker: 'STRB', emoji: '🍓', name: '딸기소프트',
    price: 38000, prevPrice: 38000, dayStartPrice: 38000,
    tickVolatility: 0.010, dailyDrift: 0.005, todayTickDrift: 0,
    tags: ['tech', 'growth'], delisted: false, priceHistory: [38000],
  },
  {
    id: 'durian-bio', ticker: 'DURB', emoji: '🦔', name: '두리안바이오',
    price: 28000, prevPrice: 28000, dayStartPrice: 28000,
    tickVolatility: 0.025, dailyDrift: 0, todayTickDrift: 0,
    tags: ['biotech'], delisted: false, priceHistory: [28000],
  },
  {
    id: 'mango-tex', ticker: 'MGTX', emoji: '🥭', name: '망고텍스',
    price: 22000, prevPrice: 22000, dayStartPrice: 22000,
    tickVolatility: 0.018, dailyDrift: 0.002, todayTickDrift: 0,
    tags: ['tech'], delisted: false, priceHistory: [22000],
  },
  {
    id: 'cherry-health', ticker: 'CHRY', emoji: '🍒', name: '체리헬스',
    price: 32000, prevPrice: 32000, dayStartPrice: 32000,
    tickVolatility: 0.006, dailyDrift: 0.003, todayTickDrift: 0,
    tags: ['healthcare'], delisted: false, priceHistory: [32000],
  },
  {
    id: 'blueberry-tech', ticker: 'BLUB', emoji: '🫐', name: '블루베리테크',
    price: 25000, prevPrice: 25000, dayStartPrice: 25000,
    tickVolatility: 0.010, dailyDrift: 0, todayTickDrift: 0,
    tags: ['tech'], delisted: false, priceHistory: [25000],
  },
  {
    id: 'grape-dream', ticker: 'GRDM', emoji: '🍇', name: '포도드림',
    price: 18000, prevPrice: 18000, dayStartPrice: 18000,
    tickVolatility: 0.015, dailyDrift: 0, todayTickDrift: 0,
    tags: ['entertainment'], delisted: false, priceHistory: [18000],
  },
  {
    id: 'kiwi-wood', ticker: 'KIWI', emoji: '🥝', name: '키위우드',
    price: 16000, prevPrice: 16000, dayStartPrice: 16000,
    tickVolatility: 0.020, dailyDrift: -0.002, todayTickDrift: 0,
    tags: ['manufacturing'], delisted: false, priceHistory: [16000],
  },
  {
    id: 'orange-food', ticker: 'ORNG', emoji: '🍊', name: '귤푸드',
    price: 14000, prevPrice: 14000, dayStartPrice: 14000,
    tickVolatility: 0.012, dailyDrift: 0.003, todayTickDrift: 0,
    tags: ['food', 'dividend'], delisted: false, priceHistory: [14000],
  },
  {
    id: 'watermelon-ent', ticker: 'WMNT', emoji: '🍉', name: '수박엔터',
    price: 20000, prevPrice: 20000, dayStartPrice: 20000,
    tickVolatility: 0.014, dailyDrift: 0.002, todayTickDrift: 0,
    tags: ['entertainment', 'dividend'], delisted: false, priceHistory: [20000],
  },
  {
    id: 'mandarin-finance', ticker: 'MNDF', emoji: '🍊', name: '귤파이낸스',
    price: 35000, prevPrice: 35000, dayStartPrice: 35000,
    tickVolatility: 0.007, dailyDrift: 0.002, todayTickDrift: 0,
    tags: ['finance'], delisted: false, priceHistory: [35000],
  },
  {
    id: 'mangosteen-fund', ticker: 'MSGF', emoji: '🍃', name: '망고스틴펀드',
    price: 19000, prevPrice: 19000, dayStartPrice: 19000,
    tickVolatility: 0.022, dailyDrift: 0, todayTickDrift: 0,
    tags: ['finance'], delisted: false, priceHistory: [19000],
  },
];

/* =====================================================================
   뉴스 풀
===================================================================== */
const NEWS_POOL = [
  { id: 'market-rally', type: 'market', text: '🌍 글로벌 경기 강세, 전 종목 급등', 
    brief: '전 종목 급등', changeRange: [0.05, 0.12] },
  { id: 'market-crash', type: 'market', text: '📉 금리 인상 우려, 전 종목 약세',
    brief: '전 종목 약세', changeRange: [-0.12, -0.05] },
  { id: 'tech-boom', type: 'tag', tag: 'tech', text: '💻 AI 산업 호황, 테크주 급등',
    brief: 'AI 산업 호황', changeRange: [0.08, 0.18] },
  { id: 'tech-slowdown', type: 'tag', tag: 'tech', text: '💻 반도체 수급 악화, 테크주 조정',
    brief: '반도체 수급 악화', changeRange: [-0.10, -0.03] },
  { id: 'biotech-approval', type: 'tag', tag: 'biotech', text: '🧬 신약 임상 성공, 바이오 폭등',
    brief: '신약 임상 성공', changeRange: [0.15, 0.35] },
  { id: 'biotech-scandal', type: 'tag', tag: 'biotech', text: '🧬 임상 부작용, 바이오 급락',
    brief: '임상 부작용', changeRange: [-0.25, -0.08] },
  { id: 'healthcare-boom', type: 'tag', tag: 'healthcare', text: '🏥 의료 개혁법 시행, 헬스주 강세',
    brief: '의료 개혁법', changeRange: [0.08, 0.15] },
  { id: 'food-inflation', type: 'tag', tag: 'food', text: '🌾 농산물 가격 상승, 식품주 강세',
    brief: '농산물 가격 상승', changeRange: [0.04, 0.12] },
  { id: 'entertainment-hit', type: 'tag', tag: 'entertainment', text: '🎬 영화 대박, 엔터주 급등',
    brief: '영화 대박', changeRange: [0.10, 0.25] },
  { id: 'finance-rally', type: 'tag', tag: 'finance', text: '🏦 금리 인상, 금융주 수혜',
    brief: '금리 인상 수혜', changeRange: [0.06, 0.15] },
  { id: 'durian-jackpot', type: 'stock', targetId: 'durian-bio', text: '🚀 두리안바이오, 신약 승인! 주가 폭등',
    brief: '두리안 신약 승인', changeRange: [2.0, 6.0] },
  { id: 'strawberry-scandal', type: 'stock', targetId: 'strawberry-soft', text: '📰 딸기소프트, 보안 사고 발생',
    brief: '딸기소프트 보안 사고', changeRange: [-0.15, -0.05] },
];

/* =====================================================================
   업적 & 상점
===================================================================== */
const ACHIEVEMENTS = [
  { id: 'first-buy', emoji: '🌱', name: '첫 투자', desc: '생애 첫 주식을 매수했다',
    check: (s) => s.everBought },
  { id: 'first-sell', emoji: '💵', name: '첫 수익 실현', desc: '생애 첫 매도를 완료했다',
    check: (s) => s.everSold },
  { id: 'millionaire', emoji: '👑', name: '천만 자산가', desc: '순자산이 1천만 원을 넘었다',
    check: (s) => s.totalAssets >= 10000000 },
  { id: 'trader', emoji: '💎', name: '활동적 투자자', desc: '한 종목을 10회 이상 거래했다',
    check: (s) => s.tradeCount >= 10 },
  { id: 'survivor-5', emoji: '📅', name: '1주일 생존', desc: '5일 동안 시장에서 살아남았다',
    check: (s) => s.dayCount >= 5 },
  { id: 'collector', emoji: '🏆', name: '모든 걸 가졌다', desc: '상점의 모든 아이템을 구매했다',
    check: (s) => s.ownedItemsCount >= SHOP_ITEMS.length },
];

const SHOP_ITEMS = [
  { id: 'luxury-watch', emoji: '⌚', name: '명품 시계', price: 5000000, desc: '손목 위의 자산 증명서' },
  { id: 'sports-car', emoji: '🏎️', name: '슈퍼카', price: 10000000, desc: '질주 본능을 채워줄 스피드' },
  { id: 'apartment', emoji: '🏢', name: '강남 오피스텔', price: 20000000, desc: '도시 한복판의 부동산' },
  { id: 'yacht', emoji: '🛥️', name: '개인 요트', price: 50000000, desc: '주말은 바다 위에서' },
  { id: 'private-jet', emoji: '✈️', name: '프라이빗 제트', price: 100000000, desc: '세계 어디로든 한 번에' },
];

/* =====================================================================
   상수 & 상태
===================================================================== */
const START_CASH = 100000;
const DAY_DURATION_MS = 3 * 60 * 1000;
const PRICE_TICK_MS = 10 * 1000;
const TICKS_PER_DAY = DAY_DURATION_MS / PRICE_TICK_MS;
const HINT_COST = 100;
const DIVIDEND_RATE = 0.02;
const DAILY_PRICE_LIMIT = 0.30;
const BANKRUPT_THRESHOLD = 100;
const SAVE_KEY = 'stockSimulatorSave';
const TUTORIAL_SHOWN_KEY = 'tutorialShown';

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
let selectedStockId = null;
let bankruptcyWarnings = {};

/* =====================================================================
   DOM 요소
===================================================================== */
const dom = {
  // 메인 영역
  dayNumber: document.getElementById('dayNumber'),
  timerText: document.getElementById('timerText'),
  timerFill: document.getElementById('timerFill'),
  newsBrief: document.getElementById('newsBrief'),
  marketList: document.getElementById('marketList'),
  chartPlaceholder: document.getElementById('chartPlaceholder'),
  chartWrap: document.getElementById('chartWrap'),
  priceChart: document.getElementById('priceChart'),

  // 뉴스 모달
  newsModal: document.getElementById('newsModal'),
  newsModalText: document.getElementById('newsModalText'),
  newsCloseBtn: document.getElementById('newsCloseBtn'),

  // 스마트폰 모달
  phoneModal: document.getElementById('phoneModal'),
  phoneOpenBtn: document.getElementById('phoneOpenBtn'),
  phoneCloseBtn: document.getElementById('phoneCloseBtn'),
  phoneContent: document.getElementById('phoneContent'),
  phoneHome: document.getElementById('phoneHome'),
  phoneTime: document.getElementById('phoneTime'),
  appGuide: document.getElementById('app-guide'),
  appAchievement: document.getElementById('app-achievement'),
  appShop: document.getElementById('app-shop'),
  appInfo: document.getElementById('app-info'),

  // 전화 앱 내용
  phoneCash: document.getElementById('phoneCash'),
  phoneTotal: document.getElementById('phoneTotal'),
  phoneHoldings: document.getElementById('phoneHoldings'),
  phoneHintText: document.getElementById('phoneHintText'),
  phoneBuyHintBtn: document.getElementById('phoneBuyHintBtn'),
  phoneResetBtn: document.getElementById('phoneResetBtn'),
  phoneAchvGrid: document.getElementById('phoneAchvGrid'),
  phoneShopGrid: document.getElementById('phoneShopGrid'),

  // 토스트
  toast: document.getElementById('toast'),
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
  renderMarket();
  updateChartDisplay();
  updatePhoneScreen();
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
      id: s.id, price: s.price, prevPrice: s.prevPrice, dayStartPrice: s.dayStartPrice,
      todayTickDrift: s.todayTickDrift, delisted: s.delisted,
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
   스마트폰 모달 관리
===================================================================== */

function openPhone() {
  dom.phoneModal.classList.add('visible');
  updatePhoneTime();
}

function closePhone() {
  dom.phoneModal.classList.remove('visible');
}

function updatePhoneTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  dom.phoneTime.textContent = `${h}:${m}`;
}

function goToPhoneApp(appName) {
  // 홈 화면 숨기기
  dom.phoneHome.style.display = 'none';

  // 모든 앱 화면 숨기기
  [dom.appGuide, dom.appAchievement, dom.appShop, dom.appInfo].forEach(el => {
    el.style.display = 'none';
  });

  // 해당 앱 보이기
  if (appName === 'guide') dom.appGuide.style.display = 'flex';
  if (appName === 'achievement') dom.appAchievement.style.display = 'flex';
  if (appName === 'shop') dom.appShop.style.display = 'flex';
  if (appName === 'info') dom.appInfo.style.display = 'flex';
}

function goToPhoneHome() {
  [dom.appGuide, dom.appAchievement, dom.appShop, dom.appInfo].forEach(el => {
    el.style.display = 'none';
  });
  dom.phoneHome.style.display = 'grid';
}

/* =====================================================================
   렌더링
===================================================================== */

function renderMarket() {
  dom.dayNumber.textContent = dayCount;
  dom.newsBrief.textContent = todaysNews.brief || todaysNews.text;

  dom.marketList.innerHTML = stocks
    .filter((s) => !s.delisted)
    .map((stock) => {
      const diff = stock.price - stock.prevPrice;
      const ratio = stock.prevPrice ? diff / stock.prevPrice : 0;
      const isUp = diff > 0;
      const isDown = diff < 0;
      const isBankrupt = stock.price <= BANKRUPT_THRESHOLD;

      let changeClass = '';
      let changeText = '';
      if (isBankrupt) {
        changeClass = 'danger';
        changeText = '💀위험';
      } else {
        changeClass = isUp ? 'up' : isDown ? 'down' : 'flat';
        changeText = (isUp ? '▲' : isDown ? '▼' : '-') + ' ' + formatPercent(ratio);
      }

      const canBuy = player.cash >= stock.price && !isBankrupt;
      const canSell = player.holdings[stock.id] > 0;

      return `
        <div class="market-item ${selectedStockId === stock.id ? 'selected' : ''}" data-stock-id="${stock.id}">
          <div class="item-name-section">
            <span class="item-emoji">${stock.emoji}</span>
            <div class="item-name-text">
              <div class="item-name">${stock.name}</div>
              <div class="item-ticker">${stock.ticker}</div>
            </div>
          </div>
          <div class="item-price">${stock.price.toLocaleString()}</div>
          <div class="item-change ${changeClass}">${changeText}</div>
          <div class="item-controls">
            <input type="number" class="qty-input" id="qty-${stock.id}" value="1" min="1">
            <button class="btn btn-buy" data-action="buy" data-id="${stock.id}" ${canBuy ? '' : 'disabled'}>매수</button>
            <button class="btn btn-sell" data-action="sell" data-id="${stock.id}" ${canSell ? '' : 'disabled'}>매도</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function updatePhoneScreen() {
  const total = computeTotalAssets();
  dom.phoneCash.textContent = formatWon(player.cash);
  dom.phoneTotal.textContent = formatWon(total);

  const owned = stocks.filter((s) => player.holdings[s.id] > 0 && !s.delisted);
  dom.phoneHoldings.innerHTML = owned.length === 0
    ? '<li class="holdings-empty">보유 종목 없음</li>'
    : owned.map((s) => `
        <li class="holdings-item">
          <span>${s.emoji} ${s.name}</span>
          <span class="mono">${player.holdings[s.id]}주</span>
        </li>
      `).join('');

  dom.phoneHintText.textContent = hintPurchasedToday
    ? `"${tomorrowsNews.text}"`
    : '"아직 정보를 사지 않았어요..."';
  dom.phoneBuyHintBtn.disabled = hintPurchasedToday || player.cash < HINT_COST;
  dom.phoneBuyHintBtn.textContent = hintPurchasedToday ? '오늘은 이미 구매함' : `구매`;

  // 업적 렌더링
  dom.phoneAchvGrid.innerHTML = ACHIEVEMENTS.map((ach) => {
    const unlocked = player.unlockedAchievements.includes(ach.id);
    return `
      <div class="phone-achv-item ${unlocked ? 'unlocked' : 'locked'}">
        <div class="achv-emoji">${ach.emoji}</div>
        <div class="achv-name">${ach.name}</div>
        <div class="achv-desc">${unlocked ? ach.desc : '???'}</div>
      </div>
    `;
  }).join('');

  // 상점 렌더링
  dom.phoneShopGrid.innerHTML = SHOP_ITEMS.map((item) => {
    const owned = player.ownedItems.includes(item.id);
    const canBuy = !owned && player.cash >= item.price;
    return `
      <div class="phone-shop-item ${owned ? 'owned' : ''}">
        <div class="shop-emoji">${item.emoji}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-price">${formatWon(item.price)}</div>
        ${owned
          ? '<div class="owned-tag">✓ 보유중</div>'
          : `<button class="buy-shop-btn" data-item="${item.id}" ${canBuy ? '' : 'disabled'}>구매</button>`}
      </div>
    `;
  }).join('');
}

function initChart() {
  selectedStockId = null;
  dom.chartWrap.style.display = 'none';
  dom.chartPlaceholder.style.display = 'flex';
}

function updateChartDisplay() {
  if (!selectedStockId) {
    dom.chartWrap.style.display = 'none';
    dom.chartPlaceholder.style.display = 'flex';
    return;
  }

  const stock = findStock(selectedStockId);
  if (!stock || stock.delisted) {
    selectedStockId = null;
    dom.chartWrap.style.display = 'none';
    dom.chartPlaceholder.style.display = 'flex';
    return;
  }

  dom.chartPlaceholder.style.display = 'none';
  dom.chartWrap.style.display = 'block';

  const isUp = stock.price > stock.dayStartPrice;
  const lineColor = isUp ? '#e0483e' : '#4f83cc';

  if (!priceChart) {
    const ctx = dom.priceChart.getContext('2d');
    priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: `${stock.emoji} ${stock.name}`,
          data: [],
          borderColor: lineColor,
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 3,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            ticks: { color: '#8b8f9e', maxRotation: 0, font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            ticks: {
              color: '#8b8f9e',
              callback: (v) => `${v.toLocaleString()}원`,
              font: { size: 10 },
            },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
        },
        plugins: {
          legend: {
            labels: { color: '#c7c9d1', boxWidth: 10, font: { size: 11 } },
          },
        },
      },
    });
  }

  priceChart.data.labels = [];
  priceChart.data.datasets[0].data = [];
  priceChart.data.datasets[0].borderColor = lineColor;

  stock.priceHistory.forEach((price, index) => {
    priceChart.data.labels.push(`${index * 10}s`);
    priceChart.data.datasets[0].data.push(price);
  });

  priceChart.update();
}

/* =====================================================================
   거래
===================================================================== */

function buyStock(stockId, qty) {
  const stock = findStock(stockId);

  if (stock.delisted) {
    alert('상장폐지된 종목입니다!');
    return;
  }

  if (stock.price <= BANKRUPT_THRESHOLD) {
    alert('부도 위험 종목은 매수 불가!');
    return;
  }

  const cost = stock.price * qty;
  if (player.cash < cost) {
    alert('현금 부족!');
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
    alert('보유 수량 부족!');
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
  const nameSection = event.target.closest('.item-name-section');
  if (nameSection) {
    const item = nameSection.closest('.market-item');
    selectedStockId = item.dataset.stockId;
    updateChartDisplay();
    renderMarket();
    return;
  }

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
   정보상 & 상점
===================================================================== */

function buyHint() {
  if (hintPurchasedToday) return;
  if (player.cash < HINT_COST) {
    alert('현금 부족!');
    return;
  }

  player.cash -= HINT_COST;
  hintPurchasedToday = true;
  commit();
}

function buyShopItem(itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (player.ownedItems.includes(itemId) || player.cash < item.price) {
    alert('구매 불가!');
    return;
  }

  player.cash -= item.price;
  player.ownedItems.push(itemId);
  commit();
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
      queueToast(`🏆 업적 달성! <strong>${ach.name}</strong>`);
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
  }, 3000);
}

/* =====================================================================
   뉴스 모달
===================================================================== */

function showNewsModal(news) {
  dom.newsModalText.textContent = news.text;
  dom.newsModal.classList.add('visible');
}

function closeNewsModal() {
  dom.newsModal.classList.remove('visible');
}

/* =====================================================================
   부도 관리
===================================================================== */

function checkBankruptcy(stock) {
  if (stock.price <= BANKRUPT_THRESHOLD && !bankruptcyWarnings[stock.id]) {
    bankruptcyWarnings[stock.id] = true;
    queueToast(`⚠️ ${stock.emoji} ${stock.name} 부도 경고!`);
  }

  if (stock.price <= 0 && !stock.delisted) {
    stock.delisted = true;
    delete player.holdings[stock.id];
    queueToast(`💀 ${stock.emoji} ${stock.name} 상장폐지!`);
  }
}

/* =====================================================================
   시세 틱 & 일일 정산
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

    const noise = randomFloat(-stock.tickVolatility, stock.tickVolatility);
    const baselineDrift = stock.dailyDrift / TICKS_PER_DAY;
    const changeRatio = noise + baselineDrift + stock.todayTickDrift;

    let newPrice = Math.max(1, Math.round(stock.price * (1 + changeRatio)));

    const maxPrice = Math.round(stock.dayStartPrice * 1.30);
    const minPrice = Math.round(stock.dayStartPrice * 0.70);
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

    stock.price = newPrice;
    stock.priceHistory.push(newPrice);

    checkBankruptcy(stock);
  });

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
  // 배당금
  stocks.forEach((stock) => {
    if (!stock.delisted && stock.tags.includes('dividend')) {
      const qty = player.holdings[stock.id];
      if (qty > 0) {
        const dividend = Math.round(qty * stock.price * DIVIDEND_RATE);
        player.cash += dividend;
        queueToast(`${stock.emoji} 배당금 ${formatWon(dividend)}`);
      }
    }
  });

  // 다음 날 뉴스
  todaysNews = tomorrowsNews;
  tomorrowsNews = pickRandomNews();
  applyTodaysNewsTrend(todaysNews);

  // 초기화
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
  }

  renderMarket();
  updatePhoneScreen();

  // 메인 화면 이벤트
  dom.marketList.addEventListener('click', handleMarketClick);
  dom.phoneOpenBtn.addEventListener('click', openPhone);
  dom.phoneCloseBtn.addEventListener('click', closePhone);
  dom.newsCloseBtn.addEventListener('click', closeNewsModal);

  // 스마트폰 앱 아이콘
  dom.phoneHome.addEventListener('click', (e) => {
    const icon = e.target.closest('.phone-app-icon');
    if (icon) goToPhoneApp(icon.dataset.app);
  });

  // 뒤로 가기 버튼
  document.querySelectorAll('.app-back-btn').forEach(btn => {
    btn.addEventListener('click', goToPhoneHome);
  });

  // 정보상 & 상점
  dom.phoneBuyHintBtn.addEventListener('click', buyHint);
  dom.phoneResetBtn.addEventListener('click', resetGame);

  dom.phoneShopGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-item]');
    if (btn) buyShopItem(btn.dataset.item);
  });

  // 뉴스 모달 배경 클릭
  dom.newsModal.addEventListener('click', (e) => {
    if (e.target === dom.newsModal) closeNewsModal();
  });

  dom.phoneModal.addEventListener('click', (e) => {
    if (e.target === dom.phoneModal) closePhone();
  });

  // 매분 폰 시간 업데이트
  setInterval(updatePhoneTime, 10000);

  // 메인 게임 루프
  setInterval(tickClock, 1000);
}

init();