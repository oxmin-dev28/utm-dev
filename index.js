(function () {
console.log("[UTM] Script loaded and executing...");
var API_BASE = "https://api-staging.utm.net.ua";

function qs(sel, root) {
  return (root || document).querySelector(sel);
}
function qsa(sel, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(sel));
}

function debounce(fn, delay) {
  var t;
  return function () {
    var ctx = this,
      args = arguments;
    clearTimeout(t);
    t = setTimeout(function () {
      fn.apply(ctx, args);
    }, delay);
  };
}

function setFieldState(input, valid) {
  if (!input) return;
  input.classList.remove("error", "is-validated");
  if (valid === true) input.classList.add("is-validated");
  if (valid === false) input.classList.add("error");
}

function disableButton(btn, disabled) {
  if (!btn) return;
  if (disabled) {
    btn.setAttribute("disabled", "disabled");
    btn.classList.add("is-disabled", "disabled");
  } else {
    btn.removeAttribute("disabled");
    btn.classList.remove("is-disabled", "disabled");
  }
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

function normalizeUaPhoneDigits(v) {
  var digits = String(v || "").replace(/\D/g, "");
  if (!digits.length) digits = "380";
  if (!digits.startsWith("380")) {
    if (digits.length === 9) digits = "380" + digits;
    else if (digits.length === 10 && digits[0] === "0")
      digits = "38" + digits;
    else digits = "380" + digits.slice(-9);
  }
  if (digits.length > 12) digits = digits.slice(0, 12);
  if (digits.length < 3) digits = "380";
  return digits;
}

function isValidUaPhoneDigits(digits) {
// допустимые украинские мобильные коды операторов:
// 39, 50, 63, 66, 67, 68, 73, 89, 91–99
return /^380(39|50|63|66|67|68|73|89|9[1-9])\d{7}$/.test(digits);
}

function formatUaPhoneVisual(digits) {
  digits = normalizeUaPhoneDigits(digits);
  var rest = digits.slice(3);
  var filled = rest.slice(0, 9);
var prefix = "+380";
var parts = [];
if (filled.length > 0) {
  parts.push("(");
  parts.push(filled.slice(0, 2));
  if (filled.length < 2) {
    parts.push("X".repeat(2 - filled.length));
  }
  parts.push(") ");
  if (filled.length > 2) {
    parts.push(filled.slice(2, 5));
    if (filled.length < 5) {
      parts.push("X".repeat(5 - filled.length));
    }
    parts.push("-");
    if (filled.length > 5) {
      parts.push(filled.slice(5, 7));
      if (filled.length < 7) {
        parts.push("X".repeat(7 - filled.length));
      }
      parts.push("-");
      if (filled.length > 7) {
        parts.push(filled.slice(7, 9));
        if (filled.length < 9) {
          parts.push("X".repeat(9 - filled.length));
        }
      } else {
        parts.push("XX");
      }
    } else {
      parts.push("XX-XX");
    }
  } else {
    parts.push("XXX-XX-XX");
  }
} else {
  parts.push("(XX) XXX-XX-XX");
}
  return {
  prefix: prefix,
  formatted: parts.join(""),
  visual: prefix + parts.join(""),
    fullDigits: digits,
  };
}

function bindPhoneMask(input) {
  if (!input) return;

var wrapper = input.parentElement;
if (!wrapper) {
  console.warn("[PhoneMask] Input parent not found");
  return;
}

if (wrapper.querySelector(".phone-mask-overlay")) {
  return;
}

var overlay = document.createElement("div");
overlay.className = "phone-mask-overlay";
var inputStyle = window.getComputedStyle(input);
var inputBorderWidth = inputStyle.borderWidth || "0px";
overlay.style.cssText = "position: absolute; left: 0; top: 0; right: 0; bottom: 0; pointer-events: none; display: flex; align-items: center; padding-left: " + inputStyle.paddingLeft + "; padding-right: " + inputStyle.paddingRight + "; padding-top: " + inputStyle.paddingTop + "; padding-bottom: " + inputStyle.paddingBottom + "; font-size: " + inputStyle.fontSize + "; font-family: " + inputStyle.fontFamily + "; line-height: " + inputStyle.lineHeight + "; white-space: nowrap; overflow: hidden; box-sizing: border-box;";
wrapper.style.position = "relative";
input.style.boxSizing = "border-box";
var originalBorder = inputStyle.border || "none";
var originalBorderWidth = inputStyle.borderWidth || "0px";
if (originalBorderWidth === "0px" || !originalBorderWidth) {
  input.style.border = "1px solid transparent";
}

var prefixSpan = document.createElement("span");
prefixSpan.style.cssText = "color: #000; margin-right: .25rem;";
var formattedSpan = document.createElement("span");
formattedSpan.style.cssText = "color: #999;";
var cursorSpan = document.createElement("span");
cursorSpan.className = "phone-cursor";
cursorSpan.style.cssText = "display: inline-block; width: 1px; height: 1em; background-color: #000; margin-left: 1px; vertical-align: baseline; animation: blink 1s infinite;";
overlay.appendChild(prefixSpan);
overlay.appendChild(formattedSpan);
overlay.appendChild(cursorSpan);

var style = document.createElement("style");
style.textContent = "@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }";
document.head.appendChild(style);

var currentValue = input.value || "";
var digits = normalizeUaPhoneDigits(currentValue);
var restDigits = digits.slice(3);

input.dataset.phoneDigits = digits;
input.value = restDigits;
input.style.color = "transparent";
input.style.caretColor = "transparent";
input.style.backgroundColor = "transparent";
var computedStyle = window.getComputedStyle(input);
var borderWidth = computedStyle.borderWidth || "1px";
var borderStyle = computedStyle.borderStyle || "solid";
var borderColor = computedStyle.borderColor || "transparent";
input.style.borderWidth = borderWidth;
input.style.borderStyle = borderStyle;
input.style.borderColor = borderColor;
input.style.outline = "none";
input.setAttribute("placeholder", "");
input.setAttribute("maxlength", "9");
input.setAttribute("inputmode", "tel");
input.setAttribute("autocomplete", "off");
input.setAttribute("autocorrect", "off");
input.setAttribute("autocapitalize", "off");
input.setAttribute("spellcheck", "false");

function getCursorPositionInFormatted(inputPos, digits) {
  if (inputPos === 0) {
    return 0;
  }
  var pos = 0;
  if (inputPos > 0) {
    pos += 1;
    pos += Math.min(inputPos, 2);
    if (inputPos >= 2) {
      pos += 3;
      if (inputPos > 2) {
        pos += Math.min(inputPos - 2, 3);
        if (inputPos >= 5) {
          pos += 1;
          if (inputPos > 5) {
            pos += Math.min(inputPos - 5, 2);
            if (inputPos >= 7) {
              pos += 1;
              if (inputPos > 7) {
                pos += Math.min(inputPos - 7, 2);
              }
            }
          }
        }
      }
    }
  }
  return pos;
}

function updateOverlay() {
  var digits = input.value || "";
  var fullDigits = "380" + digits;
  input.dataset.phoneDigits = fullDigits;
  
  var fmt = formatUaPhoneVisual(fullDigits);
  prefixSpan.textContent = fmt.prefix;
  
  var cursorPosInFormatted = 0;
  var isFocused = input === document.activeElement;
  if (isFocused) {
    var inputCursorPos = input.selectionStart !== undefined ? input.selectionStart : digits.length;
    cursorPosInFormatted = getCursorPositionInFormatted(inputCursorPos, digits);
    cursorSpan.style.display = "inline-block";
  } else {
    cursorSpan.style.display = "none";
  }
  
  var formattedText = fmt.formatted;
  var beforeCursor = formattedText.slice(0, cursorPosInFormatted);
  var afterCursor = formattedText.slice(cursorPosInFormatted);
  
  formattedSpan.innerHTML = "";
  
  if (beforeCursor) {
    var beforeSpan = document.createElement("span");
    beforeSpan.textContent = beforeCursor;
    beforeSpan.style.color = digits.length > 0 ? "#000" : "#999";
    formattedSpan.appendChild(beforeSpan);
  }
  
  if (isFocused) {
    formattedSpan.appendChild(cursorSpan);
  }
  
  if (afterCursor) {
    var afterSpan = document.createElement("span");
    afterSpan.textContent = afterCursor;
    afterSpan.style.color = digits.length > 0 ? "#000" : "#999";
    formattedSpan.appendChild(afterSpan);
  }
  
  if (isValidUaPhoneDigits(fullDigits)) {
      input.classList.add("is-validated");
      input.classList.remove("error");
    } else {
      input.classList.remove("is-validated");
    }
  }

wrapper.appendChild(overlay);
updateOverlay();

input.addEventListener("input", function(e) {
  var value = input.value.replace(/\D/g, "");
  if (value.length > 9) {
    value = value.slice(0, 9);
  }
  var oldLength = input.value.length;
  input.value = value;
  updateOverlay();
  
  setTimeout(function() {
    var cursorPos = value.length;
    if (input.setSelectionRange) {
      input.setSelectionRange(cursorPos, cursorPos);
    }
    updateOverlay();
  }, 0);
});

input.addEventListener("keydown", function(e) {
  var key = e.key;
  var cursorPos = input.selectionStart !== undefined ? input.selectionStart : 0;
  var value = input.value || "";
  
  if (key === "ArrowLeft" || key === "ArrowRight" || key === "Home" || key === "End") {
    setTimeout(function() {
      var newPos = input.selectionStart !== undefined ? input.selectionStart : 0;
      if (newPos < 0) newPos = 0;
      if (newPos > value.length) newPos = value.length;
      if (input.setSelectionRange) {
        input.setSelectionRange(newPos, newPos);
      }
      updateOverlay();
    }, 0);
  }
});

input.addEventListener("keyup", function() {
  setTimeout(function() {
    var cursorPos = input.selectionStart !== undefined ? input.selectionStart : 0;
    var value = input.value || "";
    if (cursorPos < 0) cursorPos = 0;
    if (cursorPos > value.length) cursorPos = value.length;
    if (input.setSelectionRange) {
      input.setSelectionRange(cursorPos, cursorPos);
    }
    updateOverlay();
  }, 0);
});

input.addEventListener("click", function() {
  setTimeout(function() {
    var cursorPos = input.selectionStart !== undefined ? input.selectionStart : 0;
    var value = input.value || "";
    if (cursorPos < 0) cursorPos = 0;
    if (cursorPos > value.length) cursorPos = value.length;
    if (input.setSelectionRange) {
      input.setSelectionRange(cursorPos, cursorPos);
    }
    updateOverlay();
  }, 0);
});

input.addEventListener("select", function() {
  setTimeout(function() {
    var cursorPos = input.selectionStart !== undefined ? input.selectionStart : 0;
    var value = input.value || "";
    if (cursorPos < 0) cursorPos = 0;
    if (cursorPos > value.length) cursorPos = value.length;
    if (input.setSelectionRange) {
      input.setSelectionRange(cursorPos, cursorPos);
    }
    updateOverlay();
  }, 0);
});

input.addEventListener("focus", function() {
  updateOverlay();
  setTimeout(function() {
    var cursorPos = (input.value || "").length;
    if (input.setSelectionRange) {
      input.setSelectionRange(cursorPos, cursorPos);
    }
    updateOverlay();
  }, 0);
});

input.addEventListener("blur", function() {
  cursorSpan.style.display = "none";
  updateOverlay();
});

  input.addEventListener("paste", function(e) {
    e.preventDefault();
    var pasted = (e.clipboardData || window.clipboardData).getData("text");
    var digits = pasted.replace(/\D/g, "").slice(0, 9);
    input.value = digits;
    updateOverlay();
    var event = new Event("input", { bubbles: true });
    input.dispatchEvent(event);
  });
}

function getPhoneDigits(input) {
  if (!input) return "";
  if (input.dataset && input.dataset.phoneDigits) {
    return normalizeUaPhoneDigits(input.dataset.phoneDigits);
  }
  return normalizeUaPhoneDigits(input.value || "");
}

function isFullUaPhone(input) {
return isValidUaPhoneDigits(getPhoneDigits(input));
}

function initModalSystem() {
  var openButtons = qsa("[data-modal-open]");
  var closeSelectors = "[data-modal-close], .modal__overlay";

  function resetSteps(root) {
    if (!root) return;
    var steps = qsa(
      ".modal-step, .modal-step-esim, .modal-success, .modal-error-esim",
      root
    );
    steps.forEach(function (s) {
      s.style.display = "none";
      s.classList.remove("is-active");
    });
    var first = qs(
      ".modal-step.is--1, .modal-step-esim.is--1, .modal-step:first-of-type, .modal-step-esim:first-of-type",
      root
    );
    if (first) {
      first.style.display = "";
      first.classList.add("is-active");
    }
  }

  function closeModal(wrapper) {
    if (!wrapper) return;
    wrapper.classList.remove("is-open");
    wrapper.setAttribute("aria-hidden", "true");
    qsa(".modal__dialog", wrapper).forEach(function (dlg) {
      dlg.classList.remove("is-open");
    });
    resetSteps(wrapper);
    if (!document.querySelector(".modal.is-open")) {
      document.body.classList.remove("modal-open");
    }
  }

  function openModalByDialogId(dialogId) {
  console.log("[UTM] openModalByDialogId called with:", dialogId);
    var dlg = document.getElementById(dialogId);
  if (!dlg) {
    console.warn("[UTM] Dialog not found:", dialogId);
    return;
  }
    var wrapper = dlg.closest(".modal");
  if (!wrapper) {
    console.warn("[UTM] Modal wrapper not found for dialog:", dialogId);
    return;
  }

    qsa(".modal.is-open").forEach(function (m) {
      closeModal(m);
    });

    wrapper.classList.add("is-open");
    wrapper.setAttribute("aria-hidden", "false");
    dlg.classList.add("is-open");
    document.body.classList.add("modal-open");
    resetSteps(dlg);
  
  // Инициализируем NovaPoshta селекты при открытии модального окна с доставкой
  console.log("[UTM] Checking if modal is plastic delivery. dialogId:", dialogId, "dlg.id:", dlg.id);
  if (dialogId === "modal-plastic" || dlg.id === "modal-plastic") {
    console.log("[NovaPoshta] Modal plastic opened via openModalByDialogId, initializing NovaPoshta selects");
    setTimeout(function() {
      initNovaPostSelects();
    }, 100);
  } else {
    // Проверяем, есть ли внутри этого диалога селект City
    var citySelect = dlg.querySelector("#City");
    if (citySelect) {
      console.log("[NovaPoshta] Found City select in opened modal, initializing NovaPoshta selects");
      setTimeout(function() {
        initNovaPostSelects();
      }, 100);
    }
  }
  }

  openButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var id = btn.getAttribute("data-modal-open");
      if (!id) return;
      e.preventDefault();
      openModalByDialogId(id);
    });
  });

  document.addEventListener("click", function (e) {
    var closeEl = e.target.closest(closeSelectors);
    if (!closeEl) return;
    var wrapper = closeEl.closest(".modal");
    if (!wrapper) return;
    e.preventDefault();
    closeModal(wrapper);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var w = document.querySelector(".modal.is-open");
      if (w) closeModal(w);
    }
  });

  return {
    openModalByDialogId: openModalByDialogId,
    closeModal: closeModal,
    resetSteps: resetSteps,
  };
}

