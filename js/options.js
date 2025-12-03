const DEFAULT_POLICY = "default_public_interface_only";

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    const mappings = element.dataset.i18nAttr
      .split(",")
      .map((pair) => pair.split(":").map((item) => item.trim()));
    mappings.forEach(([attr, key]) => {
      const message = chrome.i18n.getMessage(key);
      if (attr && message) {
        element.setAttribute(attr, message);
      }
    });
  });
}

function getPolicy() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ rtcIPHandling: DEFAULT_POLICY }, (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(items.rtcIPHandling);
    });
  });
}

function setPolicyValue(policy) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ rtcIPHandling: policy }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}

function applyPrivacyPolicy(policy) {
  return new Promise((resolve, reject) => {
    chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: policy }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}

async function incognitoAllowedCheck() {
  const getIncognitoAccess = () => new Promise((resolve, reject) => {
    const checkFn = (chrome.runtime && chrome.runtime.isAllowedIncognitoAccess)
      ? chrome.runtime.isAllowedIncognitoAccess
      : chrome.extension && chrome.extension.isAllowedIncognitoAccess;

    if (!checkFn) {
      resolve(false);
      return;
    }

    checkFn((state) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(state);
    });
  });

  try {
    const allowed = await getIncognitoAccess();

    const incognitoAllowed = document.getElementById("incognitoAllowed");
    const incognitoDisallowed = document.getElementById("incognitoDisallowed");

    if (allowed) {
      incognitoDisallowed.style.display = "none";
    } else {
      incognitoAllowed.style.display = "none";
    }
  } catch (error) {
    console.error("Failed to determine incognito access", error);
  }
}

function displayContent() {
  document.getElementById("content").style.display = "block";
  incognitoAllowedCheck();
}

function initDropdown() {
  const dropdown = document.getElementById("policyDropdown");
  if (!dropdown) return;

  const toggle = dropdown.querySelector(".dropdown-toggle");
  const label = dropdown.querySelector(".dropdown-label");
  const menu = dropdown.querySelector(".dropdown-menu");
  const options = Array.from(dropdown.querySelectorAll(".dropdown-option"));

  const setSelection = (value) => {
    options.forEach((opt) => {
      const isActive = opt.dataset.value === value;
      opt.classList.toggle("active", isActive);
      if (isActive && label) {
        label.textContent = opt.textContent.trim();
        toggle.dataset.value = value;
      }
    });
  };

  toggle.addEventListener("click", () => {
    const isOpen = dropdown.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  toggle.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const isOpen = dropdown.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    } else if (event.key === "Escape") {
      dropdown.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  options.forEach((opt) => {
    opt.addEventListener("click", () => {
      setSelection(opt.dataset.value);
      dropdown.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      saveOptions();
    });
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  return { setSelection, getSelected: () => toggle.dataset.value || DEFAULT_POLICY };
}

async function saveOptions() {
  const dropdown = document.getElementById("policyDropdown");
  const selected = dropdown?.querySelector(".dropdown-toggle")?.dataset.value || DEFAULT_POLICY;
  const policy = selected;
  try {
    await setPolicyValue(policy);
    await applyPrivacyPolicy(policy);
  } catch (error) {
    console.error("Failed to save WebRTC policy", error);
  }
}

async function restoreOptions() {
  const dropdownControl = initDropdown();
  try {
    const storedPolicy = await getPolicy();
    dropdownControl?.setSelection(storedPolicy);
  } catch (error) {
    console.error("Failed to restore WebRTC policy", error);
    dropdownControl?.setSelection(DEFAULT_POLICY);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();
  displayContent();
  restoreOptions();

  const testLeakButton = document.getElementById("test-leak-btn");
  if (testLeakButton) {
    testLeakButton.addEventListener("click", () => {
      window.open("https://www.browserscan.net/webrtc", "_blank", "noopener,noreferrer");
    });
  }
});
