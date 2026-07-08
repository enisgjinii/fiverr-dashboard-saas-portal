// ============ HELPER FUNCTIONS ============
function extractUsername(url) {
  const match = url.match(/^https:\/\/www\.fiverr\.com\/inbox\/([^\/\?]+)$/);
  return match ? match[1] : null;
}

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return 'size unknown';
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return response.json();
}

async function fetchHTML(url) {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return response.text();
}

function parsePerseusProps(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const el = doc.getElementById('perseus-initial-props');
  if (el && el.textContent) {
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }
  return null;
}

function parseInitialState(html) {
  const match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{.+?\});/s);
  if (match) { try { return JSON.parse(match[1]); } catch (e) { return null; } }
  return null;
}

function convertToMarkdown(data) {
  let otherUsername = '';
  if (data.messages && data.messages.length > 0) {
    const firstMessage = data.messages[0];
    if (firstMessage.sender === data.username) otherUsername = firstMessage.recipient;
    else otherUsername = firstMessage.sender;
  }
  let markdown = `# Conversation with ${otherUsername}\n\n`;
  data.messages.forEach(message => {
    const timestamp = new Date(parseInt(message.createdAt)).toLocaleString();
    const sender = message.sender || 'Unknown';
    markdown += `### ${sender} (${timestamp})\n`;
    if (message.repliedToMessage) {
      const repliedMsg = message.repliedToMessage;
      const repliedTime = new Date(parseInt(repliedMsg.createdAt)).toLocaleString();
      markdown += `> Replying to ${repliedMsg.sender} (${repliedTime}):\n> ${repliedMsg.body.replace(/\n/g, '\n> ')}\n\n`;
    }
    if (message.body) markdown += `${message.body}\n`;
    if (message.attachments && message.attachments.length > 0) {
      markdown += '\n**Attachments:**\n';
      message.attachments.forEach(attachment => {
        if (attachment && typeof attachment === 'object') {
          const fileName = attachment.file_name || attachment.filename || 'Unnamed File';
          const fileSize = attachment.file_size || attachment.fileSize || 0;
          markdown += `- ${fileName} (${formatFileSize(fileSize)})\n`;
        } else markdown += `- File attachment (size unknown)\n`;
      });
    }
    markdown += '\n---\n\n';
  });
  return markdown;
}

// ============ FETCH CONTACTS ============
async function fetchAllContacts() {
  let allContacts = [];
  let oldestTimestamp = null;
  let batchNumber = 1;
  chrome.storage.local.set({ allContacts: [], lastContactsFetch: Date.now() });

  async function fetchContactsBatch(olderThan = null) {
    try {
      const url = olderThan ? `https://www.fiverr.com/inbox/contacts?older_than=${olderThan}` : 'https://www.fiverr.com/inbox/contacts';
      chrome.runtime.sendMessage({ type: 'CONTACTS_PROGRESS', message: `Fetching batch ${batchNumber}...` });
      const contacts = await fetchJSON(url);
      if (!contacts || contacts.length === 0) { chrome.runtime.sendMessage({ type: 'CONTACTS_PROGRESS', message: 'No more contacts found.' }); return null; }
      allContacts = [...allContacts, ...contacts];
      chrome.storage.local.set({ allContacts: allContacts, lastContactsFetch: Date.now() });
      const timestamps = contacts.map(c => c.recentMessageDate);
      oldestTimestamp = Math.min(...timestamps);
      chrome.runtime.sendMessage({ type: 'CONTACTS_PROGRESS', message: `Batch ${batchNumber}: ${contacts.length} contacts (Total: ${allContacts.length})`, totalContacts: allContacts.length });
      batchNumber++;
      return oldestTimestamp;
    } catch (error) {
      chrome.runtime.sendMessage({ type: 'CONTACTS_PROGRESS', message: `Error batch ${batchNumber}: ${error.message}`, isError: true });
      return null;
    }
  }

  let nextTimestamp = await fetchContactsBatch();
  while (nextTimestamp) { await new Promise(r => setTimeout(r, 50)); nextTimestamp = await fetchContactsBatch(nextTimestamp); }
  chrome.runtime.sendMessage({ type: 'CONTACTS_FETCHED', data: allContacts, message: `Completed! Total: ${allContacts.length}` });
  return allContacts;
}

