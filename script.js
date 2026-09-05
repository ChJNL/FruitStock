/* =====================================================================
   프리미엄 모의투자 HTS (과일 테마 버전) - script.js
   -----------------------------------------------------------------
   전체 흐름:
   ① 종목/뉴스/업적/상점 데이터 → ② 게임 상태 변수 → ③ 화면 요소 참조
   → ④ 유틸 함수 → ⑤ 저장/불러오기 → ⑥ 렌더링 → ⑦ 매수/매도
   → ⑧ 정보상 → ⑨ 상점 → ⑩ 업적/토스트 → ⑪ 차트 → ⑫ 뉴스 모달
   → ⑬ 하루 진행 & 10초 시세 틱 (+ 밸런스 패치) → ⑭ 디버그 주가 조작
   → ⑮ 초기화
===================================================================== */

/* =====================================================================
   ① 종목 목록 (과일 테마 6개 종목으로 압축)
===================================================================== */
const stocks = [
  { id: 'apple-farm', ticker: 'APL', emoji: '🍎', name: '사과 농장',
    industry: '농업', category: '우량주', badgeClass: 'badge-blue-chip', chartColor: '#ff4d4d',
    price: 1200, prevPrice: 1200, dayStartPrice: 1200,
    tickVolatility: 0.004, tickCap: 0.02, dailyDrift: 0.005, todayTickDrift: 0, tags: ['farm'] },

  { id: 'banana-dist', ticker: 'BND', emoji: '🍌', name: '바나나 유통',
    industry: '유통', category: '우량주', badgeClass: 'badge-blue-chip', chartColor: '#ffd700',
    price: 1000, prevPrice: 1000, dayStartPrice: 1000,
    tickVolatility: 0.005, tickCap: 0.02, dailyDrift: 0.003, todayTickDrift: 0, tags: ['dist'] },

  { id: 'grape-pharma', ticker: 'GRP', emoji: '🍇', name: '포도당 제약',
    industry: '제약', category: '가치주', badgeClass: 'badge-value', chartColor: '#7fbf7f',
    price: 700, prevPrice: 700, dayStartPrice: 700,
    tickVolatility: 0.013, tickCap: 0.03, dailyDrift: 0, todayTickDrift: 0, tags: ['pharma'] },

  { id: 'blueberry-tech', ticker: 'BBT', emoji: '🫐', name: '블루베리 테크',
    industry: 'IT', category: '가치주', badgeClass: 'badge-value', chartColor: '#6fb1e0',
    price: 800, prevPrice: 800, dayStartPrice: 800,
    tickVolatility: 0.012, tickCap: 0.03, dailyDrift: 0.002, todayTickDrift: 0, tags: ['tech'] },

  { id: 'watermelon-enter', ticker: 'WME', emoji: '🍉', name: '수박 엔터',
    industry: '엔터', category: '테마주', badgeClass: 'badge-theme', chartColor: '#ff8fa3',
    price: 400, prevPrice: 400, dayStartPrice: 400,
    tickVolatility: 0.022, tickCap: 0.04, dailyDrift: 0, todayTickDrift: 0, tags: ['entertainment'] },

  { id: 'durian-games', ticker: 'DRG', emoji: '🍈', name: '두리안 게임즈',
    industry: '게임', category: '작전주', badgeClass: 'badge-manipulated', chartColor: '#8b8f9e',
    price: 250, prevPrice: 250, dayStartPrice: 250,
    tickVolatility: 0.032, tickCap: 0.05, dailyDrift: -0.003, todayTickDrift: 0, tags: ['game'] },
];

