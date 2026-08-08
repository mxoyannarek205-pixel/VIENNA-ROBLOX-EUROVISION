/* =========================================================================
   ВНИМАНИЕ: это фронтенд-логика. Здесь показана блокировка "один голос"
   на уровне браузера (localStorage) — как временная защита, чтобы форма
   не отправлялась повторно. РЕАЛЬНАЯ защита от накруток (проверка по IP,
   хранение голосов, подсчёт баллов по странам) должна быть на бэкенде.
   Ниже эта логика уже подготовлена под простой вызов fetch('/api/vote'),
   когда бэкенд (Vercel) будет готов — сейчас он замокан локально.
   ========================================================================= */

const ROUND_ID = "round-1";
const STORAGE_KEY = `vienna_eurovision_voted_${ROUND_ID}`;

const ENTRIES = [
  {
    code: "BE", flag: "🇧🇪", country: "Belgium",
    artist: "ESSYLA", song: "Dancing On The Ice",
    photo: "https://storage.googleapis.com/eurovision-com.appspot.com/renditions/public/cms/260507_corinne-cumming_ebu00040-croppedpng/260507_Corinne%20Cumming_EBU00040%20cropped-fill_size%3D800x1200-focal_point%3D2481x936-focal_size%3D669x803-format%3Dwebp.webp"
  },
  {
    code: "UA", flag: "🇺🇦", country: "Ukraine",
    artist: "LELEKA", song: "Ridnym",
    photo: "https://storage.googleapis.com/eurovision-com.appspot.com/renditions/public/cms/260509_corinne-cumming_ebu00070jpg/260509_Corinne%20Cumming_EBU00070-fill_size%3D800x1200-focal_point%3D2527x2748-focal_size%3D1516x1741-format%3Dwebp.webp"
  },
  {
    code: "MD", flag: "🇲🇩", country: "Moldova",
    artist: "Satoshi", song: "Viva, Moldova!",
    photo: "https://storage.googleapis.com/eurovision-com.appspot.com/renditions/public/cms/260506_corinne-cumming_ebu00028jpg/260506_Corinne%20Cumming_EBU00028-fill_size%3D800x1200-focal_point%3D2223x683-focal_size%3D587x595-format%3Dwebp.webp"
  },
  {
    code: "RO", flag: "🇷🇴", country: "Romania",
    artist: "Alexandra Căpitănescu", song: "Choke me",
    photo: "https://storage.googleapis.com/eurovision-com.appspot.com/renditions/public/cms/260508_corinne-cumming_ebu00236jpg/260508_Corinne%20Cumming_EBU00236-fill_size%3D800x1200-focal_point%3D2629x1604-focal_size%3D687x726-format%3Dwebp.webp"
  },
  {
    code: "IL", flag: "🇮🇱", country: "Israel",
    artist: "Noam Bettan", song: "Michelle",
    photo: "https://storage.googleapis.com/eurovision-com.appspot.com/renditions/public/cms/260506_corinne-cumming_ebu00008croppedpng/260506_Corinne%20Cumming_EBU00008%3Acropped-fill_size%3D800x1200-focal_point%3D3119x1006-focal_size%3D828x1325-format%3Dwebp.webp"
  },
  {
    code: "GR", flag: "🇬🇷", country: "Greece",
    artist: "Akylas", song: "Ferto",
    photo: "https://storage.googleapis.com/eurovision-com.appspot.com/renditions/public/cms/260506_corinne-cumming_ebu00008_croppedpng/260506_Corinne%20Cumming_EBU00008_cropped-fill_size%3D800x1200-focal_point%3D2505x754-focal_size%3D866x826-format%3Dwebp.webp"
  },
  {
    code: "DK", flag: "🇩🇰", country: "Denmark",
    artist: "Søren Torpegaard Lund", song: "Før Vi Går Hjem",
    photo: "https://storage.googleapis.com/eurovision-com.appspot.com/renditions/public/cms/260508_corinne-cumming_ebu00110-croppedpng/260508_Corinne%20Cumming_EBU00110%20cropped-fill_size%3D800x1200-focal_point%3D2371x1222-focal_size%3D941x1065-format%3Dwebp.webp"
  },
  {
    code: "LU", flag: "🇱🇺", country: "Luxembourg",
    artist: "Eva Marija", song: "Mother Nature",
    photo: "https://storage.googleapis.com/eurovision-com.appspot.com/renditions/public/cms/260508_corinne-cumming_ebu00263jpg/260508_Corinne%20Cumming_EBU00263-fill_size%3D800x1200-focal_point%3D2486x2318-focal_size%3D1065x1044-format%3Dwebp.webp"
  },
  {
    code: "AU", flag: "🇦🇺", country: "Australia",
    artist: "Delta Goodrem", song: "Eclipse",
    photo: "https://storage.googleapis.com/eurovision-com.appspot.com/renditions/public/cms/260509_corinne-cumming_ebu00077jpg/260509_Corinne%20Cumming_EBU00077-fill_size%3D800x1200-focal_point%3D2589x2108-focal_size%3D1106x1618-format%3Dwebp.webp"
  }
];

const grid = document.getElementById("entriesGrid");
const selectedValue = document.getElementById("selectedValue");
const pointsGrid = document.getElementById("pointsGrid");
const captchaQuestion = document.getElementById("captchaQuestion");
const captchaInput = document.getElementById("captchaInput");
const captchaRefresh = document.getElementById("captchaRefresh");
const submitBtn = document.getElementById("submitVote");
const panelError = document.getElementById("panelError");
const overlay = document.getElementById("voteOverlay");
const overlayCountry = document.getElementById("overlayCountry");