// ============ FETCH CONVERSATION ============
async function fetchConversation(username) {
  try {
    let allMessages = [], lastPage = false, timestamp = null, batchNumber = 1, conversationId = null;
    while (!lastPage) {
      chrome.runtime.sendMessage({ type: 'EXTRACTION_PROGRESS', message: `Fetching batch ${batchNumber}...` });
      const url = timestamp ? `https://www.fiverr.com/inbox/contacts/${username}/conversation?timestamp=${timestamp}` : `https://www.fiverr.com/inbox/contacts/${username}/conversation`;
      const data = await fetchJSON(url);
      if (!conversationId) conversationId = data.conversationId;
      const processedMessages = data.messages.map(message => ({ ...message, attachments: message.attachments?.map(attachment => ({ filename: attachment.file_name, downloadUrl: attachment.download_url, fileSize: attachment.file_size, contentType: attachment.content_type })) || [] }));
      allMessages = [...allMessages, ...processedMessages];
      lastPage = data.lastPage;
      if (!lastPage && processedMessages.length > 0) timestamp = Math.min(...processedMessages.map(m => m.createdAt));
      batchNumber++;
      await new Promise(r => setTimeout(r, 100));
    }
    const processedData = { conversationId, messages: allMessages.sort((a, b) => a.createdAt - b.createdAt) };
    chrome.storage.local.set({ conversationData: processedData, markdownContent: convertToMarkdown(processedData), jsonContent: processedData });
    chrome.runtime.sendMessage({ type: 'CONVERSATION_EXTRACTED', data: processedData, message: `Conversation with ${username} extracted successfully!` });
  } catch (error) {
    chrome.runtime.sendMessage({ type: 'EXTRACTION_ERROR', error: error.message });
  }
}

// ============ FETCH ORDERS ============
async function fetchOrders() {
  try {
    chrome.runtime.sendMessage({ type: 'ORDERS_PROGRESS', message: 'Fetching all orders since joining...' });
    let allOrderTxns = [];
    let hasNextPage = true;
    let cursor = null;
    let pageNumber = 1;
    let totalCount = 0;
    const seenIds = new Set();
    while (hasNextPage) {
      try {
        let url = cursor
          ? `https://www.fiverr.com/perseus/financial-dashboard/api/earnings/transactions?after=${encodeURIComponent(cursor)}`
          : 'https://www.fiverr.com/perseus/financial-dashboard/api/earnings/transactions';
        const data = await fetchJSON(url);
        if (data?.data?.transactions && data.data.transactions.length > 0) {
          const orderTxns = data.data.transactions.filter(t => t.activity === 'EARNING' && t.order?.encryptedId && !seenIds.has(t.id));
          orderTxns.forEach(t => seenIds.add(t.id));
          allOrderTxns = [...allOrderTxns, ...orderTxns];
          totalCount = data.data.totalCount || totalCount;
          hasNextPage = data.data.pageInfo?.hasNextPage || false;
          cursor = data.data.pageInfo?.endCursor || null;
          pageNumber++;
          chrome.runtime.sendMessage({ type: 'ORDERS_PROGRESS', message: `Page ${pageNumber}: ${allOrderTxns.length} orders found...` });
          if (pageNumber > 100) break;
          if (data.data.transactions.filter(t => t.activity === 'EARNING').length === 0) hasNextPage = false;
          await new Promise(r => setTimeout(r, 300));
        } else {
          hasNextPage = false;
        }
      } catch (e) {
        hasNextPage = false;
      }
    }
    if (allOrderTxns.length === 0) {
      const urls = ['https://www.fiverr.com/selling/manage_orders', 'https://www.fiverr.com/selling/manage_orders?source=header_nav'];
      for (const url of urls) {
        try {
          const html = await fetchHTML(url);
          const props = parsePerseusProps(html);
          if (props) {
            if (props.orders && Object.keys(props.orders).length > 0) { allOrderTxns = props.orders; break; }
            if (props.manageOrders && Object.keys(props.manageOrders).length > 0) { allOrderTxns = props.manageOrders; break; }
          }
        } catch (e) {}
      }
    }
    if (allOrderTxns.length === 0) throw new Error('Could not fetch orders');
    const orders = { derivedFrom: 'earnings', transactions: allOrderTxns, pagesLoaded: pageNumber - 1 };
    chrome.storage.local.set({ ordersData: orders, lastOrdersFetch: Date.now() });
    const earliest = allOrderTxns.length > 0 ? new Date(allOrderTxns[allOrderTxns.length - 1].date).toLocaleDateString() : 'N/A';
    const latest = allOrderTxns.length > 0 ? new Date(allOrderTxns[0].date).toLocaleDateString() : 'N/A';
    chrome.runtime.sendMessage({ type: 'ORDERS_FETCHED', data: orders, message: `${allOrderTxns.length} orders (${earliest} to ${latest})` });
  } catch (error) {
    chrome.runtime.sendMessage({ type: 'ORDERS_ERROR', error: error.message });
  }
}

