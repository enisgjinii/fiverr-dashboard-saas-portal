document.getElementById('openSidePanel').addEventListener('click', async () => {
  try {
    // Try to open side panel
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    } else {
      // Fallback to full page
      chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
      window.close();
    }
  } catch (err) {
    console.error('Failed to open side panel:', err);
    // Fallback to full page
    chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
    window.close();
  }
});

document.getElementById('openFullPage').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
  window.close();
});
