/**
 * content.js
 * YouTube Shorts 자동 넘김 핵심 로직
 * - MutationObserver : URL 변경 감지 전담
 * - setInterval 폴링 : video 연결 + 버튼 삽입 상태 주기적 체크
 * - goToNextShort    : ArrowDown 발사 후 URL 변경 확인, 실패 시 최대 5회 재시도
 */
(function () {
  let playCount     = 0;     // 현재 쇼츠 재생 횟수
  let maxPlays      = 1;     // 설정된 최대 재생 횟수
  let lang          = 'en';  // 설정된 언어
  let enabled       = false; // 자동 넘김 ON/OFF
  let video         = null;  // 현재 연결된 <video> 요소
  let lastTime      = 0;     // 이전 프레임의 currentTime
  let skipScheduled = false; // 중복 넘김 방지 플래그
  let watchTimer    = null;  // setInterval 핸들

  // ── 설정값 불러오기 ──────────────────────────
  function loadSettings(cb) {
    chrome.storage.sync.get({ maxPlays: 1, enabled: false, lang: 'en' }, (data) => {
      maxPlays = data.maxPlays;
      enabled  = data.enabled;
      lang     = data.lang;
      chrome.storage.sync.set({ maxPlays: data.maxPlays, enabled: data.enabled, lang: data.lang });
      if (cb) cb();
    });
  }

  // ── 현재 페이지가 Shorts인지 확인 ──────────────
  function isOnShorts() {
    return location.pathname.startsWith('/shorts/');
  }

  // ── 다음 쇼츠로 이동 ────────────────────────────
  // ArrowDown 발사 후 URL 변경 여부 확인 → 미변경 시 최대 5회 재시도
  // (최초 진입 시 YouTube 이벤트 리스너가 늦게 준비되는 경우 대응)
  function goToNextShort() {
    if (skipScheduled) return;
    skipScheduled = true;
    const urlBefore = location.href;

    const trySkip = (attempt) => {
      if (!skipScheduled) return;
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true
      }));
      setTimeout(() => {
        if (location.href !== urlBefore) {
          skipScheduled = false; // URL 바뀜 → 성공
        } else if (attempt < 5) {
          trySkip(attempt + 1);  // URL 그대로 → 재시도
        } else {
          skipScheduled = false; // 5회 초과 → 포기
        }
      }, 400);
    };

    setTimeout(() => trySkip(0), 300);
  }

  // ── 루프 감지: timeupdate 이벤트 핸들러 ────────
  // YouTube Shorts는 loop 속성 사용 → ended 이벤트 미발생
  // 영상 끝(85% 이후) → 처음(0.5초 미만)으로 점프 = 1회 재생 완료
  function onTimeUpdate() {
    if (!enabled || !video) return;
    const dur = video.duration;
    if (!dur || isNaN(dur)) return;

    if (lastTime > dur * 0.85 && video.currentTime < 0.5) {
      playCount++;
      if (playCount >= maxPlays) {
        playCount = 0;
        goToNextShort();
      }
    }
    lastTime = video.currentTime;
  }

  // ── video 요소 탐색 및 이벤트 연결 ──────────────
  function attachVideo() {
    const v =
      document.querySelector('ytd-shorts video') ||
      document.querySelector('ytd-reel-video-renderer video') ||
      document.querySelector('video.html5-main-video');

    if (!v || !document.contains(v)) return; // 없으면 다음 폴링에서 재시도
    if (v === video && document.contains(video)) return; // 이미 정상 연결됨

    if (video) video.removeEventListener('timeupdate', onTimeUpdate);
    video = v;
    playCount = 0;
    lastTime  = 0;
    video.addEventListener('timeupdate', onTimeUpdate);
  }

  // ── 폴링 시작/중지 ───────────────────────────────
  function startWatching() {
    stopWatching();
    watchTimer = setInterval(() => {
      if (!isOnShorts()) { stopWatching(); return; }
      attachVideo();
      injectBtn();
    }, 500);
  }

  function stopWatching() {
    if (watchTimer) { clearInterval(watchTimer); watchTimer = null; }
  }

  // ── 버튼 ON/OFF 상태 업데이트 ───────────────────
  function updateBtnState(btn) {
    if (!btn) return;
    if (enabled) {
      btn.classList.add('on');
      btn.classList.remove('off');
      btn.title = lang === 'ko' ? '자동넘김 중지' : 'Stop Auto-Skip';
    } else {
      btn.classList.add('off');
      btn.classList.remove('on');
      btn.title = lang === 'ko' ? '자동넘김 시작' : 'Start Auto-Skip';
    }
  }

  // ── 버튼바에 자동넘김 버튼 삽입 ─────────────────
  function injectBtn() {
    if (document.getElementById('btn-auto-skip')) return; // 이미 삽입됨

    const bar = document.querySelector('ytd-reel-player-overlay-renderer #button-bar');
    if (!bar) return; // 없으면 다음 폴링에서 재시도

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id   = 'btn-auto-skip';

    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/icon128.png');
    btn.appendChild(img);
    updateBtnState(btn);

    // 클릭 시 enabled 토글 → storage 저장 → 팝업에도 실시간 반영
    btn.addEventListener('click', () => {
      enabled = !enabled;
      chrome.storage.sync.set({ enabled });
      updateBtnState(btn);
    });

    bar.insertBefore(btn, bar.firstChild);
  }

  // ── SPA 네비게이션 감지 — URL 변경 전담 ──────────
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;

    // 이전 video 이벤트 해제 및 초기화
    if (video) video.removeEventListener('timeupdate', onTimeUpdate);
    video = null; playCount = 0; lastTime = 0; skipScheduled = false;

    if (isOnShorts()) {
      attachVideo();            // 즉시 연결 시도 (메모리의 설정값 사용)
      loadSettings(startWatching); // 설정 재확인 후 폴링 시작
    } else {
      stopWatching();
    }
  }).observe(document.documentElement, { subtree: true, childList: true });

  // ── 팝업 설정 변경 실시간 반영 ───────────────────
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.maxPlays)              maxPlays = changes.maxPlays.newValue;
    if (changes.enabled !== undefined) {
      enabled = changes.enabled.newValue;
      updateBtnState(document.getElementById('btn-auto-skip'));
    }
  });

  // ── 초기 실행 ────────────────────────────────────
  loadSettings(() => {
    if (isOnShorts()) startWatching();
  });
})();