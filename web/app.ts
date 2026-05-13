// =============================================================================
// Mashov Dashboard — frontend, one TypeScript file. Bundled by esbuild.
// Tablet-portrait, RTL Hebrew.
// =============================================================================

interface Kid {
  id: string;
  name: string;
  color: string;
}

interface Section<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

interface Summary {
  kid: Kid;
  fetchedAt: string;
  sections: Record<string, Section>;
}

interface HomeworkItem {
  subject?: string;
  homework?: string;
  message?: string;
  lessonDate?: string;
  dueDate?: string;
}

interface TimetableRow {
  timeTable: { day: number; lesson: number; roomNum?: string };
  groupDetails: { subjectName?: string; groupName?: string };
}

interface MailItem {
  sendTime?: string;
  subject?: string;
  isNew?: boolean;
  messages?: Array<{ senderName?: string }>;
}

interface GradeItem {
  grade?: number;
  subjectName?: string;
  gradingEvent?: string;
  gradeType?: string;
  eventDate?: string;
}

type ViewId = 'today' | 'tasks' | 'schedule' | 'messages' | 'grades';

// ---------- Constants --------------------------------------------------------

const REFRESH_MS = 5 * 60 * 1000;
const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HE_MONTHS = [
  'בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני',
  'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר',
];

const VIEWS: { id: ViewId; label: string; icon: string }[] = [
  { id: 'today', label: 'היום', icon: '🏠' },
  { id: 'tasks', label: 'משימות', icon: '✓' },
  { id: 'schedule', label: 'מערכת', icon: '📅' },
  { id: 'messages', label: 'הודעות', icon: '✉' },
  { id: 'grades', label: 'ציונים', icon: '★' },
];

// School bell schedule — approximate; tune to your school if needed.
const LESSON_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:50', end: '09:35' },
  3: { start: '09:55', end: '10:40' },
  4: { start: '10:45', end: '11:30' },
  5: { start: '11:45', end: '12:30' },
  6: { start: '12:35', end: '13:20' },
  7: { start: '13:25', end: '14:10' },
  8: { start: '14:15', end: '15:00' },
};

// ---------- State ------------------------------------------------------------

const state = {
  kids: [] as Kid[],
  activeKidId: 'all' as string,
  activeView: 'today' as ViewId,
  summaries: {} as Record<string, Summary>,
  lastFetched: null as Date | null,
  error: null as string | null,
};

// ---------- Boot -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  restoreSticky();
  renderBottombar();
  startClock();
  init();
});

async function init(): Promise<void> {
  try {
    state.kids = await fetchJson<Kid[]>('/api/kids');
    if (state.activeKidId !== 'all' && !state.kids.some((k) => k.id === state.activeKidId)) {
      state.activeKidId = state.kids.length > 1 ? 'all' : state.kids[0]?.id ?? 'all';
    }
    renderKidTabs();
    await refreshAll();
    setInterval(refreshAll, REFRESH_MS);
  } catch (err) {
    state.error = (err as Error).message;
    renderView();
  }
}

// ---------- Data layer -------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}

async function refreshAll(): Promise<void> {
  state.error = null;
  try {
    const results = await Promise.all(
      state.kids.map(async (k): Promise<[string, Summary]> => {
        const url = `/api/kids/${encodeURIComponent(k.id)}/summary`;
        try {
          return [k.id, await fetchJson<Summary>(url)];
        } catch (err) {
          return [k.id, { kid: k, fetchedAt: new Date().toISOString(), sections: {} }];
        }
      }),
    );
    state.summaries = Object.fromEntries(results);
    state.lastFetched = new Date();
  } catch (err) {
    state.error = (err as Error).message;
  }
  renderView();
  renderUpdated();
}

function getSection<T>(kidId: string, name: string): T | null {
  const summary = state.summaries[kidId];
  const section = summary?.sections?.[name];
  return section?.ok ? ((section.data as T) ?? null) : null;
}

// ---------- Persistence ------------------------------------------------------

function restoreSticky(): void {
  try {
    state.activeKidId = localStorage.getItem('mashov.kid') ?? state.activeKidId;
    state.activeView = (localStorage.getItem('mashov.view') as ViewId) ?? state.activeView;
  } catch {
    /* storage may be blocked — fine */
  }
}

function persistSticky(): void {
  try {
    localStorage.setItem('mashov.kid', state.activeKidId);
    localStorage.setItem('mashov.view', state.activeView);
  } catch {
    /* ignore */
  }
}

// ---------- Clock ------------------------------------------------------------