// ============ FETCH EARNINGS / REVENUE ============
async function fetchEarnings() {
  try {
    chrome.runtime.sendMessage({ type: 'EARNINGS_PROGRESS', message: 'Fetching all earnings since joining...' });
    let allTransactions = [];
    let hasNextPage = true;
    let cursor = null;
    let pageNumber = 1;
    let totalCount = 0;
    let countersPerActivity = [];
    const seenIds = new Set();
    while (hasNextPage) {
      try {
        let url;
        if (cursor) {
          url = `https://www.fiverr.com/perseus/financial-dashboard/api/earnings/transactions?after=${encodeURIComponent(cursor)}`;
        } else {
          url = 'https://www.fiverr.com/perseus/financial-dashboard/api/earnings/transactions';
        }
        const data = await fetchJSON(url);
        if (data?.data?.transactions && data.data.transactions.length > 0) {
          const newTxns = data.data.transactions.filter(t => !seenIds.has(t.id));
          newTxns.forEach(t => seenIds.add(t.id));
          allTransactions = [...allTransactions, ...newTxns];
          totalCount = data.data.totalCount || totalCount;
          countersPerActivity = data.data.countersPerActivity || countersPerActivity;
          hasNextPage = data.data.pageInfo?.hasNextPage || false;
          cursor = data.data.pageInfo?.endCursor || null;
          pageNumber++;
          chrome.runtime.sendMessage({ type: 'EARNINGS_PROGRESS', message: `Page ${pageNumber}: ${allTransactions.length} / ${totalCount} transactions...` });
          if (pageNumber > 100) break;
          if (newTxns.length === 0) hasNextPage = false;
          await new Promise(r => setTimeout(r, 300));
        } else {
          hasNextPage = false;
        }
      } catch (e) {
        hasNextPage = false;
      }
    }
    const earnings = { data: { totalCount, countersPerActivity, transactions: allTransactions, pagesLoaded: pageNumber - 1 } };
    if (allTransactions.length === 0) throw new Error('Could not fetch earnings');
    chrome.storage.local.set({ earningsData: earnings, lastEarningsFetch: Date.now() });
    const earliest = allTransactions.length > 0 ? new Date(allTransactions[allTransactions.length - 1].date).toLocaleDateString() : 'N/A';
    const latest = allTransactions.length > 0 ? new Date(allTransactions[0].date).toLocaleDateString() : 'N/A';
    chrome.runtime.sendMessage({ type: 'EARNINGS_FETCHED', data: earnings, message: `${allTransactions.length} transactions (${earliest} to ${latest})` });
  } catch (error) {
    chrome.runtime.sendMessage({ type: 'EARNINGS_ERROR', error: error.message });
  }
}

// ============ FETCH REVIEWS ============
async function fetchReviews() {
  try {
    chrome.runtime.sendMessage({ type: 'REVIEWS_PROGRESS', message: 'Fetching reviews...' });
    let reviews = null;
    let sellerUsername = null;
    const userEndpoints = [
      'https://www.fiverr.com/current_user.json',
      'https://www.fiverr.com/api/v1/users/me',
      'https://www.fiverr.com/users/me',
    ];
    for (const ep of userEndpoints) {
      try {
        const resp = await fetch(ep, { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          sellerUsername = data.username || data.user?.username || data.name || data.user?.name;
          if (sellerUsername && sellerUsername !== 'selling') break;
        }
      } catch (e) {}
    }
    if (!sellerUsername || sellerUsername === 'selling') {
      try {
        const inboxHtml = await fetchHTML('https://www.fiverr.com/inbox');
        const match = inboxHtml.match(/"username"\s*:\s*"([^"]+)"/);
        if (match && match[1] !== 'selling') sellerUsername = match[1];
      } catch (e) {}
    }
    if (!sellerUsername || sellerUsername === 'selling') {
      try {
        const meResp = await fetch('https://www.fiverr.com/inbox/contacts', { credentials: 'include', headers: { 'Accept': 'application/json' } });
        if (meResp.ok) {
          const contacts = await meResp.json();
          if (contacts && contacts.length > 0) {
            const selfContact = contacts.find(c => c.isSelf || c.type === 'self');
            if (selfContact) sellerUsername = selfContact.username;
          }
        }
      } catch (e) {}
    }
    if (!sellerUsername || sellerUsername === 'selling') throw new Error('Could not determine your username. Please set it in settings.');
    const urls = [
      `https://www.fiverr.com/${sellerUsername}`,
      `https://www.fiverr.com/${sellerUsername}/reviews`,
    ];
    for (const url of urls) {
      try {
        const html = await fetchHTML(url);
        const props = parsePerseusProps(html);
        if (props) {
          const seller = props.seller || props;
          if (seller.reviewsData && (seller.reviewsData.selling_reviews?.reviews?.length > 0 || seller.reviewsData.buying_reviews?.reviews?.length > 0)) {
            reviews = seller.reviewsData;
            break;
          }
          if (seller.reviews) { reviews = seller.reviews; break; }
        }
      } catch (e) { /* try next */ }
    }
    if (!reviews) throw new Error('Could not fetch reviews');
    chrome.storage.local.set({ reviewsData: reviews, lastReviewsFetch: Date.now() });
    chrome.runtime.sendMessage({ type: 'REVIEWS_FETCHED', data: reviews, message: 'Reviews fetched successfully!' });
  } catch (error) {
    chrome.runtime.sendMessage({ type: 'REVIEWS_ERROR', error: error.message });
  }
}

