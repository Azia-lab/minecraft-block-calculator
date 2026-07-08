
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
const copyHistoryBtn = document.getElementById("copyHistory");
const clearHistoryBtn = document.getElementById("clearHistory");

/* ✅ Modal عناصر */
const clearModal = document.getElementById("clearModal");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");

let lastDeletedHistoryItem = null;
let undoHistoryTimer = null;

const STACK_SIZE = 64;

/* ✅ Shulker = 27 stacks */
const SHULKER_SLOTS = 27; // stacks per shulker
const DOUBLE_CHEST_SLOTS = 54; // stacks per double chest
const COPY_CREDIT_TEXT = "I used the Minecraft Calculator by Azia Lab. Try it now!\nhttps://azia-lab.github.io/minecraft-calculator/";

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

const blockedNumberKeys = ["e", "E", "+", "-", "."];

input.addEventListener("keydown", (e) => {
  if (blockedNumberKeys.includes(e.key)) {
    e.preventDefault();
  }
});

input.addEventListener("paste", (e) => {
  const pastedText = e.clipboardData?.getData("text") || "";
  if (!/^\d+$/.test(pastedText.trim())) {
    e.preventDefault();
  }
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

function updateCopyButtonState() {
  if (!copyHistoryBtn) return;
  copyHistoryBtn.disabled = historyList.children.length === 0;
}

function loadState() {
  const saved = localStorage.getItem("minecraftCalcState");
  if (!saved) return;

  const state = JSON.parse(saved);

  input.value = state.inputValue || "";
  stacksValue.textContent = state.stacksValue || "-";
  remainderValue.textContent = state.remainderValue || "-";
  if (modeSelect) {
    modeSelect.value = state.modeValue || "toStacks";
    if (!modeSelect.value) modeSelect.value = "toStacks";
  }
  historyList.innerHTML = state.historyHTML || "";

  setModeUI();
  updateCopyButtonState();
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

function isSingleResultMode(mode) {
  return ["toBlocks", "shulkersToStacks", "doubleChestsToStacks"].includes(mode);
}

function setModeUI() {
  const mode = modeSelect?.value || "toStacks";

  if (mode === "toBlocks") {
    mainLabel.textContent = "Enter Stacks:";
    leftTitle.textContent = "Total Blocks:";
    rightTitle.textContent = "";
    rightTitle.innerHTML = "&nbsp;";
    rightTitle.classList.add("ghost");
    remainderValue.textContent = "";
  } else if (mode === "toShulkers") {
    mainLabel.textContent = "Enter Stacks:";
    leftTitle.textContent = "Full Shulker Boxes:";
    rightTitle.textContent = "Remaining Stacks:";
    rightTitle.classList.remove("ghost");
    remainderValue.textContent = "-";
  } else if (mode === "shulkersToStacks") {
    mainLabel.textContent = "Enter Shulker Boxes:";
    leftTitle.textContent = "Total Stacks:";
    rightTitle.textContent = "";
    rightTitle.innerHTML = "&nbsp;";
    rightTitle.classList.add("ghost");
    remainderValue.textContent = "";
  } else if (mode === "stacksToDoubleChests") {
    mainLabel.textContent = "Enter Stacks:";
    leftTitle.textContent = "Full Double Chests:";
    rightTitle.textContent = "Remaining Stacks:";
    rightTitle.classList.remove("ghost");
    remainderValue.textContent = "-";
  } else if (mode === "doubleChestsToStacks") {
    mainLabel.textContent = "Enter Double Chest:";
    leftTitle.textContent = "Total Stacks:";
    rightTitle.textContent = "";
    rightTitle.innerHTML = "&nbsp;";
    rightTitle.classList.add("ghost");
    remainderValue.textContent = "";
  } else {
    mainLabel.textContent = "Enter Blocks:";
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

function createSingleResult(mode, inputLabel, inputValue, leftLabel, leftValue) {
  return { ok: true, mode, inputLabel, inputValue, leftLabel, leftValue, hasRemainder: false };
}

function createSplitResult(mode, inputLabel, inputValue, leftLabel, leftValue, rightLabel, rightValue) {
  return { ok: true, mode, inputLabel, inputValue, leftLabel, leftValue, rightLabel, rightValue, hasRemainder: true };
}

function calculate() {
  const raw = input.value.trim();
  if (raw === "") return { ok: false };

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return { ok: false };

  const mode = modeSelect?.value || "toStacks";
  const amount = Math.floor(value);

  if (mode === "toStacks") {
    return createSplitResult(mode, "Total Blocks", amount, "Full Stacks", Math.floor(amount / STACK_SIZE), "Remaining Blocks", amount % STACK_SIZE);
  }

  if (mode === "toBlocks") {
    return createSingleResult(mode, "Total Stacks", amount, "Total Blocks", amount * STACK_SIZE);
  }

  if (mode === "toShulkers") {
    return createSplitResult(mode, "Total Stacks", amount, "Full Shulker Boxes", Math.floor(amount / SHULKER_SLOTS), "Remaining Stacks", amount % SHULKER_SLOTS);
  }

  if (mode === "shulkersToStacks") {
    return createSingleResult(mode, "Total Shulker Boxes", amount, "Total Stacks", amount * SHULKER_SLOTS);
  }


  if (mode === "stacksToDoubleChests") {
    return createSplitResult(mode, "Total Stacks", amount, "Full Double Chests", Math.floor(amount / DOUBLE_CHEST_SLOTS), "Remaining Stacks", amount % DOUBLE_CHEST_SLOTS);
  }

  if (mode === "doubleChestsToStacks") {
    return createSingleResult(mode, "Total Double Chests", amount, "Total Stacks", amount * DOUBLE_CHEST_SLOTS);
  }

  return { ok: false };
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
  updateCopyButtonState();
  saveState();
}


function hideHistoryUndo() {
  const undoBox = document.querySelector(".undo-snackbar");
  if (undoBox) undoBox.remove();

  if (undoHistoryTimer) {
    clearTimeout(undoHistoryTimer);
    undoHistoryTimer = null;
  }
}

function showHistoryUndo() {
  hideHistoryUndo();

  const undoBox = document.createElement("div");
  undoBox.className = "undo-snackbar";
  undoBox.innerHTML = `
    <span>History item removed</span>
    <button type="button" class="history-undo-btn">Undo</button>
    <span class="undo-timer" aria-hidden="true"></span>
  `;

  document.body.appendChild(undoBox);

  undoHistoryTimer = setTimeout(() => {
    hideHistoryUndo();
    lastDeletedHistoryItem = null;
  }, 5000);
}

function undoHistoryDelete() {
  if (!lastDeletedHistoryItem) return;

  const { item, index } = lastDeletedHistoryItem;
  const beforeItem = historyList.children[index] || null;
  historyList.insertBefore(item, beforeItem);

  lastDeletedHistoryItem = null;
  hideHistoryUndo();
  renumberHistory();
  updateCopyButtonState();
  saveState();
}

function getHistoryText() {
  return Array.from(historyList.querySelectorAll("li"))
    .map((li, index) => {
      const text = li.querySelector(".h-text")?.textContent.trim() || "";
      return `${index + 1}- ${text}`;
    })
    .filter(Boolean)
    .join("\n");
}

async function copyHistoryText() {
  const historyText = getHistoryText();
  if (!historyText || copyHistoryBtn?.disabled) return;

  const text = `${historyText}\n\n${COPY_CREDIT_TEXT}`;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    const oldText = copyHistoryBtn.textContent;
    copyHistoryBtn.textContent = "Copied!";
    setTimeout(() => {
      copyHistoryBtn.textContent = oldText;
    }, 1200);
  } catch (error) {
    copyHistoryBtn.textContent = "Failed";
    setTimeout(() => {
      copyHistoryBtn.textContent = "Copy";
    }, 1200);
  }
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
  if (li) {
    lastDeletedHistoryItem = {
      item: li,
      index: Array.from(historyList.children).indexOf(li),
    };
    li.remove();
    showHistoryUndo();
  }

  renumberHistory();
  updateCopyButtonState();
  saveState();
});

document.addEventListener("click", (e) => {
  if (e.target.closest(".history-undo-btn")) {
    undoHistoryDelete();
  }
});

copyHistoryBtn?.addEventListener("click", copyHistoryText);

/* =========================
   ✅ Clear (Modal)
   ========================= */
clearHistoryBtn.addEventListener("click", () => {
  openClearModal();
});

modalConfirm?.addEventListener("click", () => {
  hideHistoryUndo();
  lastDeletedHistoryItem = null;
  historyList.innerHTML = "";
  updateCopyButtonState();
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
  remainderValue.textContent = isSingleResultMode(mode) ? "" : "-";

  setLoading(false);
  playFade();
  input.focus();
  saveState();
});

/* ✅ Mode change */
modeSelect?.addEventListener("change", () => {
  input.value = "";
  setModeUI();
  saveState();
});

/* تهيئة */
setModeUI();
loadState();
updateCopyButtonState();

/* =========================
   Submit
   ========================= */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  setLoading(true);

  stacksValue.textContent = "...";
  const mode = modeSelect?.value || "toStacks";
  remainderValue.textContent = isSingleResultMode(mode) ? "" : "...";
  playFade();

  setTimeout(() => {
    const data = calculate();

    if (!data.ok) {
      stacksValue.textContent = "-";
      remainderValue.textContent = isSingleResultMode(mode) ? "" : "-";
      playFade();
      setLoading(false);
      saveState();
      return;
    }

    stacksValue.textContent = formatNumber(data.leftValue);
    remainderValue.textContent = data.hasRemainder ? formatNumber(data.rightValue) : "";

    const historyParts = [
      `<span class="h-label" title="Click to rename">${data.inputLabel}</span>: ${formatNumber(data.inputValue)}`,
      `${data.leftLabel}: ${formatNumber(data.leftValue)}`,
    ];

    if (data.hasRemainder) {
      historyParts.push(`${data.rightLabel}: ${formatNumber(data.rightValue)}`);
    }

    addToHistory(historyParts.join(" | "));

    playFade();
    setLoading(false);
    saveState();
  }, 250);
});
