/**
 * content.js
 * YouTube Shorts 자동 넘김 핵심 로직
 * - 쇼츠 URL 감지 → video 요소에 timeupdate 이벤트 연결
 * - 영상 루프 횟수를 카운트해 설정 횟수 도달 시 다음 쇼츠로 이동
 * - MutationObserver로 SPA 네비게이션(URL 변경) 감지
 * - 쇼츠 버튼바(#button-bar)에 자동넘김 토글 버튼 삽입
 */
(function () {
  let playCount     = 0;     // 현재 쇼츠 재생 횟수
  let maxPlays      = 1;     // 설정된 최대 재생 횟수
  let lang          = 'en';  // 설정된 언어
  let enabled       = false; // 자동 넘김 ON/OFF
  let video         = null;  // 현재 연결된 <video> 요소
  let lastTime      = 0;     // 이전 프레임의 currentTime
  let skipScheduled = false; // 중복 넘김 방지 플래그

  // ── 설정값 불러오기 ──────────────────────────
  // 저장된 값이 없으면 기본값으로 초기화 후 storage에 즉시 저장
  function loadSettings(cb) {
    chrome.storage.sync.get({ maxPlays: 1, enabled: false, lang: 'en' }, (data) => {
      maxPlays = data.maxPlays;
      enabled  = data.enabled;
      lang     = data.lang;
      if (cb) cb();
      chrome.storage.sync.set({ maxPlays: data.maxPlays, enabled: data.enabled, lang: data.lang });
    });
  }

  // ── 현재 페이지가 Shorts인지 확인 ──────────────
  function isOnShorts() {
    return location.pathname.startsWith('/shorts/');
  }

  // ── 다음 쇼츠로 이동 (ArrowDown 키 시뮬레이션) ──
  function goToNextShort() {
    if (skipScheduled) return;
    skipScheduled = true;
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true
      }));
      skipScheduled = false;
    }, 300);
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
    if (!isOnShorts()) return;

    // YouTube 구조 변경에 대비한 다중 셀렉터
    const v =
      document.querySelector('ytd-shorts video') ||
      document.querySelector('ytd-reel-video-renderer video') ||
      document.querySelector('video.html5-main-video');

    if (!v) { setTimeout(attachVideo, 600); return; } // 아직 DOM에 없으면 재시도
    if (v === video) return;                           // 이미 연결된 요소면 스킵

    // 기존 이벤트 해제 후 새 video에 연결
    if (video) video.removeEventListener('timeupdate', onTimeUpdate);
    video = v;
    playCount = 0;
    lastTime  = 0;
    video.addEventListener('timeupdate', onTimeUpdate);
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
    if (!isOnShorts()) return;
    if (document.getElementById('btn-auto-skip')) return; // 이미 삽입됨

    // #button-bar 탐색 (ytd-reel-player-overlay-renderer 안에 위치)
    const bar = document.querySelector('ytd-reel-player-overlay-renderer #button-bar');
    if (!bar) { setTimeout(injectBtn, 600); return; }

    // 버튼 생성
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

    // 버튼바 맨 앞에 삽입
    bar.insertBefore(btn, bar.firstChild);
  }

  // ── SPA 네비게이션 감지 (URL 변경 모니터링) ──────
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;

    if (video) video.removeEventListener('timeupdate', onTimeUpdate);
    video = null; playCount = 0; lastTime = 0;

    if (isOnShorts()) loadSettings(() => { attachVideo(); injectBtn(); });
  }).observe(document.documentElement, { subtree: true, childList: true });

  // ── 팝업 설정 변경 실시간 반영 ───────────────────
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.maxPlays)              maxPlays = changes.maxPlays.newValue;
    if (changes.enabled !== undefined) {
      enabled = changes.enabled.newValue;
      updateBtnState(document.getElementById('btn-auto-skip')); // 버튼 상태도 동기화
    }
  });

  // ── 초기 실행 ────────────────────────────────────
  loadSettings(() => {
    if (isOnShorts()) { attachVideo(); injectBtn(); }
  });
})();