// ---------- STORAGE HELPERS ----------
const store = {
  get: (k, fallback) => JSON.parse(localStorage.getItem(k) || 'null') ?? fallback,
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

const FREE_MESSAGES_PER_DAY = 3;
const isPremium = () => store.get('rb_premium', false);

// ---------- PREMIUM BADGE ----------
function refreshPremiumUI(){
  document.getElementById('premiumBadge').classList.toggle('hidden', !isPremium());
  document.getElementById('premiumSection').classList.toggle('hidden', isPremium());
  updateChatCounter();
}

// ---------- WEEK TRACKER ----------
const sizeMap = [
  [4,'a poppy seed'],[6,'a lentil'],[8,'a raspberry'],[10,'a strawberry'],
  [12,'a lime'],[14,'a lemon'],[16,'an avocado'],[18,'a bell pepper'],
  [20,'a banana'],[22,'a papaya'],[24,'an ear of corn'],[26,'a scallion bunch'],
  [28,'an eggplant'],[30,'a cabbage'],[32,'a jicama'],[34,'a cantaloupe'],
  [36,'a papaya (again, bigger!)'],[38,'a leek bundle'],[40,'a small pumpkin']
];
function sizeForWeek(w){
  let match = sizeMap[0][1];
  for(const [wk, label] of sizeMap){ if(w >= wk) match = label; }
  return match;
}
function trimesterForWeek(w){
  if(w < 13) return 'First trimester';
  if(w < 27) return 'Second trimester';
  return 'Third trimester';
}

// ---------- WEEKLY TIPS ----------
const weeklyTips = [
  [1,'Start a prenatal vitamin with folic acid if you haven\'t already — it supports your baby\'s early development.'],
  [5,'Fatigue and mild nausea are common now. Rest when you can and keep snacks nearby.'],
  [9,'Morning sickness often peaks around now. Small, frequent meals can help settle your stomach.'],
  [13,'Welcome to the second trimester! Many people find energy levels start to improve around now.'],
  [17,'You may start feeling gentle flutters soon — this is often called "quickening".'],
  [20,'Halfway there! This is a common time for a detailed anatomy ultrasound — check with your doctor.'],
  [24,'Your baby\'s hearing is developing — they may start responding to sounds and your voice.'],
  [28,'Welcome to the third trimester. Your doctor may suggest more frequent check-ups from here.'],
  [32,'Baby is gaining weight quickly now. Try sleeping on your side for better circulation.'],
  [36,'Start thinking about your hospital bag if you haven\'t packed it yet — use the checklist below!'],
  [38,'Full term is close. Keep an eye out for signs of labour and stay in touch with your doctor.'],
  [40,'Your due date is here or near — every pregnancy timeline is a little different, so stay patient.']
];
function tipForWeek(w){
  let match = weeklyTips[0][1];
  for(const [wk, tip] of weeklyTips){ if(w >= wk) match = tip; }
  return match;
}

document.getElementById('calcBtn').addEventListener('click', () => {
  const val = document.getElementById('lmpDate').value;
  if(!val) return;
  const lmp = new Date(val);
  const today = new Date();
  const days = Math.floor((today - lmp) / (1000*60*60*24));
  const weeks = Math.max(0, Math.floor(days/7));
  const dueDate = new Date(lmp.getTime() + 280*24*60*60*1000);

  document.getElementById('weekResult').classList.remove('hidden');
  document.getElementById('weekNumber').textContent = weeks;
  document.getElementById('sizeCompare').textContent = `Your baby is about the size of ${sizeForWeek(weeks)}`;
  document.getElementById('trimester').textContent = trimesterForWeek(weeks);
  document.getElementById('dueDate').textContent = `Estimated due date: ${dueDate.toLocaleDateString('en-IN', {day:'numeric', month:'long', year:'numeric'})}`;

  const pct = Math.min(weeks/40, 1);
  const circumference = 565;
  document.getElementById('progressRing').style.strokeDashoffset = circumference - (pct*circumference);

  document.getElementById('tipCard').classList.remove('hidden');
  document.getElementById('tipText').textContent = tipForWeek(weeks);

  store.set('rb_lmp', val);
});

// restore saved LMP date
(function restoreLmp(){
  const saved = store.get('rb_lmp', null);
  if(saved){
    document.getElementById('lmpDate').value = saved;
    document.getElementById('calcBtn').click();
  }
})();

// ---------- SYMPTOM LOG ----------
let selectedMood = null;
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
  });
});

