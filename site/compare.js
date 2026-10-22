const games = {
  og: {
    href: './og/',
    title: 'OG Snake.io, March 2026, plain JavaScript canvas',
  },
  v2: {
    href: './v2/',
    title: 'Snake.io v2, October 2026, TypeScript canvas',
  },
};

const landing = document.querySelector('#landing');
const footer = document.querySelector('#site-footer');
const versus = document.querySelector('#versus');
const split = document.querySelector('#split');
const hint = document.querySelector('#hint');
const playButton = document.querySelector('#play-versus');
const backButton = document.querySelector('#back');

let hintVisible = true;

function inVersus() {
  return document.body.classList.contains('is-versus');
}

function createPane(side) {
  const pane = document.createElement('div');
  const frame = document.createElement('iframe');
  pane.className = 'pane';
  pane.dataset.side = side;
  frame.className = 'frame';
  frame.src = games[side].href;
  frame.title = games[side].title;
  frame.setAttribute('allow', 'autoplay; fullscreen');
  pane.append(frame);
  pane.addEventListener('pointerenter', () => {
    pane.classList.add('is-hot');
  });
  pane.addEventListener('pointerleave', (event) => {
    if (event.relatedTarget) pane.classList.remove('is-hot');
  });
  return pane;
}

function mountFrames() {
  split.replaceChildren(createPane('og'), createPane('v2'));
}

function clearFrames() {
  split.querySelectorAll('iframe').forEach((frame) => {
    frame.src = 'about:blank';
    frame.remove();
  });
  split.replaceChildren();
}

function enter() {
  if (inVersus()) return;
  document.body.classList.add('is-versus');
  landing.hidden = true;
  footer.hidden = true;
  versus.hidden = false;
  hint.hidden = !hintVisible;
  mountFrames();
  backButton.focus();
}

function leave() {
  if (!inVersus()) return;
  document.body.classList.remove('is-versus');
  document.body.classList.remove('is-swapped');
  clearFrames();
  versus.hidden = true;
  landing.hidden = false;
  footer.hidden = false;
  playButton.focus();
}

function pageUrl() {
  return location.pathname + location.search;
}

function requestEnter() {
  if (location.hash === '#versus') {
    enter();
    return;
  }
  location.hash = 'versus';
}

function requestLeave() {
  if (location.hash === '#versus') {
    history.replaceState(null, '', pageUrl());
  }
  leave();
}

function syncFromUrl() {
  if (location.hash === '#versus') enter();
  else leave();
}

document.querySelector('#play-versus').addEventListener('click', requestEnter);
backButton.addEventListener('click', requestLeave);

document.querySelector('#swap-sides').addEventListener('click', () => {
  document.body.classList.toggle('is-swapped');
});

document.querySelector('#dismiss-hint').addEventListener('click', () => {
  hintVisible = false;
  hint.hidden = true;
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && inVersus()) requestLeave();
});

window.addEventListener('hashchange', syncFromUrl);
window.addEventListener('popstate', syncFromUrl);
syncFromUrl();
