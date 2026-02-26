/* =========================
   Minecraft Block Calculator (v3)
   Modes:
   - Blocks → Stacks
   - Stacks → Blocks
   - Stacks → Shulkers
   + Number formatting (1,234)
   ========================= */

const form = document.getElementById("calcForm");
const input = document.getElementById("blocks");
const btn = document.getElementById("btn");
const resetBtn = document.getElementById("resetBtn");

const stacksValue = document.getElementById("stacksValue");
const remainderValue = document.getElementById("remainderValue");
const resultRow = document.getElementById("resultRow");

/* ✅ Mode (Select) */
const modeSelect = document.getElementById("modeSelect");

/* UI Labels */
const mainLabel = document.getElementById("mainLabel");
const leftTitle = document.getElementById("leftTitle");
const rightTitle = document.getElementById("rightTitle");

/* ✅ History عناصر */
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

/* ✅ Modal عناصر */
const clearModal = document.getElementById("clearModal");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");

const STACK_SIZE = 64;

/* ✅ Shulker = 27 stacks */
const SHULKER_SLOTS = 27; // stacks per shulker

/* =========================
   Number Formatting
   ========================= */
function formatNumber(num) {
  return Number(num).toLocaleString("en-US");
}

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
   ✅ SAVE / LOAD (LocalStorage)
   ========================= */
function saveState() {
  const state = {
    inputValue: input.value,
    stacksValue: stacksValue.textContent,
    remainderValue: remainderValue.textContent,
    modeValue: modeSelect?.value || "toStacks",
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
  if (modeSelect) modeSelect.value = state.modeValue || "toStacks";
  historyList.innerHTML = state.historyHTML || "";

  setModeUI();
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
  const mode = modeSelect?.value || "toStacks";

  if (mode === "toBlocks") {
    // Stacks -> Blocks
    mainLabel.textContent = "Enter the number of stacks:";
    leftTitle.textContent = "Total Blocks:";
    rightTitle.innerHTML = "&nbsp;";
    rightTitle.classList.add("ghost");
    remainderValue.textContent = "";
  } else if (mode === "toShulkers") {
    // Stacks -> Shulkers
    mainLabel.textContent = "Enter the number of stacks:";
    leftTitle.textContent = "Full Shulkers:";
    rightTitle.textContent = "Remaining Stacks:";
    rightTitle.classList.remove("ghost");
    remainderValue.textContent = "-";
  } else {
    // Blocks -> Stacks
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

  const mode = modeSelect?.value || "toStacks";

  // Blocks -> Stacks
  if (mode === "toStacks") {
    const blocks = Math.floor(value);
    const stacks = Math.floor(blocks / STACK_SIZE);
    const remainder = blocks % STACK_SIZE;
    return { ok: true, mode, blocks, stacks, remainder };
  }

  // Stacks -> Blocks
  if (mode === "toBlocks") {
    const stacks = Math.floor(value);
    const blocks = stacks * STACK_SIZE;
    return { ok: true, mode, stacks, blocks };
  }

  // Stacks -> Shulkers
  const stacks = Math.floor(value);
  const shulkers = Math.floor(stacks / SHULKER_SLOTS);
  const remainderStacks = stacks % SHULKER_SLOTS;
  return { ok: true, mode, stacks, shulkers, remainderStacks };
}

/* =========================
   ✅ HISTORY Helpers
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

/* =========================
   ✅ Inline Edit (Click to rename)
   ========================= */
function startInlineEditLabel(labelSpan) {
  if (!labelSpan) return;

  const oldText = labelSpan.textContent.trim();

  const inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.value = oldText;
  inputEl.maxLength = 24;
  inputEl.className = "h-label-input";
  inputEl.setAttribute("aria-label", "Edit label");

  labelSpan.replaceWith(inputEl);
  inputEl.focus();
  inputEl.select();

  const commit = () => {
    const newText = inputEl.value.trim() || oldText;

    const newSpan = document.createElement("span");
    newSpan.className = "h-label";
    newSpan.title = "Click to rename";
    newSpan.textContent = newText;

    inputEl.replaceWith(newSpan);
    saveState();
  };

  const cancel = () => {
    const newSpan = document.createElement("span");
    newSpan.className = "h-label";
    newSpan.title = "Click to rename";
    newSpan.textContent = oldText;

    inputEl.replaceWith(newSpan);
    saveState();
  };

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancel();
  });

  inputEl.addEventListener("blur", commit);
}

