/* =====================================================================
   프리미엄 과일 주식 시뮬레이터 - script.js
   -----------------------------------------------------------------
   전체 흐름:
   ① 데이터 정의(회사 목록, 뉴스 풀) → ② 게임 상태 변수 → ③ 화면 요소 참조
   → ④ 유틸 함수 → ⑤ 저장/불러오기(localStorage) → ⑥ 렌더링 함수
   → ⑦ 거래 로직 → ⑧ 정보상(힌트) 로직 → ⑨ 하루 진행/타이머 로직
   → ⑩ 초기화
===================================================================== */


/* =====================================================================
   ① 과일 회사 목록
   -----------------------------------------------------------------
   파이썬으로 치면 list of dict 입니다.
     fruits = [{"id": "apple-electronics", "price": 50000, ...}, ...]

   각 회사에는 category(구분 뱃지)와 tags(어떤 종류의 뉴스에 반응하는지)가
   있어요. tags는 파이썬의 리스트(list of string)와 완전히 같은 개념이고,
   나중에 "이 뉴스가 이 회사에 영향을 주는가?"를 판단할 때 씁니다.
===================================================================== */
const fruits = [
  {
    id: 'apple-electronics',
    ticker: 'APPL',
    emoji: '🍎',
    name: '애플전자',
    category: '우량주',
    badgeClass: 'badge-blue-chip',
    price: 50000,
    prevPrice: 50000,
    volatility: 0.02,   // 하루 기본 변동폭 ±2%
    drift: 0.005,       // 매일 평균 +0.5% 우상향 편향
    tags: ['blue-chip'],
  },
  {
    id: 'delmonte-banana',
    ticker: 'DELB',
    emoji: '🍌',
    name: '델몬트바나나',
    category: '우량주',
    badgeClass: 'badge-blue-chip',
    price: 30000,
    prevPrice: 30000,
    volatility: 0.03,
    drift: 0.003,
    tags: ['dividend'],
  },
  {
    id: 'jeju-citrus-air',
    ticker: 'JCIT',
    emoji: '🍊',
    name: '제주감귤항공',
    category: '가치주',
    badgeClass: 'badge-value',
    price: 20000,
    prevPrice: 20000,
    volatility: 0.06,
    drift: 0,
    tags: ['weather'],   // 날씨/계절 뉴스에 민감
  },
  {
    id: 'shine-muscat-luxury',
    ticker: 'SMLX',
    emoji: '🍇',
    name: '샤인머스캣럭셔리',
    category: '가치주',
    badgeClass: 'badge-value',
    price: 25000,
    prevPrice: 25000,
    volatility: 0.07,
    drift: 0,
    tags: ['trend'],     // 유행/트렌드 뉴스에 민감
  },
  {
    id: 'watermelon-entertainment',
    ticker: 'WMEN',
    emoji: '🍉',
    name: '수박엔터테인먼트',
    category: '테마주',
    badgeClass: 'badge-theme',
    price: 15000,
    prevPrice: 15000,
    volatility: 0.15,
    drift: 0,
    tags: ['entertainment'],
  },
  {
    id: 'durian-bio',
    ticker: 'DURB',
    emoji: '🦔', // 두리안 이모지가 따로 없어 뾰족한 고슴도치로 대신했어요
    name: '두리안바이오',
    category: '작전주',
    badgeClass: 'badge-manipulated',
    price: 8000,
    prevPrice: 8000,
    volatility: 0.35,   // 매우 큰 변동폭
    drift: -0.01,       // 장기적으로는 살짝 우하향 (전형적인 작전주 특성)
    tags: ['biotech'],
  },
];


