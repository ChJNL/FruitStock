/* =====================================================================
   과일 주식 시뮬레이터 - script.js
   파이썬을 아는 분을 위한 비교 주석이 곳곳에 달려있습니다 🙂
   전체 흐름: ① 데이터 정의 → ② 화면 요소 참조 → ③ 유틸 함수
             → ④ 렌더링(그리기) 함수 → ⑤ 거래 로직 → ⑥ 가격/뉴스 로직
             → ⑦ 게임 루프(턴 진행) → ⑧ 초기 실행
===================================================================== */


/* =====================================================================
   ① 데이터 정의
   -----------------------------------------------------------------
   JS의 배열(Array)은 파이썬의 list와 거의 같아요. []로 감쌉니다.
   배열 안의 각 항목은 "객체(Object)"인데, 파이썬의 딕셔너리(dict)와
   같은 역할이라고 생각하면 됩니다. {} 로 감싸고 key: value 형태로 적어요.

   파이썬이었다면 이렇게 썼을 데이터입니다:
     fruits = [
         {"id": "apple", "name": "🍎 사과", "price": 100, "volatility": 0.03},
         ...
     ]
===================================================================== */
const fruits = [
  {
    id: 'apple',
    name: '🍎 사과',
    price: 100,        // 현재가
    prevPrice: 100,    // 직전 턴의 가격 (상승/하락 비교용)
    volatility: 0.03,  // 변동성: 한 턴에 최대 ±3% 변동 → "안전주"
  },
  {
    id: 'banana',
    name: '🍌 바나나',
    price: 150,
    prevPrice: 150,
    volatility: 0.08,  // ±8% → "보통주"
  },
  {
    id: 'durian',
    // 유니코드에 두리안 이모지가 따로 없어서, 뾰족한 느낌의 고슴도치로 대신했어요 😄
    name: '🦔 두리안',
    price: 500,
    prevPrice: 500,
    volatility: 0.20,  // ±20% → "급등락주"
  },
];

// 플레이어 상태. 파이썬으로 치면 player = {"cash": 1000, "holdings": {...}} 와 동일.
// holdings는 "과일 id → 보유 개수"를 담는, 딕셔너리 안에 또 다른 딕셔너리가
// 들어있는 구조예요. (파이썬의 nested dict과 완전히 같은 개념입니다)
const START_CASH = 1000;
const player = {
  cash: START_CASH,
  holdings: { apple: 0, banana: 0, durian: 0 },
};

// 뉴스 이벤트 목록.
// effect는 "함수를 값으로 저장한" 것입니다. 파이썬에서도 함수를 변수에 담거나
// 딕셔너리 값으로 넣을 수 있는 것처럼(1급 객체), JS 함수도 똑같이 다룰 수 있어요.
// 여기서는 화살표 함수(fruits => {...}) 문법을 썼는데,
// 파이썬의 lambda fruits: ... 와 비슷한 "짧은 함수 정의" 문법입니다.
const NEWS_EVENTS = [
  {
    text: '☀️ 전국적 가뭄 발생! 모든 과일 가격이 급등합니다!',
    effect: (list) => list.forEach((f) => { f.price = Math.round(f.price * 1.3); }),
  },
  {
    text: '🍌 바나나 다이어트 열풍! 바나나 가격이 폭등합니다!',
    effect: (list) => {
      const b = list.find((f) => f.id === 'banana');
      b.price = Math.round(b.price * 1.8);
    },
  },
  {
    text: '🥶 이상 한파로 과수원 피해 발생! 전 품목 가격 상승',
    effect: (list) => list.forEach((f) => { f.price = Math.round(f.price * 1.2); }),
  },
  {
    text: '🍎 사과 대풍년! 공급 과잉으로 가격이 폭락합니다',
    effect: (list) => {
      const a = list.find((f) => f.id === 'apple');
      a.price = Math.round(a.price * 0.6);
    },
  },
  {
    text: '🚨 두리안 수입 이슈 발생! 희소성으로 가격 폭등',
    effect: (list) => {
      const d = list.find((f) => f.id === 'durian');
      d.price = Math.round(d.price * 2.0);
    },
  },
  {
    text: '📉 소비 심리 위축 확산... 전 품목 가격 하락',
    effect: (list) => list.forEach((f) => { f.price = Math.round(f.price * 0.75); }),
  },
];