function renderLog(){
  const entries = store.get('rb_log', []);
  const container = document.getElementById('logHistory');
  container.innerHTML = entries.slice(-5).reverse().map(e => `
    <div class="log-entry">
      <span>${e.mood || ''} ${e.note ? e.note : ''}</span>
      <span class="log-date">${e.date}</span>
    </div>
  `).join('');
}
renderLog();

document.getElementById('logBtn').addEventListener('click', () => {
  const note = document.getElementById('symptomNote').value.trim();
  if(!selectedMood && !note) return;
  const entries = store.get('rb_log', []);
  entries.push({
    mood: selectedMood,
    note,
    date: new Date().toLocaleDateString('en-IN', {day:'numeric', month:'short'})
  });
  store.set('rb_log', entries);
  document.getElementById('symptomNote').value = '';
  selectedMood = null;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  renderLog();
});

// ---------- KICK COUNTER ----------
let kickCount = 0;
let kickStartTime = null;
let kickTimerInterval = null;

function formatElapsed(ms){
  const totalSec = Math.floor(ms/1000);
  const mins = String(Math.floor(totalSec/60)).padStart(2,'0');
  const secs = String(totalSec%60).padStart(2,'0');
  return `${mins}:${secs}`;
}

function renderKickHistory(){
  const sessions = store.get('rb_kick_sessions', []);
  const container = document.getElementById('kickHistory');
  container.innerHTML = sessions.slice(-5).reverse().map(s => `
    <div class="log-entry">
      <span>${s.count} kicks in ${s.duration}</span>
      <span class="log-date">${s.date}</span>
    </div>
  `).join('');
}
renderKickHistory();

document.getElementById('kickTapBtn').addEventListener('click', () => {
  if(!kickStartTime){
    kickStartTime = Date.now();
    document.getElementById('kickResetBtn').classList.remove('hidden');
    document.getElementById('kickDoneMsg').classList.add('hidden');
    kickTimerInterval = setInterval(() => {
      document.getElementById('kickTimer').textContent = formatElapsed(Date.now() - kickStartTime);
    }, 1000);
  }
  kickCount++;
  document.getElementById('kickCount').textContent = kickCount;

  if(kickCount >= 10){
    clearInterval(kickTimerInterval);
    const duration = formatElapsed(Date.now() - kickStartTime);
    const sessions = store.get('rb_kick_sessions', []);
    sessions.push({ count: kickCount, duration, date: new Date().toLocaleDateString('en-IN', {day:'numeric', month:'short'}) });
    store.set('rb_kick_sessions', sessions);
    renderKickHistory();

    document.getElementById('kickDoneMsg').classList.remove('hidden');
    document.getElementById('kickDoneMsg').textContent = `🎉 10 kicks counted in ${duration}. Session saved.`;

    kickCount = 0;
    kickStartTime = null;
    document.getElementById('kickCount').textContent = 0;
    document.getElementById('kickTimer').textContent = '00:00';
    document.getElementById('kickResetBtn').classList.add('hidden');
  }
});

document.getElementById('kickResetBtn').addEventListener('click', () => {
  clearInterval(kickTimerInterval);
  kickCount = 0;
  kickStartTime = null;
  document.getElementById('kickCount').textContent = 0;
  document.getElementById('kickTimer').textContent = '00:00';
  document.getElementById('kickResetBtn').classList.add('hidden');
  document.getElementById('kickDoneMsg').classList.add('hidden');
});

// ---------- WATER TRACKER ----------
const WATER_GOAL = 8;
function waterTodayKey(){ return 'rb_water_' + todayKey(); }