var modalApi = initModalSystem();

function initPlanSelection() {
  var orderState = (window.utmOrderState = window.utmOrderState || {});
  var buttons = qsa('[data-modal-open="modal-order"]');
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card =
        btn.closest(".pricing_slider-slide, .pricing_content") ||
        btn.closest(".pricing_content");
      if (!card) return;
      var nameEl = qs(".pricing_plan-name", card);
      var priceEl = qs(".pricing_plan-price", card);
      orderState.planName = nameEl ? nameEl.textContent.trim() : "";
      orderState.planPrice = priceEl ? priceEl.textContent.trim() : "";
    });
  });
  
  function handlePlanButtonClick(e) {
    var btn = e.target.closest('a.button, button.button, .button');
    if (!btn) return;
    
    var btnText = btn.textContent.trim();
    if (btnText.indexOf("Обрати тариф") < 0 && btnText.indexOf("Обрати") < 0) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    console.log("[PlanSelection] Button clicked:", btnText);
    
    var planModal = document.getElementById("modal-plan");
    if (!planModal) {
      console.warn("[PlanSelection] modal-plan not found");
      return;
    }
    
    var card = btn.closest(".pricing_content") || btn.closest(".plan_item--bshadow") || btn.closest(".w-dyn-item");
    if (!card) {
      console.warn("[PlanSelection] Card not found");
      return;
    }
    
    console.log("[PlanSelection] Card found");
    var nameEl = qs(".pricing_plan-name", card);
    var priceEl = qs(".pricing_plan-price", card);
    
    if (nameEl) {
      orderState.planName = nameEl.textContent.trim();
      console.log("[PlanSelection] Plan name:", orderState.planName);
    }
    if (priceEl) {
      var priceText = priceEl.textContent.trim();
      orderState.planPrice = priceText;
      console.log("[PlanSelection] Plan price:", orderState.planPrice);
    }
    
    var planForm = planModal.querySelector("form");
    if (planForm) {
      var planInput = planForm.querySelector('input[name="plan"]');
      var priceInput = planForm.querySelector('input[name="price"]');
      if (planInput && orderState.planName) {
        planInput.value = orderState.planName;
      }
      if (priceInput && orderState.planPrice) {
        priceInput.value = orderState.planPrice;
      }
    }
    
    var planWrapper = planModal.closest(".modal");
    if (!planWrapper) {
      console.warn("[PlanSelection] Modal wrapper not found");
      return;
    }
    
    var orderDialog = document.getElementById("modal-order");
    if (!orderDialog) {
      console.warn("[PlanSelection] modal-order not found");
      return;
    }
    
    console.log("[PlanSelection] Hiding modal-plan and showing modal-order");
    planModal.classList.remove("is-open");
    orderDialog.classList.add("is-open");
    
    var stepSelectType = qs(".modal-step-esim.is--select-type-sim", orderDialog);
    if (stepSelectType) {
      var allSteps = qsa(".modal-step-esim, .modal-success, .modal-error-esim", orderDialog);
      allSteps.forEach(function(step) {
        step.style.display = "none";
        step.classList.remove("is-active");
      });
      stepSelectType.style.display = "";
      stepSelectType.classList.add("is-active");
      console.log("[PlanSelection] Switched to select-type-sim step");
    } else {
      console.warn("[PlanSelection] select-type-sim step not found");
    }
  }
  
  document.addEventListener("click", function(e) {
    var planModal = document.getElementById("modal-plan");
    if (planModal && planModal.classList.contains("is-open")) {
      var btn = e.target.closest('a.button, button.button, .button');
      if (btn && planModal.contains(btn)) {
        handlePlanButtonClick(e);
      }
    }
  });
}

