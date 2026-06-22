// ============================================================
// APPSEC HUB — APP LOGIC
// ============================================================

const STATE_KEY = 'appsec-hub-state-v1';
let appState = {};
try { appState = JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); } catch (e) {}
if (!appState.completedDays) appState.completedDays = [];
if (!appState.activePhase) appState.activePhase = 'all';
if (!appState.lastDay) appState.lastDay = 1;

function saveState() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(appState)); } catch (e) {}
}

// ---------- Navigation stack ----------
let navStack = ['home'];
let currentLessonDay = null;
let currentNoteId = null;

const PAGE_TITLES = {
  home: { title: 'AppSec Hub', sub: '' },
  days: { title: 'All Days', sub: '60-day roadmap' },
  lesson: { title: '', sub: '' },
  interview: { title: 'Interview War Room', sub: '62 flashcards' },
  notes: { title: 'Revision Notes', sub: '' },
  'note-reader': { title: '', sub: '' },
};

function showPage(pageId, opts = {}) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');

  // Tab bar highlight (only for top-level pages)
  const topLevel = ['home', 'days', 'interview', 'notes'];
  if (topLevel.includes(pageId)) {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    const tab = document.querySelector(`.tab-item[data-tab="${pageId}"]`);
    if (tab) tab.classList.add('active');
  }

  const info = opts.title ? opts : PAGE_TITLES[pageId];
  document.getElementById('headerTitle').textContent = info.title || '';
  document.getElementById('headerSub').textContent = info.sub || '';

  const backBtn = document.getElementById('backBtn');
  const isTopLevel = topLevel.includes(pageId);
  backBtn.classList.toggle('invisible', isTopLevel);

  document.getElementById('appContent').scrollTop = 0;
}

function navigateTo(pageId, opts = {}) {
  navStack.push(pageId);
  showPage(pageId, opts);
}

function navigateBack() {
  if (navStack.length > 1) {
    navStack.pop();
    const prev = navStack[navStack.length - 1];
    showPage(prev);
  }
}

document.getElementById('backBtn').addEventListener('click', navigateBack);

// Tab bar navigation (resets stack to that root)
document.querySelectorAll('.tab-item').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    navStack = [target];
    showPage(target);
    if (target === 'interview') loadInterviewFrame();
  });
});

// Quick action cards on home
document.querySelectorAll('[data-nav]').forEach(el => {
  el.addEventListener('click', () => {
    const target = el.dataset.nav;
    if (target === 'roadmap') { navStack = ['days']; showPage('days'); }
    else if (target === 'interview') { navStack = ['interview']; showPage('interview'); loadInterviewFrame(); }
    else if (target === 'notes') { navStack = ['notes']; showPage('notes'); }
  });
});

// ---------- Progress calculations ----------
function getBuiltDays() {
  return DAYS.filter(d => d.lesson !== null || d.note);
}

function isComplete(dayNum) {
  return appState.completedDays.includes(dayNum);
}

function toggleComplete(dayNum) {
  const idx = appState.completedDays.indexOf(dayNum);
  if (idx >= 0) appState.completedDays.splice(idx, 1);
  else appState.completedDays.push(dayNum);
  saveState();
  renderHome();
  renderDaysList();
}

function updateProgressRing() {
  const total = 60;
  const done = appState.completedDays.length;
  const pct = Math.round((done / total) * 100);
  const circumference = 239;
  const offset = circumference - (pct / 100) * circumference;
  document.getElementById('homeRing').style.strokeDashoffset = offset;
  document.getElementById('homeRingPct').textContent = pct + '%';
  document.getElementById('dayCountMeta').textContent = `${done} / ${total} DONE`;
  document.getElementById('dayCountMeta2').textContent = `${done} / ${total} DONE`;
}

function getNextDay() {
  const builtDays = getBuiltDays();
  const nextIncomplete = builtDays.find(d => !isComplete(d.day));
  return nextIncomplete || builtDays[builtDays.length - 1] || DAYS[0];
}

