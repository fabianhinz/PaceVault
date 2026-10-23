/* Host page glue: questions for the in-frame badges, Color-by options per session. */
(() => {
  const shell = window.MockupShell;
  const frames = () => [...document.querySelectorAll('iframe.ms-screen')].map((f) => f.contentWindow);

  window.PVQuestions = undefined;
  if (location.protocol.startsWith('http'))
  fetch(new URL('../questions.json', location.href), { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((list) => {
      window.PVQuestions = Array.isArray(list) ? list : null;
      shell.set('lang', shell.state.lang);
    })
    .catch(() => {
      window.PVQuestions = null;
    });

  // Color-by options per session: the FIT run has power, the demo run has none
  const ULTRA = [
    { id: 'sport', label: 'Sport color' },
    { id: 'hr', label: 'HR zones' },
    { id: 'power', label: 'Power zones' },
    { id: 'pace', label: 'Pace zones' },
    { id: 'speed', label: 'Speed' },
  ];
  const RUN = [
    { id: 'sport', label: 'Sport color' },
    { id: 'hr', label: 'HR zones' },
    { id: 'pace', label: 'Pace zones' },
    { id: 'speed', label: 'Speed' },
  ];
  let session = 'ultra';
  shell.onChange((st) => {
    const next = st.scenario === 'flat' ? 'flat' : 'ultra';
    if (next !== session) {
      session = next;
      shell.setOptions('colorBy', next === 'flat' ? RUN : ULTRA);
    }
  });



})();