/* ✅ Click events داخل الهيستوري (✅ FIX: Text Node) */
historyList.addEventListener("click", (e) => {
  const targetEl = e.target.nodeType === 3 ? e.target.parentElement : e.target;

  const labelSpan = targetEl.closest(".h-label");
  if (labelSpan) {
    startInlineEditLabel(labelSpan);
    return;
  }

  const delBtn = targetEl.closest(".h-del");
  if (!delBtn) return;

  const li = delBtn.closest("li");
  if (li) li.remove();

  renumberHistory();
  saveState();
});

/* =========================
   ✅ Clear (Modal)
   ========================= */
clearHistoryBtn.addEventListener("click", () => {
  openClearModal();
});

modalConfirm?.addEventListener("click", () => {
  historyList.innerHTML = "";
  input.value = "";
  stacksValue.textContent = "-";

  // reset to default mode
  if (modeSelect) modeSelect.value = "toStacks";
  setModeUI();

  localStorage.removeItem("minecraftCalcState");

  closeClearModal();
  playFade();
  input.focus();
});

modalCancel?.addEventListener("click", () => {
  closeClearModal();
  input.focus();
});

clearModal?.addEventListener("click", (e) => {
  if (e.target === clearModal) {
    closeClearModal();
    input.focus();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && clearModal && !clearModal.classList.contains("hidden")) {
    closeClearModal();
    input.focus();
  }
});

/* =========================
   Restart
   ========================= */
resetBtn.addEventListener("click", () => {
  const mode = modeSelect?.value || "toStacks";

  input.value = "";
  stacksValue.textContent = "-";
  remainderValue.textContent = mode === "toBlocks" ? "" : "-";

  setLoading(false);
  playFade();
  input.focus();
  saveState();
});

/* ✅ Mode change */
modeSelect?.addEventListener("change", () => {
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
  const mode = modeSelect?.value || "toStacks";
  if (mode !== "toBlocks") remainderValue.textContent = "...";
  playFade();

  setTimeout(() => {
    const data = calculate();

    if (!data.ok) {
      stacksValue.textContent = "-";
      remainderValue.textContent = mode === "toBlocks" ? "" : "-";
      playFade();
      setLoading(false);
      saveState();
      return;
    }

    if (data.mode === "toStacks") {
      stacksValue.textContent = formatNumber(data.stacks);
      remainderValue.textContent = formatNumber(data.remainder);

      addToHistory(
        `<span class="h-label" title="Click to rename">Total Blocks</span>: ${formatNumber(
          data.blocks
        )} | Full Stacks: ${formatNumber(data.stacks)} | Remaining Blocks: ${formatNumber(
          data.remainder
        )}`
      );
    } else if (data.mode === "toBlocks") {
      stacksValue.textContent = formatNumber(data.blocks);
      remainderValue.textContent = "";

      addToHistory(
        `<span class="h-label" title="Click to rename">Total Stacks</span>: ${formatNumber(
          data.stacks
        )} | Total Blocks: ${formatNumber(data.blocks)}`
      );
    } else {
      // toShulkers (Stacks -> Shulkers)
      stacksValue.textContent = formatNumber(data.shulkers);
      remainderValue.textContent = formatNumber(data.remainderStacks);

      addToHistory(
        `<span class="h-label" title="Click to rename">Total Stacks</span>: ${formatNumber(
          data.stacks
        )} | Full Shulkers: ${formatNumber(data.shulkers)} | Remaining Stacks: ${formatNumber(
          data.remainderStacks
        )}`
      );
    }

    playFade();
    setLoading(false);
    saveState();
  }, 250);
});