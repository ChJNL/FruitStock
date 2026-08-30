/* =====================================================================
   프리미엄 과일 주식 시뮬레이터 - script.js
   -----------------------------------------------------------------
   전체 흐름:
   ① 데이터 정의(회사/뉴스/업적/상점) → ② 게임 상태 변수 → ③ 화면 요소 참조
   → ④ 유틸 함수 → ⑤ 저장/불러오기(localStorage) → ⑥ 렌더링 함수
   → ⑦ 매수/매도 → ⑧ 은행(대출) → ⑨ 정보상(힌트) → ⑩ 상점 → ⑪ 업적/토스트
   → ⑫ 차트(Chart.js) → ⑬ 하루 진행 & 10초 시세 틱 → ⑭ 초기화
===================================================================== */


/* =====================================================================
   ① 과일 회사 목록
   -----------------------------------------------------------------
   파이썬으로 치면 list of dict 입니다. tags는 "이 회사가 어떤 종류의
   뉴스에 반응하는가"를 나타내는 리스트예요.
   tickVolatility는 "10초 틱 한 번마다" 기본으로 얼마나 흔들리는지,
   dailyDrift는 "하루 전체에 걸쳐" 은근히 깔리는 방향성(우상향/우하향)입니다.
===================================================================== */
const fruits = [
  {
    id: 'apple-electronics', ticker: 'APPL', emoji: '🍎', name: '애플전자',
    category: '우량주', badgeClass: 'badge-blue-chip', chartColor: '#c7c9d1',
    price: 50000, prevPrice: 50000, dayStartPrice: 50000,
    tickVolatility: 0.004,  // 틱당 ±0.4%
    dailyDrift: 0.006,      // 하루 전체 평균 +0.6% 우상향
    todayTickDrift: 0,      // 오늘의 뉴스가 만든 틱당 추가 추세 (게임 중 계산됨)
    tags: ['blue-chip'],
  },
  {
    id: 'delmonte-banana', ticker: 'DELB', emoji: '🍌', name: '델몬트바나나',
    category: '우량주', badgeClass: 'badge-blue-chip', chartColor: '#e5c76b',
    price: 30000, prevPrice: 30000, dayStartPrice: 30000,
    tickVolatility: 0.006,
    dailyDrift: 0.003,
    todayTickDrift: 0,
    tags: ['dividend'],
  },
  {
    id: 'jeju-citrus-air', ticker: 'JCIT', emoji: '🍊', name: '제주감귤항공',
    category: '가치주', badgeClass: 'badge-value', chartColor: '#f2994a',
    price: 20000, prevPrice: 20000, dayStartPrice: 20000,
    tickVolatility: 0.012,
    dailyDrift: 0,
    todayTickDrift: 0,
    tags: ['weather'],
  },
  {
    id: 'shine-muscat-luxury', ticker: 'SMLX', emoji: '🍇', name: '샤인머스캣럭셔리',
    category: '가치주', badgeClass: 'badge-value', chartColor: '#9b6fd1',
    price: 25000, prevPrice: 25000, dayStartPrice: 25000,
    tickVolatility: 0.014,
    dailyDrift: 0,
    todayTickDrift: 0,
    tags: ['trend'],
  },
  {
    id: 'watermelon-entertainment', ticker: 'WMEN', emoji: '🍉', name: '수박엔터테인먼트',
    category: '테마주', badgeClass: 'badge-theme', chartColor: '#4ecb8f',
    price: 15000, prevPrice: 15000, dayStartPrice: 15000,
    tickVolatility: 0.025,
    dailyDrift: 0,
    todayTickDrift: 0,
    tags: ['entertainment'],
  },
  {
    id: 'durian-bio', ticker: 'DURB', emoji: '🦔', name: '두리안바이오',
    category: '작전주', badgeClass: 'badge-manipulated', chartColor: '#e0668f',
    price: 8000, prevPrice: 8000, dayStartPrice: 8000,
    tickVolatility: 0.05,   // 틱당 ±5% - 매우 큼
    dailyDrift: -0.005,
    todayTickDrift: 0,
    tags: ['biotech'],
  },
];