// ---------- Render: Home page day cards ----------
function renderPhaseRail(targetId) {
  const rail = document.getElementById(targetId);
  rail.innerHTML = '';
  const allChip = document.createElement('button');
  allChip.className = 'phase-chip' + (appState.activePhase === 'all' ? ' active' : '');
  allChip.textContent = 'ALL';
  allChip.onclick = () => { appState.activePhase = 'all'; saveState(); renderHome(); renderDaysList(); };
  rail.appendChild(allChip);

  PHASES.forEach(ph => {
    const chip = document.createElement('button');
    chip.className = 'phase-chip' + (appState.activePhase === ph.id ? ' active' : '');
    chip.textContent = ph.label.toUpperCase();
    chip.onclick = () => { appState.activePhase = ph.id; saveState(); renderHome(); renderDaysList(); };
    rail.appendChild(chip);
  });
}

function dayCardHTML(d) {
  const complete = isComplete(d.day);
  const hasLesson = d.lesson !== null;
  const hasNote = !!d.note;
  const isNext = !complete && hasLesson && d.day === getNextDay().day;
  let cls = 'day-card';
  if (!hasLesson && !hasNote) cls += ' locked';
  if (complete) cls += ' complete';
  if (isNext) cls += ' active-day';

  let tagText = d.tag;
  if (!hasLesson && !hasNote) tagText = 'Not built yet';

  return `
    <div class="${cls}" data-day="${d.day}" data-has-lesson="${hasLesson}" data-has-note="${hasNote}">
      <div class="day-badge">${complete ? '✓' : d.day}</div>
      <div class="day-info">
        <div class="day-name">${d.title}</div>
        <div class="day-tag">${tagText}</div>
      </div>
      ${complete ? '<div class="day-check">✓</div>' : (hasLesson || hasNote ? '<div class="day-chevron">›</div>' : '')}
    </div>
  `;
}

function attachDayCardHandlers(container) {
  container.querySelectorAll('.day-card').forEach(card => {
    const dayNum = parseInt(card.dataset.day);
    const hasLesson = card.dataset.hasLesson === 'true';
    const hasNote = card.dataset.hasNote === 'true';
    card.addEventListener('click', () => {
      if (hasLesson) openLesson(dayNum);
      else if (hasNote) {
        const d = DAYS.find(x => x.day === dayNum);
        const note = NOTES.find(n => n.file === d.note);
        if (note) openNote(note.id);
        else {
          // Note file exists but isn't in the NOTES registry under its own id —
          // open it directly via a synthetic note object.
          openNoteDirect(d.note, `Day ${d.day} — ${d.title}`);
        }
      }
    });
  });
}

function filteredDays() {
  if (appState.activePhase === 'all') return DAYS;
  return DAYS.filter(d => d.phase === appState.activePhase);
}

function renderHome() {
  updateProgressRing();
  const next = getNextDay();
  document.getElementById('currentDayNum').textContent = next.day;
  document.getElementById('nextDayTitle').textContent = `Day ${next.day} — ${next.title}`;
  document.getElementById('nextDayDetail').textContent = (next.lesson || next.note) ? next.tag : 'All available content complete';

  renderPhaseRail('phaseRail');
  const list = document.getElementById('dayList');
  // Home shows a compact preview: next 6 relevant days
  const days = filteredDays();
  const builtFirst = [...days].sort((a, b) => {
    const aBuilt = (a.lesson || a.note) ? 0 : 1, bBuilt = (b.lesson || b.note) ? 0 : 1;
    if (aBuilt !== bBuilt) return aBuilt - bBuilt;
    return a.day - b.day;
  });
  list.innerHTML = builtFirst.slice(0, 8).map(dayCardHTML).join('');
  attachDayCardHandlers(list);
}

