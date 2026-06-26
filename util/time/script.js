// Fetch helper with AbortController timeout
async function fetchWithTimeout(url, options = {}, timeout = 4000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

// Global state
let clockOffset = 0;
let is24Hour = localStorage.getItem('time-format-24h') !== 'false';

// Time server configurations for NTP-over-HTTP averaging
const servers = [
    {
        url: 'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
        parse: (data) => new Date(data.dateTime + 'Z').getTime()
    },
    {
        url: 'https://public-api.siyukatu.com/time.json',
        parse: (data) => data.time
    },
    {
        url: 'https://timeapi.io/api/Time/current/coordinate?latitude=0&longitude=0',
        parse: (data) => new Date(data.dateTime + 'Z').getTime()
    }
];

// Synchronization logic
async function syncTime() {
    const syncPromises = servers.map(async (server) => {
        try {
            const t0 = performance.now();
            const date0 = Date.now();
            const response = await fetchWithTimeout(server.url, {}, 3500);
            if (!response.ok) throw new Error(`HTTP status ${response.status}`);
            
            const data = await response.json();
            const t3 = performance.now();
            
            const rtt = t3 - t0;
            const serverTime = server.parse(data);
            if (isNaN(serverTime)) throw new Error('Invalid time parsed');
            
            // Offset calculation adjusting for network latency (RTT / 2)
            const clientTimeMid = date0 + (rtt / 2);
            const offset = serverTime - clientTimeMid;
            return { offset, rtt };
        } catch (error) {
            console.warn(`Time server sync failed for ${server.url}:`, error.message);
            return null;
        }
    });

    const results = await Promise.all(syncPromises);
    const validResults = results.filter(res => res !== null);

    if (validResults.length > 0) {
        const sumOffset = validResults.reduce((acc, curr) => acc + curr.offset, 0);
        const avgOffset = sumOffset / validResults.length;
        const avgRtt = validResults.reduce((acc, curr) => acc + curr.rtt, 0) / validResults.length;
        
        console.log(`Synced! Avg offset: ${avgOffset.toFixed(2)}ms. Avg RTT: ${avgRtt.toFixed(2)}ms. Active servers: ${validResults.length}/${servers.length}`);
        clockOffset = avgOffset;
    } else {
        console.warn('All time servers failed to sync. Falling back to local clock.');
    }
}

// Clock updates
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');

function pad(n) {
    return String(n).padStart(2, '0');
}

function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    if (is24Hour) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
    }
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function updateClock() {
    const now = new Date(Date.now() + clockOffset);
    timeEl.textContent = formatTime(now);
    dateEl.textContent = formatDate(now);
    requestAnimationFrame(updateClock);
}

// Toggle format
timeEl.addEventListener('click', () => {
    is24Hour = !is24Hour;
    localStorage.setItem('time-format-24h', is24Hour);
});

timeEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        is24Hour = !is24Hour;
        localStorage.setItem('time-format-24h', is24Hour);
    }
});



// Run
(async () => {
    // Initial sync
    await syncTime();
    // Start animation loop
    updateClock();
    // Background sync every 30 seconds to keep drift under control
    setInterval(syncTime, 30000);
})();