function startClock(): void {
  const clock = byId('clock');
  const date = byId('date');
  const daypart = byId('daypart');
  const tick = () => {
    const now = new Date();
    clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    date.textContent = `יום ${HE_DAYS[now.getDay()]}, ${now.getDate()} ${HE_MONTHS[now.getMonth()]}`;
    daypart.textContent = greeting(now.getHours());
  };
  tick();
  setInterval(tick, 1000);
}

function renderUpdated(): void {
  const el = byId('updated');
  if (!state.lastFetched) {
    el.textContent = 'עודכן —';
    return;
  }
  el.textContent = `עודכן ${pad(state.lastFetched.getHours())}:${pad(state.lastFetched.getMinutes())}`;
}

function greeting(hour: number): string {
  if (hour < 6) return 'לילה טוב';
  if (hour < 12) return 'בוקר טוב';
  if (hour < 17) return 'אחר הצהריים';
  if (hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

// ---------- Rendering: chrome ------------------------------------------------

function renderKidTabs(): void {
  const root = byId('kidTabs');
  root.innerHTML = '';
  if (state.kids.length === 0) return;

  const prefix = el('span', 'label-prefix', 'תצוגה:');
  root.appendChild(prefix);

  const tabs: Kid[] = state.kids.length > 1
    ? [{ id: 'all', name: 'שניהם', color: '#111' }, ...state.kids]
    : [...state.kids];

  for (const t of tabs) {
    const btn = document.createElement('button');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(t.id === state.activeKidId));
    if (t.id !== 'all') {
      const dot = el('span', 'dot');
      dot.style.color = t.color;
      btn.appendChild(dot);
    }
    btn.appendChild(el('span', '', t.name));
    btn.addEventListener('click', () => {
      state.activeKidId = t.id;
      persistSticky();
      renderKidTabs();
      renderView();
    });
    root.appendChild(btn);
  }
}

function renderBottombar(): void {
  const root = byId('bottombar');
  root.innerHTML = '';
  for (const v of VIEWS) {
    const btn = document.createElement('button');
    btn.setAttribute('aria-selected', String(v.id === state.activeView));
    btn.innerHTML = `<span class="icon">${v.icon}</span><span>${v.label}</span>`;
    btn.addEventListener('click', () => {
      state.activeView = v.id;
      persistSticky();
      renderBottombar();
      renderView();
    });
    root.appendChild(btn);
  }
}

// ---------- Rendering: views -------------------------------------------------

function renderView(): void {
  const root = byId('view');
  root.innerHTML = '';

  if (state.error) {
    root.appendChild(el('div', 'err', `שגיאה: ${state.error}`));
    return;
  }
  if (state.kids.length === 0) {
    root.appendChild(el('div', 'empty', 'אין ילדים מוגדרים. ערוך את .env והפעל מחדש.'));
    return;
  }

  const kids = state.activeKidId === 'all'
    ? state.kids
    : state.kids.filter((k) => k.id === state.activeKidId);

  switch (state.activeView) {
    case 'today': return renderToday(root, kids);
    case 'tasks': return renderTasks(root, kids);
    case 'schedule': return renderSchedule(root, kids);
    case 'messages': return renderMessages(root, kids);
    case 'grades': return renderGrades(root, kids);
  }
}

function renderToday(root: HTMLElement, kids: Kid[]): void {
  // 1. Urgent homework — overdue or due today/tomorrow.
  const urgent: { kid: Kid; item: HomeworkItem; days: number }[] = [];
  for (const k of kids) {
    const hw = getSection<HomeworkItem[]>(k.id, 'homework') ?? [];
    for (const item of hw) {
      const days = daysUntil(item.lessonDate ?? item.dueDate);
      if (days !== null && days <= 1) urgent.push({ kid: k, item, days });
    }
  }
  if (urgent.length > 0) {
    const alert = el('div', 'alert');
    alert.appendChild(el('div', 'alert__title', '⚠ אל תשכחו'));
    for (const u of urgent.slice(0, 6)) {
      const row = el('div', 'alert__row');
      row.appendChild(el('div', 'alert__dot'));
      const text = el('div', 'alert__text');
      text.appendChild(el('div', 'alert__main', homeworkText(u.item)));
      text.appendChild(el('div', 'alert__sub', `${u.kid.name} — ${u.item.subject ?? ''}`));
      row.appendChild(text);
      alert.appendChild(row);
    }
    root.appendChild(alert);
  }

  // 2. Today's lessons per kid.
  const weekday = jsDayToMashov(new Date().getDay());
  for (const k of kids) {
    const timetable = getSection<TimetableRow[]>(k.id, 'timetable') ?? [];
    const lessons = collapseDay(timetable, weekday);
    const card = kidCard(k, { title: 'היום', sub: `${lessons.length} שיעורים` });
    const body = card.querySelector<HTMLElement>('.kidcard__body')!;
    if (lessons.length === 0) {
      body.appendChild(el('div', 'empty', 'אין שיעורים היום'));
    } else {
      const list = el('div', 'eventlist');
      for (const l of lessons) {
        const row = el('div', 'eventlist__row');
        row.appendChild(el('div', 'eventlist__time', l.timeLabel || `שיעור ${l.lesson}`));
        const dot = el('div', 'eventlist__dot');
        dot.style.background = k.color;
        row.appendChild(dot);
        row.appendChild(el('div', '', `${l.name}${l.place ? ` · ${l.place}` : ''}`));
        list.appendChild(row);
      }
      body.appendChild(list);
    }
    root.appendChild(card);
  }
}

function renderTasks(root: HTMLElement, kids: Kid[]): void {
  const grid = el('div', kids.length > 1 ? 'kidgrid' : '');
  for (const k of kids) {
    const hw = (getSection<HomeworkItem[]>(k.id, 'homework') ?? []).slice();
    hw.sort((a, b) =>
      +new Date(a.lessonDate ?? a.dueDate ?? 0) - +new Date(b.lessonDate ?? b.dueDate ?? 0),
    );
    const card = kidCard(k, { title: k.name, sub: 'משימות בית', count: String(hw.length) });
    const body = card.querySelector<HTMLElement>('.kidcard__body')!;
    if (hw.length === 0) body.appendChild(el('div', 'empty', 'אין משימות'));
    for (const item of hw) {
      const wrap = el('div', 'hw');
      wrap.style.setProperty('--kid-color', k.color);
      const top = el('div', 'hw__top');
      top.appendChild(el('div', '', item.subject ?? 'משימה'));
      const days = daysUntil(item.lessonDate ?? item.dueDate);
      if (days !== null) {
        const pill = el('div', `hw__pill${days <= 1 ? '' : ' hw__pill--soft'}`);
        pill.textContent = days <= 0 ? 'היום' : `בעוד ${days} י׳`;
        top.appendChild(pill);
      }
      wrap.appendChild(top);
      wrap.appendChild(el('div', 'hw__text', homeworkText(item)));
      body.appendChild(wrap);
    }
    grid.appendChild(card);
  }
  root.appendChild(grid);
}

function renderSchedule(root: HTMLElement, kids: Kid[]): void {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekday = jsDayToMashov(tomorrow.getDay());
  const header = el('div', 'section');
  header.innerHTML = `<div class="section__title">📅 מערכת מחר <span class="meta">יום ${HE_DAYS[tomorrow.getDay()]}, ${tomorrow.getDate()} ${HE_MONTHS[tomorrow.getMonth()]}</span></div>`;
  root.appendChild(header);

  const grid = el('div', kids.length > 1 ? 'kidgrid' : '');
  for (const k of kids) {
    const timetable = getSection<TimetableRow[]>(k.id, 'timetable') ?? [];
    const day = collapseDay(timetable, weekday);
    const card = kidCard(k, { title: k.name, sub: 'יום מחר', count: `${day.length} שיעורים` });
    const body = card.querySelector<HTMLElement>('.kidcard__body')!;
    if (day.length === 0) {
      body.appendChild(el('div', 'empty', 'אין שיעורים'));
    } else {
      const list = el('div', 'schedule');
      for (const l of day) {
        const row = el('div', 'schedule__row');
        row.style.setProperty('--kid-color', k.color);
        row.style.setProperty('--kid-color-soft', tint(k.color));
        row.appendChild(el('div', 'schedule__num', String(l.lesson)));
        row.appendChild(el('div', '', `${l.name}${l.place ? ` · ${l.place}` : ''}`));
        row.appendChild(el('div', 'schedule__time', l.timeLabel));
        list.appendChild(row);
      }
      body.appendChild(list);
      const foot = el('div', 'schedule__foot');
      foot.style.background = k.color;
      foot.appendChild(el('div', '', 'סיום יום הלימודים'));
      foot.appendChild(el('div', '', day[day.length - 1].endTimeLabel));
      body.appendChild(foot);
    }
    grid.appendChild(card);
  }
  root.appendChild(grid);
}

function renderMessages(root: HTMLElement, kids: Kid[]): void {
  const grid = el('div', kids.length > 1 ? 'kidgrid' : '');
  for (const k of kids) {
    const msgs = getSection<MailItem[]>(k.id, 'messages') ?? [];
    const newCount = msgs.filter((m) => m.isNew).length;
    const card = kidCard(k, {
      title: k.name,
      sub: `${msgs.length} הודעות`,
      count: newCount > 0 ? `${newCount} חדש` : undefined,
    });
    const body = card.querySelector<HTMLElement>('.kidcard__body')!;
    if (msgs.length === 0) body.appendChild(el('div', 'empty', 'אין הודעות'));
    for (const m of msgs.slice(0, 8)) {
      const msg = el('div', 'msg');
      const head = el('div', 'msg__head');
      head.appendChild(el('div', '', formatShortDate(m.sendTime)));
      head.appendChild(el('div', '', m.messages?.[0]?.senderName ?? ''));
      msg.appendChild(head);
      msg.appendChild(el('div', `msg__subject${m.isNew ? ' msg__new' : ''}`, m.subject ?? '(ללא נושא)'));
      body.appendChild(msg);
    }
    grid.appendChild(card);
  }
  root.appendChild(grid);
}

function renderGrades(root: HTMLElement, kids: Kid[]): void {
  const grid = el('div', kids.length > 1 ? 'kidgrid' : '');
  for (const k of kids) {
    const grades = (getSection<GradeItem[]>(k.id, 'grades') ?? []).slice();
    grades.sort((a, b) => +new Date(b.eventDate ?? 0) - +new Date(a.eventDate ?? 0));
    const nums = grades.map((g) => g.grade).filter((n): n is number => typeof n === 'number');
    const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    const card = kidCard(k, {
      title: k.name,
      sub: 'ציונים אחרונים',
      count: avg !== null ? `ממוצע ${avg.toFixed(1)}` : undefined,
    });
    const body = card.querySelector<HTMLElement>('.kidcard__body')!;
    if (grades.length === 0) body.appendChild(el('div', 'empty', 'אין ציונים זמינים'));
    for (const g of grades.slice(0, 10)) {
      const row = el('div', 'grade');
      row.style.setProperty('--kid-color', k.color);
      row.appendChild(el('div', '', `${g.subjectName ?? ''} — ${g.gradingEvent ?? g.gradeType ?? ''}`));
      row.appendChild(el('div', 'grade__value', g.grade != null ? String(g.grade) : '—'));
      body.appendChild(row);
    }
    grid.appendChild(card);
  }
  root.appendChild(grid);
}

// ---------- Building blocks --------------------------------------------------

interface CardConfig {
  title: string;
  sub: string;
  count?: string;
}

function kidCard(kid: Kid, cfg: CardConfig): HTMLElement {
  const tpl = document.getElementById('kid-card-template') as HTMLTemplateElement;
  const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
  node.style.setProperty('--kid-color', kid.color);
  node.style.setProperty('--kid-color-soft', tint(kid.color));
  const head = node.querySelector<HTMLElement>('.kidcard__head')!;
  head.classList.add('kidcard__head--soft');
  head.style.background = tint(kid.color);
  head.style.color = '#111';
  node.querySelector<HTMLElement>('.kidcard__badge')!.textContent = (kid.name || 'א')[0];
  node.querySelector<HTMLElement>('.kidcard__title')!.textContent = cfg.title;
  node.querySelector<HTMLElement>('.kidcard__sub')!.textContent = cfg.sub;
  const countEl = node.querySelector<HTMLElement>('.kidcard__count')!;
  if (cfg.count) countEl.textContent = cfg.count;
  else countEl.remove();
  return node;
}

interface Lesson {
  lesson: number;
  name: string;
  place: string;
  timeLabel: string;
  endTimeLabel: string;
}

function collapseDay(rows: TimetableRow[], weekday: number): Lesson[] {
  const byLesson = new Map<number, Lesson>();
  for (const row of rows) {
    if (row.timeTable?.day !== weekday) continue;
    const lesson = row.timeTable.lesson;
    if (byLesson.has(lesson)) continue;
    byLesson.set(lesson, {
      lesson,
      name: row.groupDetails?.subjectName ?? row.groupDetails?.groupName ?? '',
      place: row.timeTable.roomNum ?? '',
      timeLabel: LESSON_TIMES[lesson]?.start ?? '',
      endTimeLabel: LESSON_TIMES[lesson]?.end ?? '',
    });
  }
  return [...byLesson.values()].sort((a, b) => a.lesson - b.lesson);
}

// ---------- Utilities --------------------------------------------------------

function byId(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node;
}

function el(tag: string, cls?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function homeworkText(item: HomeworkItem): string {
  return item.homework ?? item.message ?? item.subject ?? 'משימה';
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((+target - +today) / 86400000);
}

function jsDayToMashov(jsDay: number): number {
  // JS getDay: 0=Sun..6=Sat. Mashov uses 1=Sun..7=Sat.
  return jsDay + 1;
}

function tint(hex: string): string {
  if (!hex.startsWith('#') || hex.length < 7) return '#fafafa';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}

function formatShortDate(d?: string): string {
  if (!d) return '';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return d;
  return `${t.getDate()}/${t.getMonth() + 1}`;
}
