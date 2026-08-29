/* =====================================================================
   프리미엄 과일 주식 시뮬레이터 (10초 시세 반영 & 차트 & 부가 컨텐츠)
===================================================================== */

const START_CASH = 1000000;
const DAY_DURATION_MS = 5 * 60 * 1000; // 하루 5분
const TICK_INTERVAL = 10000; // 10초마다 틱
const TICKS_PER_DAY = DAY_DURATION_MS / TICK_INTERVAL; // 30틱
const HINT_COST = 5000;
const SAVE_KEY = 'premiumFruitSaveV2';

// --------------------------------------------------
// 1. 데이터 구조 정의
// --------------------------------------------------
let fruits = [
  { id: 'apple-electronics', ticker: 'APPL', emoji: '🍎', name: '애플전자', category: '우량주', badgeClass: 'badge-blue-chip', 
    price: 50000, startPrice: 50000, volatility: 0.005, drift: 0.001, tags: ['blue-chip'], history: [50000], color: '#e8e6df' },
  { id: 'delmonte-banana', ticker: 'DELB', emoji: '🍌', name: '델몬트바나나', category: '우량주', badgeClass: 'badge-blue-chip', 
    price: 30000, startPrice: 30000, volatility: 0.006, drift: 0.0005, tags: ['dividend'], history: [30000], color: '#d4af37' },
  { id: 'jeju-citrus-air', ticker: 'JCIT', emoji: '🍊', name: '제주감귤항공', category: '가치주', badgeClass: 'badge-value', 
    price: 20000, startPrice: 20000, volatility: 0.015, drift: 0, tags: ['weather'], history: [20000], color: '#e0984e' },
  { id: 'shine-muscat-luxury', ticker: 'SMLX', emoji: '🍇', name: '샤인머스캣럭셔리', category: '가치주', badgeClass: 'badge-value', 
    price: 25000, startPrice: 25000, volatility: 0.02, drift: 0, tags: ['trend'], history: [25000], color: '#4a9aa4' },
  { id: 'watermelon-entertainment', ticker: 'WMEN', emoji: '🍉', name: '수박엔터테인먼트', category: '테마주', badgeClass: 'badge-theme', 
    price: 15000, startPrice: 15000, volatility: 0.04, drift: 0, tags: ['entertainment'], history: [15000], color: '#e0483e' },
  { id: 'durian-bio', ticker: 'DURB', emoji: '🦔', name: '두리안바이오', category: '작전주', badgeClass: 'badge-manipulated', 
    price: 8000, startPrice: 8000, volatility: 0.08, drift: -0.002, tags: ['biotech'], history: [8000], color: '#4f83cc' }
];

// 뉴스 풀
const NEWS_POOL = [
  { id: 'market-boom', type: 'market', text: '🌍 글로벌 경기 훈풍, 전 종목 강세 흐름', hint: '전반적인 시장 분위기가 아주 뜨거울 예정입니다.', effect: 0.1 },
  { id: 'market-crash', type: 'market', text: '📉 금리 인상 발표, 전 종목 약세 흐름', hint: '시장에 짙은 먹구름이 낄 것 같습니다.', effect: -0.1 },
  { id: 'weather-bad', type: 'tag', tag: 'weather', text: '❄️ 한파 주의보, 날씨 관련주 부진 예상', hint: '기상 악화로 비행기나 농사에 차질이 생길지도...', effect: -0.15 },
  { id: 'weather-good', type: 'tag', tag: 'weather', text: '☀️ 역대급 맑은 날씨, 관련주 호조', hint: '날씨 덕을 보는 회사들이 웃을 겁니다.', effect: 0.15 },
  { id: 'durian-moon', type: 'stock', targetId: 'durian-bio', text: '🚀 두리안 바이오 임상 성공 소식에 연일 급등!', hint: '가장 냄새나는 회사에서 엄청난 소식이 터집니다.', effect: 1.5 },
  { id: 'durian-delist', type: 'stock', targetId: 'durian-bio', text: '💀 두리안 바이오 회계 부정 논란... 폭락 중', hint: '가장 냄새나는 회사가 문을 닫을지도 모릅니다.', effect: -0.6 }
];

