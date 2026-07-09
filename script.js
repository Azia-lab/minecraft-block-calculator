
const form = document.getElementById("calcForm");
const input = document.getElementById("blocks");
const btn = document.getElementById("btn");
const resetBtn = document.getElementById("resetBtn");

const stacksValue = document.getElementById("stacksValue");
const remainderValue = document.getElementById("remainderValue");
const resultRow = document.getElementById("resultRow");

/* ✅ Mode (Select) */
const modeSelect = document.getElementById("modeSelect");
const stackSizeInputs = document.querySelectorAll('input[name="stackSize"]');

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

let deletedHistoryItems = new Map();
let nextHistoryUndoId = 0;
let nextHistoryOrder = 0;
let copyNotificationTimer = null;

const DEFAULT_STACK_SIZE = 64;

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

function normalizeStackSize(value) {
  return Number(value) === 16 ? 16 : DEFAULT_STACK_SIZE;
}

function getStackSize() {
  const selected = Array.from(stackSizeInputs).find((option) => option.checked);
  return normalizeStackSize(selected?.value);
}

function setStackSize(value) {
  const stackSize = normalizeStackSize(value);
  const option = Array.from(stackSizeInputs).find((inputOption) => inputOption.value === String(stackSize));
  if (option) option.checked = true;
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
    stackSizeValue: String(getStackSize()),
    historyHTML: historyList.innerHTML,
  };
  localStorage.setItem("minecraftCalcState", JSON.stringify(state));
}

function updateCopyButtonState() {
  if (!copyHistoryBtn) return;
  copyHistoryBtn.disabled = historyList.children.length === 0;
}

function assignHistoryOrder(li) {
  const existingOrder = Number(li?.dataset?.historyOrder);
  if (Number.isFinite(existingOrder)) {
    nextHistoryOrder = Math.max(nextHistoryOrder, existingOrder + 1);
    return existingOrder;
  }

  const order = nextHistoryOrder++;
  li.dataset.historyOrder = String(order);
  return order;
}

