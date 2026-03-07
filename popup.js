/**
 * popup.js
 * 팝업 UI 동작 스크립트
 * - chrome.storage.sync 로 설정값 저장/불러오기
 * - 한/영 다국어 전환 (i18n 객체 방식)
 */

// ── 다국어 텍스트 정의 ───────────────────────────
const i18n = {
  ko: {
    enable:    '자동 넘김',
    enableSub: '쇼츠 자동 넘김 ON/OFF',
    count:     '반복 횟수',
    countSub:  '몇 번 재생 후 넘길까요?',
    footer:    'YouTube Shorts 페이지에서만 동작합니다',
  },
  en: {
    enable:    'Auto Skip',
    enableSub: 'Enable / disable auto skip',
    count:     'Repeat Count',
    countSub:  'How many plays before skipping?',
    footer:    'Only works on YouTube Shorts pages',
  }
};

let lang     = 'ko'; // 현재 언어
let maxPlays = 2;    // 반복 재생 횟수 (1~10)
let enabled  = true; // 자동 넘김 활성화 여부

// ── UI 텍스트를 현재 언어로 업데이트 ────────────
function applyLang() {
  const t = i18n[lang];
  document.getElementById('enableLabel').textContent = t.enable;
  document.getElementById('enableSub').textContent   = t.enableSub;
  document.getElementById('countLabel').textContent  = t.count;
  document.getElementById('countSub').textContent    = t.countSub;
  document.getElementById('footerText').textContent  = t.footer;
  document.getElementById('langBtn').textContent     = lang === 'ko' ? 'EN' : '한';
}

// ── 설정값을 storage에 저장 ──────────────────────
function save() {
  chrome.storage.sync.set({ maxPlays, enabled, lang });
}

// ── 저장된 설정 불러오기 (팝업 열릴 때 1회 실행) ──
chrome.storage.sync.get({ maxPlays: 2, enabled: true, lang: 'ko' }, (data) => {
  maxPlays = data.maxPlays;
  enabled  = data.enabled;
  lang     = data.lang;
  document.getElementById('enableToggle').checked = enabled;
  document.getElementById('countNum').textContent = maxPlays;
  applyLang();
});

// ── 이벤트 리스너 ────────────────────────────────

// 자동 넘김 토글
document.getElementById('enableToggle').addEventListener('change', (e) => {
  enabled = e.target.checked;
  save();
});

// 횟수 증가 (최대 10)
document.getElementById('plusBtn').addEventListener('click', () => {
  if (maxPlays < 10) {
    maxPlays++;
    document.getElementById('countNum').textContent = maxPlays;
    save();
  }
});

// 횟수 감소 (최소 1)
document.getElementById('minusBtn').addEventListener('click', () => {
  if (maxPlays > 1) {
    maxPlays--;
    document.getElementById('countNum').textContent = maxPlays;
    save();
  }
});

// 한/영 언어 전환
document.getElementById('langBtn').addEventListener('click', () => {
  lang = lang === 'ko' ? 'en' : 'ko';
  applyLang();
  save();
});