function renderDaysList() {
  renderPhaseRail('phaseRail2');
  const list = document.getElementById('dayListFull');
  const days = filteredDays();
  list.innerHTML = days.map(dayCardHTML).join('');
  attachDayCardHandlers(list);
}

document.getElementById('continueBtn').addEventListener('click', () => {
  const next = getNextDay();
  if (next.lesson) openLesson(next.day);
  else if (next.note) {
    const note = NOTES.find(n => n.file === next.note);
    if (note) openNote(note.id);
    else openNoteDirect(next.note, `Day ${next.day} — ${next.title}`);
  }
});

// ---------- Lesson viewer ----------
function openLesson(dayNum) {
  const d = DAYS.find(x => x.day === dayNum);
  if (!d || !d.lesson) return;
  currentLessonDay = dayNum;

  const [file, anchor] = d.lesson.split('#');
  const frame = document.getElementById('lessonFrame');
  frame.src = `lessons/${file}${anchor ? '#' + anchor : ''}`;

  navStack.push('lesson');
  showPage('lesson', { title: `Day ${d.day}`, sub: d.title });

  // Add a "mark complete" affordance via long-press on header title (simple toggle button injected once)
  injectCompleteToggle(dayNum);
  appState.lastDay = dayNum;
  saveState();
}

function injectCompleteToggle(dayNum) {
  let btn = document.getElementById('completeToggleBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'completeToggleBtn';
    btn.style.cssText = 'flex-shrink:0;width:34px;height:34px;border-radius:10px;background:var(--bg2);border:1px solid var(--border);color:var(--text2);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;';
    document.getElementById('appHeader').appendChild(btn);
  }
  btn.onclick = () => {
    toggleComplete(dayNum);
    updateCompleteToggleVisual(dayNum);
  };
  updateCompleteToggleVisual(dayNum);
  btn.style.display = navStack[navStack.length - 1] === 'lesson' ? 'flex' : 'none';
}

function updateCompleteToggleVisual(dayNum) {
  const btn = document.getElementById('completeToggleBtn');
  if (!btn) return;
  const complete = isComplete(dayNum);
  btn.textContent = complete ? '✓' : '○';
  btn.style.color = complete ? '#34d399' : 'var(--text2)';
  btn.style.borderColor = complete ? 'rgba(52,211,153,.4)' : 'var(--border)';
}

// Hide complete-toggle button on non-lesson pages
const origShowPage = showPage;
showPage = function (pageId, opts) {
  origShowPage(pageId, opts);
  const btn = document.getElementById('completeToggleBtn');
  if (btn) btn.style.display = pageId === 'lesson' ? 'flex' : 'none';
};

// ---------- Interview frame (lazy load once) ----------
let interviewLoaded = false;
function loadInterviewFrame() {
  if (interviewLoaded) return;
  document.getElementById('interviewFrame').src = 'lessons/interview-prep-days-1-4.html';
  interviewLoaded = true;
}

// ---------- Notes ----------
function renderNotesList(filter = '') {
  const list = document.getElementById('noteList');
  const q = filter.toLowerCase();
  const filtered = NOTES.filter(n =>
    !q || n.title.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q)
  );
  list.innerHTML = filtered.map(n => `
    <div class="note-card" data-note="${n.id}">
      <div class="note-card-title">${n.title}</div>
      <div class="note-card-desc">${n.desc}</div>
    </div>
  `).join('') || '<div style="text-align:center;padding:60px 20px;color:var(--text3);font-size:13px;">No notes match your search.</div>';

  list.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', () => openNote(card.dataset.note));
  });
}

document.getElementById('notesSearchInput').addEventListener('input', (e) => {
  renderNotesList(e.target.value);
});

const noteCache = {};

async function openNote(noteId) {
  const note = NOTES.find(n => n.id === noteId);
  if (!note) return;
  await openNoteDirect(note.file, note.title);
}