function initTopUpModal() {
  var dialog = document.getElementById("modal-top-up-mobile");
  if (!dialog) return;

  var stepIntro = qs(".modal-step.is--1", dialog);
  var stepAdd = qs('.modal-step[data-step="add-funds"]', dialog);
  var stepSuccess = qs(".modal-success", dialog);
  var btnHaveNumber = document.getElementById("modalClientButton");
  var backBtn = qs(".modal-form-button", dialog);
  var submitBtn = qs(".button.is-validation", dialog);
  var phoneInput = qs("#phone", dialog);
  var errorMsg = qs("#error-msg", dialog);

  bindPhoneMask(phoneInput);
  disableButton(submitBtn, true);

  function validatePhone() {
    var ok = isFullUaPhone(phoneInput);
    if (ok) setFieldState(phoneInput, true);
    else phoneInput.classList.remove("is-validated", "error");
    disableButton(submitBtn, !ok);
    if (errorMsg) errorMsg.classList.add("hide");
  }

  if (btnHaveNumber && stepIntro && stepAdd) {
    btnHaveNumber.addEventListener("click", function (e) {
      e.preventDefault();
      stepIntro.style.display = "none";
      stepIntro.classList.remove("is-active");
      stepAdd.style.display = "";
      stepAdd.classList.add("is-active");
    });
  }

  if (backBtn && stepIntro && stepAdd) {
    backBtn.addEventListener("click", function (e) {
      e.preventDefault();
      stepAdd.style.display = "none";
      stepAdd.classList.remove("is-active");
      stepIntro.style.display = "";
      stepIntro.classList.add("is-active");
      phoneInput.value = formatUaPhoneVisual("380").visual;
      phoneInput.dataset.phoneDigits = "380";
      phoneInput.classList.remove("error", "is-validated");
      disableButton(submitBtn, true);
      if (errorMsg) errorMsg.classList.add("hide");
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", validatePhone);
    phoneInput.addEventListener("change", validatePhone);
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (!isFullUaPhone(phoneInput)) {
        setFieldState(phoneInput, false);
        return;
      }
      var phone = getPhoneDigits(phoneInput);
      disableButton(submitBtn, true);

      fetch(API_BASE + "/telecom/phoneNumbers/" + phone + "/status")
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (data) {
          if (!data || !data.isOurNetwork) {
            setFieldState(phoneInput, false);
            if (errorMsg) errorMsg.classList.remove("hide");
            disableButton(submitBtn, false);
            return;
          }
          setFieldState(phoneInput, true);
          if (errorMsg) errorMsg.classList.add("hide");

          return fetch(API_BASE + "/payments/topUpInfo")
            .then(function (r) {
              if (!r.ok) throw new Error("HTTP " + r.status);
              return r.json();
            })
            .then(function (info) {
              var link = info && info.link ? info.link : null;
              if (stepAdd && stepSuccess) {
                stepAdd.style.display = "none";
                stepAdd.classList.remove("is-active");
                stepSuccess.style.display = "";
                stepSuccess.classList.add("is-active");
              }
              if (link) {
                var a = qs(".modal-relink-text a", dialog);
                if (a) a.href = link;
                setTimeout(function () {
                  window.open(link, "_blank");
                }, 1500);
              }
            });
        })
        .catch(function () {
          setFieldState(phoneInput, false);
          if (errorMsg) errorMsg.classList.remove("hide");
          disableButton(submitBtn, false);
        });
    });
  }

  validatePhone();
}

function initEsimOrderModal() {
  var dialog = document.getElementById("modal-order");
  if (!dialog) return;

  var form = qs("form", dialog);
  if (form)
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });

  var stepSelectType = qs(".modal-step-esim.is--select-type-sim", dialog);
  var stepDescribe = qs(".modal-step-esim.is--describe-you", dialog);
  var stepApply = qs(".modal-step-esim.is--apply-esim", dialog);
  var stepPayment = qs(".modal-step-esim.is--payment", dialog);
  var stepError = qs(".modal-error-esim", dialog);
  var stepSuccess = qs(".modal-success", dialog);

  var selectTypeBtn = stepSelectType
    ? qs(".button.is-validation", stepSelectType)
    : null;
  var describeBtn = stepDescribe
    ? qs(".button.is-validation", stepDescribe)
    : null;
  var applyBtn = stepApply ? qs(".button.is-validation", stepApply) : null;
  var paymentBtn = stepPayment
    ? qs(".button.is-validation", stepPayment)
    : null;

  var backButtons = qsa(".modal-form-button", dialog);

  var radioSimType = qsa('input[name="New-Client"]', dialog);
  var firstNameInput = qs("#first-name", dialog);
  var lastNameInput = qs("#last-name", dialog);
  var emailInput = qs("#email", dialog);

  var orderState = (window.utmOrderState = window.utmOrderState || {});

  var tableNames = qsa(".modal-esim_name");
  var tableEmails = qsa(".modal-esim_email");
  var tablePlans = qsa(".modal-esim_plan");
  var tablePrices = qsa(".modal-esim_price");

  // ячейка "Тип SIM" в таблице шага оплаты (динамический текст)
  var simTypeCell = null;
  if (stepPayment) {
    var paymentRows = qsa(".modal-esim_table-row", stepPayment);
    paymentRows.forEach(function (row) {
      var label = qs(".modal-esim_table-label", row);
      if (label && label.textContent.trim().indexOf("Тип SIM") === 0) {
        var items = qsa(".modal-esim_table-item", row);
        if (items[1]) {
          var cellDiv = qs("div", items[1]);
          if (cellDiv) simTypeCell = cellDiv;
        }
      }
    });
  }

  function getSimTypeRaw() {
    var r = radioSimType.find(function (x) {
      return x.checked;
    });
    return r ? r.value : null;
  }

  function getSimType() {
    var val = getSimTypeRaw();
    if (!val) return null;

    var low = String(val).toLowerCase();
    if (low === "esim" || low === "e-sim" || low === "e_sim") return "eSIM";
    return "plastic";
  }

  function updateSelectTypeValidity() {
    var has = !!getSimTypeRaw();
    if (selectTypeBtn) disableButton(selectTypeBtn, !has);
  }

  function updateDescribeValidity() {
    var okFirst = !!firstNameInput.value.trim();
    var okLast = !!lastNameInput.value.trim();
    var okEmail = isValidEmail(emailInput.value);
    setFieldState(firstNameInput, okFirst ? true : null);
    setFieldState(lastNameInput, okLast ? true : null);
    setFieldState(emailInput, okEmail ? true : null);
    var all = okFirst && okLast && okEmail;
    if (describeBtn) disableButton(describeBtn, !all);
  }

  radioSimType.forEach(function (r) {
    r.addEventListener("change", updateSelectTypeValidity);
  });

  if (firstNameInput)
    firstNameInput.addEventListener("input", updateDescribeValidity);
  if (lastNameInput)
    lastNameInput.addEventListener("input", updateDescribeValidity);
  if (emailInput)
    emailInput.addEventListener("input", updateDescribeValidity);

  if (selectTypeBtn && stepSelectType && stepDescribe) {
    selectTypeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (!getSimTypeRaw()) return;
      stepSelectType.style.display = "none";
      stepSelectType.classList.remove("is-active");
      stepDescribe.style.display = "";
      stepDescribe.classList.add("is-active");
    });
  }

  if (describeBtn && stepDescribe) {
    describeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      updateDescribeValidity();
      var okFirst = !!firstNameInput.value.trim();
      var okLast = !!lastNameInput.value.trim();
      var okEmail = isValidEmail(emailInput.value);
      if (!okFirst || !okLast || !okEmail) return;

      var fullName =
        firstNameInput.value.trim() + " " + lastNameInput.value.trim();
      var email = emailInput.value.trim();
      var planName = orderState.planName || "";
      var planPrice = orderState.planPrice || "";

      tableNames.forEach(function (n) {
        n.textContent = fullName;
      });
      tableEmails.forEach(function (n) {
        n.textContent = email;
      });
      tablePlans.forEach(function (n) {
        n.textContent = planName;
      });
      tablePrices.forEach(function (n) {
        n.textContent = planPrice;
      });

      var type = getSimType(); // "eSIM" или "plastic"

      // динамический текст "Тип SIM" в таблице
      if (simTypeCell) {
        simTypeCell.textContent = type === "eSIM" ? "eSIM" : "Пластикова SIM";
      }

      stepDescribe.style.display = "none";
      stepDescribe.classList.remove("is-active");

      if (type === "eSIM") {
        // eSIM идёт на шаг оплаты в этой же модалке
        if (stepApply) {
          stepApply.style.display = "";
          stepApply.classList.add("is-active");
        } else if (stepPayment) {
          stepPayment.style.display = "";
          stepPayment.classList.add("is-active");
          // заглушка: сразу разрешаем оплату
          if (paymentBtn) disableButton(paymentBtn, false);
        }
      } else {
        // Пластиковая SIM перекидывается в модалку доставки
      console.log("[UTM] Switching to plastic delivery modal");
        var wrapper = dialog.closest(".modal");
        if (wrapper) {
          var plasticDialog = qs(".modal__dialog.modal--md", wrapper);
          if (plasticDialog) {
          console.log("[UTM] Found plastic dialog, switching to it");
            dialog.classList.remove("is-open");
            plasticDialog.classList.add("is-open");
            modalApi.resetSteps(plasticDialog);
          // Инициализируем NovaPoshta селекты при открытии модального окна доставки
          console.log("[NovaPoshta] Plastic delivery modal opened, initializing NovaPoshta selects");
          setTimeout(function() {
            initNovaPostSelects();
          }, 100);
        } else {
          console.warn("[UTM] Plastic dialog not found!");
        }
      } else {
        console.warn("[UTM] Modal wrapper not found!");
        }
      }
    });
  }

  if (applyBtn && stepApply && stepPayment) {
    applyBtn.addEventListener("click", function (e) {
      e.preventDefault();
      stepApply.style.display = "none";
      stepApply.classList.remove("is-active");
      stepPayment.style.display = "";
      stepPayment.classList.add("is-active");
      // заглушка: разрешаем оплату на шаге оплаты
      if (paymentBtn) disableButton(paymentBtn, false);
    });
  }

  if (paymentBtn && stepPayment) {
    paymentBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var type = getSimType(); // "eSIM" или "plastic"

      // eSIM: заглушка бэкенда — просто открываем модалку с инструкцией (#modal-success-esim)
      if (type === "eSIM") {
        disableButton(paymentBtn, true);
        var wrapper = dialog.closest(".modal");
        if (wrapper) {
          // модалка с инструкцией eSIM
          var esimSuccessDialog =
            document.getElementById("modal-success-esim") ||
            qs(".modal__dialog.modal--lg", wrapper);
          if (esimSuccessDialog) {
            // закрываем текущий диалог оплаты
            qsa(".modal__dialog", wrapper).forEach(function (dlg) {
              dlg.classList.remove("is-open");
            });
            // показываем диалог с успехом/инструкцией
            esimSuccessDialog.classList.add("is-open");
            modalApi.resetSteps(esimSuccessDialog);
          }
        }
        return;
      }

      // на случай, если когда-то этот шаг будут использовать и для пластика — старое поведение
      disableButton(paymentBtn, true);
      setTimeout(function () {
        disableButton(paymentBtn, false);
        stepPayment.style.display = "none";
        stepPayment.classList.remove("is-active");
        if (stepSuccess) {
          stepSuccess.style.display = "";
          stepSuccess.classList.add("is-active");
        }
      }, 800);
    });
  }

  backButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var step = btn.closest(
        ".modal-step-esim, .modal-error-esim, .modal-success"
      );
      if (!step) return;
      var steps = qsa(
        ".modal-step-esim, .modal-error-esim, .modal-success",
        dialog
      );
      var i = steps.indexOf(step);
      if (i <= 0) return;
      step.style.display = "none";
      step.classList.remove("is-active");
      var prev = steps[i - 1];
      if (prev) {
        prev.style.display = "";
        prev.classList.add("is-active");
      }
    });
  });

  updateSelectTypeValidity();
  updateDescribeValidity();
}

