// Receives MajlisSnapshot messages from the Mknon iOS handler over a custom
// Cast namespace and renders the public-only Letters monitor view.
//
// On a real Chromecast: cast_receiver_framework.js boots the CAF context,
// we register a message listener, and the SDK takes over the splash/ready
// lifecycle.
//
// In a regular browser (for local dev — see local-dev.html), CAF is absent
// so we expose `window.applyMajlisSnapshot(json)` and skip the SDK init.

const NAMESPACE = 'urn:x-cast:app.mknon.majlis.letters';

const els = {
  status: document.getElementById('status'),
  player1Name: document.querySelector('#player1 .name'),
  player1Score: document.querySelector('#player1 .score'),
  player2Name: document.querySelector('#player2 .name'),
  player2Score: document.querySelector('#player2 .score'),
  player1: document.getElementById('player1'),
  player2: document.getElementById('player2'),
  banner: document.getElementById('banner'),
  bannerName: document.getElementById('banner-name'),
  board: document.getElementById('board'),
};

function render(snap) {
  els.status.textContent = 'متصل';
  els.status.classList.add('connected');

  els.player1Name.textContent = snap.player1?.name ?? '—';
  els.player1Score.textContent = snap.player1?.score ?? 0;
  els.player2Name.textContent = snap.player2?.name ?? '—';
  els.player2Score.textContent = snap.player2?.score ?? 0;

  const isPlayer1Turn = snap.currentPlayerIndex === 0;
  els.player1.classList.toggle('active', isPlayer1Turn && !snap.winnerIndex);
  els.player2.classList.toggle('active', !isPlayer1Turn && !snap.winnerIndex);

  if (snap.isQuestionOpen) {
    const name = isPlayer1Turn ? snap.player1?.name : snap.player2?.name;
    els.bannerName.textContent = name ?? '';
    els.banner.classList.remove('hidden');
  } else {
    els.banner.classList.add('hidden');
  }

  renderBoard(snap.grid ?? [], snap.winningPath ?? [], snap.selectedCellIndex);
}

function renderBoard(grid, winningPath, selectedIndex) {
  const winSet = new Set(winningPath);
  const letters = grid.filter((c) => c.type === 'letter');
  letters.sort((a, b) => (a.row - b.row) || (a.col - b.col));

  els.board.innerHTML = '';
  for (const c of letters) {
    const div = document.createElement('div');
    div.className = 'cell';
    if (c.status === 'player1Owned') div.classList.add('p1');
    else if (c.status === 'player2Owned') div.classList.add('p2');
    if (selectedIndex != null && c.index === selectedIndex) {
      div.classList.add('selected');
    }
    if (winSet.has(c.index)) div.classList.add('win');
    div.textContent = c.letter;
    els.board.appendChild(div);
  }
}

function safeApply(raw) {
  try {
    const snap = typeof raw === 'string' ? JSON.parse(raw) : raw;
    render(snap);
  } catch (e) {
    console.error('Failed to apply snapshot', e, raw);
  }
}

// Exposed for local-dev preview where CAF isn't present.
window.applyMajlisSnapshot = safeApply;

// CAF init — only on a real Cast device or the official simulator.
if (typeof cast !== 'undefined' && cast?.framework?.CastReceiverContext) {
  const context = cast.framework.CastReceiverContext.getInstance();
  const options = new cast.framework.CastReceiverOptions();
  options.disableIdleTimeout = true;
  context.addCustomMessageListener(NAMESPACE, (event) => {
    safeApply(event.data);
  });
  context.start(options);
} else {
  els.status.textContent = 'وضع المعاينة (المتصفح) — CAF غير محمَّل';
}