// 상점 아이템 (부동산)
const SHOP_ITEMS = [
  { id: 'watch', name: '롤렉스 시계', price: 20000000, emoji: '⌚' },
  { id: 'car', name: '슈퍼카', price: 150000000, emoji: '🏎️' },
  { id: 'farm', name: '대규모 과일 농장', price: 500000000, emoji: '🚜' },
  { id: 'penthouse', name: '강남 펜트하우스', price: 2000000000, emoji: '🏢' }
];

// --------------------------------------------------
// 2. 플레이어 상태
// --------------------------------------------------
let player = {
  cash: START_CASH,
  debt: 0,
  holdings: { 'apple-electronics': 0, 'delmonte-banana': 0, 'jeju-citrus-air': 0, 'shine-muscat-luxury': 0, 'watermelon-entertainment': 0, 'durian-bio': 0 },
  inventory: [],
  achievements: []
};

let dayCount = 1;
let timeRemaining = DAY_DURATION_MS;
let todaysNews = pickRandomNews();
let activeNews = null;
let hintPurchasedToday = false;
let chartInstance = null;

const dom = {
  dayNumber: document.getElementById('dayNumber'),
  timerText: document.getElementById('timerText'),
  timerFill: document.getElementById('timerFill'),
  newsText: document.getElementById('newsText'),
  cashValue: document.getElementById('cashValue'),
  totalValue: document.getElementById('totalValue'),
  debtValue: document.getElementById('debtValue'),
  holdingsList: document.getElementById('holdingsList'),
  stockTableBody: document.getElementById('stockTableBody'),
  shopList: document.getElementById('shopList'),
  hintText: document.getElementById('hintText'),
  hintBtn: document.getElementById('hintBtn'),
  toastContainer: document.getElementById('toastContainer')
};

// --------------------------------------------------
// 3. 유틸 함수
// --------------------------------------------------
function formatWon(amount) { return `${Math.round(amount).toLocaleString('ko-KR')}원`; }
function formatPercent(ratio) { return `${ratio > 0 ? '+' : ''}${(ratio * 100).toFixed(1)}%`; }
function randomFloat(min, max) { return Math.random() * (max - min) + min; }
function pickRandomNews() { return NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)]; }

function newsAffects(news, fruit) {
  if (news.type === 'market') return true;
  if (news.type === 'tag') return fruit.tags.includes(news.tag);
  if (news.type === 'stock') return fruit.id === news.targetId;
  return false;
}

// --------------------------------------------------
// 4. 차트 초기화 (Chart.js)
// --------------------------------------------------
function initChart() {
  const ctx = document.getElementById('priceChart').getContext('2d');
  
  // 파이썬 리스트 컴프리헨션(List Comprehension)과 유사하게 객체 배열을 변환
  const datasets = fruits.map(f => ({
    label: f.name,
    data: f.history,
    borderColor: f.color,
    borderWidth: 2,
    tension: 0.1,
    pointRadius: 0
  }));

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array(f.history ? f.history.length : 1).fill(''), 
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { display: false },
        y: { ticks: { color: '#8b8f9e' }, grid: { color: '#262b3a' } }
      },
      plugins: {
        legend: { labels: { color: '#e8e6df', boxWidth: 12 } }
      }
    }
  });
}

function updateChart() {
  if (!chartInstance) return;
  const maxPoints = 60;
  
  fruits.forEach((f, index) => {
    chartInstance.data.datasets[index].data = f.history;
  });
  
  const currentLen = fruits[0].history.length;
  chartInstance.data.labels = Array(currentLen).fill('');
  chartInstance.update();
}

// --------------------------------------------------
// 5. 게임 핵심 로직 (10초 틱 & 하루 마감)
// --------------------------------------------------
function tickClock() {
  timeRemaining -= 1000;
  
  const secs = Math.ceil(timeRemaining / 1000);
  dom.timerText.textContent = `${String(Math.floor(secs / 60)).padStart(2,'0')}:${String(secs % 60).padStart(2,'0')}`;
  dom.timerFill.style.width = `${(timeRemaining / DAY_DURATION_MS) * 100}%`;

  if (timeRemaining > 0 && timeRemaining % TICK_INTERVAL === 0) {
    marketTick();
  }

  if (timeRemaining <= 0) {
    resolveDay();
    timeRemaining = DAY_DURATION_MS;
  }
}