var npState = { cityId: null };

function npFetchJson(url) {
  return fetch(url).then(function (res) {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  });
}

async function npLoadInitialCities(limit) {
var params = new URLSearchParams();
params.set("page", "1");
params.set("limit", String(limit));
var url = API_BASE + "/delivery/novaPost/cities?" + params.toString();
console.log("[NovaPoshta] npLoadInitialCities: fetching initial", limit, "cities");
try {
  var data = await npFetchJson(url);
  return data.payload || [];
} catch (e) {
  console.error("[NovaPoshta] npLoadInitialCities: error:", e);
  return [];
}
}

async function npSearchCities(query) {
var params = new URLSearchParams();
params.set("page", "1");
params.set("limit", "50");
params.set("searchQuery", query);
var url = API_BASE + "/delivery/novaPost/cities?" + params.toString();
console.log("[NovaPoshta] npSearchCities: searching for", query);
try {
  var data = await npFetchJson(url);
  return data.payload || [];
} catch (e) {
  console.error("[NovaPoshta] npSearchCities: error:", e);
  return [];
}
}

async function npLoadInitialStreets(cityId, limit) {
if (!cityId) return [];
var params = new URLSearchParams();
params.set("page", "1");
params.set("limit", String(limit));
params.set("cityId", cityId);
var url = API_BASE + "/delivery/novaPost/streets?" + params.toString();
console.log("[NovaPoshta] npLoadInitialStreets: fetching initial", limit, "streets for city", cityId);
try {
  var data = await npFetchJson(url);
  return data.payload || [];
} catch (e) {
  console.error("[NovaPoshta] npLoadInitialStreets: error:", e);
  return [];
}
}

async function npSearchStreets(query, cityId) {
if (!cityId) return Promise.resolve([]);
var params = new URLSearchParams();
params.set("page", "1");
params.set("limit", "50");
params.set("searchQuery", query);
params.set("cityId", cityId);
var url = API_BASE + "/delivery/novaPost/streets?" + params.toString();
console.log("[NovaPoshta] npSearchStreets: searching for", query, "in city", cityId);
try {
  var data = await npFetchJson(url);
  return data.payload || [];
} catch (e) {
  console.error("[NovaPoshta] npSearchStreets: error:", e);
  return [];
}
}

async function npLoadInitialBranches(cityId, limit) {
if (!cityId) return [];
var params = new URLSearchParams();
params.set("page", "1");
params.set("limit", String(limit));
params.set("cityId", cityId);
var url = API_BASE + "/delivery/novaPost/branches?" + params.toString();
console.log("[NovaPoshta] npLoadInitialBranches: fetching initial", limit, "branches for city", cityId);
try {
  var data = await npFetchJson(url);
  return data.payload || [];
} catch (e) {
  console.error("[NovaPoshta] npLoadInitialBranches: error:", e);
  return [];
}
}

async function npSearchBranches(query, cityId) {
if (!cityId) return Promise.resolve([]);
var params = new URLSearchParams();
params.set("page", "1");
params.set("limit", "50");
params.set("searchQuery", query);
params.set("cityId", cityId);
var url = API_BASE + "/delivery/novaPost/branches?" + params.toString();
console.log("[NovaPoshta] npSearchBranches: searching for", query, "in city", cityId);
try {
  var data = await npFetchJson(url);
  return data.payload || [];
} catch (e) {
  console.error("[NovaPoshta] npSearchBranches: error:", e);
  return [];
}
}

async function npLoadAllCities() {
console.log("[NovaPoshta] npLoadAllCities: starting...");
  var select = document.getElementById("City");
if (!select) {
  console.warn("[NovaPoshta] npLoadAllCities: City select not found!");
  return;
}
if (select.dataset.loading === "1") {
  console.log("[NovaPoshta] npLoadAllCities: already loading, skipping");
  return;
}
console.log("[NovaPoshta] npLoadAllCities: City select found, starting load");
  var phOpt = select.querySelector("option[value='']") || select.options[0];
  var phText = phOpt ? phOpt.textContent : "Введіть назву міста";
  select.innerHTML = "";
  var ph = document.createElement("option");
  ph.value = "";
  ph.textContent = phText;
  select.appendChild(ph);
select.dataset.loading = "1";
  var page = 1;
var limit = 500;
var totalLoaded = 0;
var hasMore = true;

while (hasMore) {
    var params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
  var url = API_BASE + "/delivery/novaPost/cities?" + params.toString();
  console.log("[NovaPoshta] npLoadAllCities: fetching page", page, "from", url);
    var data;
    try {
    data = await npFetchJson(url);
    console.log("[NovaPoshta] npLoadAllCities: received response for page", page, ":", data);
    } catch (e) {
    console.error("[NovaPoshta] npLoadAllCities: error on page", page, ":", e);
      break;
    }
  
  // Обработка разных форматов ответа API
  var items = null;
  if (Array.isArray(data)) {
    items = data;
    console.log("[NovaPoshta] npLoadAllCities: data is array, items count:", items.length);
  } else if (data && Array.isArray(data.payload)) {
    items = data.payload;
    console.log("[NovaPoshta] npLoadAllCities: data.payload found, items count:", items.length, "meta:", data.meta);
  } else if (data && Array.isArray(data.data)) {
    items = data.data;
    console.log("[NovaPoshta] npLoadAllCities: data.data found, items count:", items.length);
  } else if (data && data.items && Array.isArray(data.items)) {
    items = data.items;
    console.log("[NovaPoshta] npLoadAllCities: data.items found, items count:", items.length);
  } else {
    console.warn("[NovaPoshta] npLoadAllCities: unknown data format:", data);
  }
  
  if (!items || !items.length) {
    console.log("[NovaPoshta] npLoadAllCities: no items found, stopping");
    hasMore = false;
    break;
  }
  
  var seenValues = {};
  var seenTexts = {};
  items.forEach(function (item) {
    var value = item.id || item.Ref || item.ref;
    var text = item.name || item.Description || item.description;
    if (!value || !text) return;
    var textKey = String(text).trim().toLowerCase();
    if (seenValues[value] || seenTexts[textKey]) return;
    seenValues[value] = true;
    seenTexts[textKey] = true;
      var opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
      select.appendChild(opt);
    });
  
  totalLoaded += items.length;
  console.log("[NovaPoshta] npLoadAllCities: loaded page", page, "-", items.length, "items (total:", totalLoaded, ")");
  
  // Проверка наличия следующей страницы
  var totalPages = null;
  var currentPage = null;
  var totalCount = null;
  
  if (data.meta) {
    totalPages = data.meta.totalPages;
    currentPage = data.meta.currentPage || data.meta.page;
    totalCount = data.meta.totalCount || data.meta.total;
    console.log("[NovaPoshta] npLoadAllCities: meta found - totalPages:", totalPages, "currentPage:", currentPage, "totalCount:", totalCount);
  } else if (data.pagination) {
    totalPages = data.pagination.totalPages;
    currentPage = data.pagination.currentPage || data.pagination.page;
    totalCount = data.pagination.totalCount || data.pagination.total;
    console.log("[NovaPoshta] npLoadAllCities: pagination found - totalPages:", totalPages, "currentPage:", currentPage, "totalCount:", totalCount);
  } else {
    console.log("[NovaPoshta] npLoadAllCities: no meta/pagination found, using fallback logic");
  }
  
  if (totalPages !== null && typeof totalPages === "number") {
    if (page >= totalPages) {
      console.log("[NovaPoshta] npLoadAllCities: reached totalPages (", totalPages, "), stopping");
      hasMore = false;
    } else {
    page++;
  }
  } else if (totalCount !== null && typeof totalCount === "number") {
    if (totalLoaded >= totalCount) {
      console.log("[NovaPoshta] npLoadAllCities: reached totalCount (", totalCount, "), stopping");
      hasMore = false;
    } else {
      page++;
    }
  } else {
    // Fallback: если получили меньше элементов, чем лимит, значит это последняя страница
    if (items.length < limit) {
      console.log("[NovaPoshta] npLoadAllCities: items.length (", items.length, ") < limit (", limit, "), stopping");
      hasMore = false;
    } else {
      // Если получили ровно limit элементов, делаем еще один запрос для проверки
      console.log("[NovaPoshta] npLoadAllCities: items.length (", items.length, ") == limit (", limit, "), continuing to next page");
      page++;
      // Защита от бесконечного цикла
      if (page > 1000) {
        console.warn("[NovaPoshta] npLoadAllCities: reached max pages limit (1000)");
        hasMore = false;
      }
    }
  }
}

console.log("[NovaPoshta] npLoadAllCities: finished loading, total cities:", totalLoaded);
delete select.dataset.loading;
}