function renderWaterRow(){
  const filled = store.get(waterTodayKey(), 0);
  const row = document.getElementById('waterRow');
  row.innerHTML = '';
  for(let i = 1; i <= WATER_GOAL; i++){
    const btn = document.createElement('button');
    btn.className = 'water-drop' + (i <= filled ? ' filled' : '');
    btn.textContent = '💧';
    btn.addEventListener('click', () => {
      const current = store.get(waterTodayKey(), 0);
      store.set(waterTodayKey(), i <= current ? i - 1 : i);
      renderWaterRow();
    });
    row.appendChild(btn);
  }
  const status = document.getElementById('waterStatus');
  status.textContent = filled >= WATER_GOAL
    ? `Goal reached! ${filled}/${WATER_GOAL} glasses today 🎉`
    : `${filled}/${WATER_GOAL} glasses today`;
}
renderWaterRow();

document.getElementById('waterResetBtn').addEventListener('click', () => {
  store.set(waterTodayKey(), 0);
  renderWaterRow();
});

// ---------- BABY SIZE GUESS GAME ----------
const gameData = [
  [4,'poppy seed'],[5,'sesame seed'],[6,'lentil'],[7,'blueberry'],
  [8,'raspberry'],[9,'grape'],[10,'strawberry'],[11,'fig'],
  [12,'lime'],[13,'peapod'],[14,'lemon'],[15,'apple'],
  [16,'avocado'],[17,'onion'],[18,'bell pepper'],[19,'tomato'],
  [20,'banana'],[21,'carrot'],[22,'papaya'],[23,'mango'],
  [24,'ear of corn'],[25,'cauliflower'],[26,'scallion bunch'],
  [27,'cabbage'],[28,'eggplant'],[29,'butternut squash'],
  [30,'cabbage head'],[31,'coconut'],[32,'jicama'],
  [33,'pineapple'],[34,'cantaloupe'],[35,'honeydew melon'],
  [36,'papaya (large)'],[37,'swiss chard bunch'],[38,'leek bundle'],
  [39,'mini watermelon'],[40,'small pumpkin']
];

let currentGameAnswer = null;

function pickGameQuestion(){
  const [week, correctSize] = gameData[Math.floor(Math.random() * gameData.length)];
  document.getElementById('gameWeek').textContent = week;
  currentGameAnswer = correctSize;

  const others = gameData.filter(([w]) => w !== week).map(([,s]) => s);
  const shuffledOthers = others.sort(() => Math.random() - 0.5).slice(0,3);
  const options = [correctSize, ...shuffledOthers].sort(() => Math.random() - 0.5);

  const optionsContainer = document.getElementById('gameOptions');
  optionsContainer.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'game-option-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleGameAnswer(opt, btn));
    optionsContainer.appendChild(btn);
  });

  document.getElementById('gameFeedback').classList.add('hidden');
  document.getElementById('gameNextBtn').classList.add('hidden');
}

function handleGameAnswer(chosen, btnEl){
  const allBtns = document.querySelectorAll('.game-option-btn');
  allBtns.forEach(b => b.disabled = true);

  const feedback = document.getElementById('gameFeedback');
  feedback.classList.remove('hidden');

  const stats = store.get('rb_game', { score: 0, streak: 0, best: 0 });

  if(chosen === currentGameAnswer){
    btnEl.classList.add('correct');
    feedback.textContent = "🎉 Correct! You know your baby's journey well.";
    feedback.className = 'game-feedback correct-text';
    stats.score += 10;
    stats.streak += 1;
    stats.best = Math.max(stats.best, stats.streak);
  } else {
    btnEl.classList.add('wrong');
    allBtns.forEach(b => { if(b.textContent === currentGameAnswer) b.classList.add('correct'); });
    feedback.textContent = `Not quite — the answer was "${currentGameAnswer}".`;
    feedback.className = 'game-feedback wrong-text';
    stats.streak = 0;
  }

  store.set('rb_game', stats);
  updateGameStatsUI();
  document.getElementById('gameNextBtn').classList.remove('hidden');
}