/* =====================================================================
   뉴스 이벤트 풀
   -----------------------------------------------------------------
   changeRange는 이제 "그날 하루 전체에 걸쳐 누적으로 만들고 싶은 목표
   등락률"이에요. 하루가 시작될 때 이 범위 안에서 딱 한 번 목표치를
   뽑고, 그걸 하루의 틱 개수(30번)로 잘게 나눠서 매 10초마다 조금씩
   반영합니다. (자세한 계산은 ⑬번 섹션 applyTodaysNewsTrend 참고)
===================================================================== */
const NEWS_POOL = [
  { id: 'market-boom', type: 'market', text: '🌍 글로벌 경기 훈풍, 전 종목 동반 강세',
    hint: '시장 전체에 훈훈한 바람이 불 거란 소문이 있어요...', changeRange: [0.03, 0.08] },
  { id: 'market-crash', type: 'market', text: '📉 금리 인상 발표, 전 종목 동반 약세',
    hint: '시장에 서늘한 바람이 불 거란 소문이 있어요...', changeRange: [-0.08, -0.03] },
  { id: 'citrus-frost', type: 'tag', tag: 'weather', text: '❄️ 이상 한파로 감귤 작황 피해 우려',
    hint: '날씨 관련 종목에 안 좋은 소식이 있을 거란 소문이...', changeRange: [-0.15, -0.05] },
  { id: 'citrus-boom', type: 'tag', tag: 'weather', text: '☀️ 역대급 풍년, 감귤 생산량 최고치 경신',
    hint: '날씨 관련 종목에 좋은 소식이 있을 거란 소문이...', changeRange: [0.05, 0.15] },
  { id: 'muscat-trend', type: 'tag', tag: 'trend', text: '🍇 SNS 챌린지 열풍, 트렌드 관련주 급등',
    hint: 'SNS에서 뭔가 유행할 조짐이 있다는 소문이...', changeRange: [0.1, 0.25] },
  { id: 'muscat-fade', type: 'tag', tag: 'trend', text: '📉 유행이 시들해지며 트렌드 관련주 조정',
    hint: '한창 잘나가던 유행이 식을 거란 소문이...', changeRange: [-0.12, -0.04] },
  { id: 'watermelon-hit', type: 'stock', targetId: 'watermelon-entertainment', text: '🎬 수박 엔터, 신작 흥행 대박',
    hint: '수박 쪽에서 아주 신나는 소식이 있을 거란 소문이...', changeRange: [0.15, 0.4] },
  { id: 'watermelon-scandal', type: 'stock', targetId: 'watermelon-entertainment', text: '📰 주연 배우 논란 확산, 수박 엔터 이미지 타격',
    hint: '수박 쪽에서 시끄러운 잡음이 들릴 거란 소문이...', changeRange: [-0.3, -0.1] },
  { id: 'apple-earnings', type: 'stock', targetId: 'apple-electronics', text: '🍎 애플전자, 역대 최대 분기 실적 발표',
    hint: '가장 안전한 종목에서 반가운 소식이 있을 거란 소문이...', changeRange: [0.02, 0.05] },
  { id: 'banana-dividend-news', type: 'stock', targetId: 'delmonte-banana', text: '🍌 델몬트바나나, 깜짝 호실적 발표',
    hint: '꾸준한 종목에서 보너스 같은 소식이 있을 거란 소문이...', changeRange: [0.02, 0.06] },
  { id: 'durian-jackpot', type: 'stock', targetId: 'durian-bio', text: '🚀 두리안 바이오, 신약 임상 대성공! 주가 폭등',
    hint: '두리안 쪽에서 아주 달콤한 냄새가 날 거란 소문이...', changeRange: [3.0, 9.0] },
  { id: 'durian-delisting', type: 'stock', targetId: 'durian-bio', text: '💀 두리안 바이오, 회계 부정 정황 포착... 상장폐지 위기',
    hint: '두리안 쪽에서 아주 끔찍한 냄새가 날 거란 소문이...', changeRange: [-0.95, -0.75] },
];


