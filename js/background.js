const DEFAULT_POLICY = "default_public_interface_only";

function getStoredPolicy() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["rtcIPHandling"], (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(items.rtcIPHandling);
    });
  });
}

function savePolicy(policy) {
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

function applyPolicy(policy) {
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

async function ensurePolicyApplied() {
  try {
    const storedPolicy = await getStoredPolicy();
    const policyToUse = storedPolicy ?? DEFAULT_POLICY;

    if (storedPolicy === undefined) {
      await savePolicy(policyToUse);
    }

    await applyPolicy(policyToUse);
  } catch (error) {
    console.error("Failed to apply WebRTC policy", error);
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }

  ensurePolicyApplied();
});

chrome.runtime.onStartup.addListener(() => {
  ensurePolicyApplied();
});
