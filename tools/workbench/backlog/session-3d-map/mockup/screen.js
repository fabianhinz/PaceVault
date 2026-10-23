/* Frame orchestrator: state from the shell; chart scrub moves the chart cursor and the map dot (both
   jump to the record under the cursor, as today). */
(() => {
  const PV = window.PV;
  PV.cursorTime = null;
  let lastScenario = null;

  PV.questionState = (id) => {
    const list = parent.PVQuestions;
    if (!Array.isArray(list)) return undefined;
    const q = list.find((x) => x.id === id);
    return q && q.state === 'open' ? 'open' : 'settled';
  };

  PV.scrub = (time) => {
    PV.cursorTime = time;
    PV.paintCursor();
    const lap = PV.lapAtRecord(PV.session, PV.indexAtTime(PV.session, time));
    const hovered = lap === undefined ? null : lap; // SessionChartsExplorer onHover → setHoveredLap
    if (hovered !== PV.lap.hovered) {
      PV.lap.hovered = hovered;
      PV.paintLapStrip();
    }
    PV.maps.paint();
  };
  PV.scrubEnd = () => {
    PV.cursorTime = null;
    PV.lap.hovered = null;
    PV.paintCursor();
    PV.paintLapStrip();
    PV.maps.paint();
  };

  const render = (st) => {
    PV.state = { ...st };
    if (st.scenario !== lastScenario) {
      lastScenario = st.scenario;
      PV.session = PV.buildSession(st.scenario);
      PV.cursorTime = null;
        PV.lap.selected = null;
      PV.lap.hovered = null;
    }
    PV.renderUi(st);
    PV.maps.update(st);
  };

  /* One-way state (owner rule): toolbar (MockupShell) → both frames. In-frame interactions write a
     frame-local override; a toolbar change of the same key drops the override in both frames. */
  PV.local = {};
  let lastShell = {};
  const merged = () => ({ ...lastShell, ...PV.local });
  PV.setLocal = (values) => {
    PV.local = { ...PV.local, ...values };
    render(merged());
  };
  const fromShell = (st) => {
    const next = { ...st };
    const local = { ...PV.local };
    for (const k of Object.keys(next)) if (next[k] !== lastShell[k]) delete local[k];
    PV.local = local;
    lastShell = next;
    render(merged());
  };

  const start = () => {
    PV.maps.init();
    addEventListener('resize', () => {
      if (PV.state) PV.maps.update(PV.state);
    });
    parent.MockupShell.onChange((st) => {
      try {
        fromShell(st);
      } catch (err) {
        console.error('frame render', err);
      }
    });
  };
  const wait = () => {
    if (parent.MockupShell && window.maplibregl && window.deck && window.PV_TRACKS && window.PV_DARK_MATTER) start();
    else setTimeout(wait, 30);
  };
  wait();
})();
