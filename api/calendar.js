// api/calendar.js
// Vercel Serverless Function to proxy & parse Google Calendar iCal feed
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    const calendarId = req.query.calendarId || 'dolphin.kden@gmail.com';
    const icsUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;

    try {
        const icsRes = await fetch(icsUrl);
        if (!icsRes.ok) {
            return res.status(icsRes.status).json({ error: `Failed to fetch calendar ICS (${icsRes.status})` });
        }
        const text = await icsRes.text();
        const items = parseIcs(text);
        return res.status(200).json({ items });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

function parseIcs(icsText) {
    const events = [];
    const vevents = icsText.split('BEGIN:VEVENT');

    for (let i = 1; i < vevents.length; i++) {
        const block = vevents[i].split('END:VEVENT')[0];
        const lines = block.split(/\r?\n/);

        let summary = '';
        let dtstart = '';
        let dtend = '';
        let status = 'confirmed';
        let transp = 'OPAQUE';

        for (let j = 0; j < lines.length; j++) {
            let line = lines[j];
            while (j + 1 < lines.length && (lines[j + 1].startsWith(' ') || lines[j + 1].startsWith('\t'))) {
                line += lines[j + 1].substring(1);
                j++;
            }

            if (line.startsWith('SUMMARY:')) {
                summary = line.substring('SUMMARY:'.length).trim();
            } else if (line.startsWith('DTSTART')) {
                const val = line.split(':')[1];
                if (val) dtstart = parseIcsDate(val);
            } else if (line.startsWith('DTEND')) {
                const val = line.split(':')[1];
                if (val) dtend = parseIcsDate(val);
            } else if (line.startsWith('STATUS:')) {
                status = line.substring('STATUS:'.length).trim().toLowerCase();
            } else if (line.startsWith('TRANSP:')) {
                transp = line.substring('TRANSP:'.length).trim();
            }
        }

        if (dtstart && dtend) {
            events.push({
                summary,
                status,
                transparency: transp === 'TRANSPARENT' ? 'transparent' : 'opaque',
                start: dtstart.length === 10 ? { date: dtstart } : { dateTime: dtstart },
                end: dtend.length === 10 ? { date: dtend } : { dateTime: dtend }
            });
        }
    }
    return events;
}

function parseIcsDate(icsStr) {
    if (!icsStr) return '';
    const clean = icsStr.trim();
    if (clean.length === 8) {
        return `${clean.substr(0,4)}-${clean.substr(4,2)}-${clean.substr(6,2)}`;
    }
    if (clean.includes('T')) {
        const y = clean.substr(0, 4);
        const m = clean.substr(4, 2);
        const d = clean.substr(6, 2);
        const hh = clean.substr(9, 2);
        const mm = clean.substr(11, 2);
        const ss = clean.substr(13, 2);
        if (clean.endsWith('Z')) {
            return `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
        } else {
            return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
        }
    }
    return clean;
}