// ============ FETCH NOTIFICATIONS ============
async function fetchNotifications() {
  try {
    chrome.runtime.sendMessage({ type: 'NOTIFICATIONS_PROGRESS', message: 'Fetching notifications...' });
    let notifications = null;
    const urls = [
      'https://www.fiverr.com/selling',
      'https://www.fiverr.com/',
    ];
    for (const url of urls) {
      try {
        const html = await fetchHTML(url);
        const props = parsePerseusProps(html);
        if (props && (props.notifications || props.unreadNotifications)) {
          notifications = props.notifications || props.unreadNotifications;
          break;
        }
        const state = parseInitialState(html);
        if (state && state.notifications) { notifications = state.notifications; break; }
      } catch (e) { /* try next */ }
    }
    if (!notifications) {
      try {
        const bellEl = document.querySelector('[data-testid="notification-bell"], [aria-label*="notification"], [class*="notification"]');
        const badgeEl = bellEl ? bellEl.querySelector('[class*="badge"], [class*="count"], [class*="dot"]') : null;
        const count = badgeEl ? parseInt(badgeEl.textContent) || 0 : 0;
        notifications = { count, message: count > 0 ? `You have ${count} unread notifications` : 'No unread notifications' };
      } catch (e) {}
    }
    if (!notifications) throw new Error('Could not fetch notifications');
    chrome.storage.local.set({ notificationsData: notifications, lastNotificationsFetch: Date.now() });
    chrome.runtime.sendMessage({ type: 'NOTIFICATIONS_FETCHED', data: notifications, message: 'Notifications fetched successfully!' });
  } catch (error) {
    chrome.runtime.sendMessage({ type: 'NOTIFICATIONS_ERROR', error: error.message });
  }
}

// ============ FETCH ALL DATA (Everything at once) ============
async function fetchAllData() {
  chrome.runtime.sendMessage({ type: 'EXTRACTION_PROGRESS', message: 'Fetching everything...' });
  await fetchAllContacts();
  await Promise.all([
    fetchOrders(),
    fetchEarnings(),
    fetchReviews(),
    fetchNotifications()
  ]);
  chrome.runtime.sendMessage({ type: 'ALL_DATA_FETCHED', message: 'All data fetched successfully!' });
}

// ============ MESSAGE LISTENER ============
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_CONVERSATION') {
    chrome.storage.local.get(['currentUsername'], function(result) {
      if (result.currentUsername) fetchConversation(result.currentUsername);
      else chrome.runtime.sendMessage({ type: 'EXTRACTION_ERROR', error: 'No username found.' });
    });
  } else if (request.type === 'FETCH_ALL_CONTACTS') {
    fetchAllContacts();
  } else if (request.type === 'FETCH_ORDERS') {
    fetchOrders();
  } else if (request.type === 'FETCH_EARNINGS') {
    fetchEarnings();
  } else if (request.type === 'FETCH_REVIEWS') {
    fetchReviews();
  } else if (request.type === 'FETCH_NOTIFICATIONS') {
    fetchNotifications();
  } else if (request.type === 'FETCH_ALL_DATA') {
    fetchAllData();
  }
});