/* =====================================================================
   업적 목록
   -----------------------------------------------------------------
   check는 "현재 상태를 넣으면 true/false를 돌려주는 함수"예요.
   파이썬으로 치면 check: lambda s: s['cash'] < 0 같은 형태와 같습니다.
===================================================================== */
const ACHIEVEMENTS = [
  { id: 'first-buy', emoji: '🌱', name: '첫 투자', desc: '생애 첫 주식을 매수했다',
    check: (s) => s.everBought },
  { id: 'first-sell', emoji: '💵', name: '첫 수익 실현', desc: '생애 첫 매도를 완료했다',
    check: (s) => s.everSold },
  { id: 'bankrupt', emoji: '💀', name: '첫 깡통', desc: '현금이 마이너스가 되었다',
    check: (s) => s.cash < 0 },
  { id: 'millionaire-100m', emoji: '👑', name: '자산 1억 달성', desc: '순자산이 1억 원을 넘었다',
    check: (s) => s.totalAssets >= 100000000 },
  { id: 'durian-madness', emoji: '🦔', name: '두리안의 냄새', desc: '두리안바이오 주가가 4만 원을 넘었다',
    check: (s) => s.durianPrice >= 40000 },
  { id: 'luxury-owner', emoji: '💎', name: '플렉스의 시작', desc: '사치품을 하나 이상 구매했다',
    check: (s) => s.ownedItemsCount >= 1 },
  { id: 'collector', emoji: '🏆', name: '모든 걸 가졌다', desc: '상점의 모든 자산을 구매했다',
    check: (s) => s.ownedItemsCount >= SHOP_ITEMS_COUNT },
  { id: 'survivor-10', emoji: '📅', name: '베테랑 투자자', desc: '10일 동안 시장에서 살아남았다',
    check: (s) => s.dayCount >= 10 },
];


/* =====================================================================
   사치품 상점 목록
===================================================================== */
const SHOP_ITEMS = [
  { id: 'fruit-farm', emoji: '🌾', name: '과일 농장', price: 2000000, desc: '나만의 농장을 소유한다는 뿌듯함' },
  { id: 'watch', emoji: '⌚', name: '명품 시계', price: 5000000, desc: '손목 위의 자산 증명서' },
  { id: 'sports-car', emoji: '🏎️', name: '슈퍼카', price: 10000000, desc: '질주 본능을 채워줄 스피드' },
  { id: 'yacht', emoji: '🛥️', name: '요트', price: 20000000, desc: '주말은 바다 위에서' },
  { id: 'penthouse', emoji: '🏙️', name: '펜트하우스', price: 50000000, desc: '도시 전체가 내려다보이는 집' },
];
const SHOP_ITEMS_COUNT = SHOP_ITEMS.length;


/* =====================================================================
   ② 게임 상태 변수 & 상수
===================================================================== */
const START_CASH = 1000000;
const DAY_DURATION_MS = 5 * 60 * 1000;  // 5분
const PRICE_TICK_MS = 10 * 1000;        // 10초
const TICKS_PER_DAY = DAY_DURATION_MS / PRICE_TICK_MS; // 30
const HINT_COST = 500;
const DIVIDEND_RATE = 0.01;    // 델몬트바나나 배당률 (보유가치의 1%)
const LOAN_INTEREST_RATE = 0.05; // 대출 이자율 (하루 5%)
const LOAN_MAX = 5000000;
const SAVE_KEY = 'fruitStockPremiumSave';

const player = {
  cash: START_CASH,
  loan: 0,
  holdings: {
    'apple-electronics': 0, 'delmonte-banana': 0, 'jeju-citrus-air': 0,
    'shine-muscat-luxury': 0, 'watermelon-entertainment': 0, 'durian-bio': 0,
  },
  ownedItems: [],           // 구매한 사치품 id 목록 (파이썬의 list와 동일)
  unlockedAchievements: [], // 달성한 업적 id 목록
  everBought: false,
  everSold: false,
};