/* =====================================================================
   뉴스 이벤트 풀 (과일 테마로 전면 수정)
===================================================================== */
const NEWS_POOL = [
  { id: 'market-boom', type: 'market', text: '🌍 과일 시장 대풍년, 전 종목 동반 강세',
    hint: '시장 전체에 달콤한 과일 향기가 가득할 거란 소문이...', changeRange: [0.02, 0.05] },
  { id: 'market-crash', type: 'market', text: '📉 이상 기후 발생, 과일 시장 전체 한파',
    hint: '과일 시장에 서늘한 바람이 불 거란 소문이...', changeRange: [-0.05, -0.02] },

  { id: 'farm-good', type: 'tag', tag: 'farm', text: '🍎 꿀사과 당도 역대 최고치, 농업주 강세',
    hint: '농장 쪽에 대풍년 소식이 있을 거란 소문이...', changeRange: [0.03, 0.07] },
  { id: 'farm-bad', type: 'tag', tag: 'farm', text: '🍎 과수 화상병 우려 확산, 농업주 약세',
    hint: '농장에 전염병이 돌 거란 소문이...', changeRange: [-0.06, -0.02] },

  { id: 'dist-good', type: 'tag', tag: 'dist', text: '🍌 당일 로켓 배송 도입, 유통주 강세',
    hint: '유통망이 엄청나게 개선될 거란 소문이...', changeRange: [0.02, 0.06] },
  { id: 'dist-bad', type: 'tag', tag: 'dist', text: '🍌 화물 연대 파업, 과일 유통 차질',
    hint: '물류 쪽에 파업이 일어날 거란 소문이...', changeRange: [-0.05, -0.02] },

  { id: 'pharma-good', type: 'tag', tag: 'pharma', text: '🍇 포도당 추출 신약 특허, 제약주 강세',
    hint: '제약업계에 반가운 소식이 있을 거란 소문이...', changeRange: [0.05, 0.1] },
  { id: 'pharma-bad', type: 'tag', tag: 'pharma', text: '🍇 포도당 영양제 부작용 논란, 제약주 약세',
    hint: '제약업계에 걱정스러운 소식이 있을 거란 소문이...', changeRange: [-0.08, -0.04] },

  { id: 'tech-boom', type: 'tag', tag: 'tech', text: '🫐 AI 과일 신선도 판독기 대박, 테크주 강세',
    hint: 'IT 업종 쪽에서 혁신적인 기술이 나올 거란 소문이...', changeRange: [0.04, 0.08] },
  { id: 'tech-crash', type: 'tag', tag: 'tech', text: '🫐 스마트팜 서버 다운 사태, 테크주 약세',
    hint: 'IT 업종 쪽에 안 좋은 소식이 있을 거란 소문이...', changeRange: [-0.07, -0.03] },

  { id: 'ent-hit', type: 'tag', tag: 'entertainment', text: '🍉 수박 먹방 챌린지 전세계 유행, 엔터주 급등',
    hint: '엔터업계에서 틱톡 대박 소식이 터질 거란 소문이...', changeRange: [0.1, 0.22] },
  { id: 'ent-flop', type: 'tag', tag: 'entertainment', text: '🍉 소속 인플루언서 뒷광고 논란, 엔터주 급락',
    hint: '엔터업계에서 시끄러운 잡음이 들릴 거란 소문이...', changeRange: [-0.18, -0.08] },

  { id: 'game-jackpot', type: 'tag', tag: 'game', text: '🍈 신작 "두리안 키우기" 글로벌 히트!',
    hint: '게임업계에서 신작 대박 소식이 있을 거란 소문이...', changeRange: [0.15, 0.28] },
  { id: 'game-flop', type: 'tag', tag: 'game', text: '🍈 두리안 게임즈, 심각한 버그로 환불 사태',
    hint: '게임업계에서 흥행 참패 소식이 있을 거란 소문이...', changeRange: [-0.25, -0.12] },
];

/* =====================================================================
   업적 & 사치품 상점
===================================================================== */
const ACHIEVEMENTS = [
  { id: 'first-buy', emoji: '🌱', name: '첫 과일 바구니', desc: '생애 첫 과일 주식을 매수했다', check: (s) => s.everBought },
  { id: 'first-sell', emoji: '💵', name: '첫 수익 실현', desc: '생애 첫 매도를 완료했다', check: (s) => s.everSold },
  { id: 'bankrupt', emoji: '💀', name: '썩은 과일', desc: '현금이 마이너스가 되었다', check: (s) => s.cash < 0 },
  { id: 'rich-10k', emoji: '👑', name: '과일 재벌', desc: '총자산이 10,000원을 넘었다', check: (s) => s.totalAssets >= 10000 },
  { id: 'durian-madness', emoji: '🍈', name: '두리안의 기적', desc: '두리안 게임즈 주가가 900원을 넘었다', check: (s) => s.durianPrice >= 900 },
  { id: 'luxury-owner', emoji: '💎', name: '플렉스의 시작', desc: '사치품을 하나 이상 구매했다', check: (s) => s.ownedItemsCount >= 1 },
  { id: 'collector', emoji: '🏆', name: '모든 걸 가졌다', desc: '상점의 모든 자산을 구매했다', check: (s) => s.ownedItemsCount >= SHOP_ITEMS_COUNT },
  { id: 'survivor-10', emoji: '📅', name: '베테랑 상인', desc: '10일 동안 과일 시장에서 살아남았다', check: (s) => s.dayCount >= 10 },
];