async function npLoadAllStreets() {
  if (!npState.cityId) return;
  var select = document.getElementById("Address");
  if (!select) return;
if (select.dataset.loading === "1") return;
  var phOpt = select.querySelector("option[value='']") || select.options[0];
  var phText = phOpt ? phOpt.textContent : "Введіть адресу";
  select.innerHTML = "";
  var ph = document.createElement("option");
  ph.value = "";
  ph.textContent = phText;
  select.appendChild(ph);
select.dataset.loading = "1";
  var page = 1;
var limit = 500;
var totalLoaded = 0;
var hasMore = true;

while (hasMore) {
    var params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("cityId", npState.cityId);
    var data;
    try {
      data = await npFetchJson(
        API_BASE + "/delivery/novaPost/streets?" + params.toString()
      );
    } catch (e) {
    console.error("NovaPoshta streets error:", e);
      break;
    }
  
  var items = null;
  if (Array.isArray(data)) {
    items = data;
  } else if (data && Array.isArray(data.payload)) {
    items = data.payload;
  } else if (data && Array.isArray(data.data)) {
    items = data.data;
  } else if (data && data.items && Array.isArray(data.items)) {
    items = data.items;
  }
  
  if (!items || !items.length) {
    hasMore = false;
    break;
  }
  
  var seenValues = {};
  var seenTexts = {};
  items.forEach(function (item) {
    var value = item.id || item.Ref || item.ref;
    var text = item.name || item.Description || item.description;
    if (!value || !text) return;
    var textKey = String(text).trim().toLowerCase();
    if (seenValues[value] || seenTexts[textKey]) return;
    seenValues[value] = true;
    seenTexts[textKey] = true;
      var opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
      select.appendChild(opt);
    });
  
  totalLoaded += items.length;
  
  var totalPages = null;
  var totalCount = null;
  if (data.meta) {
    totalPages = data.meta.totalPages;
    totalCount = data.meta.totalCount || data.meta.total;
  } else if (data.pagination) {
    totalPages = data.pagination.totalPages;
    totalCount = data.pagination.totalCount || data.pagination.total;
  }
  
  if (totalPages !== null && typeof totalPages === "number") {
    if (page >= totalPages) {
      hasMore = false;
    } else {
    page++;
  }
  } else if (totalCount !== null && typeof totalCount === "number") {
    if (totalLoaded >= totalCount) {
      hasMore = false;
    } else {
      page++;
    }
  } else {
    if (items.length < limit) {
      hasMore = false;
    } else {
      page++;
      if (page > 1000) {
        hasMore = false;
      }
    }
  }
}

delete select.dataset.loading;
}

async function npLoadAllBranches() {
  if (!npState.cityId) return;
  var select = document.getElementById("Department");
  if (!select) return;
if (select.dataset.loading === "1") return;
  var phOpt = select.querySelector("option[value='']") || select.options[0];
  var phText = phOpt
    ? phOpt.textContent
    : "Введіть Номер відділення чи поштомату";
  select.innerHTML = "";
  var ph = document.createElement("option");
  ph.value = "";
  ph.textContent = phText;
  select.appendChild(ph);
select.dataset.loading = "1";
  var page = 1;
var limit = 500;
var totalLoaded = 0;
var hasMore = true;

while (hasMore) {
    var params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("cityId", npState.cityId);
    var data;
    try {
      data = await npFetchJson(
        API_BASE + "/delivery/novaPost/branches?" + params.toString()
      );
    } catch (e) {
    console.error("NovaPoshta branches error:", e);
      break;
    }
  
  var items = null;
  if (Array.isArray(data)) {
    items = data;
  } else if (data && Array.isArray(data.payload)) {
    items = data.payload;
  } else if (data && Array.isArray(data.data)) {
    items = data.data;
  } else if (data && data.items && Array.isArray(data.items)) {
    items = data.items;
  }
  
  if (!items || !items.length) {
    hasMore = false;
    break;
  }
  
  var seenValues = {};
  var seenTexts = {};
  items.forEach(function (item) {
    var value = item.id || item.Ref || item.ref;
    var text = item.name || item.Description || item.description;
    if (!value || !text) return;
    var textKey = String(text).trim().toLowerCase();
    if (seenValues[value] || seenTexts[textKey]) return;
    seenValues[value] = true;
    seenTexts[textKey] = true;
      var opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
      select.appendChild(opt);
    });
  
  totalLoaded += items.length;
  
  var totalPages = null;
  var totalCount = null;
  if (data.meta) {
    totalPages = data.meta.totalPages;
    totalCount = data.meta.totalCount || data.meta.total;
  } else if (data.pagination) {
    totalPages = data.pagination.totalPages;
    totalCount = data.pagination.totalCount || data.pagination.total;
  }
  
  if (totalPages !== null && typeof totalPages === "number") {
    if (page >= totalPages) {
      hasMore = false;
    } else {
    page++;
  }
  } else if (totalCount !== null && typeof totalCount === "number") {
    if (totalLoaded >= totalCount) {
      hasMore = false;
    } else {
      page++;
    }
  } else {
    if (items.length < limit) {
      hasMore = false;
    } else {
      page++;
      if (page > 1000) {
        hasMore = false;
      }
    }
  }
}

delete select.dataset.loading;
}