/* =====================================================================
   뉴스 이벤트 풀
   -----------------------------------------------------------------
   type: 'market'(전체 시장) / 'tag'(특정 태그를 가진 회사들) / 'stock'(특정 회사 하나)
   changeRange: [최소, 최대] 등락률 (예: [0.03, 0.08] = +3%~+8%)
   hint: 정보상이 알려주는 흐릿한 힌트 문구
===================================================================== */
const NEWS_POOL = [
  {
    id: 'market-boom',
    type: 'market',
    text: '🌍 글로벌 경기 훈풍, 전 종목 동반 강세',
    hint: '시장 전체에 훈훈한 바람이 불 거란 소문이 있어요...',
    changeRange: [0.03, 0.08],
  },
  {
    id: 'market-crash',
    type: 'market',
    text: '📉 금리 인상 발표, 전 종목 동반 약세',
    hint: '시장에 서늘한 바람이 불 거란 소문이 있어요...',
    changeRange: [-0.08, -0.03],
  },
  {
    id: 'citrus-frost',
    type: 'tag',
    tag: 'weather',
    text: '❄️ 이상 한파로 감귤 작황 피해 우려',
    hint: '날씨 관련 종목에 안 좋은 소식이 있을 거란 소문이...',
    changeRange: [-0.15, -0.05],
  },
  {
    id: 'citrus-boom',
    type: 'tag',
    tag: 'weather',
    text: '☀️ 역대급 풍년, 감귤 생산량 최고치 경신',
    hint: '날씨 관련 종목에 좋은 소식이 있을 거란 소문이...',
    changeRange: [0.05, 0.15],
  },
  {
    id: 'muscat-trend',
    type: 'tag',
    tag: 'trend',
    text: '🍇 SNS 챌린지 열풍, 트렌드 관련주 급등',
    hint: 'SNS에서 뭔가 유행할 조짐이 있다는 소문이...',
    changeRange: [0.1, 0.25],
  },
  {
    id: 'muscat-fade',
    type: 'tag',
    tag: 'trend',
    text: '📉 유행이 시들해지며 트렌드 관련주 조정',
    hint: '한창 잘나가던 유행이 식을 거란 소문이...',
    changeRange: [-0.12, -0.04],
  },
  {
    id: 'watermelon-hit',
    type: 'stock',
    targetId: 'watermelon-entertainment',
    text: '🎬 수박 엔터, 신작 흥행 대박',
    hint: '수박 쪽에서 아주 신나는 소식이 있을 거란 소문이...',
    changeRange: [0.15, 0.4],
  },
  {
    id: 'watermelon-scandal',
    type: 'stock',
    targetId: 'watermelon-entertainment',
    text: '📰 주연 배우 논란 확산, 수박 엔터 이미지 타격',
    hint: '수박 쪽에서 시끄러운 잡음이 들릴 거란 소문이...',
    changeRange: [-0.3, -0.1],
  },
  {
    id: 'apple-earnings',
    type: 'stock',
    targetId: 'apple-electronics',
    text: '🍎 애플전자, 역대 최대 분기 실적 발표',
    hint: '가장 안전한 종목에서 반가운 소식이 있을 거란 소문이...',
    changeRange: [0.02, 0.05],
  },
  {
    id: 'banana-dividend',
    type: 'stock',
    targetId: 'delmonte-banana',
    text: '🍌 델몬트바나나, 깜짝 배당 발표',
    hint: '꾸준한 종목에서 보너스 같은 소식이 있을 거란 소문이...',
    changeRange: [0.02, 0.06],
  },
  {
    id: 'durian-jackpot',
    type: 'stock',
    targetId: 'durian-bio',
    text: '🚀 두리안 바이오, 신약 임상 대성공! 주가 폭등',
    hint: '두리안 쪽에서 아주 달콤한 냄새가 날 거란 소문이...',
    changeRange: [3.0, 9.0], // +300% ~ +900% (최대 10배)
  },
  {
    id: 'durian-delisting',
    type: 'stock',
    targetId: 'durian-bio',
    text: '💀 두리안 바이오, 회계 부정 정황 포착... 상장폐지 위기',
    hint: '두리안 쪽에서 아주 끔찍한 냄새가 날 거란 소문이...',
    changeRange: [-0.95, -0.75],
  },
];


/* =====================================================================
   ② 게임 상태 변수
   -----------------------------------------------------------------
   player는 파이썬의 dict과 같아요: player = {"cash": 1000000, "holdings": {...}}
   let로 선언한 변수들은 나중에 재할당(=)이 필요해서 const 대신 let을 씁니다.
   (const로 선언한 변수는 다른 값을 다시 대입할 수 없어요 - 파이썬엔 없는 개념)
===================================================================== */
const START_CASH = 1000000;
const DAY_DURATION_MS = 5 * 60 * 1000; // 5분 = 300,000ms
const HINT_COST = 500;
const SAVE_KEY = 'fruitStockPremiumSave';