function syncHistoryOrder() {
  Array.from(historyList.children).forEach(assignHistoryOrder);
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
  setStackSize(state.stackSizeValue);
  historyList.innerHTML = state.historyHTML || "";
  syncHistoryOrder();

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
  return ["toBlocks"].includes(mode);
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
    rightTitle.textContent = "Total Blocks:";
    rightTitle.classList.remove("ghost");
    remainderValue.textContent = "-";
  } else if (mode === "stacksToDoubleChests") {
    mainLabel.textContent = "Enter Stacks:";
    leftTitle.textContent = "Full Double Chests:";
    rightTitle.textContent = "Remaining Stacks:";
    rightTitle.classList.remove("ghost");
    remainderValue.textContent = "-";
  } else if (mode === "doubleChestsToStacks") {
    mainLabel.textContent = "Enter Double Chest:";
    leftTitle.textContent = "Total Stacks:";
    rightTitle.textContent = "Total Blocks:";
    rightTitle.classList.remove("ghost");
    remainderValue.textContent = "-";
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
  const stackSize = getStackSize();

  if (mode === "toStacks") {
    return createSplitResult(mode, "Total Blocks", amount, "Full Stacks", Math.floor(amount / stackSize), "Remaining Blocks", amount % stackSize);
  }

  if (mode === "toBlocks") {
    return createSingleResult(mode, "Total Stacks", amount, "Total Blocks", amount * stackSize);
  }

  if (mode === "toShulkers") {
    return createSplitResult(mode, "Total Stacks", amount, "Full Shulker Boxes", Math.floor(amount / SHULKER_SLOTS), "Remaining Stacks", amount % SHULKER_SLOTS);
  }

  if (mode === "shulkersToStacks") {
    const totalStacks = amount * SHULKER_SLOTS;
    const totalBlocks = totalStacks * stackSize;
    return createSplitResult(mode, "Total Shulker Boxes", amount, "Total Stacks", totalStacks, "Total Blocks", totalBlocks);
  }


  if (mode === "stacksToDoubleChests") {
    return createSplitResult(mode, "Total Stacks", amount, "Full Double Chests", Math.floor(amount / DOUBLE_CHEST_SLOTS), "Remaining Stacks", amount % DOUBLE_CHEST_SLOTS);
  }

  if (mode === "doubleChestsToStacks") {
    const totalStacks = amount * DOUBLE_CHEST_SLOTS;
    const totalBlocks = totalStacks * stackSize;
    return createSplitResult(mode, "Total Double Chests", amount, "Total Stacks", totalStacks, "Total Blocks", totalBlocks);
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
  assignHistoryOrder(li);

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


function getHistoryUndoStack() {
  let stack = document.querySelector(".undo-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "undo-stack";
    document.body.appendChild(stack);
  }
  return stack;
}

function removeHistoryUndo(undoId, shouldForget = true) {
  const undoData = deletedHistoryItems.get(undoId);
  if (undoData?.timer) clearTimeout(undoData.timer);

  const undoBox = document.querySelector(`.undo-snackbar[data-undo-id="${undoId}"]`);
  if (undoBox) undoBox.remove();

  const stack = document.querySelector(".undo-stack");
  if (stack && stack.children.length === 0) stack.remove();

  if (shouldForget) deletedHistoryItems.delete(undoId);
}

function hideHistoryUndo() {
  deletedHistoryItems.forEach((undoData) => {
    if (undoData.timer) clearTimeout(undoData.timer);
  });
  deletedHistoryItems.clear();

  const stack = document.querySelector(".undo-stack");
  if (stack) stack.remove();
}

function showHistoryUndo(item, index, nextItem) {
  const undoId = String(++nextHistoryUndoId);
  const undoBox = document.createElement("div");
  undoBox.className = "undo-snackbar";
  undoBox.dataset.undoId = undoId;
  undoBox.innerHTML = `
    <span>History item removed</span>
    <button type="button" class="history-undo-btn">Undo</button>
    <span class="undo-timer" aria-hidden="true"></span>
  `;

  getHistoryUndoStack().appendChild(undoBox);

  const timer = setTimeout(() => {
    removeHistoryUndo(undoId);
  }, 5000);

  deletedHistoryItems.set(undoId, { item, index, nextItem, timer });
}

function undoHistoryDelete(undoId) {
  const undoData = deletedHistoryItems.get(undoId);
  if (!undoData) return;

  const { item, index, nextItem } = undoData;
  const itemOrder = Number(item.dataset.historyOrder);
  const beforeItem = Number.isFinite(itemOrder)
    ? Array.from(historyList.children).find((currentItem) => {
      const currentOrder = Number(currentItem.dataset.historyOrder);
      return Number.isFinite(currentOrder) && currentOrder > itemOrder;
    }) || null
    : nextItem?.parentElement === historyList ? nextItem : historyList.children[index] || null;
  historyList.insertBefore(item, beforeItem);

  removeHistoryUndo(undoId, false);
  deletedHistoryItems.delete(undoId);
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

function hideCopyNotification() {
  const notification = document.querySelector(".copy-snackbar");
  if (notification) notification.remove();

  if (copyNotificationTimer) {
    clearTimeout(copyNotificationTimer);
    copyNotificationTimer = null;
  }
}

function showCopyNotification() {
  hideCopyNotification();

  const notification = document.createElement("div");
  notification.className = "copy-snackbar";
  notification.textContent = "Copied to clipboard!";
  document.body.appendChild(notification);

  copyNotificationTimer = setTimeout(() => {
    hideCopyNotification();
  }, 2000);
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
    showCopyNotification();
    setTimeout(() => {
      copyHistoryBtn.textContent = oldText;
    }, 1500);
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
    const index = Array.from(historyList.children).indexOf(li);
    const nextItem = li.nextElementSibling;
    li.remove();
    showHistoryUndo(li, index, nextItem);
  }

  renumberHistory();
  updateCopyButtonState();
  saveState();
});

document.addEventListener("click", (e) => {
  const undoBtn = e.target.closest(".history-undo-btn");
  if (undoBtn) {
    const undoBox = undoBtn.closest(".undo-snackbar");
    undoHistoryDelete(undoBox?.dataset.undoId);
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
  historyList.innerHTML = "";
  updateCopyButtonState();
  input.value = "";
  stacksValue.textContent = "-";

  // reset to default mode
  if (modeSelect) modeSelect.value = "toStacks";
  setStackSize(DEFAULT_STACK_SIZE);
  setModeUI();

  localStorage.removeItem("minecraftCalcState");

  closeClearModal();
  playFade();
});

modalCancel?.addEventListener("click", () => {
  closeClearModal();
});

clearModal?.addEventListener("click", (e) => {
  if (e.target === clearModal) {
    closeClearModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && clearModal && !clearModal.classList.contains("hidden")) {
    closeClearModal();
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
  saveState();
});

/* ✅ Mode change */
modeSelect?.addEventListener("change", () => {
  input.value = "";
  setModeUI();
  saveState();
});

stackSizeInputs.forEach((option) => {
  option.addEventListener("change", () => {
    const mode = modeSelect?.value || "toStacks";
    stacksValue.textContent = "-";
    remainderValue.textContent = isSingleResultMode(mode) ? "" : "-";
    saveState();
  });
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