function initNovaPostAutocomplete(select, searchFn, minChars, initialLoadFn) {
if (!select) return;
if (select.dataset.npAutocomplete === "1") {
  console.log("[NovaPoshta] Autocomplete already initialized for", select.id);
  return;
}

var wrapper = select.closest(".np-select-wrapper");
if (!wrapper) {
  console.warn("[NovaPoshta] np-select-wrapper not found for", select.id);
  return;
}

var displayInput = wrapper.querySelector('.w-embed .np-select-display') || wrapper.querySelector('.np-select-display');
var dropdown = wrapper.querySelector(".np-select-dropdown");
var searchInput = wrapper.querySelector(".np-select-search");
var resultsList = wrapper.querySelector(".np-select-results");

if (!displayInput || !dropdown || !searchInput || !resultsList) {
  console.warn("[NovaPoshta] Required elements not found for", select.id);
  return;
}

select.dataset.npAutocomplete = "1";
var isOpen = false;
var requestCounter = 0;

var savedPlaceholder = displayInput.getAttribute("placeholder") || displayInput.getAttribute("data-placeholder") || "";

function updateDisplay() {
  var selectedOption = select.options[select.selectedIndex];
  if (selectedOption && selectedOption.value) {
    displayInput.value = selectedOption.textContent;
    displayInput.classList.remove("placeholder");
  } else {
    displayInput.value = "";
    displayInput.classList.add("placeholder");
  }
}

function addItemToSelect(item, addToDropdown) {
  var value = item.id || item.Ref || item.ref;
  var text = item.name || item.Description || item.description;
  if (!value || !text) return null;

  var existingOption = select.querySelector('option[value="' + value + '"]');
  if (!existingOption) {
    var opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
    select.appendChild(opt);
  }

  if (addToDropdown) {
    var itemDiv = document.createElement("div");
    itemDiv.className = "np-select-item";
    itemDiv.textContent = text;
    itemDiv.dataset.value = value;
    itemDiv.dataset.text = text;

    if (select.value === value) {
      itemDiv.classList.add("selected");
    }

    itemDiv.addEventListener("mouseenter", function() {
      itemDiv.style.backgroundColor = "#f5f5f5";
    });
    itemDiv.addEventListener("mouseleave", function() {
      if (select.value !== value) {
        itemDiv.style.backgroundColor = "";
      }
    });
    itemDiv.addEventListener("click", function() {
      select.value = value;
      updateDisplay();
      hideDropdown();
      setTimeout(function() {
        var changeEvent = new Event("change", { bubbles: true, cancelable: true });
        select.dispatchEvent(changeEvent);
        var inputEvent = new Event("input", { bubbles: true, cancelable: true });
        select.dispatchEvent(inputEvent);
        if (select.id === "City" || select.id === "Address" || select.id === "Department") {
          var deliveryStep = select.closest(".modal-step-esim.is--delivery");
          if (deliveryStep && typeof window.deliveryFormValidate === "function") {
            setTimeout(function() {
              window.deliveryFormValidate();
            }, 50);
          }
        }
      }, 10);
    });

    return itemDiv;
  }
  return null;
}

function showInitialItems() {
  resultsList.innerHTML = "";
  var options = select.querySelectorAll("option[value]:not([value=''])");
  var shown = 0;
  var maxShow = 15;
  var seenTexts = {};

  for (var i = 0; i < options.length && shown < maxShow; i++) {
    var opt = options[i];
    if (opt.value) {
      var text = opt.textContent.trim();
      var textKey = text.toLowerCase();
      if (seenTexts[textKey]) {
        continue;
      }
      seenTexts[textKey] = true;
      
      var itemDiv = document.createElement("div");
      itemDiv.className = "np-select-item";
      itemDiv.textContent = text;
      itemDiv.dataset.value = opt.value;
      itemDiv.dataset.text = text;

      if (select.value === opt.value) {
        itemDiv.classList.add("selected");
      }

      itemDiv.addEventListener("mouseenter", function() {
        this.style.backgroundColor = "#f5f5f5";
      });
      itemDiv.addEventListener("mouseleave", function() {
        if (select.value !== this.dataset.value) {
          this.style.backgroundColor = "";
        }
      });
      itemDiv.addEventListener("click", function() {
        select.value = this.dataset.value;
        updateDisplay();
        hideDropdown();
        setTimeout(function() {
          var changeEvent = new Event("change", { bubbles: true, cancelable: true });
          select.dispatchEvent(changeEvent);
          var inputEvent = new Event("input", { bubbles: true, cancelable: true });
          select.dispatchEvent(inputEvent);
          if (select.id === "City" || select.id === "Address" || select.id === "Department") {
            var deliveryStep = select.closest(".modal-step-esim.is--delivery");
            if (deliveryStep && typeof window.deliveryFormValidate === "function") {
              setTimeout(function() {
                window.deliveryFormValidate();
              }, 50);
            }
          }
        }, 10);
      });

      resultsList.appendChild(itemDiv);
      shown++;
    }
  }
  if (shown === 0) {
    var noResults = document.createElement("div");
    noResults.className = "np-select-no-results";
    noResults.textContent = "Введіть для пошуку...";
    resultsList.appendChild(noResults);
  }
}

function showDropdown() {
  if (isOpen) return;
  isOpen = true;
  wrapper.classList.add("active");
  searchInput.focus();
  searchInput.value = "";
  showInitialItems();
}

function hideDropdown() {
  if (!isOpen) return;
  isOpen = false;
  wrapper.classList.remove("active");
  searchInput.value = "";
}

var searchDebounced = debounce(function(query) {
  console.log("[NovaPoshta] searchDebounced called for", select.id, "with query:", query);
  requestCounter++;
  var currentRequestId = requestCounter;
  select.dataset.currentRequestId = String(currentRequestId);

  resultsList.innerHTML = '<div class="np-select-loading">Завантаження...</div>';

  console.log("[NovaPoshta] Calling searchFn for", select.id, "query:", query);
  searchFn(query).then(function(items) {
    console.log("[NovaPoshta] Search results received for", select.id, "items count:", items ? items.length : 0);
    if (!wrapper || !resultsList) {
      console.warn("[NovaPoshta] Wrapper or resultsList not found for", select.id);
      return;
    }
    if (String(select.dataset.currentRequestId) !== String(currentRequestId)) {
      console.log("[NovaPoshta] Ignoring outdated search results for", select.id);
      return;
    }

    if (!items || items.length === 0) {
      console.log("[NovaPoshta] No items found for", select.id);
      resultsList.innerHTML = '<div class="np-select-no-results">Нічого не знайдено</div>';
      return;
    }

    console.log("[NovaPoshta] Processing", items.length, "items for", select.id);
    var seenValues = {};
    var seenTexts = {};
    var itemsToAdd = [];
    
    items.forEach(function(item) {
      var value = item.id || item.Ref || item.ref;
      var text = item.name || item.Description || item.description;
      if (!value || !text) return;
      var textKey = String(text).trim().toLowerCase();
      if (seenValues[value] || seenTexts[textKey]) {
        console.log("[NovaPoshta] Skipping duplicate item:", text, "value:", value);
        return;
      }
      seenValues[value] = true;
      seenTexts[textKey] = true;
      itemsToAdd.push(item);
    });
    
    var existingTexts = {};
    var existingItems = resultsList.querySelectorAll('.np-select-item');
    existingItems.forEach(function(existingItem) {
      var existingText = (existingItem.dataset.text || existingItem.textContent || "").trim().toLowerCase();
      if (existingText) {
        existingTexts[existingText] = true;
      }
    });
    
    resultsList.innerHTML = "";
    var addedCount = 0;
    var finalSeenTexts = {};
    itemsToAdd.forEach(function(item) {
      var text = item.name || item.Description || item.description;
      if (!text) return;
      var textKey = String(text).trim().toLowerCase();
      if (finalSeenTexts[textKey]) {
        console.log("[NovaPoshta] Skipping duplicate text in results:", text);
        return;
      }
      finalSeenTexts[textKey] = true;
      var itemDiv = addItemToSelect(item, true);
      if (itemDiv) {
        resultsList.appendChild(itemDiv);
        addedCount++;
      }
    });
    console.log("[NovaPoshta] Added", addedCount, "items to dropdown for", select.id);
  }).catch(function(err) {
    console.error("[NovaPoshta] Search error for", select.id, ":", err);
    if (!wrapper || !resultsList) return;
    if (String(select.dataset.currentRequestId) !== String(currentRequestId)) return;
    resultsList.innerHTML = '<div class="np-select-error">Помилка завантаження</div>';
  });
}, 300);

displayInput.addEventListener("click", function(e) {
  e.preventDefault();
  if (isOpen) {
    hideDropdown();
  } else {
    showDropdown();
  }
});

searchInput.addEventListener("input", function(e) {
  var query = (e.target.value || "").trim();
  console.log("[NovaPoshta] Search input changed for", select.id, "query:", query, "length:", query.length, "minChars:", minChars);
  if (query.length >= minChars) {
    console.log("[NovaPoshta] Triggering search for", select.id, "with query:", query);
    searchDebounced(query);
  } else {
    console.log("[NovaPoshta] Query too short, showing initial items for", select.id);
    showInitialItems();
  }
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && isOpen) {
    hideDropdown();
  }
});

document.addEventListener("click", function(e) {
  if (isOpen && !wrapper.contains(e.target)) {
    hideDropdown();
  }
});

select.addEventListener("change", function() {
  updateDisplay();
});

if (initialLoadFn && typeof initialLoadFn === "function") {
  initialLoadFn(15).then(function(items) {
    if (items && items.length > 0) {
      var seen = {};
      items.forEach(function(item) {
        var value = item.id || item.Ref || item.ref;
        if (value && !seen[value]) {
          seen[value] = true;
          addItemToSelect(item, false);
        }
      });
      console.log("[NovaPoshta] Loaded", items.length, "initial items for", select.id);
      updateDisplay();
    }
  }).catch(function(err) {
    console.error("[NovaPoshta] Error loading initial items:", err);
  });
}

updateDisplay();
}

function initNovaPostSelects() {
console.log("[NovaPoshta] initNovaPostSelects: initializing...");
  var citySelect = document.getElementById("City");
  var addrSelect = document.getElementById("Address");
  var deptSelect = document.getElementById("Department");

console.log("[NovaPoshta] initNovaPostSelects: citySelect found:", !!citySelect, "addrSelect:", !!addrSelect, "deptSelect:", !!deptSelect);

if (citySelect && !citySelect.dataset.npInitialized) {
  citySelect.dataset.npInitialized = "1";
  
  initNovaPostAutocomplete(citySelect, function(query) {
    return npSearchCities(query);
  }, 2, function(limit) {
    return npLoadInitialCities(limit);
    });

    citySelect.addEventListener("change", function () {
      npState.cityId = citySelect.value || null;
      if (addrSelect) {
      addrSelect.value = "";
        addrSelect.innerHTML = '<option value="">Введіть адресу</option>';
      var addrWrapper = addrSelect.closest(".np-select-wrapper");
      if (addrWrapper) {
        var addrDisplay = addrWrapper.querySelector('.np-select-display') || addrWrapper.querySelector('.w-embed .np-select-display');
        if (addrDisplay) {
          addrDisplay.value = "";
          addrDisplay.classList.add("placeholder");
        }
      }
      delete addrSelect.dataset.npInitialized;
      delete addrSelect.dataset.npAutocomplete;
      if (npState.cityId) {
        initNovaPostAutocomplete(addrSelect, function(query) {
          if (!npState.cityId) return Promise.resolve([]);
          return npSearchStreets(query, npState.cityId);
        }, 2, function(limit) {
          if (!npState.cityId) return Promise.resolve([]);
          return npLoadInitialStreets(npState.cityId, limit);
        });
      }
    }
    if (deptSelect) {
      deptSelect.value = "";
      deptSelect.innerHTML = '<option value="">Введіть Номер відділення чи поштомату</option>';
      var deptWrapper = deptSelect.closest(".np-select-wrapper");
      if (deptWrapper) {
        var deptDisplay = deptWrapper.querySelector('.np-select-display') || deptWrapper.querySelector('.w-embed .np-select-display');
        if (deptDisplay) {
          deptDisplay.value = "";
          deptDisplay.classList.add("placeholder");
        }
      }
      delete deptSelect.dataset.npInitialized;
      delete deptSelect.dataset.npAutocomplete;
      if (npState.cityId) {
        initNovaPostAutocomplete(deptSelect, function(query) {
          if (!npState.cityId) return Promise.resolve([]);
          return npSearchBranches(query, npState.cityId);
        }, 2, function(limit) {
          if (!npState.cityId) return Promise.resolve([]);
          return npLoadInitialBranches(npState.cityId, limit);
        });
      }
    }
  });
}

if (addrSelect && !addrSelect.dataset.npInitialized && npState.cityId) {
  addrSelect.dataset.npInitialized = "1";
  initNovaPostAutocomplete(addrSelect, function(query) {
    if (!npState.cityId) return Promise.resolve([]);
    return npSearchStreets(query, npState.cityId);
  }, 2, function(limit) {
    if (!npState.cityId) return Promise.resolve([]);
    return npLoadInitialStreets(npState.cityId, limit);
  });
}

if (deptSelect && !deptSelect.dataset.npInitialized && npState.cityId) {
  deptSelect.dataset.npInitialized = "1";
  initNovaPostAutocomplete(deptSelect, function(query) {
    if (!npState.cityId) return Promise.resolve([]);
    return npSearchBranches(query, npState.cityId);
  }, 2, function(limit) {
    if (!npState.cityId) return Promise.resolve([]);
    return npLoadInitialBranches(npState.cityId, limit);
  });
  }
}