let dayCount = 1;
let dayEndAt = Date.now() + DAY_DURATION_MS;
let hintPurchasedToday = false;
let todaysNews = pickRandomNews();     // 오늘 활성화된 뉴스 (화면에 공개됨)
let tomorrowsNews = pickRandomNews();  // 내일 터질 뉴스 (비공개, 정보상이 힌트만 판매)
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
  loanValue: document.getElementById('loanValue'),
  loanAmount: document.getElementById('loanAmount'),
  borrowBtn: document.getElementById('borrowBtn'),
  repayBtn: document.getElementById('repayBtn'),
  hintText: document.getElementById('hintText'),
  hintBtn: document.getElementById('hintBtn'),
  stockTableBody: document.getElementById('stockTableBody'),
  shopGrid: document.getElementById('shopGrid'),
  achvGrid: document.getElementById('achvGrid'),
  toast: document.getElementById('toast'),
  resetBtn: document.getElementById('resetBtn'),
};


/* =====================================================================
   ④ 유틸 함수
===================================================================== */

function formatWon(amount) {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

function formatPercent(ratio) {
  const sign = ratio > 0 ? '+' : '';
  return `${sign}${(ratio * 100).toFixed(1)}%`;
}

// 파이썬의 random.uniform(min, max)와 동일한 기능
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// 파이썬의 random.choice(NEWS_POOL)과 동일한 기능
function pickRandomNews() {
  return NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
}

function newsAffectsFruit(news, fruit) {
  if (news.type === 'market') return true;
  if (news.type === 'tag') return fruit.tags.includes(news.tag);
  if (news.type === 'stock') return fruit.id === news.targetId;
  return false;
}

function findFruit(fruitId) {
  return fruits.find((f) => f.id === fruitId);
}

// 현금 + 보유 주식 평가금 - 대출 = 순자산
function computeTotalAssets() {
  const stockValue = fruits.reduce((sum, f) => sum + f.price * player.holdings[f.id], 0);
  return player.cash + stockValue - player.loan;
}

// 데이터 변경 후 항상 세 가지(화면 갱신, 업적 확인, 저장)를 같이 해줘야 하므로
// 하나의 함수로 묶어둡니다. 이렇게 하면 buyFruit, sellFruit, borrowLoan 등
// 곳곳에서 renderAll(); checkAchievements(); saveGame(); 세 줄을 반복해서
// 적지 않아도 돼요. (파이썬이었다면 그냥 공통 함수로 빼는 것과 같은 이치입니다)
function commit() {
  renderAll();
  checkAchievements();
  saveGame();
}


/* =====================================================================
   ⑤ 저장 / 불러오기 (localStorage)
   -----------------------------------------------------------------
   localStorage는 문자열만 저장할 수 있는 브라우저 내장 저장소예요.
     저장: JSON.stringify(객체)  ≈ 파이썬의 json.dumps(dict)
     불러오기: JSON.parse(문자열) ≈ 파이썬의 json.loads(문자열)
   주의: 가격 히스토리(차트 데이터)까지 저장하면 용량이 커지고 복잡해지므로,
   여기서는 "지금 이 순간의 상태"만 저장하고 차트는 새로고침 시 새로
   그리기 시작하도록 했어요. 자산/보유량/업적처럼 정말 중요한 데이터는
   전부 보존됩니다.
===================================================================== */

function saveGame() {
  const saveData = {
    cash: player.cash,
    loan: player.loan,
    holdings: player.holdings,
    ownedItems: player.ownedItems,
    unlockedAchievements: player.unlockedAchievements,
    everBought: player.everBought,
    everSold: player.everSold,
    dayCount,
    dayEndAt,
    hintPurchasedToday,
    todaysNewsId: todaysNews.id,
    tomorrowsNewsId: tomorrowsNews.id,
    fruits: fruits.map((f) => ({
      id: f.id, price: f.price, prevPrice: f.prevPrice,
      dayStartPrice: f.dayStartPrice, todayTickDrift: f.todayTickDrift,
    })),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;

  const data = JSON.parse(raw);

  player.cash = data.cash;
  player.loan = data.loan;
  player.holdings = data.holdings;
  player.ownedItems = data.ownedItems;
  player.unlockedAchievements = data.unlockedAchievements;
  player.everBought = data.everBought;
  player.everSold = data.everSold;

  dayCount = data.dayCount;
  dayEndAt = data.dayEndAt;
  hintPurchasedToday = data.hintPurchasedToday;

  // 뉴스는 id만 저장해뒀다가 NEWS_POOL에서 같은 id를 다시 찾아옵니다.
  todaysNews = NEWS_POOL.find((n) => n.id === data.todaysNewsId) || pickRandomNews();
  tomorrowsNews = NEWS_POOL.find((n) => n.id === data.tomorrowsNewsId) || pickRandomNews();

  data.fruits.forEach((saved) => {
    const fruit = findFruit(saved.id);
    if (fruit) {
      fruit.price = saved.price;
      fruit.prevPrice = saved.prevPrice;
      fruit.dayStartPrice = saved.dayStartPrice;
      fruit.todayTickDrift = saved.todayTickDrift;
    }
  });

  if (Date.now() >= dayEndAt) {
    // 게임을 꺼둔 사이에 이미 하루가 끝나버렸다면, 돌아오자마자 정산합니다.
    resolveDayEnd();
  } else {
    // 아직 오늘이 진행 중이라면, 남은 시간을 기준으로 "이미 지나간 틱 번호"를
    // 다시 계산해서 새로고침 직후 시세 틱이 중복 발생하지 않도록 맞춥니다.
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
   ⑥ 렌더링(화면 그리기) 함수
===================================================================== */

function renderDayBadge() { dom.dayNumber.textContent = dayCount; }

function renderNews() { dom.newsText.textContent = todaysNews.text; }

function renderWallet() {
  dom.cashValue.textContent = formatWon(player.cash);
  dom.totalValue.textContent = formatWon(computeTotalAssets());

  const owned = fruits.filter((f) => player.holdings[f.id] > 0);
  dom.holdingsList.innerHTML = owned.length === 0
    ? '<li class="holding-empty">아직 보유한 종목이 없어요</li>'
    : owned.map((fruit) => `
        <li class="holding-row">
          <span>${fruit.emoji} ${fruit.name}</span>
          <span class="mono">${player.holdings[fruit.id]}주</span>
        </li>
      `).join('');
}

function renderBank() {
  dom.loanValue.textContent = formatWon(player.loan);
}

function renderMarket() {
  dom.stockTableBody.innerHTML = fruits.map((fruit) => {
    const diff = fruit.price - fruit.prevPrice;
    const ratio = fruit.prevPrice ? diff / fruit.prevPrice : 0;

    const isUp = diff > 0;
    const isDown = diff < 0;
    const flashClass = isUp ? 'flash-up' : isDown ? 'flash-down' : '';
    const changeClass = isUp ? 'change-up' : isDown ? 'change-down' : 'change-flat';
    const arrow = isUp ? '▲' : isDown ? '▼' : '-';

    const canBuy = player.cash >= fruit.price;
    const canSell = player.holdings[fruit.id] > 0;

    return `
      <tr>
        <td>
          <div class="stock-name-cell">
            <span class="stock-emoji">${fruit.emoji}</span>
            <div>
              <div class="stock-name">${fruit.name}</div>
              <div class="stock-ticker mono">${fruit.ticker}</div>
            </div>
          </div>
        </td>
        <td><span class="badge ${fruit.badgeClass}">${fruit.category}</span></td>
        <td class="mono price-cell ${flashClass}">${fruit.price.toLocaleString()}원</td>
        <td><span class="change-badge ${changeClass}">${arrow} ${formatPercent(ratio)}</span></td>
        <td class="mono">${player.holdings[fruit.id]}주</td>
        <td>
          <div class="trade-controls">
            <input type="number" class="qty-input mono" id="qty-${fruit.id}" value="1" min="1">
            <button class="btn buy-btn" data-action="buy" data-id="${fruit.id}" ${canBuy ? '' : 'disabled'}>매수</button>
            <button class="btn sell-btn" data-action="sell" data-id="${fruit.id}" ${canSell ? '' : 'disabled'}>매도</button>
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
    ? `"${tomorrowsNews.hint}"`
    : '"아직 정보를 사지 않았어요..."';
}

function renderAll() {
  renderDayBadge();
  renderNews();
  renderWallet();
  renderBank();
  renderMarket();
  renderShop();
  renderAchievements();
  renderHint();
}


/* =====================================================================
   ⑦ 매수 / 매도
   -----------------------------------------------------------------
   ⚠️ 이 게임엔 예약 매매나 자동 거래 기능이 없습니다. 아래 두 함수는
   오직 사용자가 버튼을 "직접 클릭"했을 때만 실행됩니다.
===================================================================== */

function buyFruit(fruitId, qty) {
  const fruit = findFruit(fruitId);
  const cost = fruit.price * qty;

  if (player.cash < cost) { alert('현금이 부족해요! 🥲'); return; }

  player.cash -= cost;
  player.holdings[fruitId] += qty;
  player.everBought = true;
  commit();
}

function sellFruit(fruitId, qty) {
  const fruit = findFruit(fruitId);

  if (player.holdings[fruitId] < qty) { alert('보유한 수량보다 많이 팔 수 없어요! 🥲'); return; }

  player.holdings[fruitId] -= qty;
  player.cash += fruit.price * qty;
  player.everSold = true;
  commit();
}

function handleMarketClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const fruitId = button.dataset.id;
  const qtyInput = document.getElementById(`qty-${fruitId}`);
  const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);

  if (button.dataset.action === 'buy') buyFruit(fruitId, qty);
  else sellFruit(fruitId, qty);
}


/* =====================================================================
   ⑧ 은행 (대출 / 상환)
===================================================================== */

function borrowLoan(amount) {
  if (amount <= 0) return;
  if (player.loan + amount > LOAN_MAX) {
    alert(`대출 한도(${formatWon(LOAN_MAX)})를 초과할 수 없어요!`);
    return;
  }
  player.loan += amount;
  player.cash += amount;
  commit();
}

function repayLoan(amount) {
  if (amount <= 0) return;
  // Math.min으로 "입력값 / 남은 대출 / 가진 현금" 중 가장 작은 값을 골라
  // 그 이상은 절대 상환되지 않도록 안전장치를 둡니다.
  const payAmount = Math.min(amount, player.loan, player.cash);
  if (payAmount <= 0) { alert('상환할 대출이 없거나 현금이 부족해요!'); return; }

  player.loan -= payAmount;
  player.cash -= payAmount;
  commit();
}


/* =====================================================================
   ⑨ 어둠의 정보상
===================================================================== */

function buyHint() {
  if (hintPurchasedToday) return;
  if (player.cash < HINT_COST) { alert('정보상에게 낼 돈이 부족해요! 🥲'); return; }

  player.cash -= HINT_COST;
  hintPurchasedToday = true;
  commit();
}


/* =====================================================================
   ⑩ 사치품 상점
===================================================================== */

function buyItem(itemId) {
  if (player.ownedItems.includes(itemId)) return; // .includes()는 파이썬의 `in` 연산자와 같은 역할

  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (player.cash < item.price) { alert('돈이 부족해요! 🥲'); return; }

  player.cash -= item.price;
  player.ownedItems.push(itemId); // .push()는 파이썬의 list.append()와 동일
  commit();
}

function handleShopClick(event) {
  const button = event.target.closest('button[data-item]');
  if (!button) return;
  buyItem(button.dataset.item);
}


/* =====================================================================
   ⑪ 업적 & 토스트 알림
===================================================================== */

function getAchievementState() {
  return {
    cash: player.cash,
    totalAssets: computeTotalAssets(),
    durianPrice: findFruit('durian-bio').price,
    ownedItemsCount: player.ownedItems.length,
    dayCount,
    everBought: player.everBought,
    everSold: player.everSold,
  };
}

function checkAchievements() {
  const state = getAchievementState();
  ACHIEVEMENTS.forEach((ach) => {
    if (player.unlockedAchievements.includes(ach.id)) return; // 이미 달성한 건 건너뜀
    if (ach.check(state)) {
      player.unlockedAchievements.push(ach.id);
      queueToast(`🏆 업적 달성! <strong>${ach.name}</strong> — ${ach.desc}`);
    }
  });
}

// 토스트가 동시에 여러 개 뜨면 겹쳐 보이니, 큐(대기열)에 순서대로 쌓아뒀다가
// 하나씩 보여줍니다. 파이썬의 리스트를 큐처럼 쓰는 것(append로 넣고
// pop(0)으로 꺼내는 것)과 같은 개념이에요.
let toastQueue = [];
let toastBusy = false;

function queueToast(html) {
  toastQueue.push(html);
  if (!toastBusy) playNextToast();
}

function playNextToast() {
  if (toastQueue.length === 0) { toastBusy = false; return; }
  toastBusy = true;

  const html = toastQueue.shift(); // 맨 앞 항목을 꺼내며 제거 (파이썬의 list.pop(0))
  dom.toast.innerHTML = html;
  dom.toast.classList.add('visible');

  setTimeout(() => {
    dom.toast.classList.remove('visible');
    setTimeout(playNextToast, 400); // 슬라이드 아웃 애니메이션이 끝난 뒤 다음 토스트
  }, 3200);
}


/* =====================================================================
   ⑫ 차트 (Chart.js)
   -----------------------------------------------------------------
   Chart.js는 파이썬의 matplotlib과 비슷한 "그래프 그려주는 라이브러리"인데,
   결정적인 차이는 한 번 그리고 끝나는 게 아니라 데이터를 계속 밀어넣고
   .update()를 호출하면 실시간으로 다시 그려준다는 점이에요.
===================================================================== */

function initChart() {
  const ctx = document.getElementById('priceChart').getContext('2d');
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: fruits.map((fruit) => ({
        label: fruit.name,
        data: [],
        borderColor: fruit.chartColor,
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // 10초마다 갱신되므로 애니메이션은 꺼서 깜빡임을 줄입니다
      scales: {
        x: { ticks: { color: '#8b8f9e', maxRotation: 0 }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          ticks: { color: '#8b8f9e', callback: (v) => `${v}%` },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
      },
      plugins: {
        legend: { labels: { color: '#c7c9d1', boxWidth: 12, font: { size: 11 } } },
      },
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

  fruits.forEach((fruit, i) => {
    const changePercent = ((fruit.price / fruit.dayStartPrice) - 1) * 100;
    priceChart.data.datasets[i].data.push(changePercent.toFixed(2));
  });

  // 하루 분량(30틱)만 남기고 오래된 데이터는 버립니다.
  // .shift()는 배열 맨 앞 요소를 꺼내며 지우는 함수 - 파이썬의 list.pop(0)과 동일해요.
  if (priceChart.data.labels.length > TICKS_PER_DAY) {
    priceChart.data.labels.shift();
    priceChart.data.datasets.forEach((ds) => ds.data.shift());
  }

  priceChart.update();
}


/* =====================================================================
   ⑬ 하루 진행 & 10초 시세 틱
   -----------------------------------------------------------------
   ⏱️ 이 게임에는 서로 다른 두 개의 리듬이 동시에 흐릅니다.
     - 5분(300초)마다 한 번: 하루가 바뀌고 뉴스/배당/이자가 정산됨
     - 10초마다 한 번: 주가가 실시간으로 조금씩 움직임

   두 리듬을 각각 setInterval로 따로 두면 시간이 갈수록 미세하게
   어긋날 수 있어서, 여기서는 "1초마다 도는 하나의 시계"(tickClock)
   안에서 남은 시간을 계산해 "10초 단위가 바뀌는 순간"을 스스로
   감지하는 방식을 씁니다. 파이썬의 time.sleep(1)을 무한 반복하며
   매번 조건을 검사하는 것과 비슷한 느낌이지만, 역시 프로그램을
   멈추지 않고 "1초마다 실행 예약"만 한다는 점이 다릅니다.
===================================================================== */

// 오늘의 뉴스가 각 회사에 미치는 "틱당 추세"를 미리 계산해둡니다.
function applyTodaysNewsTrend(news) {
  fruits.forEach((fruit) => {
    if (newsAffectsFruit(news, fruit)) {
      const dayTotalTarget = randomFloat(news.changeRange[0], news.changeRange[1]);
      fruit.todayTickDrift = dayTotalTarget / TICKS_PER_DAY;
    } else {
      fruit.todayTickDrift = 0;
    }
  });
}

function runPriceTick() {
  tickIndexToday += 1;

  fruits.forEach((fruit) => {
    fruit.prevPrice = fruit.price;

    // 이번 틱의 등락률 = 무작위 노이즈 + 회사 고유 기본 드리프트 + 오늘의 뉴스 추세
    // "호재가 터진 날은 오를 확률과 폭이 더 크다"는 요구사항은, 대칭적인
    // 무작위 값(noise)에 오늘의 추세(todayTickDrift)를 더하는 것만으로
    // 자연스럽게 구현됩니다. 추세가 양수로 클수록 결과값이 양수가 될
    // 확률도, 평균 크기도 함께 커지거든요.
    const noise = randomFloat(-fruit.tickVolatility, fruit.tickVolatility);
    const baselineDrift = fruit.dailyDrift / TICKS_PER_DAY;
    const changeRatio = noise + baselineDrift + fruit.todayTickDrift;

    fruit.price = Math.max(1, Math.round(fruit.price * (1 + changeRatio)));
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
  // 1) 델몬트바나나 배당금 지급
  const banana = findFruit('delmonte-banana');
  const bananaQty = player.holdings['delmonte-banana'];
  if (bananaQty > 0) {
    const dividend = Math.round(bananaQty * banana.price * DIVIDEND_RATE);
    player.cash += dividend;
    queueToast(`🍌 델몬트바나나 배당금 ${formatWon(dividend)} 지급!`);
  }

  // 2) 대출 이자 인출
  if (player.loan > 0) {
    const interest = Math.round(player.loan * LOAN_INTEREST_RATE);
    player.cash -= interest;
    queueToast(`🏦 대출 이자 ${formatWon(interest)}가 빠져나갔어요`);
  }

  // 3) 오늘의 뉴스를 교체: 어제 몰래 뽑아뒀던 "내일의 뉴스"가 오늘의 뉴스가 됨
  todaysNews = tomorrowsNews;
  tomorrowsNews = pickRandomNews();
  applyTodaysNewsTrend(todaysNews);

  // 4) 하루 & 차트 리셋
  fruits.forEach((f) => { f.dayStartPrice = f.price; });
  resetChart();
  tickIndexToday = 0;
  lastPriceTickElapsed = 0;

  dayCount += 1;
  hintPurchasedToday = false;
  dayEndAt = Date.now() + DAY_DURATION_MS;

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
   ⑭ 초기화
===================================================================== */

function init() {
  initChart();

  const hasSave = loadGame();
  if (!hasSave) {
    // 새 게임이면 첫째 날의 뉴스 추세도 여기서 바로 계산해줍니다.
    applyTodaysNewsTrend(todaysNews);
    fruits.forEach((f) => { f.dayStartPrice = f.price; });
    saveGame();
  }

  renderAll();

  dom.stockTableBody.addEventListener('click', handleMarketClick);
  dom.shopGrid.addEventListener('click', handleShopClick);
  dom.hintBtn.addEventListener('click', buyHint);
  dom.resetBtn.addEventListener('click', resetGame);
  dom.borrowBtn.addEventListener('click', () => {
    borrowLoan(Math.max(0, parseInt(dom.loanAmount.value, 10) || 0));
  });
  dom.repayBtn.addEventListener('click', () => {
    repayLoan(Math.max(0, parseInt(dom.loanAmount.value, 10) || 0));
  });

  // 1초마다 tickClock 반복 실행 (파이썬의 무한루프+sleep(1)과 비슷하지만
  // 프로그램을 멈추지 않고 "예약"만 한다는 점이 다릅니다 - ⑬번 섹션 설명 참고)
  setInterval(tickClock, 1000);
}

init();