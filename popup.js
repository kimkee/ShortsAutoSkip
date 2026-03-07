const i18n = {
  ko: {
    enable: '자동 넘김',
    enableSub: '쇼츠 자동 넘김 ON/OFF',
    count: '반복 횟수',
    countSub: '몇 번 재생 후 넘길까요?',
    footer: 'YouTube Shorts 페이지에서만 동작합니다',
  },
  en: {
    enable: 'Auto Skip',
    enableSub: 'Enable / disable auto skip',
    count: 'Repeat Count',
    countSub: 'How many plays before skipping?',
    footer: 'Only works on YouTube Shorts pages',
  }
};

let lang = 'ko';
let maxPlays = 2;
let enabled = true;

function applyLang() {
  const t = i18n[lang];
  document.getElementById('enableLabel').textContent = t.enable;
  document.getElementById('enableSub').textContent   = t.enableSub;
  document.getElementById('countLabel').textContent  = t.count;
  document.getElementById('countSub').textContent    = t.countSub;
  document.getElementById('footerText').textContent  = t.footer;
  document.getElementById('langBtn').textContent     = lang === 'ko' ? 'EN' : '한';
}

function save() {
  chrome.storage.sync.set({ maxPlays, enabled, lang });
}

// 저장된 설정 불러오기
chrome.storage.sync.get({ maxPlays: 2, enabled: true, lang: 'ko' }, (data) => {
  maxPlays = data.maxPlays;
  enabled  = data.enabled;
  lang     = data.lang;
  document.getElementById('enableToggle').checked = enabled;
  document.getElementById('countNum').textContent = maxPlays;
  applyLang();
});

document.getElementById('enableToggle').addEventListener('change', (e) => {
  enabled = e.target.checked;
  save();
});

document.getElementById('plusBtn').addEventListener('click', () => {
  if (maxPlays < 10) {
    maxPlays++;
    document.getElementById('countNum').textContent = maxPlays;
    save();
  }
});

document.getElementById('minusBtn').addEventListener('click', () => {
  if (maxPlays > 1) {
    maxPlays--;
    document.getElementById('countNum').textContent = maxPlays;
    save();
  }
});

document.getElementById('langBtn').addEventListener('click', () => {
  lang = lang === 'ko' ? 'en' : 'ko';
  applyLang();
  save();
});