let state = {
  selectedCode: null,
  selectedPoints: null,
  captchaAnswer: null
};

/* ---------- render entry cards ---------- */
function renderEntries() {
  grid.innerHTML = "";
  ENTRIES.forEach(entry => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "entry-card";
    card.dataset.code = entry.code;
    card.setAttribute("aria-pressed", "false");
    card.innerHTML = `
      <div class="entry-inner">
        <img class="entry-photo" src="${entry.photo}" alt="${entry.artist} — ${entry.song}" loading="lazy">
        <div class="entry-fade"></div>
        <div class="entry-flag">${entry.flag}</div>
        <div class="entry-check">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke="#08080D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="entry-text">
          <p class="entry-country">${entry.country}</p>
          <p class="entry-artist">${entry.artist}</p>
          <p class="entry-song">«${entry.song}»</p>
        </div>
      </div>
    `;
    card.addEventListener("click", () => selectEntry(entry.code));
    grid.appendChild(card);
  });
}

function selectEntry(code) {
  state.selectedCode = code;
  document.querySelectorAll(".entry-card").forEach(card => {
    const isSelected = card.dataset.code === code;
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
  });
  const entry = ENTRIES.find(e => e.code === code);
  selectedValue.textContent = `${entry.flag} ${entry.country} — ${entry.artist}, «${entry.song}»`;
  selectedValue.classList.remove("is-empty");
  clearError();
  updateSubmitState();
}

/* ---------- points 1..10 ---------- */
function renderPoints() {
  pointsGrid.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "point-btn";
    btn.textContent = String(i);
    btn.addEventListener("click", () => selectPoints(i, btn));
    pointsGrid.appendChild(btn);
  }
}

function selectPoints(value, btnEl) {
  state.selectedPoints = value;
  document.querySelectorAll(".point-btn").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");
  clearError();
  updateSubmitState();
}

/* ---------- captcha ---------- */
function newCaptcha() {
  const a = Math.floor(Math.random() * 8) + 1;
  const b = Math.floor(Math.random() * 8) + 1;
  const ops = ["+", "-"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let answer, question;
  if (op === "+") {
    answer = a + b;
    question = `${a} + ${b} =`;
  } else {
    const hi = Math.max(a, b), lo = Math.min(a, b);
    answer = hi - lo;
    question = `${hi} - ${lo} =`;
  }
  state.captchaAnswer = answer;
  captchaQuestion.textContent = question;
  captchaInput.value = "";
}

captchaRefresh.addEventListener("click", () => {
  newCaptcha();
  clearError();
});
captchaInput.addEventListener("input", () => {
  clearError();
  updateSubmitState();
});

/* ---------- submit gating ---------- */
function updateSubmitState() {
  const ready = state.selectedCode && state.selectedPoints && captchaInput.value.trim() !== "";
  submitBtn.disabled = !ready;
}

function clearError() {
  panelError.textContent = "";
}

function showError(msg) {
  panelError.textContent = msg;
}

/* ---------- submit vote ----------
   Заглушка под реальный бэкенд. Когда будет готов /api/vote на Vercel,
   замени тело функции submitVote() на fetch-запрос, например:

   const res = await fetch('/api/vote', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ round: ROUND_ID, country: state.selectedCode, points: state.selectedPoints, captchaAnswer: Number(captchaInput.value) })
   });
   const data = await res.json();
   if (!res.ok) { showError(data.message || 'Не удалось отправить голос'); return; }

   Бэкенд должен сам проверять капчу и IP — фронтенд не может быть
   единственной защитой от накруток.
------------------------------------------------------------------ */
async function submitVote() {
  clearError();

  if (localStorage.getItem(STORAGE_KEY)) {
    showError("Вы уже голосовали в этом раунде.");
    return;
  }
  if (!state.selectedCode) {
    showError("Выберите страну.");
    return;
  }
  if (!state.selectedPoints) {
    showError("Выберите количество баллов.");
    return;
  }
  const userAnswer = Number(captchaInput.value);
  if (Number.isNaN(userAnswer) || userAnswer !== state.captchaAnswer) {
    showError("Неверный ответ на пример, попробуйте ещё раз.");
    newCaptcha();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Отправка…";

  // симуляция запроса к серверу
  await new Promise(r => setTimeout(r, 500));

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    country: state.selectedCode,
    points: state.selectedPoints,
    ts: Date.now()
  }));

  const entry = ENTRIES.find(e => e.code === state.selectedCode);
  overlayCountry.textContent = `${entry.country} (${state.selectedPoints} б.)`;
  overlay.hidden = false;

  submitBtn.textContent = "Отправить голос";
  lockForm();
}

function lockForm() {
  document.querySelectorAll(".entry-card, .point-btn, .captcha-input, .captcha-refresh, #submitVote")
    .forEach(el => { el.disabled = true; });
}

submitBtn.addEventListener("click", submitVote);

/* ---------- init ---------- */
function checkAlreadyVoted() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;
  try {
    const data = JSON.parse(saved);
    const entry = ENTRIES.find(e => e.code === data.country);
    if (entry) {
      selectEntry(entry.code);
      const btns = pointsGrid.querySelectorAll(".point-btn");
      if (btns[data.points - 1]) btns[data.points - 1].classList.add("active");
      overlayCountry.textContent = `${entry.country} (${data.points} б.)`;
    }
  } catch (e) { /* ignore */ }
  lockForm();
  return true;
}

renderEntries();
renderPoints();
newCaptcha();
const alreadyVoted = checkAlreadyVoted();
if (alreadyVoted) {
  showError("Вы уже проголосовали в этом раунде — спасибо!");
}