function updateGameStatsUI(){
  const stats = store.get('rb_game', { score: 0, streak: 0, best: 0 });
  document.getElementById('gameScore').textContent = `Score: ${stats.score}`;
  document.getElementById('gameStreak').textContent = stats.streak;
  document.getElementById('gameBest').textContent = stats.best;
}

document.getElementById('gameNextBtn').addEventListener('click', pickGameQuestion);

updateGameStatsUI();
pickGameQuestion();

// ---------- AI CHAT ----------
function todayKey(){
  return new Date().toISOString().slice(0,10);
}
function getMessageCountToday(){
  const record = store.get('rb_chat_count', {});
  return record[todayKey()] || 0;
}
function incrementMessageCount(){
  const record = store.get('rb_chat_count', {});
  record[todayKey()] = (record[todayKey()] || 0) + 1;
  store.set('rb_chat_count', record);
}
function updateChatCounter(){
  const el = document.getElementById('chatCounter');
  if(isPremium()){
    el.textContent = 'Unlimited';
  } else {
    const used = getMessageCountToday();
    el.textContent = `${Math.max(0, FREE_MESSAGES_PER_DAY - used)} free left today`;
  }
}
updateChatCounter();

function appendMessage(text, who){
  const win = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.className = `msg ${who}`;
  div.textContent = text;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
}

async function sendMessage(){
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text) return;

  if(!isPremium() && getMessageCountToday() >= FREE_MESSAGES_PER_DAY){
    document.getElementById('chatLockMsg').classList.remove('hidden');
    return;
  }

  appendMessage(text, 'user');
  input.value = '';
  incrementMessageCount();
  updateChatCounter();

  const thinkingId = 'thinking-' + Date.now();
  appendMessage('Thinking...', 'ai');

  try{
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    document.querySelector('.chat-window').lastChild.textContent = data.reply || "Sorry, I couldn't answer that. Please try again.";
  } catch(err){
    document.querySelector('.chat-window').lastChild.textContent = "Something went wrong. Please check your connection and try again.";
  }
}

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keypress', e => {
  if(e.key === 'Enter') sendMessage();
});


// ---------- HOSPITAL BAG CHECKLIST ----------
const checklistDefaults = [
  'Comfortable going-home outfit for you',
  'Going-home outfit for baby',
  'Maternity pads',
  'Nursing bras / breast pads',
  'Toiletries (toothbrush, hairbrush, etc.)',
  'Phone charger',
  'Important documents (ID, insurance, birth plan)',
  'Snacks for you and your partner',
  'Baby blanket and swaddle',
  'Diapers and wipes (a small starter pack)',
  'Slippers and warm socks',
  'Going-home car seat, installed in advance'
];

function getChecklistState(){
  return store.get('rb_checklist', {});
}

function renderChecklist(){
  const state = getChecklistState();
  const container = document.getElementById('checklistItems');
  container.innerHTML = checklistDefaults.map((item, i) => {
    const checked = !!state[i];
    return `
      <label class="checklist-item ${checked ? 'checked' : ''}" data-index="${i}">
        <input type="checkbox" ${checked ? 'checked' : ''}>
        <span>${item}</span>
      </label>
    `;
  }).join('');

  container.querySelectorAll('.checklist-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = el.dataset.index;
      const s = getChecklistState();
      s[idx] = !s[idx];
      store.set('rb_checklist', s);
      renderChecklist();
    });
  });

  const checkedCount = Object.values(state).filter(Boolean).length;
  const pct = Math.round((checkedCount / checklistDefaults.length) * 100);
  document.getElementById('checklistProgressFill').style.width = pct + '%';
  document.getElementById('checklistProgressText').textContent = `${checkedCount}/${checklistDefaults.length}`;
}
renderChecklist();

refreshPremiumUI();
function payWithGpay(amount) {
  window.location.href = `upi://pay?pa=sivagowridhans@okaxis&pn=SivaGowriDhan&am=${amount}&cu=INR&tn=RootAndBloom`;
}
