const form = document.getElementById("calcForm");
const input = document.getElementById("blocks");
const btn = document.getElementById("btn");
const resetBtn = document.getElementById("resetBtn");

const stacksValue = document.getElementById("stacksValue");
const remainderValue = document.getElementById("remainderValue");
const resultRow = document.getElementById("resultRow");

const modeSwitch = document.getElementById("modeSwitch");
const modeText = document.getElementById("modeText");
const mainLabel = document.getElementById("mainLabel");
const leftTitle = document.getElementById("leftTitle");
const rightTitle = document.getElementById("rightTitle");

/* ✅ History عناصر */
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

/* ✅ Modal عناصر (لازم تكون موجودة في الـ HTML) */
const clearModal = document.getElementById("clearModal");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");

const STACK_SIZE = 64;

/* =========================
   ✅ تحديد الرقم تلقائياً عند الضغط داخل الحقل
   ========================= */
input.addEventListener("focus", () => {
  if (input.value !== "") input.select();
});
input.addEventListener("click", () => {
  if (input.value !== "") input.select();
});

/* =========================
   ✅ SAVE / LOAD (LocalStorage) - حفظ كل شيء
   ========================= */
function saveState() {
  const state = {
    inputValue: input.value,
    stacksValue: stacksValue.textContent,
    remainderValue: remainderValue.textContent,
    modeChecked: modeSwitch.checked,
    historyHTML: historyList.innerHTML,
  };
  localStorage.setItem("minecraftCalcState", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("minecraftCalcState");
  if (!saved) return;

  const state = JSON.parse(saved);

  input.value = state.inputValue || "";
  stacksValue.textContent = state.stacksValue || "-";
  remainderValue.textContent = state.remainderValue || "-";
  modeSwitch.checked = !!state.modeChecked;
  historyList.innerHTML = state.historyHTML || "";

  setModeUI(); // يعيد ضبط الواجهة حسب المود
}

/* حفظ أثناء الكتابة */
input.addEventListener("input", saveState);

/* =========================
   ✅ Custom Modal Helpers
   ========================= */
function openClearModal() {
  clearModal.classList.remove("hidden");

  requestAnimationFrame(() => {
    clearModal.classList.add("show");
  });

  modalConfirm.focus();
}

function closeClearModal() {
  clearModal.classList.remove("show");

  setTimeout(() => {
    clearModal.classList.add("hidden");
  }, 250);
}

/* =========================
   UI helpers
   ========================= */
function playFade() {
  resultRow.classList.remove("fade");
  void resultRow.offsetWidth;
  resultRow.classList.add("fade");
}

function setModeUI() {
  // unchecked = Blocks -> Stacks (الوضع الافتراضي)
  // checked   = Stacks -> Blocks
  if (modeSwitch.checked) {
    modeText.textContent = "Calculate Blocks";
    mainLabel.textContent = "Enter the number of stacks:";
    leftTitle.textContent = "Total Blocks:";
    rightTitle.innerHTML = "&nbsp;";
    rightTitle.classList.add("ghost");
    remainderValue.textContent = "";
  } else {
    modeText.textContent = "Calculate Stacks";
    mainLabel.textContent = "Enter the number of blocks:";
    leftTitle.textContent = "Full Stacks:";
    rightTitle.textContent = "Remaining Blocks:";
    rightTitle.classList.remove("ghost");
    remainderValue.textContent = "-";
  }

  stacksValue.textContent = "-";
  playFade();
}

function setLoading(isLoading) {
  if (isLoading) {
    btn.disabled = true;
    btn.textContent = "Calculating...";
  } else {
    btn.textContent = "Calculate";
    btn.disabled = false;
  }
}

function calculate() {
  const raw = input.value.trim();
  if (raw === "") return { ok: false };

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return { ok: false };

  if (!modeSwitch.checked) {
    // Blocks -> Stacks
    const blocks = Math.floor(value);
    const stacks = Math.floor(blocks / STACK_SIZE);
    const remainder = blocks % STACK_SIZE;
    return { ok: true, mode: "toStacks", blocks, stacks, remainder };
  } else {
    // Stacks -> Blocks
    const stacks = Math.floor(value);
    const blocks = stacks * STACK_SIZE;
    return { ok: true, mode: "toBlocks", stacks, blocks };
  }
}

/* =========================
   ✅ HISTORY
   ========================= */
function renumberHistory() {
  const items = historyList.querySelectorAll("li");
  items.forEach((li, idx) => {
    const numSpan = li.querySelector(".h-num");
    if (numSpan) numSpan.textContent = `${idx + 1}- `;
  });
}

function addToHistory(text) {
  const li = document.createElement("li");

  li.innerHTML = `
    <span class="h-num"></span>
    <span class="h-text">${text}</span>
    <button type="button" class="h-del" title="Remove">✕</button>
  `;

  historyList.appendChild(li);
  renumberHistory();
  saveState();
}

historyList.addEventListener("click", (e) => {
  const delBtn = e.target.closest(".h-del");
  if (!delBtn) return;

  const li = delBtn.closest("li");
  if (li) li.remove();

  renumberHistory();
  saveState();
});

/* =========================
   ✅ Clear: يفتح المودال بدل confirm
   ========================= */
clearHistoryBtn.addEventListener("click", () => {
  openClearModal();
});

/* Continue */
modalConfirm?.addEventListener("click", () => {
  historyList.innerHTML = "";
  input.value = "";
  stacksValue.textContent = "-";
  modeSwitch.checked = false;
  setModeUI();

  localStorage.removeItem("minecraftCalcState");

  closeClearModal();
  playFade();
  input.focus();
});

/* Back */
modalCancel?.addEventListener("click", () => {
  closeClearModal();
  input.focus();
});

/* إغلاق بالنقر خارج الصندوق */
clearModal?.addEventListener("click", (e) => {
  if (e.target === clearModal) {
    closeClearModal();
    input.focus();
  }
});

/* إغلاق بزر Esc */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && clearModal && !clearModal.classList.contains("hidden")) {
    closeClearModal();
    input.focus();
  }
});

/* =========================
   Restart (كما هو)
   ========================= */
resetBtn.addEventListener("click", () => {
  input.value = "";
  stacksValue.textContent = "-";
  remainderValue.textContent = modeSwitch.checked ? "" : "-";
  setLoading(false);
  playFade();
  input.focus();
});

modeSwitch.addEventListener("change", () => {
  input.value = "";
  setModeUI();
  input.focus();
  saveState();
});

/* تهيئة */
setModeUI();
loadState();

/* =========================
   Submit
   ========================= */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  setLoading(true);

  stacksValue.textContent = "...";
  if (!modeSwitch.checked) remainderValue.textContent = "...";
  playFade();

  setTimeout(() => {
    const data = calculate();

    if (!data.ok) {
      stacksValue.textContent = "-";
      remainderValue.textContent = modeSwitch.checked ? "" : "-";
      playFade();
      setLoading(false);
      saveState();
      return;
    }

    if (data.mode === "toStacks") {
      stacksValue.textContent = data.stacks;
      remainderValue.textContent = data.remainder;

      addToHistory(
        `Total Blocks: ${data.blocks} | Full Stacks: ${data.stacks} | Remaining Blocks: ${data.remainder}`
      );
    } else {
      stacksValue.textContent = data.blocks;
      remainderValue.textContent = "";

      addToHistory(`Total Stacks: ${data.stacks} | Total Blocks: ${data.blocks}`);
    }

    playFade();
    setLoading(false);
    saveState();
  }, 250);
});