const player = {
  cash: START_CASH,
  holdings: {
    'apple-electronics': 0,
    'delmonte-banana': 0,
    'jeju-citrus-air': 0,
    'shine-muscat-luxury': 0,
    'watermelon-entertainment': 0,
    'durian-bio': 0,
  },
};

let dayCount = 1;
let dayEndAt = Date.now() + DAY_DURATION_MS; // 오늘이 끝나는 시각(타임스탬프)
let hintPurchasedToday = false;
let todaysNews = pickRandomNews();  // 오늘 하루가 끝날 때 터질 뉴스 (미리 뽑아둠, 아직 비공개)
let latestNews = null;              // 화면의 "오늘의 뉴스" 패널에 표시할, 이미 터진 뉴스


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
  stockTableBody: document.getElementById('stockTableBody'),
  hintText: document.getElementById('hintText'),
  hintBtn: document.getElementById('hintBtn'),
  resetBtn: document.getElementById('resetBtn'),
};


/* =====================================================================
   ④ 유틸 함수
===================================================================== */

function formatWon(amount) {
  // toLocaleString('ko-KR')은 천 단위 콤마를 자동으로 찍어줍니다.
  // 파이썬의 f"{amount:,}원" 과 같은 결과예요.
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

function formatPercent(ratio) {
  const sign = ratio > 0 ? '+' : '';
  return `${sign}${(ratio * 100).toFixed(1)}%`;
}

// min~max 사이의 "실수"를 하나 뽑습니다. 파이썬의 random.uniform(min, max)와 동일.
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// 뉴스 풀에서 무작위로 하나 뽑기. 파이썬의 random.choice(NEWS_POOL)과 동일.
function pickRandomNews() {
  return NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
}

// 오늘의 뉴스가 특정 과일 회사에 영향을 주는지 판단합니다.
function newsAffectsFruit(news, fruit) {
  if (news.type === 'market') return true;
  if (news.type === 'tag') return fruit.tags.includes(news.tag);
  if (news.type === 'stock') return fruit.id === news.targetId;
  return false;
}

function findFruit(fruitId) {
  return fruits.find((f) => f.id === fruitId);
}


/* =====================================================================
   ⑤ 저장 / 불러오기 (localStorage)
   -----------------------------------------------------------------
   localStorage는 브라우저가 제공하는 아주 단순한 "키-값 저장소"예요.
   문자열만 저장할 수 있기 때문에, 객체를 저장하려면 먼저 문자열로
   변환(JSON.stringify)해야 하고, 불러올 때는 다시 객체로 되돌려야
   (JSON.parse) 합니다.

     파이썬으로 치면:
       저장: json.dumps(data)  → 파일이나 DB에 문자열로 씀
       불러오기: json.loads(문자열) → 다시 dict/list로 복원

   localStorage.setItem(키, 값) / localStorage.getItem(키) 는
   파이썬의 딕셔너리 저장(dict[키] = 값)과 비슷하지만, 브라우저를 껐다
   켜도(심지어 컴퓨터를 재부팅해도) 데이터가 남아있다는 게 큰 차이예요.
===================================================================== */

function saveGame() {
  const saveData = {
    cash: player.cash,
    holdings: player.holdings,
    dayCount,
    dayEndAt,
    hintPurchasedToday,
    todaysNewsId: todaysNews.id,
    latestNewsId: latestNews ? latestNews.id : null,
    fruitPrices: fruits.map((f) => ({ id: f.id, price: f.price, prevPrice: f.prevPrice })),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false; // 저장된 게 없으면 false를 돌려주고 새 게임으로 시작

  const data = JSON.parse(raw);

  player.cash = data.cash;
  player.holdings = data.holdings;
  dayCount = data.dayCount;
  dayEndAt = data.dayEndAt;
  hintPurchasedToday = data.hintPurchasedToday;

  // 뉴스는 객체 전체를 저장하지 않고 id만 저장해뒀다가,
  // NEWS_POOL에서 같은 id를 가진 원본 객체를 다시 찾아옵니다.
  // (NEWS_POOL은 코드에 고정된 값이라 매번 똑같이 생성되기 때문에 가능해요)
  todaysNews = NEWS_POOL.find((n) => n.id === data.todaysNewsId) || pickRandomNews();
  latestNews = data.latestNewsId ? NEWS_POOL.find((n) => n.id === data.latestNewsId) : null;

  data.fruitPrices.forEach((saved) => {
    const fruit = findFruit(saved.id);
    if (fruit) {
      fruit.price = saved.price;
      fruit.prevPrice = saved.prevPrice;
    }
  });

  // 게임을 꺼둔 사이에 이미 하루가 끝나버렸다면, 돌아오자마자 그날을 정산합니다.
  if (Date.now() >= dayEndAt) {
    resolveDay();
  }

  return true;
}

function resetGame() {
  const ok = confirm('정말 초기화할까요? 모든 자산 기록이 사라져요.');
  if (!ok) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload(); // 페이지를 새로 불러오면 init()이 처음부터 다시 시작됨
}


/* =====================================================================
   ⑥ 렌더링(화면 그리기) 함수
===================================================================== */

function renderWallet() {
  dom.cashValue.textContent = formatWon(player.cash);

  const stockValue = fruits.reduce(
    (sum, fruit) => sum + fruit.price * player.holdings[fruit.id],
    0,
  );
  dom.totalValue.textContent = formatWon(player.cash + stockValue);

  const owned = fruits.filter((f) => player.holdings[f.id] > 0);

  if (owned.length === 0) {
    dom.holdingsList.innerHTML = '<li class="holding-empty">아직 보유한 종목이 없어요</li>';
  } else {
    dom.holdingsList.innerHTML = owned.map((fruit) => `
      <li class="holding-row">
        <span>${fruit.emoji} ${fruit.name}</span>
        <span class="mono">${player.holdings[fruit.id]}주</span>
      </li>
    `).join('');
  }
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
    const heldQty = player.holdings[fruit.id];

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
        <td class="mono">${heldQty}주</td>
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

function renderNews() {
  dom.newsText.textContent = latestNews
    ? latestNews.text
    : '첫째 날 시장이 개장했습니다. 행운을 빌어요!';
}

function renderHint() {
  dom.hintBtn.disabled = hintPurchasedToday || player.cash < HINT_COST;
  dom.hintBtn.textContent = hintPurchasedToday ? '오늘은 이미 정보를 샀어요' : `정보 구매 (${HINT_COST}원)`;
  dom.hintText.textContent = hintPurchasedToday
    ? `"${todaysNews.hint}"`
    : '"아직 정보를 사지 않았어요..."';
}

function renderDayBadge() {
  dom.dayNumber.textContent = dayCount;
}

// 위 렌더 함수들을 한 번에 호출하는 묶음 함수
function renderAll() {
  renderDayBadge();
  renderNews();
  renderWallet();
  renderMarket();
  renderHint();
}


/* =====================================================================
   ⑦ 거래(매수/매도) 로직
===================================================================== */

function buyFruit(fruitId, qty) {
  const fruit = findFruit(fruitId);
  const cost = fruit.price * qty;

  if (player.cash < cost) {
    alert('현금이 부족해요! 🥲');
    return;
  }

  player.cash -= cost;
  player.holdings[fruitId] += qty;
  renderAll();
  saveGame();
}

function sellFruit(fruitId, qty) {
  const fruit = findFruit(fruitId);

  if (player.holdings[fruitId] < qty) {
    alert('보유한 수량보다 많이 팔 수 없어요! 🥲');
    return;
  }

  player.holdings[fruitId] -= qty;
  player.cash += fruit.price * qty;
  renderAll();
  saveGame();
}

// 표가 매번 innerHTML로 다시 그려지므로, 버튼 각각에 리스너를 다는 대신
// 부모 요소(tbody) 하나에만 걸어두는 "이벤트 위임" 방식을 씁니다.
function handleMarketClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const fruitId = button.dataset.id;
  const qtyInput = document.getElementById(`qty-${fruitId}`);
  const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);

  if (button.dataset.action === 'buy') {
    buyFruit(fruitId, qty);
  } else {
    sellFruit(fruitId, qty);
  }
}


/* =====================================================================
   ⑧ 어둠의 정보상 (힌트 구매) 로직
===================================================================== */

function buyHint() {
  if (hintPurchasedToday) return;

  if (player.cash < HINT_COST) {
    alert('정보상에게 낼 돈이 부족해요! 🥲');
    return;
  }

  player.cash -= HINT_COST;
  hintPurchasedToday = true;
  renderAll();
  saveGame();
}


/* =====================================================================
   ⑨ 하루 진행 & 타이머 로직
   -----------------------------------------------------------------
   ⚠️ 지난 미니게임(사과/바나나/두리안 버전)에서는 턴 간격이 "5~10초 사이
   무작위"였기 때문에 setTimeout을 재귀 호출하는 방식을 썼어요.
   이번에는 간격이 "정확히 5분 고정"이라서 오히려 더 단순한 setInterval을
   씁니다. 두 방식의 차이를 표로 정리하면:

     상황                     추천 방식
     -----------------------  ------------------------------
     고정된 간격으로 반복       setInterval(fn, ms)
     매번 다른(무작위) 간격     setTimeout(fn, ms)을 fn 안에서 재귀 호출

   그리고 파이썬의 time.sleep(n)과 결정적으로 다른 점은, setInterval도
   "그 자리에서 멈추는 것"이 아니라 "n밀리초마다 이 함수를 실행해줘"라고
   브라우저에게 예약해두는 것뿐이라는 거예요. 그래서 5분을 기다리는 동안에도
   매수/매도 버튼 클릭 같은 사용자 반응은 전혀 막히지 않습니다.

   ⏱️ 정확한 카운트다운을 위해 "남은 시간을 셀 때마다 1초씩 깎는" 방식 대신,
   "하루가 끝나는 정확한 시각(dayEndAt)"을 미리 정해두고, 매 tick마다
   dayEndAt - Date.now()로 남은 시간을 계산합니다. 이렇게 하면 브라우저 탭이
   잠깐 멈췄다 돌아와도(예: 다른 탭을 오래 보다 옴) 시간이 부정확해지지
   않고, 새로고침 후에도 저장해둔 dayEndAt으로 정확히 이어서 카운트할 수
   있어요.
===================================================================== */

function updateTimerDisplay(remainingMs) {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  dom.timerText.textContent = `${mm}:${ss}`;

  const percent = Math.max(0, Math.min(100, (remainingMs / DAY_DURATION_MS) * 100));
  dom.timerFill.style.width = `${percent}%`;
}

function resolveDay() {
  const news = todaysNews; // 오늘 미리 뽑아뒀던 그 뉴스

  fruits.forEach((fruit) => {
    fruit.prevPrice = fruit.price;

    // 매일 기본적으로 회사 고유의 변동성 + 드리프트만큼 가격이 흔들립니다.
    // 파이썬: change = fruit['drift'] + random.uniform(-fruit['volatility'], fruit['volatility'])
    const baseChange = fruit.drift + randomFloat(-fruit.volatility, fruit.volatility);
    let multiplier = 1 + baseChange;

    // 오늘의 뉴스가 이 회사에 해당된다면, 추가로 뉴스 효과를 곱해줍니다.
    if (newsAffectsFruit(news, fruit)) {
      const newsChange = randomFloat(news.changeRange[0], news.changeRange[1]);
      multiplier *= (1 + newsChange);
    }

    fruit.price = Math.max(1, Math.round(fruit.price * multiplier));
  });

  latestNews = news;       // 화면에 "오늘의 뉴스"로 표시
  dayCount += 1;
  hintPurchasedToday = false;
  todaysNews = pickRandomNews(); // 다음 날 몰래 터질 뉴스를 새로 미리 뽑아둠
  dayEndAt = Date.now() + DAY_DURATION_MS;

  renderAll();
  saveGame();
}

function tickClock() {
  const remaining = dayEndAt - Date.now();
  updateTimerDisplay(Math.max(0, remaining));

  if (remaining <= 0) {
    resolveDay();
  }
}


/* =====================================================================
   ⑩ 초기화
===================================================================== */

function init() {
  const hasSave = loadGame(); // 저장된 데이터가 있으면 불러오고, 없으면 위에서 정한 초기값 그대로 시작
  if (!hasSave) {
    saveGame(); // 새 게임이면 초기 상태를 바로 한 번 저장해둠
  }

  renderAll();

  dom.stockTableBody.addEventListener('click', handleMarketClick);
  dom.hintBtn.addEventListener('click', buyHint);
  dom.resetBtn.addEventListener('click', resetGame);

  // 1초(1000ms)마다 tickClock을 반복 실행합니다.
  // 파이썬으로 치면 while True: tick(); time.sleep(1) 과 비슷해 보이지만,
  // 앞서 설명했듯 프로그램 전체를 멈추지 않고 "예약"만 한다는 점이 다릅니다.
  setInterval(tickClock, 1000);
}

init();