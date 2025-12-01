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
  var maskCount = 9 - filled.length;
  var mask = "x".repeat(maskCount);
  return {
    visual: "+380 " + filled + mask,
    fullDigits: digits,
  };
}

function bindPhoneMask(input) {
  if (!input) return;
  var initial = formatUaPhoneVisual(input.value || "380");
  input.dataset.phoneDigits = initial.fullDigits;
  input.value = initial.visual;

  function syncFromValue() {
    var fmt = formatUaPhoneVisual(input.value);
    input.dataset.phoneDigits = fmt.fullDigits;
    input.value = fmt.visual;
    if (isValidUaPhoneDigits(fmt.fullDigits)) {
      input.classList.add("is-validated");
      input.classList.remove("error");
    } else {
      input.classList.remove("is-validated");
    }
  }

  input.addEventListener("focus", function () {
    if (!input.dataset.phoneDigits) {
      var f = formatUaPhoneVisual("380");
      input.dataset.phoneDigits = f.fullDigits;
      input.value = f.visual;
    }
  });

  input.addEventListener("input", syncFromValue);
  input.addEventListener("change", syncFromValue);
  input.addEventListener("blur", syncFromValue);
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
    // нормализация значений
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
    
    items.forEach(function (item) {
      var opt = document.createElement("option");
      opt.value = item.id || item.Ref || item.ref;
      opt.textContent = item.name || item.Description || item.description;
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
    
    items.forEach(function (item) {
      var opt = document.createElement("option");
      opt.value = item.id || item.Ref || item.ref;
      opt.textContent = item.name || item.Description || item.description;
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
    
    items.forEach(function (item) {
      var opt = document.createElement("option");
      opt.value = item.id || item.Ref || item.ref;
      opt.textContent = item.name || item.Description || item.description;
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

function initNovaPostSelects() {
  console.log("[NovaPoshta] initNovaPostSelects: initializing...");
  var citySelect = document.getElementById("City");
  var addrSelect = document.getElementById("Address");
  var deptSelect = document.getElementById("Department");

  console.log("[NovaPoshta] initNovaPostSelects: citySelect found:", !!citySelect, "addrSelect:", !!addrSelect, "deptSelect:", !!deptSelect);

  if (citySelect) {
    // Проверяем, нужно ли загружать города
    // Если в селекте только placeholder или очень мало опций (< 10), значит нужно загрузить
    var currentOptionsCount = citySelect.options.length;
    var hasOnlyPlaceholder = currentOptionsCount <= 1 || (currentOptionsCount === 2 && !citySelect.options[1].value);
    
    console.log("[NovaPoshta] initNovaPostSelects: current options count:", currentOptionsCount, "hasOnlyPlaceholder:", hasOnlyPlaceholder);
    
    // Загружаем города, если их нет или очень мало (меньше 10)
    if (hasOnlyPlaceholder || currentOptionsCount < 10) {
      console.log("[NovaPoshta] initNovaPostSelects: triggering city load (options count:", currentOptionsCount, ")");
      // Не устанавливаем data-loaded, чтобы можно было перезагрузить при необходимости
      npLoadAllCities();
    } else {
      console.log("[NovaPoshta] initNovaPostSelects: cities already loaded (", currentOptionsCount, "options), skipping");
    }

    // Убираем старые обработчики и добавляем новые
    citySelect.removeEventListener("focus", citySelect._npFocusHandler);
    citySelect._npFocusHandler = function () {
      console.log("[NovaPoshta] initNovaPostSelects: citySelect focused");
      if (citySelect.dataset.loading !== "1" && (citySelect.options.length <= 1 || citySelect.options.length < 10)) {
        console.log("[NovaPoshta] initNovaPostSelects: triggering city load on focus");
        npLoadAllCities();
      }
    };
    citySelect.addEventListener("focus", citySelect._npFocusHandler);

    citySelect.addEventListener("change", function () {
      npState.cityId = citySelect.value || null;
      if (addrSelect) {
        addrSelect.dataset.loaded = "";
        addrSelect.innerHTML = '<option value="">Введіть адресу</option>';
      }
      if (deptSelect) {
        deptSelect.dataset.loaded = "";
        deptSelect.innerHTML =
          '<option value="">Введіть Номер відділення чи поштомату</option>';
      }
    });
  }

  if (addrSelect) {
    function ensureStreetsLoaded() {
      if (!npState.cityId) return;
      if (!addrSelect.dataset.loaded) {
        addrSelect.dataset.loaded = "1";
        npLoadAllStreets();
      }
    }
    addrSelect.addEventListener("focus", ensureStreetsLoaded);
    addrSelect.addEventListener("click", ensureStreetsLoaded);
  }

  if (deptSelect) {
    function ensureBranchesLoaded() {
      if (!npState.cityId) return;
      if (!deptSelect.dataset.loaded) {
        deptSelect.dataset.loaded = "1";
        npLoadAllBranches();
      }
    }
    deptSelect.addEventListener("focus", ensureBranchesLoaded);
    deptSelect.addEventListener("click", ensureBranchesLoaded);
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
    } else if (type) {
      deptOk = !!(deptSelect && deptSelect.value);
    }

    citySelect && setFieldState(citySelect, cityOk ? true : null);
    setFieldState(phoneInput, phoneOk ? true : null);

    if (type === "courier") {
      addrSelect && setFieldState(addrSelect, addrOk ? true : null);
      buildingInput && setFieldState(buildingInput, buildingOk ? true : null);
      flatInput && setFieldState(flatInput, flatOk ? true : null);
      deptSelect && deptSelect.classList.remove("error", "is-validated");
    } else if (type) {
      deptSelect && setFieldState(deptSelect, deptOk ? true : null);
      addrSelect && addrSelect.classList.remove("error", "is-validated");
      buildingInput &&
        buildingInput.classList.remove("error", "is-validated");
      flatInput && flatInput.classList.remove("error", "is-validated");
    }

    var allOk =
      cityOk && phoneOk && type && addrOk && deptOk && buildingOk && flatOk;
    disableButton(nextBtn, !allOk);
  }

  if (citySelect) citySelect.addEventListener("change", validate);
  if (phoneInput) {
    phoneInput.addEventListener("input", validate);
    phoneInput.addEventListener("change", validate);
  }
  radios.forEach(function (r) {
    r.addEventListener("change", validate);
  });
  if (addrSelect) addrSelect.addEventListener("change", validate);
  if (deptSelect) deptSelect.addEventListener("change", validate);
  if (buildingInput) buildingInput.addEventListener("input", validate);
  if (flatInput) flatInput.addEventListener("input", validate);

  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.preventDefault();
      validate();
      if (nextBtn.disabled) return;
      var deliveryDialog = deliveryStep.closest(".modal__dialog");
      var paymentStep = qs(".modal-step-esim.is--payment", deliveryDialog);
      if (deliveryStep && paymentStep) {
        deliveryStep.style.display = "none";
        deliveryStep.classList.remove("is-active");
        paymentStep.style.display = "";
        paymentStep.classList.add("is-active");
      }
    });
  }
  validate();
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