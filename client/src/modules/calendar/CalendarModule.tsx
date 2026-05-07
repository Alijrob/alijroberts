import { useState, useEffect, useCallback, useRef } from 'react';

type ViewMode = 'month' | 'week' | 'day';

interface CalEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end:   { dateTime?: string; date?: string };
}

interface Status { connected: boolean; email: string | null; }

interface NewEventForm {
  summary: string; startDate: string; endDate: string;
  startTime: string; endTime: string; description: string; allDay: boolean;
}

const GOLD = '#c9a840';
const NAVY = '#1c2866';
const HOUR_H   = 56;
const DAY_START = 7;

// ── helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function startOfWeek(d: Date) { const r = new Date(d.getFullYear(), d.getMonth(), d.getDate()); r.setDate(r.getDate() - r.getDay()); return r; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function getEventDate(e: CalEvent) { return e.start.date ?? e.start.dateTime?.slice(0,10) ?? ''; }
function startMin(e: CalEvent) { if (!e.start.dateTime) return 0; const d = new Date(e.start.dateTime); return d.getHours()*60+d.getMinutes(); }
function durMin(e: CalEvent) { if (!e.start.dateTime||!e.end.dateTime) return 60; return (new Date(e.end.dateTime).getTime()-new Date(e.start.dateTime).getTime())/60000; }
function fmtTime(dt: string) { return new Date(dt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}); }
function fmtHour(h: number) { if(h===12) return '12pm'; return h<12?`${h}am`:`${h-12}pm`; }
function eventColor(_e: CalEvent) { return NAVY; }
function todayStr() { return isoDate(new Date()); }
function blankForm(date?: string): NewEventForm {
  const t = date ?? todayStr();
  return { summary:'', startDate:t, endDate:t, startTime:'09:00', endTime:'10:00', description:'', allDay:false };
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({ events, focusDate, today, onDayClick, onEventClick }:
  { events: CalEvent[]; focusDate: Date; today: string;
    onDayClick:(d:string)=>void; onEventClick:(e:CalEvent)=>void; }) {

  const monthStart = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  const gridStart  = startOfWeek(monthStart);
  const days       = Array.from({length:42}, (_,i) => addDays(gridStart,i));

  const byDate = new Map<string,CalEvent[]>();
  for (const e of events) {
    const k = getEventDate(e);
    if (!byDate.has(k)) byDate.set(k,[]);
    byDate.get(k)!.push(e);
  }

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
          <div key={d} style={{padding:'8px 0',textAlign:'center',fontSize:'0.68rem',fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.05em'}}>{d}</div>
        ))}
      </div>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'repeat(7,1fr)',gridTemplateRows:'repeat(6,1fr)',overflow:'hidden'}}>
        {days.map((day,i) => {
          const ds      = isoDate(day);
          const isToday = ds === today;
          const inMonth = day.getMonth() === focusDate.getMonth();
          const evts    = byDate.get(ds) ?? [];
          const show    = evts.slice(0,3);
          const more    = evts.length - 3;
          return (
            <div key={i} onClick={()=>onDayClick(ds)}
              style={{border:'1px solid #f0f0f0',borderTop:isToday?`2px solid ${GOLD}`:'1px solid #f0f0f0',padding:'4px 6px',overflow:'hidden',cursor:'pointer',background:isToday?'#fffbeb':'#fff'}}>
              <div style={{width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',
                background:isToday?GOLD:'transparent',
                color:isToday?'#fff':inMonth?'#333':'#ccc',
                fontSize:'0.75rem',fontWeight:isToday?700:400,marginBottom:2}}>
                {day.getDate()}
              </div>
              {show.map(ev=>(
                <div key={ev.id} onClick={e=>{e.stopPropagation();onEventClick(ev);}}
                  style={{background:eventColor(ev),color:'#fff',borderRadius:3,padding:'1px 5px',fontSize:'0.67rem',fontWeight:500,marginBottom:2,
                    whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',cursor:'pointer'}}>
                  {ev.start.dateTime?fmtTime(ev.start.dateTime)+' ':''}{ev.summary}
                </div>
              ))}
              {more>0&&<div style={{fontSize:'0.62rem',color:'#888',paddingLeft:4}}>+{more} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({ events, focusDate, today, onEventClick }:
  { events: CalEvent[]; focusDate: Date; today: string; onEventClick:(e:CalEvent)=>void; }) {

  const ws    = startOfWeek(focusDate);
  const days  = Array.from({length:7},(_,i)=>addDays(ws,i));
  const hours = Array.from({length:15},(_,i)=>i+DAY_START);
  const totalH = hours.length * HOUR_H;

  const allDay = events.filter(e=>!!e.start.date||!e.start.dateTime);
  const timed  = events.filter(e=>!!e.start.dateTime);

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Day header */}
      <div style={{display:'grid',gridTemplateColumns:'52px repeat(7,1fr)',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
        <div/>
        {days.map((d,i)=>{
          const ds=isoDate(d); const isT=ds===today;
          return (
            <div key={i} style={{padding:'8px 4px',textAlign:'center'}}>
              <div style={{fontSize:'0.65rem',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.04em'}}>{d.toLocaleDateString([],{weekday:'short'})}</div>
              <div style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',margin:'2px auto 0',borderRadius:'50%',
                background:isT?GOLD:'transparent',color:isT?'#fff':'#333',fontSize:'0.95rem',fontWeight:700}}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* All-day row */}
      {allDay.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'52px repeat(7,1fr)',borderBottom:'1px solid #eee',minHeight:26,flexShrink:0}}>
          <div style={{fontSize:'0.6rem',color:'#aaa',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:8}}>all-day</div>
          {days.map((d,i)=>{
            const evs=allDay.filter(e=>getEventDate(e)===isoDate(d));
            return <div key={i} style={{padding:'2px 3px'}}>{evs.map(ev=>(
              <div key={ev.id} onClick={()=>onEventClick(ev)}
                style={{background:eventColor(ev),color:'#fff',borderRadius:3,padding:'1px 5px',fontSize:'0.67rem',fontWeight:500,cursor:'pointer',marginBottom:2,
                  whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.summary}</div>
            ))}</div>;
          })}
        </div>
      )}
      {/* Time grid */}
      <div style={{flex:1,overflowY:'auto'}}>
        <div style={{display:'flex',position:'relative',height:totalH}}>
          {/* Time labels */}
          <div style={{width:52,flexShrink:0}}>
            {hours.map(h=>(
              <div key={h} style={{height:HOUR_H,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:8,paddingTop:4,fontSize:'0.62rem',color:'#bbb',userSelect:'none'}}>{fmtHour(h)}</div>
            ))}
          </div>
          {/* Day columns */}
          {days.map((d,di)=>{
            const ds=isoDate(d);
            const dayEvts=timed.filter(e=>getEventDate(e)===ds);
            return (
              <div key={di} style={{flex:1,position:'relative',borderLeft:'1px solid #e5e7eb'}}>
                {hours.map(h=>(
                  <div key={h} style={{position:'absolute',top:(h-DAY_START)*HOUR_H,width:'100%',height:HOUR_H,borderTop:'1px solid #f5f5f5'}}/>
                ))}
                {dayEvts.map(ev=>{
                  const top=Math.max(0,(startMin(ev)-DAY_START*60)/60*HOUR_H);
                  const h=Math.max(22,durMin(ev)/60*HOUR_H-2);
                  return (
                    <div key={ev.id} onClick={()=>onEventClick(ev)}
                      style={{position:'absolute',top,left:2,right:2,height:h,background:eventColor(ev),color:'#fff',
                        borderRadius:4,padding:'2px 5px',fontSize:'0.68rem',fontWeight:500,overflow:'hidden',cursor:'pointer',
                        zIndex:1,boxShadow:'0 1px 3px rgba(0,0,0,0.15)'}}>
                      <div style={{fontWeight:600,lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.summary}</div>
                      {h>30&&<div style={{fontSize:'0.6rem',opacity:0.9}}>{fmtTime(ev.start.dateTime!)}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Day view ──────────────────────────────────────────────────────────────────

function DayView({ events, focusDate, today, onEventClick }:
  { events: CalEvent[]; focusDate: Date; today: string; onEventClick:(e:CalEvent)=>void; }) {

  const ds      = isoDate(focusDate);
  const dayEvts = events.filter(e=>getEventDate(e)===ds);
  const allDay  = dayEvts.filter(e=>!!e.start.date||!e.start.dateTime);
  const timed   = dayEvts.filter(e=>!!e.start.dateTime);
  const hours   = Array.from({length:15},(_,i)=>i+DAY_START);
  const totalH  = hours.length * HOUR_H;
  const isToday = ds===today;

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'10px 20px',borderBottom:'1px solid #eee',flexShrink:0}}>
        <span style={{fontSize:'1rem',fontWeight:700,color:isToday?GOLD:NAVY}}>
          {focusDate.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
        </span>
        {isToday&&<span style={{fontSize:'0.72rem',color:GOLD,marginLeft:8,fontWeight:600}}>Today</span>}
      </div>
      {allDay.length>0&&(
        <div style={{padding:'6px 20px',borderBottom:'1px solid #eee',display:'flex',gap:6,flexWrap:'wrap',flexShrink:0}}>
          {allDay.map(ev=>(
            <div key={ev.id} onClick={()=>onEventClick(ev)}
              style={{background:eventColor(ev),color:'#fff',borderRadius:4,padding:'2px 10px',fontSize:'0.75rem',fontWeight:500,cursor:'pointer'}}>{ev.summary}</div>
          ))}
        </div>
      )}
      <div style={{flex:1,overflowY:'auto'}}>
        <div style={{display:'flex',position:'relative',height:totalH}}>
          <div style={{width:52,flexShrink:0}}>
            {hours.map(h=>(
              <div key={h} style={{height:HOUR_H,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:8,paddingTop:4,fontSize:'0.62rem',color:'#bbb',userSelect:'none'}}>{fmtHour(h)}</div>
            ))}
          </div>
          <div style={{flex:1,position:'relative',borderLeft:'1px solid #e5e7eb'}}>
            {hours.map(h=>(
              <div key={h} style={{position:'absolute',top:(h-DAY_START)*HOUR_H,width:'100%',height:HOUR_H,borderTop:'1px solid #f5f5f5'}}/>
            ))}
            {timed.map(ev=>{
              const top=Math.max(0,(startMin(ev)-DAY_START*60)/60*HOUR_H);
              const h=Math.max(24,durMin(ev)/60*HOUR_H-2);
              return (
                <div key={ev.id} onClick={()=>onEventClick(ev)}
                  style={{position:'absolute',top,left:4,right:4,height:h,background:eventColor(ev),color:'#fff',
                    borderRadius:5,padding:'4px 10px',fontSize:'0.8rem',fontWeight:500,overflow:'hidden',cursor:'pointer',
                    zIndex:1,boxShadow:'0 1px 3px rgba(0,0,0,0.15)'}}>
                  <div style={{fontWeight:600}}>{ev.summary}</div>
                  {h>36&&<div style={{fontSize:'0.7rem',opacity:0.9}}>{fmtTime(ev.start.dateTime!)} – {fmtTime(ev.end.dateTime!)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Event detail modal ────────────────────────────────────────────────────────

function EventModal({ event, onClose, onDelete, deleting }:
  { event: CalEvent; onClose:()=>void; onDelete:(id:string)=>void; deleting:boolean; }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={onClose}>
      <div style={{background:'#fff',borderRadius:10,padding:'1.5rem',maxWidth:400,width:'90%',boxShadow:'0 8px 32px rgba(0,0,0,0.18)'}}
        onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'0.75rem'}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:eventColor(event),marginTop:5,marginRight:8,flexShrink:0}}/>
          <span style={{flex:1,fontSize:'1rem',fontWeight:700,color:'#111'}}>{event.summary}</span>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:'1.2rem',cursor:'pointer',color:'#aaa',padding:'0 4px'}}>×</button>
        </div>
        <div style={{fontSize:'0.82rem',color:'#666',marginBottom:'0.5rem'}}>
          {event.start.dateTime
            ? `${new Date(event.start.dateTime).toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})} · ${fmtTime(event.start.dateTime)} – ${fmtTime(event.end.dateTime!)}`
            : new Date(event.start.date!+'T00:00:00').toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
        </div>
        {event.description&&<div style={{fontSize:'0.82rem',color:'#555',marginBottom:'0.75rem'}}>{event.description}</div>}
        <div style={{display:'flex',justifyContent:'flex-end',paddingTop:'0.5rem',borderTop:'1px solid #f0f0f0'}}>
          <button onClick={()=>onDelete(event.id)} disabled={deleting}
            style={{padding:'0.4rem 1rem',background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',borderRadius:5,fontSize:'0.8rem',fontWeight:600,cursor:'pointer'}}>
            {deleting?'Deleting…':'Delete Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New event form ────────────────────────────────────────────────────────────

function NewEventForm({ form, setF, error, saving, onSave, onCancel }:
  { form: NewEventForm; setF:(k:keyof NewEventForm,v:string|boolean)=>void;
    error:string; saving:boolean; onSave:()=>void; onCancel:()=>void; }) {
  return (
    <div style={{margin:'0.875rem 1.5rem',background:'#f9f9fb',border:'1px solid #e5e7eb',borderRadius:8,padding:'1.1rem',display:'flex',flexDirection:'column',gap:'0.65rem',flexShrink:0}}>
      <div style={fs.row}>
        <label style={fs.lbl}>Title</label>
        <input style={fs.inp} value={form.summary} onChange={e=>setF('summary',e.target.value)} placeholder="Event title" autoFocus/>
      </div>
      <div style={fs.grid2}>
        <div style={fs.row}>
          <label style={fs.lbl}>Date</label>
          <input style={fs.inp} type="date" value={form.startDate} onChange={e=>{setF('startDate',e.target.value);setF('endDate',e.target.value);}}/>
        </div>
        <div style={{...fs.row,justifyContent:'center',paddingTop:18}}>
          <label style={{fontSize:'0.8rem',color:'#555',display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
            <input type="checkbox" checked={form.allDay} onChange={e=>setF('allDay',e.target.checked)}/>
            All day
          </label>
        </div>
      </div>
      {!form.allDay&&(
        <div style={fs.grid2}>
          <div style={fs.row}><label style={fs.lbl}>Start</label><input style={fs.inp} type="time" value={form.startTime} onChange={e=>setF('startTime',e.target.value)}/></div>
          <div style={fs.row}><label style={fs.lbl}>End</label><input style={fs.inp} type="time" value={form.endTime} onChange={e=>setF('endTime',e.target.value)}/></div>
        </div>
      )}
      <div style={fs.row}>
        <label style={fs.lbl}>Description</label>
        <input style={fs.inp} value={form.description} onChange={e=>setF('description',e.target.value)} placeholder="Optional"/>
      </div>
      {error&&<div style={{fontSize:'0.78rem',color:'#dc2626',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:4,padding:'0.4rem 0.6rem'}}>{error}</div>}
      <div style={{display:'flex',justifyContent:'flex-end',gap:'0.5rem'}}>
        <button style={fs.cancel} onClick={onCancel}>Cancel</button>
        <button style={fs.save} onClick={onSave} disabled={saving}>{saving?'Saving…':'Save Event'}</button>
      </div>
    </div>
  );
}

const fs: Record<string,React.CSSProperties> = {
  row:    {display:'flex',flexDirection:'column',gap:3},
  grid2:  {display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem'},
  lbl:    {fontSize:'0.68rem',fontWeight:700,color:'#555',textTransform:'uppercase',letterSpacing:'0.05em'},
  inp:    {padding:'0.4rem 0.6rem',border:'1px solid #d1d5db',borderRadius:5,fontSize:'0.85rem',background:'#fff',outline:'none'},
  cancel: {padding:'0.4rem 0.9rem',border:'1px solid #d1d5db',borderRadius:5,background:'#fff',cursor:'pointer',fontSize:'0.8rem',color:'#555'},
  save:   {padding:'0.4rem 1rem',background:GOLD,color:'#fff',border:'none',borderRadius:5,fontWeight:700,fontSize:'0.8rem',cursor:'pointer'},
};

// ── Main component ────────────────────────────────────────────────────────────

export default function CalendarModule() {
  const today = todayStr();
  const [status, setStatus]         = useState<Status|null>(null);
  const [events, setEvents]         = useState<CalEvent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<ViewMode>('month');
  const [focusDate, setFocusDate]   = useState(new Date());
  const [showForm, setShowForm]     = useState(false);
  const [form, setFormState]        = useState<NewEventForm>(blankForm());
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CalEvent|null>(null);
  const [deletingId, setDeletingId] = useState<string|null>(null);
  const [syncing, setSyncing]       = useState(false);
  const fetchedRange = useRef<{min: number; max: number} | null>(null);

  const setF = (k: keyof NewEventForm, v: string|boolean) => setFormState(f=>({...f,[k]:v}));

  const loadEventsForDate = useCallback(async (d: Date, force = false) => {
    const winMin = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const winMax = new Date(d.getFullYear(), d.getMonth() + 3, 1);
    const ts     = d.getTime();
    if (!force && fetchedRange.current) {
      const { min, max } = fetchedRange.current;
      if (ts >= min && ts <= max) return; // already cached
    }
    setSyncing(true);
    try {
      const params = new URLSearchParams({
        timeMin: winMin.toISOString(),
        timeMax: winMax.toISOString(),
      });
      const res  = await fetch(`/api/calendar/events?${params}`);
      const data = await res.json() as {items?: CalEvent[]; error?: string};
      if (data.items) {
        setEvents(data.items);
        fetchedRange.current = { min: winMin.getTime(), max: winMax.getTime() };
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const res  = await fetch('/api/calendar/status');
      const data = await res.json() as Status;
      setStatus(data);
      if (data.connected) await loadEventsForDate(new Date());
    } finally {
      setLoading(false);
    }
  }, [loadEventsForDate]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('google_auth_success')) window.history.replaceState({},'',window.location.pathname);
    loadStatus();
  }, [loadStatus]);

  // Re-sync when navigating to a period outside the cached range
  useEffect(() => {
    if (status?.connected) loadEventsForDate(focusDate);
  }, [focusDate, status?.connected, loadEventsForDate]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  function navPrev() {
    setFocusDate(d => {
      if (view === 'month') return addMonths(d, -1);
      if (view === 'week')  return addDays(d, -7);
      return addDays(d, -1);
    });
  }

  function navNext() {
    setFocusDate(d => {
      if (view === 'month') return addMonths(d, 1);
      if (view === 'week')  return addDays(d, 7);
      return addDays(d, 1);
    });
  }

  function periodLabel(): string {
    if (view === 'month') return focusDate.toLocaleDateString([],{month:'long',year:'numeric'});
    if (view === 'week') {
      const ws = startOfWeek(focusDate);
      const we = addDays(ws, 6);
      return `${ws.toLocaleDateString([],{month:'short',day:'numeric'})} – ${we.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'})}`;
    }
    return focusDate.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleSaveEvent() {
    if (!form.summary.trim()) { setFormError('Title is required'); return; }
    setSaving(true); setFormError('');
    try {
      const res  = await fetch('/api/calendar/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data = await res.json() as any;
      if (data.error) { setFormError(data.error); return; }
      setShowForm(false);
      await loadEventsForDate(focusDate, true);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/calendar/events/${encodeURIComponent(id)}`,{method:'DELETE'});
      setEvents(ev=>ev.filter(e=>e.id!==id));
      setSelectedEvent(null);
    } finally { setDeletingId(null); }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Google Calendar & Tasks?')) return;
    await fetch('/api/calendar/auth',{method:'DELETE'});
    setStatus({connected:false,email:null});
    setEvents([]);
  }

  function openNewEvent(date?: string) {
    setFormState(blankForm(date));
    setFormError('');
    setShowForm(true);
  }

  if (loading) return <div style={s.center}><span style={s.subtle}>Loading…</span></div>;

  if (!status?.connected) {
    return (
      <div style={s.center}>
        <div style={s.connectCard}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:8}}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p style={{margin:0,fontSize:'1.05rem',fontWeight:700,color:NAVY}}>Connect Google Calendar</p>
          <p style={{margin:0,fontSize:'0.825rem',color:'#666',maxWidth:300,textAlign:'center'}}>Authorize once to enable both Calendar and Tasks.</p>
          <button style={s.connectBtn} onClick={()=>{window.location.href='/api/calendar/auth/start';}}>Connect with Google</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <button style={s.navBtn} onClick={navPrev}>‹</button>
          <button style={s.navBtn} onClick={navNext}>›</button>
          <button style={s.todayBtn} onClick={()=>setFocusDate(new Date())}>Today</button>
          <span style={s.periodLabel}>{periodLabel()}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <div style={s.viewSwitcher}>
            {(['day','week','month'] as ViewMode[]).map(v=>(
              <button key={v} style={{...s.viewBtn,...(view===v?s.viewBtnActive:{})}}
                onClick={()=>setView(v)}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>
          <button style={s.newBtn} onClick={()=>openNewEvent()}>+ New Event</button>
          <button style={s.disconnectBtn} onClick={()=>loadEventsForDate(focusDate,true)} title="Sync"
            disabled={syncing}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{animation:syncing?'spin 1s linear infinite':'none'}}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button style={s.disconnectBtn} onClick={handleDisconnect} title="Disconnect Google">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {showForm && (
        <NewEventForm form={form} setF={setF} error={formError} saving={saving}
          onSave={handleSaveEvent} onCancel={()=>setShowForm(false)}/>
      )}

      {view === 'month' && (
        <MonthView events={events} focusDate={focusDate} today={today}
          onDayClick={d=>openNewEvent(d)}
          onEventClick={e=>setSelectedEvent(e)}/>
      )}
      {view === 'week' && (
        <WeekView events={events} focusDate={focusDate} today={today}
          onEventClick={e=>setSelectedEvent(e)}/>
      )}
      {view === 'day' && (
        <DayView events={events} focusDate={focusDate} today={today}
          onEventClick={e=>setSelectedEvent(e)}/>
      )}

      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={()=>setSelectedEvent(null)}
          onDelete={handleDelete} deleting={deletingId===selectedEvent.id}/>
      )}
    </div>
  );
}

// inject spin keyframe once
if (typeof document !== 'undefined' && !document.getElementById('cal-spin')) {
  const style = document.createElement('style');
  style.id = 'cal-spin';
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}

const s: Record<string,React.CSSProperties> = {
  page:          {display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'},
  center:        {display:'flex',alignItems:'center',justifyContent:'center',height:'100%'},
  subtle:        {color:'#888',fontSize:'0.875rem'},
  connectCard:   {display:'flex',flexDirection:'column',alignItems:'center',gap:'0.75rem',padding:'3rem 2.5rem',background:'#fff',borderRadius:12,boxShadow:'0 2px 12px rgba(0,0,0,0.08)',maxWidth:360},
  connectBtn:    {marginTop:'0.5rem',padding:'0.65rem 1.75rem',background:NAVY,color:'#fff',border:'none',borderRadius:7,fontWeight:700,fontSize:'0.9rem',cursor:'pointer'},
  topBar:        {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 1.25rem',borderBottom:'1px solid #eee',flexShrink:0,gap:'0.5rem'},
  navBtn:        {background:'none',border:'1px solid #e5e7eb',borderRadius:5,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'1.1rem',color:'#555',fontWeight:700},
  todayBtn:      {padding:'0.3rem 0.75rem',border:'1px solid #e5e7eb',borderRadius:5,background:'#fff',cursor:'pointer',fontSize:'0.78rem',fontWeight:600,color:'#333'},
  periodLabel:   {fontSize:'0.95rem',fontWeight:700,color:NAVY,minWidth:160},
  viewSwitcher:  {display:'flex',border:'1px solid #e5e7eb',borderRadius:6,overflow:'hidden'},
  viewBtn:       {padding:'0.3rem 0.75rem',background:'#fff',border:'none',cursor:'pointer',fontSize:'0.78rem',fontWeight:500,color:'#555',borderRight:'1px solid #e5e7eb'},
  viewBtnActive: {background:NAVY,color:'#fff',fontWeight:700},
  newBtn:        {padding:'0.35rem 0.9rem',background:GOLD,color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:'0.8rem',cursor:'pointer'},
  disconnectBtn: {padding:'0.3rem 0.5rem',background:'#fff',color:'#aaa',border:'1px solid #e5e7eb',borderRadius:5,cursor:'pointer',display:'flex',alignItems:'center'},
};