function initDeliveryTypeToggle() {
  var deliveryStep = document.querySelector(".modal-step-esim.is--delivery");
  if (!deliveryStep) return;
  var radios = qsa('input[name="Delivery-Type"]', deliveryStep);
  var addrWrapper = qs(".modal-delivery_address-wrapper", deliveryStep);
  var addrContainer = qs(".modal-delivery_address", deliveryStep);
  var deptItem = qs(".modal-step-esim_item.is--department", deliveryStep);

  function applyState() {
    var r = radios.find(function (x) {
      return x.checked;
    });
    var val = r ? r.value : null;
    if (!addrContainer || !addrWrapper || !deptItem) return;
    if (!val) {
      addrContainer.style.display = "none";
      addrWrapper.style.display = "none";
      deptItem.style.display = "none";
      return;
    }
    addrContainer.style.display = "block";
    if (val === "courier") {
      addrWrapper.style.display = "flex";
      deptItem.style.display = "none";
    } else {
      addrWrapper.style.display = "none";
      deptItem.style.display = "block";
    }
  }

  radios.forEach(function (r) {
    r.addEventListener("change", applyState);
  });

  applyState();
}

function initDeliveryFormValidation() {
  var deliveryStep = document.querySelector(".modal-step-esim.is--delivery");
  if (!deliveryStep) return;
  var form = deliveryStep.closest("form");
  if (form)
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });

  var citySelect = qs("#City", deliveryStep);
  var phoneInput = qs("#delivery-phone", deliveryStep);
  var addrSelect = qs("#Address", deliveryStep);
  var deptSelect = qs("#Department", deliveryStep);
  var buildingInput = qs("#Building", deliveryStep);
  var flatInput = qs("#Flat", deliveryStep);
  var radios = qsa('input[name="Delivery-Type"]', deliveryStep);
  var nextBtn = qs(".button.is-validation", deliveryStep);

  bindPhoneMask(phoneInput);

  function getType() {
    var r = radios.find(function (x) {
      return x.checked;
    });
    return r ? r.value : null;
  }

  function updateRequiredFields() {
    var type = getType();
    
    if (type === "courier") {
      if (addrSelect) addrSelect.setAttribute("required", "required");
      if (buildingInput) buildingInput.setAttribute("required", "required");
      if (flatInput) flatInput.setAttribute("required", "required");
      if (deptSelect) deptSelect.removeAttribute("required");
    } else if (type === "pickup") {
      if (deptSelect) deptSelect.setAttribute("required", "required");
      if (addrSelect) addrSelect.removeAttribute("required");
      if (buildingInput) buildingInput.removeAttribute("required");
      if (flatInput) flatInput.removeAttribute("required");
    } else {
      if (addrSelect) addrSelect.removeAttribute("required");
      if (buildingInput) buildingInput.removeAttribute("required");
      if (flatInput) flatInput.removeAttribute("required");
      if (deptSelect) deptSelect.removeAttribute("required");
    }
  }

  function validate() {
    var cityOk = !!(citySelect && citySelect.value);
    var phoneOk = isFullUaPhone(phoneInput);
    var type = getType();
    var addrOk = true;
    var deptOk = true;
    var buildingOk = true;
    var flatOk = true;

    if (type === "courier") {
      addrOk = !!(addrSelect && addrSelect.value);
      buildingOk = !!(buildingInput && buildingInput.value.trim());
      flatOk = !!(flatInput && flatInput.value.trim());
      deptOk = true;
    } else if (type === "pickup") {
      deptOk = !!(deptSelect && deptSelect.value);
      addrOk = true;
      buildingOk = true;
      flatOk = true;
    }

    citySelect && setFieldState(citySelect, cityOk ? true : null);
    setFieldState(phoneInput, phoneOk ? true : null);

    if (type === "courier") {
      addrSelect && setFieldState(addrSelect, addrOk ? true : null);
      buildingInput && setFieldState(buildingInput, buildingOk ? true : null);
      flatInput && setFieldState(flatInput, flatOk ? true : null);
      deptSelect && deptSelect.classList.remove("error", "is-validated");
    } else if (type === "pickup") {
      deptSelect && setFieldState(deptSelect, deptOk ? true : null);
      addrSelect && addrSelect.classList.remove("error", "is-validated");
      buildingInput &&
        buildingInput.classList.remove("error", "is-validated");
      flatInput && flatInput.classList.remove("error", "is-validated");
    }

    var allOk =
      cityOk && phoneOk && type && addrOk && deptOk && buildingOk && flatOk;
    
    console.log("[DeliveryForm] Validation:", {
      cityOk: cityOk,
      phoneOk: phoneOk,
      type: type,
      addrOk: addrOk,
      deptOk: deptOk,
      buildingOk: buildingOk,
      flatOk: flatOk,
      allOk: allOk
    });
    
    disableButton(nextBtn, !allOk);
  }

  window.deliveryFormValidate = validate;

  if (citySelect) {
    citySelect.addEventListener("change", validate);
    citySelect.addEventListener("input", validate);
  }
  if (phoneInput) {
    phoneInput.addEventListener("input", validate);
    phoneInput.addEventListener("change", validate);
  }
  radios.forEach(function (r) {
    r.addEventListener("change", function() {
      updateRequiredFields();
      validate();
    });
  });
  
  updateRequiredFields();
  if (addrSelect) {
    addrSelect.addEventListener("change", validate);
    addrSelect.addEventListener("input", validate);
  }
  if (deptSelect) {
    deptSelect.addEventListener("change", validate);
    deptSelect.addEventListener("input", validate);
  }
  if (buildingInput) buildingInput.addEventListener("input", validate);
  if (flatInput) flatInput.addEventListener("input", validate);

  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.preventDefault();
      validate();
      if (nextBtn.disabled) return;
      var deliveryDialog = deliveryStep.closest(".modal__dialog");
      var paymentStep = qs('[data-step="plastic-oplata"]', deliveryDialog) || qs(".modal-step-esim.is--payment", deliveryDialog) || qs(".modal-step-esim.is--1", deliveryDialog);
      if (deliveryStep && paymentStep) {
        updatePaymentStepData(deliveryStep, paymentStep);
        deliveryStep.style.display = "none";
        deliveryStep.classList.remove("is-active");
        paymentStep.style.display = "";
        paymentStep.classList.add("is-active");
      }
    });
  }
  validate();
}

function updatePaymentStepData(deliveryStep, paymentStep) {
  var form = deliveryStep.closest("form");
  if (!form) return;
  
  var citySelect = qs("#City", deliveryStep);
  var addrSelect = qs("#Address", deliveryStep);
  var deptSelect = qs("#Department", deliveryStep);
  var deliveryTypeRadios = qsa('input[name="Delivery-Type"]', deliveryStep);
  var buildingInput = qs("#Building", deliveryStep);
  var flatInput = qs("#Flat", deliveryStep);
  
  var cityValue = "";
  if (citySelect && citySelect.value) {
    var cityDisplay = qs('[data-np-display="City"]', deliveryStep);
    if (cityDisplay && cityDisplay.value) {
      cityValue = cityDisplay.value.trim();
    } else {
      var cityOption = citySelect.querySelector('option[value="' + citySelect.value + '"]');
      if (cityOption) {
        cityValue = cityOption.textContent.trim();
      }
    }
  }
  
  var addressValue = "";
  if (addrSelect && addrSelect.value) {
    var addrDisplay = qs('[data-np-display="Address"]', deliveryStep);
    if (addrDisplay && addrDisplay.value) {
      addressValue = addrDisplay.value.trim();
    } else {
      var addrOption = addrSelect.querySelector('option[value="' + addrSelect.value + '"]');
      if (addrOption) {
        addressValue = addrOption.textContent.trim();
      }
    }
    if (buildingInput && buildingInput.value.trim()) {
      addressValue += ", " + buildingInput.value.trim();
    }
    if (flatInput && flatInput.value.trim()) {
      addressValue += ", кв. " + flatInput.value.trim();
    }
  }
  
  var departmentValue = "";
  if (deptSelect && deptSelect.value) {
    var deptDisplay = qs('[data-np-display="Department"]', deliveryStep);
    if (deptDisplay && deptDisplay.value) {
      departmentValue = deptDisplay.value.trim();
    } else {
      var deptOption = deptSelect.querySelector('option[value="' + deptSelect.value + '"]');
      if (deptOption) {
        departmentValue = deptOption.textContent.trim();
      }
    }
  }
  
  var deliveryTypeValue = "";
  var checkedDeliveryType = Array.prototype.find.call(deliveryTypeRadios, function(r) { return r.checked; });
  if (checkedDeliveryType) {
    if (checkedDeliveryType.value === "courier") {
      deliveryTypeValue = "Кур'єр на вашу адресу";
    } else if (checkedDeliveryType.value === "pickup") {
      deliveryTypeValue = "Самовивіз з Нової Пошти або Поштомату";
    }
  }
  
  var paymentRows = qsa(".modal-esim_table-row", paymentStep);
  paymentRows.forEach(function(row) {
    var label = qs(".modal-esim_table-label", row);
    if (!label) return;
    
    var labelText = label.textContent.trim();
    var items = qsa(".modal-esim_table-item", row);
    if (items.length < 2) return;
    
    var valueCell = items[1];
    var valueDiv = qs("div", valueCell);
    
    if (labelText.indexOf("Місто") === 0 || labelText.indexOf("Город") === 0) {
      if (valueDiv) valueDiv.textContent = cityValue || "";
    } else if (labelText.indexOf("Доставка") === 0 || labelText.indexOf("Способ доставки") === 0) {
      if (valueDiv) valueDiv.textContent = deliveryTypeValue || "";
    } else if (labelText.indexOf("Адреса") === 0 || labelText.indexOf("Адрес") === 0) {
      if (checkedDeliveryType && checkedDeliveryType.value === "pickup") {
        row.style.display = "none";
      } else {
        row.style.display = "";
        if (valueDiv) valueDiv.textContent = addressValue || "";
      }
    } else if (labelText.indexOf("Номер відділення") === 0 || labelText.indexOf("Отделение") === 0) {
      if (checkedDeliveryType && checkedDeliveryType.value === "courier") {
        row.style.display = "none";
      } else {
        row.style.display = "";
        if (valueDiv) valueDiv.textContent = departmentValue || "";
      }
    } else if (labelText.indexOf("Загальна вартість") === 0 || labelText.indexOf("Общая стоимость") === 0) {
      var priceDiv = qs(".modal-esim_price", valueCell) || valueDiv;
      if (priceDiv) {
        var priceText = priceDiv.textContent.trim();
        if (priceText && !priceText.endsWith("₴") && !priceText.endsWith("грн")) {
          priceDiv.textContent = priceText + " ₴";
        }
      }
    }
  });
}

