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

async function saveOptions() {
  const policy = document.getElementById("policy").value;
  try {
    await setPolicyValue(policy);
    await applyPrivacyPolicy(policy);
  } catch (error) {
    console.error("Failed to save WebRTC policy", error);
  }
}

async function restoreOptions() {
  try {
    const storedPolicy = await getPolicy();
    document.getElementById("policy").value = storedPolicy;
  } catch (error) {
    console.error("Failed to restore WebRTC policy", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();
  displayContent();
  restoreOptions();

  document.getElementById("policy").addEventListener("change", saveOptions);

  const testLeakButton = document.getElementById("test-leak-btn");
  if (testLeakButton) {
    testLeakButton.addEventListener("click", () => {
      window.open("https://www.browserscan.net/webrtc", "_blank", "noopener,noreferrer");
    });
  }
});
