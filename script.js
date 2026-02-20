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

const STACK_SIZE = 64;

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
   ✅ HISTORY (طلباتك الثلاثة)
   ========================= */

/* 1) رقم "1-" فقط + 2) الجديد تحت القديم (append)
   3) زر حذف لكل عنصر + إعادة ترقيم */
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

  // ✅ الجديد تحت القديم
  historyList.appendChild(li);

  // ✅ تحديث الأرقام لتكون 1- 2- 3- ...
  renumberHistory();
}

// حذف عنصر واحد فقط
historyList.addEventListener("click", (e) => {
  const delBtn = e.target.closest(".h-del");
  if (!delBtn) return;

  const li = delBtn.closest("li");
  if (li) li.remove();

  renumberHistory();
});

// مسح الكل
clearHistoryBtn.addEventListener("click", () => {
  historyList.innerHTML = "";
});

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
});

setModeUI();

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

      addToHistory(
        `Total Stacks: ${data.stacks} | Total Blocks: ${data.blocks}`
      );
    }

    playFade();
    setLoading(false);
  }, 250);
});