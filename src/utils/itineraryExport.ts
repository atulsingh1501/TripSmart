function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface ItineraryExportInput {
  title: string;
  origin: string;
  destination: string;
  dates?: string;
  duration?: string;
  travelers?: number | string;
  totalCost?: string;
  breakdown?: Array<{ label: string; amount: string }>;
  hotel?: { name?: string; stars?: number; location?: string; nights?: number };
  transport?: { mode?: string; operator?: string; departure?: string; arrival?: string; class?: string };
  days: Array<{
    day: number | string;
    title: string;
    date?: string;
    activities: Array<{ time?: string; title: string; description?: string; cost?: string }>;
  }>;
}

export function downloadItineraryHtml(input: ItineraryExportInput) {
  const html = buildItineraryHtml(input);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TripSmart_${(input.destination || 'Trip').replace(/\s+/g, '_')}_Itinerary.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printItinerary(input: ItineraryExportInput) {
  const html = buildItineraryHtml(input);
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200');
  if (!w) {
    downloadItineraryHtml(input);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

function buildItineraryHtml(input: ItineraryExportInput) {
  const days = input.days.map((day) => `
    <section class="day">
      <h3>Day ${esc(day.day)} — ${esc(day.title)}${day.date ? ` <span>${esc(day.date)}</span>` : ''}</h3>
      <ul>
        ${day.activities.map((a) => `
          <li>
            <div class="time">${esc(a.time || '')}</div>
            <div class="activity-title">${esc(a.title)}</div>
            ${a.cost ? `<div class="cost">${esc(a.cost)}</div>` : ''}
            ${a.description ? `<p>${esc(a.description)}</p>` : ''}
          </li>
        `).join('')}
      </ul>
    </section>
  `).join('');

  const breakdown = (input.breakdown || []).map((row) => `
    <tr><td>${esc(row.label)}</td><td>${esc(row.amount)}</td></tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(input.title)} — TripSmart Itinerary</title>
  <style>
    :root { color-scheme: light; }
    @page { margin: 1.5cm; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A1814; background: #fff; margin: 0; line-height: 1.5; }
    .sheet { max-width: 800px; margin: 0 auto; padding: 20px 0; }
    .header { border-bottom: 2px solid #C85F3C; padding-bottom: 20px; margin-bottom: 30px; }
    .brand { font-size: 24px; font-weight: bold; color: #C85F3C; letter-spacing: -0.5px; margin: 0 0 4px; }
    .brand span { font-weight: 300; color: #1A1814; }
    h1 { font-size: 32px; margin: 0 0 10px; font-weight: 600; letter-spacing: -0.02em; }
    .meta { font-size: 14px; color: #6B6560; margin: 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .card { border: 1px solid rgba(26,24,20,0.12); border-radius: 8px; padding: 20px; background: #faf9f7; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .card h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8A8480; margin: 0 0 12px; }
    .card p { margin: 0 0 4px; font-size: 14px; }
    .card p:first-of-type { font-weight: 600; font-size: 16px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    td { padding: 10px 0; border-bottom: 1px solid rgba(26,24,20,0.08); }
    td:last-child { text-align: right; font-weight: 600; }
    .day { margin: 32px 0; page-break-inside: avoid; }
    .day h3 { font-size: 20px; margin: 0 0 16px; color: #C85F3C; border-bottom: 1px solid rgba(26,24,20,0.08); padding-bottom: 8px; }
    .day h3 span { font-size: 13px; color: #8A8480; font-weight: normal; float: right; margin-top: 6px; }
    .day ul { list-style: none; padding: 0; margin: 0; border-left: 2px solid rgba(200,95,60,0.2); margin-left: 8px; }
    .day li { position: relative; padding: 0 0 20px 24px; }
    .day li::before { content: ''; position: absolute; left: -6px; top: 6px; width: 10px; height: 10px; border-radius: 50%; background: #C85F3C; border: 2px solid #fff; }
    .day li:last-child { padding-bottom: 0; }
    .time { color: #C85F3C; font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .activity-title { font-weight: 600; font-size: 15px; margin: 0; }
    .day p { margin: 4px 0 0; color: #6B6560; font-size: 13px; }
    .cost { float: right; font-weight: 600; font-size: 14px; margin-top: -20px; }
    footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid rgba(26,24,20,0.1); font-size: 11px; color: #8A8480; text-align: center; }
  </style>
</head>
<body>
  <article class="sheet">
    <div class="header">
      <div class="brand">Trip<span>Smart</span></div>
      <h1>${esc(input.origin)} → ${esc(input.destination)}</h1>
      <p class="meta">${esc(input.title)} · ${esc(input.dates || input.duration || '')} · ${esc(input.travelers || 1)} traveler(s) · Total: ${esc(input.totalCost || '')}</p>
    </div>
    <div class="grid">
      <div class="card">
        <h2>Transport</h2>
        <p>${esc(input.transport?.mode || '—')}</p>
        <p>${esc(input.transport?.operator || '')}</p>
        <p>${esc(input.transport?.departure || '')} → ${esc(input.transport?.arrival || '')}</p>
        <p>${esc(input.transport?.class || '')}</p>
      </div>
      <div class="card">
        <h2>Stay</h2>
        <p>${esc(input.hotel?.name || '—')}</p>
        <p>${input.hotel?.stars ? `${esc(input.hotel.stars)}★` : ''} ${esc(input.hotel?.location || '')}</p>
        <p>${input.hotel?.nights ? `${esc(input.hotel.nights)} night(s)` : ''}</p>
      </div>
    </div>
    <div class="card" style="margin-bottom:28px">
      <h2>Cost breakdown</h2>
      <table>${breakdown}</table>
    </div>
    ${days}
    <footer>Generated by TripSmart · Print this page to save as PDF</footer>
  </article>
</body>
</html>`;
}