function marketTick() {
  fruits.forEach(f => {
    f.startPrice = f.price; 
    
    let drift = f.drift;
    if (newsAffects(todaysNews, f)) {
      drift += (todaysNews.effect / TICKS_PER_DAY);
    }

    const change = drift + randomFloat(-f.volatility, f.volatility);
    f.price = Math.max(1, Math.round(f.price * (1 + change)));
    
    // 파이썬의 list.append()와 같은 기능으로 히스토리에 추가
    f.history.push(f.price);
    // 파이썬의 list.pop(0) 처럼 앞부분 삭제하여 차트 길이 조절
    if (f.history.length > 60) f.history.shift(); 
  });
  
  updateChart();
  renderMarket();
  renderWallet();
  checkAchievements();
  saveGame();
}

function resolveDay() {
  activeNews = todaysNews;
  
  if (player.debt > 0) {
    player.debt = Math.round(player.debt * 1.05); // 5% 복리
    showToast(`💸 대출 이자 5%가 발생했습니다.`);
  }

  const bananaQty = player.holdings['delmonte-banana'];
  if (bananaQty > 0) {
    const dividend = bananaQty * 500;
    player.cash += dividend;
    showToast(`🍌 델몬트바나나 배당금 ${formatWon(dividend)} 입금!`);
  }

  dayCount++;
  todaysNews = pickRandomNews(); 
  hintPurchasedToday = false;
  
  renderAll();
  saveGame();
}

// --------------------------------------------------
// 6. 상호작용 (매매, 대출, 상점, 힌트)
// --------------------------------------------------
function buyFruit(id, qty) {
  const f = fruits.find(x => x.id === id);
  const cost = f.price * qty;
  if (player.cash < cost) return alert('현금이 부족합니다!');
  player.cash -= cost;
  player.holdings[id] += qty;
  renderAll(); saveGame(); checkAchievements();
}

function sellFruit(id, qty) {
  const f = fruits.find(x => x.id === id);
  if (player.holdings[id] < qty) return alert('보유 수량이 부족합니다!');
  player.cash += f.price * qty;
  player.holdings[id] -= qty;
  renderAll(); saveGame(); checkAchievements();
}

document.getElementById('loanBtn').addEventListener('click', () => {
  player.cash += 1000000;
  player.debt += 1000000;
  renderAll(); saveGame();
});

document.getElementById('repayBtn').addEventListener('click', () => {
  if (player.debt <= 0) return alert('갚을 빚이 없습니다.');
  if (player.cash < player.debt) return alert('현금이 부족하여 전액 상환할 수 없습니다.');
  player.cash -= player.debt;
  player.debt = 0;
  renderAll(); saveGame();
});

dom.hintBtn.addEventListener('click', () => {
  if (hintPurchasedToday) return;
  if (player.cash < HINT_COST) return alert('돈이 부족합니다!');
  player.cash -= HINT_COST;
  hintPurchasedToday = true;
  renderAll(); saveGame();
});

function buyShopItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (player.cash < item.price) return alert('현금이 부족합니다!');
  if (player.inventory.includes(itemId)) return alert('이미 보유하고 있습니다.');
  
  player.cash -= item.price;
  player.inventory.push(itemId);
  showToast(`🎉 ${item.name} 구매 완료!`);
  renderAll(); saveGame(); checkAchievements();
}

// --------------------------------------------------
// 7. 렌더링
// --------------------------------------------------
function renderWallet() {
  dom.cashValue.textContent = formatWon(player.cash);
  dom.debtValue.textContent = formatWon(player.debt);
  
  const stockValue = fruits.reduce((sum, f) => sum + f.price * player.holdings[f.id], 0);
  const netWorth = player.cash + stockValue - player.debt;
  dom.totalValue.textContent = formatWon(netWorth);

  const owned = fruits.filter(f => player.holdings[f.id] > 0);
  dom.holdingsList.innerHTML = owned.length ? owned.map(f => `
    <li class="holding-row"><span>${f.emoji} ${f.name}</span><span class="mono">${player.holdings[f.id]}주</span></li>
  `).join('') : '<li class="holding-row" style="color:var(--text-dim)">보유 종목 없음</li>';
}

