(function () {
  let playCount = 0;
  let maxPlays = 2;
  let enabled = true;
  let video = null;
  let lastTime = 0;
  let skipScheduled = false;

  // 설정 불러오기
  function loadSettings(cb) {
    chrome.storage.sync.get({ maxPlays: 2, enabled: true }, (data) => {
      maxPlays = data.maxPlays;
      enabled = data.enabled;
      if (cb) cb();
    });
  }

  function isOnShorts() {
    return location.pathname.startsWith('/shorts/');
  }

  // 다음 쇼츠로 이동 (ArrowDown 키 시뮬레이션)
  function goToNextShort() {
    if (skipScheduled) return;
    skipScheduled = true;
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40,
        bubbles: true
      }));
      skipScheduled = false;
    }, 300);
  }

  // timeupdate 이벤트로 루프 감지
  // (YouTube Shorts는 loop 속성 사용 → ended 이벤트 미발생)
  function onTimeUpdate() {
    if (!enabled || !video) return;
    const dur = video.duration;
    if (!dur || isNaN(dur)) return;

    // 영상 끝 부분 → 시작 부분으로 점프 = 1회 재생 완료
    if (lastTime > dur * 0.85 && video.currentTime < 0.5) {
      playCount++;
      if (playCount >= maxPlays) {
        playCount = 0;
        goToNextShort();
      }
    }
    lastTime = video.currentTime;
  }

  // 비디오 요소 연결
  function attachVideo() {
    if (!isOnShorts()) return;

    const v =
      document.querySelector('ytd-shorts video') ||
      document.querySelector('ytd-reel-video-renderer video') ||
      document.querySelector('video.html5-main-video');

    if (!v) {
      setTimeout(attachVideo, 600);
      return;
    }
    if (v === video) return; // 이미 연결됨

    if (video) video.removeEventListener('timeupdate', onTimeUpdate);
    video = v;
    playCount = 0;
    lastTime = 0;
    video.addEventListener('timeupdate', onTimeUpdate);
  }

  // SPA 네비게이션 감지 (URL 변경 감지)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;

    if (video) video.removeEventListener('timeupdate', onTimeUpdate);
    video = null;
    playCount = 0;
    lastTime = 0;

    if (isOnShorts()) loadSettings(attachVideo);
  }).observe(document.documentElement, { subtree: true, childList: true });

  // 팝업에서 설정 변경 시 실시간 반영
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.maxPlays) maxPlays = changes.maxPlays.newValue;
    if (changes.enabled !== undefined) enabled = changes.enabled.newValue;
  });

  // 초기 실행
  loadSettings(() => {
    if (isOnShorts()) attachVideo();
  });
})();