const SHOP_ITEMS = [
  { id: 'my-car', emoji: '🚗', name: '과일 배달 트럭', price: 200, desc: '배달의 시작, 뿌듯함이 두 배' },
  { id: 'watch', emoji: '⌚', name: '명품 시계', price: 500, desc: '손목 위의 자산 증명서' },
  { id: 'sports-car', emoji: '🏎️', name: '스포츠카', price: 1500, desc: '질주 본능을 채워줄 스피드' },
  { id: 'yacht', emoji: '🛥️', name: '요트', price: 3000, desc: '주말은 바다 위에서' },
  { id: 'penthouse', emoji: '🏙️', name: '농장 펜트하우스', price: 8000, desc: '과수원 전체가 내려다보이는 집' },
];
const SHOP_ITEMS_COUNT = SHOP_ITEMS.length;

/* =====================================================================
   ② 게임 상태 변수 & 상수
===================================================================== */
const START_CASH = 1000;
const DAY_DURATION_MS = 3 * 60 * 1000;
const PRICE_TICK_MS = 10 * 1000;
const TICKS_PER_DAY = DAY_DURATION_MS / PRICE_TICK_MS;
const DAY_PRICE_LIMIT = 0.3;
const HINT_COST = 50;
const DIVIDEND_RATE = 0.01;
const SAVE_KEY = 'stockSimPremiumSaveV5'; // 충돌 방지를 위해 V5로 올림

const player = {
  cash: START_CASH,
  holdings: {
    'apple-farm': 0, 'banana-dist': 0, 'grape-pharma': 0,
    'blueberry-tech': 0, 'watermelon-enter': 0, 'durian-games': 0
  },
  ownedItems: [],
  unlockedAchievements: [],
  everBought: false,
  everSold: false,
};

let dayCount = 1;
let dayEndAt = Date.now() + DAY_DURATION_MS;
let hintPurchasedToday = false;
let todaysNews = pickRandomNews();
let tomorrowsNews = pickRandomNews();
let tickIndexToday = 0;
let lastPriceTickElapsed = 0;
let priceChart = null;

/* =====================================================================
   ③ 화면 요소 참조
===================================================================== */
const dom = {
  dayNumber: document.getElementById('dayNumber'),
  timerText: document.getElementById('timerText'),
  timerFill: document.getElementById('timerFill'),
  newsText: document.getElementById('newsText'),
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
  modalOverlay: document.getElementById('newsModalOverlay'),
  modalDayLabel: document.getElementById('modalDayLabel'),
  modalNewsText: document.getElementById('modalNewsText'),
  modalConfirmBtn: document.getElementById('modalConfirmBtn'),
  debugList: document.getElementById('debugList'),
};

/* =====================================================================
   ④ 유틸 함수
===================================================================== */
function formatWon(amount) { return `${Math.round(amount).toLocaleString('ko-KR')}원`; }
function formatPercent(ratio) {
  const sign = ratio > 0 ? '+' : '';
  return `${sign}${(ratio * 100).toFixed(1)}%`;
}
function randomFloat(min, max) { return Math.random() * (max - min) + min; }
function pickRandomNews() { return NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)]; }

function newsAffectsStock(news, stock) {
  if (news.type === 'market') return true;
  if (news.type === 'tag') return stock.tags.includes(news.tag);
  if (news.type === 'stock') return stock.id === news.targetId;
  return false;
}

function findStock(stockId) { return stocks.find((s) => s.id === stockId); }

function computeTotalAssets() {
  const stockValue = stocks.reduce((sum, s) => sum + s.price * player.holdings[s.id], 0);
  return player.cash + stockValue;
}

function commit() {
  renderAll();
  checkAchievements();
  saveGame();
}