/* =====================================================================
   ② 화면 요소 참조
   -----------------------------------------------------------------
   document.getElementById(...)는 HTML에서 id="..." 로 표시해둔 요소를
   JS 변수로 붙잡아오는 함수예요. 파이썬에는 이런 개념이 없는데,
   웹 페이지의 각 태그가 "화면에 그려진 객체"라고 생각하면 됩니다.
   미리 한 번씩만 찾아서 dom이라는 객체(=딕셔너리)에 모아두면,
   매번 다시 찾을 필요 없이 dom.cashValue 처럼 바로 꺼내 쓸 수 있어요.
===================================================================== */
const dom = {
  tickerTrack: document.getElementById('tickerTrack'),
  newsBanner: document.getElementById('newsBanner'),
  newsText: document.getElementById('newsText'),
  cashValue: document.getElementById('cashValue'),
  totalValue: document.getElementById('totalValue'),
  holdingsList: document.getElementById('holdingsList'),
  marketPanel: document.getElementById('marketPanel'),
  progressFill: document.getElementById('progressFill'),
};


/* =====================================================================
   ③ 유틸 함수
===================================================================== */

// 숫자를 "1,234원" 형태의 문자열로 바꿔줍니다.
// 파이썬의 f"{금액:,}원" 과 하는 일이 같아요.
function formatWon(amount) {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

// min~max 사이의 정수 하나를 무작위로 뽑습니다. (양 끝 포함)
// 파이썬의 random.randint(min, max) 와 동일한 기능이지만,
// JS의 Math.random()은 항상 0~1 사이의 "실수"만 주기 때문에
// 우리가 직접 원하는 범위로 변환하는 계산식을 써야 해요.
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 변동성 숫자를 보고 "안전 / 보통 / 고위험" 라벨을 붙여줍니다.
function volatilityLabel(v) {
  if (v <= 0.05) return '안전';
  if (v <= 0.12) return '보통';
  return '고위험';
}


/* =====================================================================
   ④ 렌더링(화면 그리기) 함수
   -----------------------------------------------------------------
   데이터(fruits, player)가 바뀔 때마다 이 함수들을 다시 호출해서
   화면을 최신 상태로 갱신합니다. 파이썬 콘솔 프로그램이라면
   print()로 매번 다시 출력하는 것과 비슷한 역할이에요.

   .map()은 파이썬의 리스트 컴프리헨션과 비슷합니다.
     파이썬: [f(x) for x in mylist]
     JS    : mylist.map(x => f(x))
   .join('')은 파이썬의 "".join(리스트) 와 완전히 동일해요.
===================================================================== */

function renderTicker() {
  const items = fruits.map((fruit) => {
    const diff = fruit.price - fruit.prevPrice;
    const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '-';
    const dir = diff > 0 ? 'up' : diff < 0 ? 'down' : '';
    return `<span class="ticker-item ${dir}">${fruit.name}<span class="mono">${fruit.price.toLocaleString()}원 ${arrow}</span></span>`;
  }).join('');

  // 매끄럽게 무한 반복되는 것처럼 보이도록 내용을 두 번 이어붙입니다.
  dom.tickerTrack.innerHTML = items + items;
}

function renderWallet() {
  dom.cashValue.textContent = formatWon(player.cash);

  // reduce는 파이썬의 functools.reduce, 혹은 그냥 for문 누적 합계와 같아요.
  // 파이썬이었다면: sum(f['price'] * player['holdings'][f['id']] for f in fruits)
  const stockValue = fruits.reduce(
    (sum, fruit) => sum + fruit.price * player.holdings[fruit.id],
    0,
  );
  dom.totalValue.textContent = formatWon(player.cash + stockValue);

  dom.holdingsList.innerHTML = fruits.map((fruit) => `
    <li class="holding-row">
      <span>${fruit.name}</span>
      <span class="mono">${player.holdings[fruit.id]}개</span>
    </li>
  `).join('');
}

function renderMarket() {
  dom.marketPanel.innerHTML = fruits.map((fruit) => {
    const diff = fruit.price - fruit.prevPrice;
    const diffPercent = fruit.prevPrice
      ? Math.abs((diff / fruit.prevPrice) * 100).toFixed(1)
      : '0.0';

    const isUp = diff > 0;
    const isDown = diff < 0;
    const flashClass = isUp ? 'flash-up' : isDown ? 'flash-down' : '';
    const badgeClass = isUp ? 'badge-up' : isDown ? 'badge-down' : 'badge-flat';
    const arrow = isUp ? '▲' : isDown ? '▼' : '-';

    const canBuy = player.cash >= fruit.price;
    const canSell = player.holdings[fruit.id] > 0;

    return `
      <article class="fruit-card">
        <div class="card-top">
          <h3>${fruit.name}</h3>
          <span class="vol-tag">${volatilityLabel(fruit.volatility)}</span>
        </div>

        <p class="price mono ${flashClass}">${fruit.price.toLocaleString()}원</p>
        <span class="badge ${badgeClass}">${arrow} ${diffPercent}%</span>

        <div class="trade-row">
          <input type="number" class="qty-input mono" id="qty-${fruit.id}" value="1" min="1">
          <button class="btn buy-btn" data-action="buy" data-id="${fruit.id}" ${canBuy ? '' : 'disabled'}>매수</button>
          <button class="btn sell-btn" data-action="sell" data-id="${fruit.id}" ${canSell ? '' : 'disabled'}>매도</button>
        </div>
      </article>
    `;
  }).join('');
}

// 세 렌더 함수를 한 번에 호출하는 묶음 함수. 데이터가 바뀔 때마다 이것만 부르면 됩니다.
function renderAll() {
  renderTicker();
  renderWallet();
  renderMarket();
}


/* =====================================================================
   ⑤ 거래(매수/매도) 로직
===================================================================== */

function buyFruit(fruitId, qty) {
  // .find()는 배열에서 조건에 맞는 첫 항목을 찾습니다.
  // 파이썬: next(f for f in fruits if f['id'] == fruitId)
  const fruit = fruits.find((f) => f.id === fruitId);
  const cost = fruit.price * qty;

  if (player.cash < cost) {
    alert('현금이 부족해요! 🥲');
    return;
  }

  player.cash -= cost;
  player.holdings[fruitId] += qty;
  renderAll(); // 자산이 바뀌었으니 화면을 즉시 다시 그림
}

function sellFruit(fruitId, qty) {
  const fruit = fruits.find((f) => f.id === fruitId);

  if (player.holdings[fruitId] < qty) {
    alert('보유한 수량보다 많이 팔 수 없어요! 🥲');
    return;
  }

  player.holdings[fruitId] -= qty;
  player.cash += fruit.price * qty;
  renderAll();
}

// 매수/매도 버튼 클릭을 처리하는 함수.
// 카드들은 renderMarket()이 매번 innerHTML로 새로 그리기 때문에,
// 버튼 하나하나에 직접 addEventListener를 다는 대신 "이벤트 위임(event delegation)"
// 방식을 씁니다: 부모 요소(marketPanel) 하나에만 리스너를 걸어두고,
// 실제로 클릭된 대상이 버튼인지 나중에 확인하는 방식이에요.
function handleMarketClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return; // 버튼이 아닌 곳을 클릭했다면 무시

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
   ⑥ 가격 변동 & 뉴스 이벤트 로직
===================================================================== */

function updatePrices() {
  fruits.forEach((fruit) => {
    fruit.prevPrice = fruit.price;

    // Math.random()은 파이썬의 random.random()과 동일하게 0.0 ~ 1.0 사이의
    // 실수를 하나 돌려줍니다. 여기에 * 2 - 1을 하면 -1.0 ~ 1.0 범위가 되고,
    // 여기에 volatility(변동성)를 곱하면 "이번 턴의 등락률"이 나옵니다.
    const changeRatio = (Math.random() * 2 - 1) * fruit.volatility;
    const newPrice = fruit.price * (1 + changeRatio);

    // 가격이 1원 밑으로 떨어지지 않도록 최소값을 보장합니다.
    fruit.price = Math.max(1, Math.round(newPrice));
  });
}

let newsHideTimer = null;

function showNews(text) {
  dom.newsText.textContent = text;
  dom.newsBanner.classList.add('visible');

  // 파이썬이었다면 threading.Timer(4.5, hide).start() 같은 방식으로
  // "몇 초 뒤에 실행"을 처리했을 텐데, 브라우저에서는 setTimeout으로 간단히 됩니다.
  // 이전에 예약해둔 숨김 타이머가 남아있다면 먼저 취소(clearTimeout)해서
  // 배너가 중간에 갑자기 사라지는 버그를 막습니다.
  clearTimeout(newsHideTimer);
  newsHideTimer = setTimeout(() => {
    dom.newsBanner.classList.remove('visible');
  }, 4500);
}

function maybeTriggerNews() {
  const NEWS_CHANCE = 0.25; // 매 턴마다 25% 확률로 뉴스 발생
  if (Math.random() > NEWS_CHANCE) return; // 파이썬: if random.random() > 0.25: return

  // 배열 안에서 무작위로 하나 뽑기. 파이썬의 random.choice(NEWS_EVENTS)와 동일한 결과.
  const event = NEWS_EVENTS[Math.floor(Math.random() * NEWS_EVENTS.length)];
  event.effect(fruits); // 가격에 실제로 반영
  showNews(event.text);
}


/* =====================================================================
   ⑦ 게임 루프 (턴 진행)
   -----------------------------------------------------------------
   ⚠️ setTimeout vs 파이썬의 time.sleep() - 가장 중요한 차이점!

   파이썬에서 흐름을 5초 멈추고 싶으면:
       time.sleep(5)   # 이 줄에서 프로그램 전체가 "그 자리에 멈춰서" 5초를 기다림

   자바스크립트는 이렇게 하면 안 됩니다. setTimeout(함수, 5000)은
   "5초 뒤에 이 함수를 실행해줘"라고 브라우저에게 예약만 해두고,
   나머지 코드는 즉시 계속 실행됩니다. 그래서 버튼 클릭 같은 사용자 반응이
   가격 변동을 기다리는 동안에도 전혀 막히지 않고 즉각 동작하는 거예요.

   또한 우리는 "5~10초 사이 무작위 간격"을 원하기 때문에, 매번 똑같은
   간격으로 반복하는 setInterval(fn, 7000) 대신, runTurn() 함수 끝에서
   scheduleNextTurn()을 다시 호출해 "다음 턴을 새로 예약"하는 재귀적인
   방식을 사용합니다.
===================================================================== */

function startProgressBar(durationMs) {
  const fill = dom.progressFill;

  // 애니메이션을 매번 "처음 상태(100%)"부터 다시 시작시키기 위한 트릭입니다.
  // 트랜지션을 잠깐 끄고 너비를 100%로 즉시 되돌린 뒤, offsetWidth를 한 번
  // 읽어서 브라우저가 스타일 변경을 강제로 반영(reflow)하게 만듭니다.
  // 이 과정이 없으면 브라우저가 "어차피 곧 다시 바뀔 스타일"이라고 판단해서
  // 트랜지션을 건너뛰어 버릴 수 있어요. (파이썬에는 없는, 브라우저 렌더링 특유의 개념)
  fill.style.transition = 'none';
  fill.style.width = '100%';
  void fill.offsetWidth;
  fill.style.transition = `width ${durationMs}ms linear`;
  fill.style.width = '0%';
}

function scheduleNextTurn() {
  const duration = randomBetween(5000, 10000); // 5~10초
  startProgressBar(duration);
  setTimeout(runTurn, duration);
}

function runTurn() {
  updatePrices();
  maybeTriggerNews();
  renderAll();
  scheduleNextTurn(); // 이번 턴이 끝나자마자 다음 턴을 새로 예약
}


/* =====================================================================
   ⑧ 초기 실행
   -----------------------------------------------------------------
   파이썬의 if __name__ == "__main__": 블록처럼, 이 파일이 로드되는
   순간 자동으로 실행되어 게임을 시작시키는 부분입니다.
===================================================================== */
function init() {
  renderAll();
  dom.marketPanel.addEventListener('click', handleMarketClick);
  scheduleNextTurn(); // 첫 턴 예약 → 이후로는 runTurn이 스스로 자신을 계속 예약함
}

init();