function renderMarket() {
  dom.stockTableBody.innerHTML = fruits.map(f => {
    const diff = f.price - f.startPrice;
    const ratio = diff / f.startPrice;
    const isUp = diff > 0, isDown = diff < 0;
    const changeClass = isUp ? 'change-up' : isDown ? 'change-down' : 'change-flat';
    
    const canBuy = player.cash >= f.price;
    const canSell = player.holdings[f.id] > 0;

    return `
      <tr>
        <td>
          <div class="stock-name-cell"><span class="stock-emoji">${f.emoji}</span>
          <div><div class="stock-name">${f.name}</div><div class="stock-ticker mono">${f.ticker}</div></div></div>
        </td>
        <td><span class="badge ${f.badgeClass}">${f.category}</span></td>
        <td class="mono price-cell">${f.price.toLocaleString()}원</td>
        <td><span class="change-badge ${changeClass}">${isUp?'▲':isDown?'▼':'-'} ${formatPercent(ratio)}</span></td>
        <td class="mono">${player.holdings[f.id]}주</td>
        <td>
          <div class="trade-controls">
            <input type="number" class="qty-input mono" id="qty-${f.id}" value="1" min="1">
            <button class="btn buy-btn" onclick="buyFruit('${f.id}', parseInt(document.getElementById('qty-${f.id}').value))" ${canBuy?'':'disabled'}>매수</button>
            <button class="btn sell-btn" onclick="sellFruit('${f.id}', parseInt(document.getElementById('qty-${f.id}').value))" ${canSell?'':'disabled'}>매도</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderShop() {
  dom.shopList.innerHTML = SHOP_ITEMS.map(item => {
    const owned = player.inventory.includes(item.id);
    return `
      <li class="holding-row">
        <span>${item.emoji} ${item.name} <span style="color:var(--text-dim);font-size:11px;">(${formatWon(item.price)})</span></span>
        ${owned ? '<span class="badge badge-value">보유중</span>' 
                : `<button class="btn shop-btn" onclick="buyShopItem('${item.id}')">구매</button>`}
      </li>
    `;
  }).join('');
}

function renderAll() {
  dom.dayNumber.textContent = dayCount;
  dom.newsText.textContent = activeNews ? activeNews.text : '첫째 날 개장! 우상향을 기원합니다.';
  
  dom.hintBtn.disabled = hintPurchasedToday;
  dom.hintBtn.textContent = hintPurchasedToday ? '정보 입수 완료' : `정보 구매 (${HINT_COST.toLocaleString()}원)`;
  dom.hintText.textContent = hintPurchasedToday ? `"${todaysNews.hint}"` : '"아직 정보를 사지 않았어요..."';

  renderWallet();
  renderMarket();
  renderShop();
}

// --------------------------------------------------
// 8. 업적 시스템
// --------------------------------------------------
function checkAchievements() {
  const stockValue = fruits.reduce((sum, f) => sum + f.price * player.holdings[f.id], 0);
  const netWorth = player.cash + stockValue - player.debt;

  const checks = [
    { id: '100m', title: '자산가', desc: '순자산 1억 달성!', check: () => netWorth >= 100000000 },
    { id: 'bankrupt', title: '첫 깡통', desc: '순자산 0원 이하...', check: () => netWorth <= 0 },
    { id: 'all_item', title: 'FLEX', desc: '모든 사치품 구매!', check: () => player.inventory.length === SHOP_ITEMS.length }
  ];

  checks.forEach(ach => {
    if (!player.achievements.includes(ach.id) && ach.check()) {
      player.achievements.push(ach.id);
      showToast(`🏆 업적 달성: ${ach.title} - ${ach.desc}`);
    }
  });
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = msg;
  dom.toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// --------------------------------------------------
// 9. 세이브 / 로드 / 초기화
// --------------------------------------------------
function saveGame() {
  const saveData = { player, dayCount, hintPurchasedToday, fruits: fruits.map(f => ({id:f.id, price:f.price, history:f.history})) };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;
  const data = JSON.parse(raw);
  player = Object.assign(player, data.player);
  if(!player.achievements) player.achievements = []; 
  dayCount = data.dayCount;
  hintPurchasedToday = data.hintPurchasedToday;
  data.fruits.forEach(sf => {
    const f = fruits.find(x => x.id === sf.id);
    if(f) { f.price = sf.price; f.history = sf.history || [sf.price]; }
  });
}

document.getElementById('resetBtn').addEventListener('click', () => {
  if(!confirm('모든 기록을 지우고 처음부터 하시겠습니까?')) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
});

// 시작
loadGame();
initChart();
renderAll();
updateChart();
setInterval(tickClock, 1000);