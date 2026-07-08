// Keep track of active tabs with content scripts
let activeTabsWithContentScript = new Set();
let ongoingProcesses = { contacts: new Map(), conversations: new Map() };

function getFiverrTab(callback) {
  chrome.tabs.query({ url: "https://www.fiverr.com/*" }, (tabs) => {
    callback(tabs[0] || null);
  });
}

chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(err => console.error('Failed to open side panel:', err));
  }
});

if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('fiverr.com')) {
    chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] })
      .then(() => activeTabsWithContentScript.add(tabId))
      .catch(err => console.error('Failed to inject content script:', err));
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabsWithContentScript.delete(tabId);
  ongoingProcesses.contacts.delete(tabId);
  ongoingProcesses.conversations.delete(tabId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const tabId = sender.tab ? sender.tab.id : (request.tabId || null);

  if (request.type === 'INIT_POPUP') {
    getFiverrTab(async (tab) => {
      if (tab) {
        try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }); }
        catch (error) { console.error('Failed to inject content script:', error); }
      }
    });
  }
  else if (request.type === 'CONTACTS_PROGRESS' || request.type === 'EXTRACTION_PROGRESS' || request.type === 'ORDERS_PROGRESS' || request.type === 'EARNINGS_PROGRESS' || request.type === 'REVIEWS_PROGRESS' || request.type === 'NOTIFICATIONS_PROGRESS') {
    if (tabId) {
      const pt = request.type.includes('CONTACTS') ? 'contacts' : 'conversations';
      ongoingProcesses[pt].set(tabId, { status: 'running', progress: request.message, timestamp: Date.now() });
    }
  }
  else if (request.type === 'CONTACTS_FETCHED' || request.type === 'CONVERSATION_EXTRACTED' || request.type === 'ORDERS_FETCHED' || request.type === 'EARNINGS_FETCHED' || request.type === 'REVIEWS_FETCHED' || request.type === 'NOTIFICATIONS_FETCHED' || request.type === 'ALL_DATA_FETCHED') {
    if (tabId) {
      const pt = request.type === 'CONTACTS_FETCHED' ? 'contacts' : 'conversations';
      ongoingProcesses[pt].set(tabId, { status: 'completed', message: request.message, timestamp: Date.now() });
    }
  }
  else if (request.type === 'EXTRACTION_ERROR' || request.type === 'ORDERS_ERROR' || request.type === 'EARNINGS_ERROR' || request.type === 'REVIEWS_ERROR' || request.type === 'NOTIFICATIONS_ERROR') {
    if (tabId) ongoingProcesses.conversations.set(tabId, { status: 'error', error: request.error, timestamp: Date.now() });
  }
  else if (request.type === 'GET_PROCESS_STATUS') {
    if (tabId) {
      sendResponse({ contacts: ongoingProcesses.contacts.get(tabId), conversations: ongoingProcesses.conversations.get(tabId) });
      return true;
    }
  }
  // Forward ALL data-fetching requests to the Fiverr tab
  else if (['EXTRACT_CONVERSATION', 'FETCH_ALL_CONTACTS', 'FETCH_ORDERS', 'FETCH_EARNINGS', 'FETCH_REVIEWS', 'FETCH_NOTIFICATIONS', 'FETCH_ALL_DATA'].includes(request.type)) {
    getFiverrTab((tab) => {
      if (tab) {
        const pt = request.type === 'FETCH_ALL_CONTACTS' ? 'contacts' : 'conversations';
        ongoingProcesses[pt].set(tab.id, { status: 'starting', timestamp: Date.now() });
        chrome.tabs.sendMessage(tab.id, { ...request, tabId: tab.id });
      }
    });
  }
});
