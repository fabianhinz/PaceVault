const SP = (size) =>
  '<svg width="' +
  size +
  '" height="' +
  size +
  '" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/><path d="M5 17A12 12 0 0 1 17 5"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/></svg>';

const HOWTO = "Select a stretch on a session's charts, or ⋯ → Use as reference segment";

const MAP =
  '<div class="fill" style="left:0;top:0;width:760px;height:800px;border-radius:0;background:#e4e4e4"></div>' +
  '<div class="s" style="left:24px;top:770px">map</div>';

const TRACK =
  '<svg style="position:absolute;left:0;top:0" width="760" height="800"><path d="M120 640 C 200 560, 260 520, 320 470 S 420 380, 470 330 S 560 220, 640 160" fill="none" stroke="#999" stroke-width="5"/>' +
  '<path d="M320 470 S 420 380, 470 330 S 520 280, 540 260" fill="none" stroke="#222" stroke-width="8"/></svg>';

const SESSION_HEAD =
  '<div class="fill" style="left:772px;top:118px;width:40px;height:40px"></div>' +
  '<div class="t" style="left:824px;top:116px;font-size:20px;font-weight:600">Flaucher easy</div>' +
  '<div class="s" style="left:824px;top:144px">Sep 10, 2026 · Tempo · 7.8 km · 46m 41s</div>' +
  '<div class="t" style="left:1232px;top:124px;font-size:20px">⋯</div>';

const CHART = (top, name) =>
  '<div class="t" style="left:796px;top:' +
  (top + 16) +
  'px;font-weight:600">' +
  name +
  '</div>' +
  '<svg style="position:absolute;left:880px;top:' +
  (top + 50) +
  'px" width="350" height="110"><path d="M0 70 L40 40 L80 55 L120 30 L160 50 L200 35 L240 60 L280 40 L320 50 L350 45" fill="none" stroke="#555" stroke-width="2"/><line x1="0" y1="105" x2="350" y2="105" stroke="#bbb"/></svg>' +
  '<div class="s" style="left:880px;top:' +
  (top + 164) +
  'px">12:30</div><div class="s" style="left:1196px;top:' +
  (top + 164) +
  'px">16:10</div>';

const SEG_ROW = (left, title, chevron) =>
  '<div class="box" style="left:' +
  left +
  'px;top:150px;width:380px;height:250px"></div>' +
  '<div class="s" style="left:' +
  (left + 50) +
  'px;top:172px">Weather · Training effect · Splits</div>' +
  '<div class="fill" style="left:' +
  (left + 14) +
  'px;top:200px;width:352px;height:30px"></div>' +
  '<div class="t" style="left:' +
  (left + 16) +
  'px;top:262px">' +
  SP(20) +
  '</div>' +
  '<div class="t" style="left:' +
  (left + 50) +
  'px;top:256px;font-weight:600">' +
  title +
  '</div>' +
  '<div class="s" style="left:' +
  (left + 50) +
  'px;top:280px;white-space:normal;width:290px">' +
  HOWTO +
  '</div>' +
  (chevron ? '<div class="t" style="left:' + (left + 352) + 'px;top:262px">›</div>' : '') +
  '<div class="s" style="left:' +
  (left + 50) +
  'px;top:352px">More stats</div>';

