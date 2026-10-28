'use strict';
const cards = document.getElementById('cards');
const searchInput = document.getElementById('searchInput');
const count = document.getElementById('resultCount');
const empty = document.getElementById('empty');
const error = document.getElementById('error');
const filterButtons = [...document.querySelectorAll('[data-agency]')];
let articles = [];
let agency = '전체';

function summaryOf(text) {
  // 원문 마크다운 제목·강조 기호만 화면 요약에서 제거 (원문은 그대로 보존)
  const clean = String(text || '').replace(/^\s*#+\s+.*$/gm, '').replace(/\*\*/g, '').replace(/^\s*---\s*$/gm, '').replace(/\s+/g, ' ').trim();
  return clean.length > 155 ? clean.slice(0, 155) + '…' : clean;
}
function createCard(article) {
  const item = document.createElement('article');
  item.className = 'article';
  const top = document.createElement('div'); top.className = 'article-top';
  const tag = document.createElement('span'); tag.className = 'agency'; tag.textContent = article['부처'];
  const number = document.createElement('span'); number.className = 'article-num'; number.textContent = `자료 ${article['번호']}`;
  top.append(tag, number);
  const title = document.createElement('h3'); title.textContent = article['제목'];
  const summary = document.createElement('p'); summary.className = 'summary'; summary.textContent = summaryOf(article['본문']);
  const details = document.createElement('details');
  const toggle = document.createElement('summary'); toggle.textContent = '원문 보기';
  const full = document.createElement('div'); full.className = 'fulltext'; full.textContent = article['본문'];
  details.append(toggle, full);
  item.append(top, title, summary, details);
  return item;
}
function render() {
  const query = searchInput.value.trim().toLocaleLowerCase('ko');
  const matches = articles.filter(a => (agency === '전체' || a['부처'] === agency) &&
    [a['부처'], a['제목'], a['본문']].some(v => String(v ?? '').toLocaleLowerCase('ko').includes(query)));
  cards.replaceChildren(...matches.map(createCard));
  count.textContent = `결과 ${matches.length}건`;
  empty.hidden = matches.length !== 0;
}
searchInput.addEventListener('input', render);
document.getElementById('clearButton').addEventListener('click', () => {
  searchInput.value = ''; agency = '전체';
  filterButtons.forEach(b => { const active = b.dataset.agency === '전체'; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  render(); searchInput.focus();
});
filterButtons.forEach(button => button.addEventListener('click', () => {
  agency = button.dataset.agency;
  filterButtons.forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  render();
}));
document.getElementById('externalImage').addEventListener('error', () => {
  document.getElementById('imageError').hidden = false;
});
// file:// 직접 열기에서는 fetch(JSON)가 차단될 수 있으므로 data.js를 우선 사용합니다.
// Netlify 등 HTTP 환경에서는 JSON 원본을 먼저 읽고, 실패 시 data.js로 복구합니다.
function applyData(data) {
  if (!Array.isArray(data) || !data.every(a => ['번호', '부처', '제목', '본문'].every(k => k in a))) {
    throw new Error('보도자료 데이터 구조가 올바르지 않습니다.');
  }
  articles = data;
  error.hidden = true;
  render();
}
const fallback = window.PRESS_RELEASE_DATA;
if (location.protocol === 'file:') {
  try { applyData(fallback); }
  catch (err) { error.hidden = false; error.textContent = '로컬 데이터 파일(data.js)을 확인하세요: ' + err.message; count.textContent = '불러오기 실패'; }
} else {
  fetch('./보도자료데이터.json', { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
    .then(applyData)
    .catch(err => {
      try { applyData(fallback); }
      catch (_) { error.hidden = false; error.textContent = '데이터를 불러오지 못했습니다: ' + err.message; count.textContent = '불러오기 실패'; }
    });
}