async function openNoteDirect(filename, title) {
  currentNoteId = filename;
  navStack.push('note-reader');
  showPage('note-reader', { title, sub: 'Revision Notes' });

  const contentEl = document.getElementById('noteReaderContent');
  const cacheKey = filename;
  if (noteCache[cacheKey]) {
    contentEl.innerHTML = noteCache[cacheKey];
    return;
  }
  contentEl.innerHTML = '<div style="text-align:center;padding:60px 0;color:var(--text3);font-family:JetBrains Mono,monospace;font-size:12px;">LOADING...</div>';
  try {
    const res = await fetch(`notes/${filename}`);
    const md = await res.text();
    const html = renderMarkdown(md);
    noteCache[cacheKey] = html;
    contentEl.innerHTML = html;
  } catch (err) {
    contentEl.innerHTML = `<p style="color:var(--red);">Could not load this note. Make sure ${filename} is in the /notes folder.</p>`;
  }
}

// ---------- Minimal markdown renderer (no dependencies, works offline) ----------
function renderMarkdown(md) {
  let html = md;

  // Escape HTML first in code blocks, protect them
  const codeBlocks = [];
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, (m, code) => {
    codeBlocks.push(code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    return `\u0000CODEBLOCK${codeBlocks.length - 1}\u0000`;
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Blockquotes (must run before generic paragraph wrapping)
  html = html.replace(/^> ?(.*)$/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/(<blockquote>.*<\/blockquote>\n?)+/g, m => m.replace(/<\/blockquote>\n?<blockquote>/g, '<br>'));

  // Bold / italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, (m, code) => `<code>${code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code>`);

  // Tables (simple pipe-table support)
  html = html.replace(/^\|(.+)\|\s*\n\|[\s:|-]+\|\s*\n((?:\|.*\|\s*\n?)*)/gim, (m, header, body) => {
    const headers = header.split('|').map(h => h.trim()).filter(Boolean);
    const rows = body.trim().split('\n').map(r => r.split('|').map(c => c.trim()).filter((c, i, a) => !(i === 0 && c === '') && !(i === a.length - 1 && c === '')));
    let t = '<table><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    rows.forEach(r => { t += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>'; });
    t += '</table>';
    return t;
  });

  // Horizontal rule
  html = html.replace(/^---$/gim, '<hr>');

  // Lists (basic numbered + bullet)
  html = html.replace(/^\d+\.\s+(.*)$/gim, '<li class="ol">$1</li>');
  html = html.replace(/^[-*]\s+(.*)$/gim, '<li class="ul">$1</li>');
  html = html.replace(/(<li class="ol">.*<\/li>\n?)+/g, m => '<ol>' + m.replace(/ class="ol"/g, '') + '</ol>');
  html = html.replace(/(<li class="ul">.*<\/li>\n?)+/g, m => '<ul>' + m.replace(/ class="ul"/g, '') + '</ul>');

  // Paragraphs (lines not already wrapped in a block tag)
  html = html.split('\n').map(line => {
    if (/^<(h\d|ul|ol|li|table|tr|th|td|hr|blockquote|\/)/.test(line.trim()) || line.trim() === '') return line;
    if (line.includes('\u0000CODEBLOCK')) return line;
    return `<p>${line}</p>`;
  }).join('\n');

  // Restore code blocks
  html = html.replace(/\u0000CODEBLOCK(\d+)\u0000/g, (m, i) => `<pre><code>${codeBlocks[i]}</code></pre>`);

  return html;
}

// ---------- Init ----------
function init() {
  renderHome();
  renderDaysList();
  renderNotesList();

  // Hide loading screen
  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    ls.style.opacity = '0';
    setTimeout(() => ls.remove(), 400);
  }, 500);
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      // Check for an updated service worker every time the app opens,
      // and activate it immediately rather than waiting for a second visit.
      reg.update();
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch(() => {});
  });

  // Reload once if the controlling service worker changes mid-session,
  // so the new shell code is actually running rather than half-old.
  let refreshed = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshed) return;
    refreshed = true;
    window.location.reload();
  });
}