/* =====================================================================
   ⑤ 저장 / 불러오기 (localStorage)
===================================================================== */
function saveGame() {
  const saveData = {
    cash: player.cash,
    holdings: player.holdings,
    ownedItems: player.ownedItems,
    unlockedAchievements: player.unlockedAchievements,
    everBought: player.everBought,
    everSold: player.everSold,
    dayCount, dayEndAt, hintPurchasedToday,
    todaysNewsId: todaysNews.id,
    tomorrowsNewsId: tomorrowsNews.id,
    stocks: stocks.map((s) => ({
      id: s.id, price: s.price, prevPrice: s.prevPrice,
      dayStartPrice: s.dayStartPrice, todayTickDrift: s.todayTickDrift,
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
   ⑥ 렌더링
===================================================================== */
function renderDayBadge() { dom.dayNumber.textContent = dayCount; }
function renderNews() { dom.newsText.textContent = todaysNews.text; }

function renderWallet() {
  dom.cashValue.textContent = formatWon(player.cash);
  dom.totalValue.textContent = formatWon(computeTotalAssets());

  const owned = stocks.filter((s) => player.holdings[s.id] > 0);
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
  const savedQty = {};
  stocks.forEach((s) => {
    const el = document.getElementById(`qty-${s.id}`);
    if (el) savedQty[s.id] = el.value;
  });

  dom.stockTableBody.innerHTML = stocks.map((stock) => {
    const diff = stock.price - stock.prevPrice;
    const ratio = stock.prevPrice ? diff / stock.prevPrice : 0;

    const isUp = diff > 0;
    const isDown = diff < 0;
    const flashClass = isUp ? 'flash-up' : isDown ? 'flash-down' : '';
    const changeClass = isUp ? 'change-up' : isDown ? 'change-down' : 'change-flat';
    const arrow = isUp ? '▲' : isDown ? '▼' : '-';

    const upperLimit = Math.round(stock.dayStartPrice * (1 + DAY_PRICE_LIMIT));
    const lowerLimit = Math.round(stock.dayStartPrice * (1 - DAY_PRICE_LIMIT));
    let limitTag = '';
    if (stock.price >= upperLimit) limitTag = '<span class="limit-tag limit-upper">상한가</span>';
    else if (stock.price <= lowerLimit) limitTag = '<span class="limit-tag limit-lower">하한가</span>';

    const canBuy = player.cash >= stock.price;
    const canSell = player.holdings[stock.id] > 0;

    return `
      <tr>
        <td class="cell-name" data-label="종목">
          <div class="stock-name-cell">
            <span class="stock-emoji">${stock.emoji}</span>
            <div>
              <div class="stock-name">${stock.name}</div>
              <div class="stock-ticker mono">${stock.industry} · ${stock.ticker}</div>
            </div>
          </div>
        </td>
        <td data-label="구분"><span class="badge ${stock.badgeClass}">${stock.category}</span></td>
        <td data-label="현재가" class="mono price-cell ${flashClass}">${stock.price.toLocaleString()}원 ${limitTag}</td>
        <td data-label="등락"><span class="change-badge ${changeClass}">${arrow} ${formatPercent(ratio)}</span></td>
        <td data-label="보유" class="mono">${player.holdings[stock.id]}주</td>
        <td class="cell-trade" data-label="거래">
          <div class="trade-controls">
            <input type="number" class="qty-input mono" id="qty-${stock.id}" value="1" min="1">
            <button class="btn buy-btn" data-action="buy" data-id="${stock.id}" ${canBuy ? '' : 'disabled'}>매수</button>
            <button class="btn sell-btn" data-action="sell" data-id="${stock.id}" ${canSell ? '' : 'disabled'}>매도</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  stocks.forEach((s) => {
    const el = document.getElementById(`qty-${s.id}`);
    if (el && savedQty[s.id] !== undefined) el.value = savedQty[s.id];
  });
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
  dom.hintText.textContent = hintPurchasedToday ? `"${tomorrowsNews.hint}"` : '"아직 정보를 사지 않았어요..."';
}

function renderDebugPanel() {
  const savedInputs = {};
  stocks.forEach((s) => {
    const el = document.getElementById(`debugPrice-${s.id}`);
    if (el) savedInputs[s.id] = el.value;
  });

  dom.debugList.innerHTML = stocks.map((stock) => `
    <div class="debug-row">
      <div class="debug-name">${stock.emoji} ${stock.name}</div>
      <div class="debug-price mono">${stock.price.toLocaleString()}원</div>
      <div class="debug-controls">
        <button class="btn debug-pump-btn" data-debug-action="pump" data-id="${stock.id}">🚀 +50%</button>
        <button class="btn debug-dump-btn" data-debug-action="dump" data-id="${stock.id}">📉 -50%</button>
        <input type="number" class="qty-input mono debug-input" id="debugPrice-${stock.id}" placeholder="직접입력" min="100">
        <button class="btn debug-apply-btn" data-debug-action="set" data-id="${stock.id}">적용</button>
      </div>
    </div>
  `).join('');

  stocks.forEach((s) => {
    const el = document.getElementById(`debugPrice-${s.id}`);
    if (el && savedInputs[s.id] !== undefined) el.value = savedInputs[s.id];
  });
}

function renderAll() {
  renderDayBadge();
  renderNews();
  renderWallet();
  renderMarket();
  renderShop();
  renderAchievements();
  renderHint();
  renderDebugPanel();
}

/* =====================================================================
   ⑦ 매수 / 매도
===================================================================== */
function buyStock(stockId, qty) {
  const stock = findStock(stockId);
  const cost = stock.price * qty;
  if (player.cash < cost) { alert('현금이 부족해요! 🥲'); return; }
  player.cash -= cost;
  player.holdings[stockId] += qty;
  player.everBought = true;
  commit();
}

function sellStock(stockId, qty) {
  const stock = findStock(stockId);
  if (player.holdings[stockId] < qty) { alert('보유한 수량보다 많이 팔 수 없어요! 🥲'); return; }
  player.holdings[stockId] -= qty;
  player.cash += stock.price * qty;
  player.everSold = true;
  commit();
}

function handleMarketClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const stockId = button.dataset.id;
  const qtyInput = document.getElementById(`qty-${stockId}`);
  const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
  if (button.dataset.action === 'buy') buyStock(stockId, qty);
  else sellStock(stockId, qty);
}

/* =====================================================================
   ⑧ 어둠의 정보상
===================================================================== */
function buyHint() {
  if (hintPurchasedToday) return;
  if (player.cash < HINT_COST) { alert('정보상에게 낼 돈이 부족해요! 🥲'); return; }
  player.cash -= HINT_COST;
  hintPurchasedToday = true;
  commit();
}

/* =====================================================================
   ⑨ 사치품 상점
===================================================================== */
function buyItem(itemId) {
  if (player.ownedItems.includes(itemId)) return;
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (player.cash < item.price) { alert('돈이 부족해요! 🥲'); return; }
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
   ⑩ 업적 & 토스트
===================================================================== */
function getAchievementState() {
  return {
    cash: player.cash,
    totalAssets: computeTotalAssets(),
    durianPrice: findStock('durian-games').price,
    ownedItemsCount: player.ownedItems.length,
    dayCount,
    everBought: player.everBought,
    everSold: player.everSold,
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
  if (toastQueue.length === 0) { toastBusy = false; return; }
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
   ⑪ 차트 (Chart.js)
===================================================================== */
function initChart() {
  const ctx = document.getElementById('priceChart').getContext('2d');
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: stocks.map((stock) => ({
        label: stock.name,
        data: [],
        borderColor: stock.chartColor,
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { ticks: { color: '#8b8f9e', maxRotation: 0 }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#8b8f9e', callback: (v) => `${v}%` }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
      plugins: { legend: { labels: { color: '#c7c9d1', boxWidth: 12, font: { size: 10 } } } },
    },
  });
}

function resetChart() {
  priceChart.data.labels = [];
  priceChart.data.datasets.forEach((ds) => { ds.data = []; });
  priceChart.update();
}

function updateChart() {
  priceChart.data.labels.push(`${tickIndexToday * 10}s`);

  stocks.forEach((stock, i) => {
    const changePercent = ((stock.price / stock.dayStartPrice) - 1) * 100;
    priceChart.data.datasets[i].data.push(changePercent.toFixed(2));
  });

  if (priceChart.data.labels.length > TICKS_PER_DAY) {
    priceChart.data.labels.shift();
    priceChart.data.datasets.forEach((ds) => ds.data.shift());
  }

  priceChart.update();
}

/* =====================================================================
   ⑫ 오늘의 뉴스 모달
===================================================================== */
function showNewsModal(news) {
  dom.modalDayLabel.textContent = `DAY ${dayCount}`;
  dom.modalNewsText.textContent = news.text;
  dom.modalOverlay.classList.add('visible');
}

function hideNewsModal() {
  dom.modalOverlay.classList.remove('visible');
}

/* =====================================================================
   ⑬ 하루 진행 & 10초 시세 틱 (+ 밸런스 패치)
===================================================================== */
function applyTodaysNewsTrend(news) {
  stocks.forEach((stock) => {
    if (newsAffectsStock(news, stock)) {
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
    stock.prevPrice = stock.price;

    const noise = randomFloat(-stock.tickVolatility, stock.tickVolatility);
    const baselineDrift = stock.dailyDrift / TICKS_PER_DAY;
    let changeRatio = noise + baselineDrift + stock.todayTickDrift;

    changeRatio = Math.max(-stock.tickCap, Math.min(stock.tickCap, changeRatio));

    const rawPrice = stock.price * (1 + changeRatio);

    const upperLimit = stock.dayStartPrice * (1 + DAY_PRICE_LIMIT);
    const lowerLimit = stock.dayStartPrice * (1 - DAY_PRICE_LIMIT);
    const clampedPrice = Math.min(upperLimit, Math.max(lowerLimit, rawPrice));

    stock.price = Math.max(1, Math.round(clampedPrice));
  });

  updateChart();
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
  // 과일 테마에 맞춘 배당금 이벤트 (바나나 유통)
  const dividendStock = findStock('banana-dist');
  const dividendQty = player.holdings['banana-dist'];
  if (dividendQty > 0) {
    const dividend = Math.round(dividendQty * dividendStock.price * DIVIDEND_RATE);
    player.cash += dividend;
    queueToast(`🍌 바나나 유통 배당금 ${formatWon(dividend)} 지급!`);
  }

  todaysNews = tomorrowsNews;
  tomorrowsNews = pickRandomNews();
  applyTodaysNewsTrend(todaysNews);

  stocks.forEach((s) => { s.dayStartPrice = s.price; });
  resetChart();
  tickIndexToday = 0;
  lastPriceTickElapsed = 0;

  dayCount += 1;
  hintPurchasedToday = false;
  dayEndAt = Date.now() + DAY_DURATION_MS;

  commit();
  showNewsModal(todaysNews);
}

function tickClock() {
  const remaining = dayEndAt - Date.now();
  updateTimerDisplay(Math.max(0, remaining));

  if (remaining <= 0) { resolveDayEnd(); return; }

  const elapsed = DAY_DURATION_MS - remaining;
  const tickSlot = Math.floor(elapsed / PRICE_TICK_MS);
  if (tickSlot !== lastPriceTickElapsed) {
    lastPriceTickElapsed = tickSlot;
    runPriceTick();
  }
}

/* =====================================================================
   ⑭ 디버그: 주가 조작 (치트 기능)
===================================================================== */
const DEBUG_MIN_PRICE = 100; 

function manipulateStock(stockId, mode, customValue) {
  const stock = findStock(stockId);

  stock.prevPrice = stock.price;

  let target;
  if (mode === 'pump') target = stock.price * 1.5;
  else if (mode === 'dump') target = stock.price * 0.5;
  else target = customValue;

  stock.price = Math.max(DEBUG_MIN_PRICE, Math.round(target));
  stock.dayStartPrice = stock.price;

  tickIndexToday += 1;
  updateChart();
  commit();
}

function handleDebugClick(event) {
  const button = event.target.closest('button[data-debug-action]');
  if (!button) return;

  const stockId = button.dataset.id;
  const action = button.dataset.debugAction;

  if (action === 'pump') {
    manipulateStock(stockId, 'pump');
  } else if (action === 'dump') {
    manipulateStock(stockId, 'dump');
  } else if (action === 'set') {
    const input = document.getElementById(`debugPrice-${stockId}`);
    const value = parseInt(input.value, 10);
    if (!value || value <= 0) { alert('올바른 금액을 입력해주세요!'); return; }
    manipulateStock(stockId, 'set', value);
    input.value = '';
  }
}

/* =====================================================================
   ⑮ 초기화
===================================================================== */
function init() {
  initChart();

  const hasSave = loadGame();
  if (!hasSave) {
    applyTodaysNewsTrend(todaysNews);
    stocks.forEach((s) => { s.dayStartPrice = s.price; });
    saveGame();
  }

  renderAll();

  if (!hasSave) {
    showNewsModal(todaysNews);
  }

  dom.stockTableBody.addEventListener('click', handleMarketClick);
  dom.shopGrid.addEventListener('click', handleShopClick);
  dom.hintBtn.addEventListener('click', buyHint);
  dom.resetBtn.addEventListener('click', resetGame);
  dom.modalConfirmBtn.addEventListener('click', hideNewsModal);
  dom.debugList.addEventListener('click', handleDebugClick);

  setInterval(tickClock, 1000);
}

init();