function saveOrderData(formData) {
  try {
    var orderData = {
      timestamp: new Date().toISOString(),
      firstName: formData.get("first-name") || "",
      lastName: formData.get("last-name") || "",
      email: formData.get("email") || "",
      plan: formData.get("plan") || "",
      price: formData.get("price") || "",
      simType: formData.get("sim_type") || "",
      city: formData.get("City") || "",
      deliveryPhone: formData.get("delivery-phone") || "",
      deliveryType: formData.get("Delivery-Type") || "",
      address: formData.get("Address") || "",
      building: formData.get("Building") || "",
      flat: formData.get("Flat") || "",
      department: formData.get("Department") || ""
    };
    
    var savedOrders = JSON.parse(localStorage.getItem("utm_orders") || "[]");
    savedOrders.push(orderData);
    localStorage.setItem("utm_orders", JSON.stringify(savedOrders));
    
    console.log("[UTM] Order data saved:", orderData);
    return orderData;
  } catch (e) {
    console.error("[UTM] Error saving order data:", e);
    return null;
  }
}

function processCity24Payment(orderData, callback) {
  console.log("[City24] Processing payment for order:", orderData);
  
  setTimeout(function() {
    var paymentResult = {
      success: true,
      orderId: "CITY24-" + Date.now(),
      transactionId: "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      amount: orderData.price || "299",
      currency: "UAH",
      status: "completed",
      timestamp: new Date().toISOString()
    };
    
    console.log("[City24] Payment processed:", paymentResult);
    
    if (callback) {
      callback(paymentResult);
    }
  }, 2000);
}

function initPlasticPayment() {
  var plasticDialog = document.getElementById("modal-plastic");
  if (!plasticDialog) return;
  
  var paymentStep = qs('[data-step="plastic-oplata"]', plasticDialog) || qs(".modal-step-esim.is--1", plasticDialog);
  if (!paymentStep) return;
  
  var paymentBtn = qs(".button.is-validation", paymentStep);
  if (!paymentBtn) return;
  
  var form = plasticDialog.querySelector("form");
  if (!form) return;
  
  paymentBtn.addEventListener("click", function(e) {
    e.preventDefault();
    
    if (paymentBtn.disabled) return;
    
    var formData = new FormData(form);
    var orderData = saveOrderData(formData);
    
    if (!orderData) {
      console.error("[UTM] Failed to save order data");
      return;
    }
    
    disableButton(paymentBtn, true);
    var btnContent = paymentBtn.querySelector("div");
    if (btnContent) {
      btnContent.textContent = "Обробка оплати...";
    }
    
    processCity24Payment(orderData, function(paymentResult) {
      if (paymentResult && paymentResult.success) {
        var successStep = qs(".modal-success", plasticDialog);
        if (successStep) {
          paymentStep.style.display = "none";
          paymentStep.classList.remove("is-active");
          successStep.style.display = "";
          successStep.classList.add("is-active");
          
          setTimeout(function() {
            var link = successStep.querySelector(".modal-relink-text a");
            if (link) {
              var redirectUrl = "https://city24.ua/payment/success?orderId=" + paymentResult.orderId;
              link.href = redirectUrl;
            }
          }, 0);
        }
      } else {
        var errorStep = qs(".modal-error-esim", plasticDialog);
        if (errorStep) {
          paymentStep.style.display = "none";
          paymentStep.classList.remove("is-active");
          errorStep.style.display = "";
          errorStep.classList.add("is-active");
        }
        disableButton(paymentBtn, false);
        if (btnContent) {
          btnContent.textContent = "Оплатити";
        }
      }
    });
  });
}

function initGlobalPhoneMasks() {
  bindPhoneMask(document.getElementById("phone"));
  bindPhoneMask(document.getElementById("delivery-phone"));
}

// Проверяем, загружен ли DOM
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initAll);
} else {
// DOM уже загружен
initAll();
}

function initAll() {
console.log("[UTM] DOMContentLoaded: initializing all modules...");
try {
  initGlobalPhoneMasks();
  initPlanSelection();
  initTopUpModal();
  initEsimOrderModal();
  initNovaPostSelects();
  initDeliveryTypeToggle();
  initDeliveryFormValidation();
  initPlasticPayment();
  console.log("[UTM] DOMContentLoaded: all modules initialized");
} catch (e) {
  console.error("[UTM] Error during initialization:", e);
}
}

// Также пробуем инициализировать при полной загрузке страницы
window.addEventListener("load", function() {
console.log("[UTM] Window loaded, checking NovaPoshta selects...");
var citySelect = document.getElementById("City");
if (citySelect) {
  console.log("[UTM] City select found on window load, re-initializing NovaPoshta");
  initNovaPostSelects();
}
});
})();














(function initSwipers() {
if (typeof window.Swiper === "undefined") {
  console.warn("[Swiper] Not found on page.");
  return;
}

var SLIDERS = [
  {
    key: "plan",
    container: '[data-swiper="planSlider"]',
    pagination: '[data-slider="planPagination"]',
    options: {
      pagination: { el: '[data-slider="planPagination"]', clickable: true },
      breakpoints: {
        991: { slidesPerView: 1.8, spaceBetween: 24 },
        768: { slidesPerView: 1.4, spaceBetween: 20 },
        468: { slidesPerView: 1, spaceBetween: 16 },
        0:   { slidesPerView: 1, spaceBetween: 12, initialSlide: 1 },
      },
    },
  },
  {
    key: "planModal",
    container: '[data-swiper="planSliderModal"]',
    pagination: '[data-slider="planPaginationModal"]',
    options: {
      pagination: { el: '[data-slider="planPaginationModal"]', clickable: true },
      breakpoints: {
        991: { slidesPerView: 1.8, spaceBetween: 24 },
        768: { slidesPerView: 1.4, spaceBetween: 20 },
        468: { slidesPerView: 1, spaceBetween: 16 },
        0:   { slidesPerView: 1, spaceBetween: 12, initialSlide: 1 },
      },
    },
    desktopOnly: true,
    minSlides: 3,
  },
  {
    key: "about",
    container: '[data-swiper="aboutSlider"]',
    pagination: '[data-slider="aboutPagination"]',
    options: {
      pagination: { el: '[data-slider="aboutPagination"]', clickable: true },
      spaceBetween: 32,
      breakpoints: {
        991: { slidesPerView: 2.2, spaceBetween: 32 },
        768: { slidesPerView: 1.8, spaceBetween: 28 },
        468: { slidesPerView: 1.2, spaceBetween: 24 },
        0:   { slidesPerView: 1.1, spaceBetween: 20 },
      },
    },
  },
];

var instances = new Map();
var mql = window.matchMedia("(max-width: 991px)");

function createIfNeeded(cfg) {
  if (instances.has(cfg.key)) return;
  var el = document.querySelector(cfg.container);
  if (!el) return;

  if (cfg.desktopOnly && mql.matches) {
    return;
  }

  if (cfg.minSlides) {
    var slides = el.querySelectorAll(".swiper-slide");
    if (!slides || slides.length < cfg.minSlides) {
      return;
    }
  }

  if (cfg.pagination && !document.querySelector(cfg.pagination)) {
    console.warn("[Swiper] Pagination element not found for " + cfg.key + ".");
  }
  var instance = new Swiper(el, cfg.options || {});
  instances.set(cfg.key, instance);
}

function destroyIfExists(cfg) {
  var inst = instances.get(cfg.key);
  if (inst && typeof inst.destroy === "function") {
    inst.destroy(true, true);
  }
  instances.delete(cfg.key);
}

function enableMobile() { 
  SLIDERS.forEach(function(cfg) {
    if (!cfg.desktopOnly) {
      createIfNeeded(cfg);
    } else {
      destroyIfExists(cfg);
    }
  });
}
function disableDesktop() { 
  SLIDERS.forEach(function(cfg) {
    if (!cfg.desktopOnly) {
      destroyIfExists(cfg);
    } else {
      createIfNeeded(cfg);
    }
  });
}
function applyByViewport() { if (mql.matches) enableMobile(); else disableDesktop(); }

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyByViewport, { once: true });
} else {
  applyByViewport();
}

if (typeof mql.addEventListener === "function") {
  mql.addEventListener("change", applyByViewport);
} else if (typeof mql.addListener === "function") {
  mql.addListener(applyByViewport);
}
})();

// jQuery-dependent modal step toggles
(function initModalToggles() {
if (!window.jQuery) { 
  console.warn("[jQuery] Not found on page."); 
  return; 
}
var $ = window.jQuery;

$(document).on('click', '#modalClientButton', function () {
  $('.modal-step.is--1').fadeOut(200, function () {
    $('.modal-step.is--2').fadeIn(200);
  });
});

$(document).on('click', '.modal-form-button', function () {
  $('.modal-step.is--2').fadeOut(200, function () {
    $('.modal-step.is--1').fadeIn(200);
  });
});
})();

console.log("[UTM] Script loaded and executed");