window.WIREFRAMES = {
  '02-w1-save-range':
    MAP +
    TRACK +
    '<div class="hint" style="left:790px">Session detail · charts zoomed after a drag</div>' +
    SESSION_HEAD +
    '<div class="box" style="left:768px;top:196px;width:488px;height:560px"></div>' +
    '<div class="pill" style="left:866px;top:218px">' +
    SP(15) +
    ' Save as segment</div>' +
    '<div class="pill" style="left:1052px;top:218px">⌕ Reset zoom</div>' +
    CHART(270, 'Heart Rate') +
    CHART(470, 'Speed'),

  '03-w2-name-dialog':
    '<div class="fill" style="left:0;top:0;width:1280px;height:800px;border-radius:0;background:#bdbdbd"></div>' +
    '<div class="box" style="left:400px;top:210px;width:480px;height:330px;border-radius:14px"></div>' +
    '<div class="t" style="left:424px;top:228px;font-size:18px;font-weight:600">Save as segment</div>' +
    '<div class="t" style="left:846px;top:226px;font-size:18px">✕</div>' +
    '<div class="s" style="left:424px;top:304px">Name</div>' +
    '<div class="box" style="left:424px;top:326px;width:432px;height:44px;border-radius:8px"></div>' +
    '<div class="t" style="left:438px;top:337px;background:#cfd8e6;padding:0 2px">Flaucher easy · km 2.1–3.5</div>' +
    '<div class="s" style="left:424px;top:390px">Running · 1.4 km · +12 m</div>' +
    '<div class="btn" style="left:630px;top:480px">Cancel</div>' +
    '<div class="btn primary" style="left:752px;top:480px">Save</div>',

  '05-w3-session-menu':
    MAP +
    SESSION_HEAD +
    '<div class="box" style="left:768px;top:196px;width:488px;height:420px;background:#f8f8f8"></div>' +
    '<div class="box" style="left:940px;top:176px;width:308px;height:242px;box-shadow:0 6px 20px rgba(0,0,0,.18)"></div>' +
    '<div class="t" style="left:962px;top:198px">⊕  Manage trip</div>' +
    '<div class="t" style="left:962px;top:242px">↝  Edit in Studio</div>' +
    '<div class="t" style="left:962px;top:286px">⤓  Export GPX</div>' +
    '<div class="t" style="left:962px;top:330px;font-weight:600">⟲  Use as reference segment</div>' +
    '<div class="t" style="left:962px;top:376px;text-decoration:underline">🗑  Delete</div>',

  '08-w4-segments-row':
    '<div class="hint" style="left:30px">Segments tab · empty</div>' +
    '<div class="box" style="left:30px;top:80px;width:380px;height:50px"></div>' +
    '<div class="t" style="left:80px;top:94px">Dashboard</div>' +
    '<div class="fill" style="left:222px;top:88px;width:180px;height:34px"></div>' +
    '<div class="t" style="left:280px;top:94px">Segments</div>' +
    '<div class="box" style="left:30px;top:150px;width:380px;height:96px"></div>' +
    '<div class="t" style="left:46px;top:172px">' +
    SP(20) +
    '</div>' +
    '<div class="t" style="left:80px;top:166px;font-weight:600">No segments yet</div>' +
    '<div class="s" style="left:80px;top:190px;white-space:normal;width:310px">' +
    HOWTO +
    '</div>' +
    '<div class="hint" style="left:450px">Session · Segments row · 0 segments</div>' +
    SEG_ROW(450, 'No segments yet', false) +
    '<div class="hint" style="left:870px">Session · Segments row · 3 segments</div>' +
    SEG_ROW(870, '3 segments', true),

  '04-w7-after-save':
    MAP +
    TRACK +
    '<div class="hint" style="left:790px">Segment page right after Save</div>' +
    '<div class="t" style="left:784px;top:60px;font-weight:600">A · matching</div>' +
    '<div class="t" style="left:786px;top:92px">' +
    SP(22) +
    '</div>' +
    '<div class="t" style="left:820px;top:86px;font-size:18px;font-weight:600">Isar bridge sprint</div>' +
    '<div class="s" style="left:820px;top:112px">Running · 575 m · −4 m</div>' +
    '<div class="t" style="left:1228px;top:88px;font-size:18px">⋯</div>' +
    '<div class="s" style="left:820px;top:136px;color:#444">● Finding passes…</div>' +
    '<div class="box" style="left:768px;top:166px;width:488px;height:120px;background:#f8f8f8"></div>' +
    '<div class="fill" style="left:790px;top:184px;width:140px;height:14px"></div>' +
    '<div class="fill" style="left:790px;top:214px;width:444px;height:54px"></div>' +
    '<div class="box" style="left:768px;top:296px;width:488px;height:70px;background:#f8f8f8"></div>' +
    '<div class="fill" style="left:790px;top:314px;width:444px;height:34px"></div>' +
    '<div class="t" style="left:784px;top:396px;font-weight:600">B · 0 matches (only this session)</div>' +
    '<div class="box" style="left:768px;top:426px;width:488px;height:150px"></div>' +
    '<div class="t" style="left:790px;top:440px">Pass times</div>' +
    '<div class="s" style="left:790px;top:462px">1 pass · only this session so far</div>' +
    '<svg style="position:absolute;left:790px;top:486px" width="444" height="40"><line x1="0" y1="20" x2="444" y2="20" stroke="#ccc"/><circle cx="430" cy="20" r="6" fill="#222"/></svg>' +
    '<div class="s" style="left:790px;top:536px">New imports are checked against this segment automatically.</div>' +
    '<div class="t" style="left:784px;top:606px;font-weight:600">C · result</div>' +
    '<div class="box" style="left:768px;top:636px;width:488px;height:140px"></div>' +
    '<div class="t" style="left:790px;top:650px">Pass times</div>' +
    '<div class="s" style="left:790px;top:672px">12 passes</div>' +
    '<svg style="position:absolute;left:790px;top:694px" width="444" height="70"><polyline points="0,40 60,30 120,44 180,28 240,36 300,30 360,40 430,26" fill="none" stroke="#999"/><g fill="#222"><circle cx="20" cy="20" r="4"/><circle cx="80" cy="50" r="4"/><circle cx="150" cy="34" r="4"/><circle cx="210" cy="14" r="4"/><circle cx="280" cy="44" r="4"/><circle cx="340" cy="30" r="4"/><circle cx="400" cy="52" r="4"/><circle cx="430" cy="26" r="5"/></g></svg>',

  '10-w6-map-popup':
    '<div class="fill" style="left:0;top:0;width:1280px;height:800px;border-radius:0;background:#e4e4e4"></div>' +
    '<svg style="position:absolute;left:0;top:0" width="1280" height="800"><path d="M100 700 C 300 600, 420 520, 590 470 S 900 300, 1180 120" fill="none" stroke="#999" stroke-width="5"/><circle cx="590" cy="470" r="9" fill="#222"/></svg>' +
    '<div class="box" style="left:420px;top:240px;width:340px;height:210px;box-shadow:0 6px 20px rgba(0,0,0,.18)"></div>' +
    '<div class="t" style="left:440px;top:252px;font-weight:600">2 segments</div>' +
    '<div class="s" style="left:440px;top:274px">Segments near this location</div>' +
    '<div class="t" style="left:730px;top:252px">✕</div>' +
    '<div class="box" style="left:436px;top:312px;width:308px;height:56px;border-radius:8px"></div>' +
    '<div class="t" style="left:452px;top:322px">Isar bridge sprint</div><div class="s" style="left:452px;top:344px">575 m · −4 m · 93 passes</div><div class="s" style="left:672px;top:330px">Sep 12</div>' +
    '<div class="box" style="left:436px;top:378px;width:308px;height:56px;border-radius:8px"></div>' +
    '<div class="t" style="left:452px;top:388px">Flaucher loop</div><div class="s" style="left:452px;top:410px">7.8 km · +9 m · 39 passes</div><div class="s" style="left:672px;top:396px">Sep 10</div>',

  '12-w5-segment-header':
    MAP +
    '<div class="fill" style="left:772px;top:120px;width:36px;height:40px"></div>' +
    '<div class="t" style="left:820px;top:116px;font-size:20px;font-weight:600">Isar bridge sprint</div>' +
    '<div class="s" style="left:820px;top:146px">Running · 575 m · −4 m</div>' +
    '<div class="t" style="left:1224px;top:122px;font-size:20px">⋯</div>' +
    '<div class="box" style="left:1020px;top:166px;width:226px;height:110px;box-shadow:0 6px 20px rgba(0,0,0,.18);z-index:2"></div>' +
    '<div class="t" style="left:1040px;top:184px;z-index:3">✎  Rename</div>' +
    '<div class="t" style="left:1040px;top:236px;z-index:3;text-decoration:underline">🗑  Delete</div>' +
    '<div class="box" style="left:768px;top:290px;width:488px;height:200px;background:#f8f8f8"></div>' +
    '<div class="s" style="left:790px;top:306px">Pass times · passes · charts (unchanged)</div>',
};
