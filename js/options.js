function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    const mappings = element.dataset.i18nAttr.split(",").map((pair) => pair.split(":").map((item) => item.trim()));
    mappings.forEach(([attr, key]) => {
      const message = chrome.i18n.getMessage(key);
      if (attr && message) {
        element.setAttribute(attr, message);
      }
    });
  });
}

/* Check if extension is allowed in Incognito mode */
function incognitoAllowedCheck() {
  chrome.extension.isAllowedIncognitoAccess((state) => {
    const incognitoAllowed = document.getElementById('incognitoAllowed');
    const incognitoDisallowed = document.getElementById('incognitoDisallowed');

    if (state) {
      incognitoDisallowed.style.display = 'none';
    } else {
      incognitoAllowed.style.display = 'none';
    }
  });
}

/* Show main content and check incognito status */
function displayContent() {
  document.getElementById('content').style.display = 'block';
  incognitoAllowedCheck();
}

/* Save option and apply WebRTC policy */
function saveOptions() {
  const policy = document.getElementById('policy').value;

  chrome.storage.local.set({ rtcIPHandling: policy }, () => {
    chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: policy });
  });
}

/* Load stored option into UI */
function restoreOptions() {
  chrome.storage.local.get({ rtcIPHandling: 'default_public_interface_only' }, (items) => {
    document.getElementById('policy').value = items.rtcIPHandling;
  });
}

/* Event listeners */
document.addEventListener('DOMContentLoaded', () => {
  applyI18n();
  displayContent();
  restoreOptions();

  document.getElementById('policy').addEventListener('change', saveOptions);

  const testLeakButton = document.getElementById('test-leak-btn');
  if (testLeakButton) {
    testLeakButton.addEventListener('click', () => {
      window.open('https://www.browserscan.net/webrtc', '_blank', 'noopener,noreferrer');
    });
  }
});
