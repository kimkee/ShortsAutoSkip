# Shorts AutoSkip

> YouTube Shorts를 설정한 횟수만큼만 재생하고 자동으로 다음 쇼츠로 넘어가는 크롬 익스텐션

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Go%20to%20Store-brightgreen?logo=googlechrome)](https://chromewebstore.google.com/detail/shorts-autoskip/dkipdcdfoioldhfhekoanhkdepclmbca)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange)](https://developer.chrome.com/docs/extensions/mv3/)

--- 

![Promo Image](./screen/promo.png) 

---

## 🎬 소개

YouTube Shorts는 기본적으로 영상이 끝나면 무한 반복 재생됩니다.  
**Shorts AutoSkip**을 사용하면 원하는 횟수만큼만 재생한 뒤 자동으로 다음 쇼츠로 넘어갑니다.

---

## ✨ 주요 기능

- 🔁 **재생 횟수 설정** — 1~10회 자유롭게 설정
- ⚡ **빠른 ON/OFF** — 팝업 창은 물론, **쇼츠 화면 내 버튼**에서도 즉시 ON/OFF 토글 가능
- 🌐 **한국어 / 영어** UI 지원
- 💾 **설정 자동 저장** — 브라우저를 닫아도 설정 유지

---

## 📦 설치 방법

### Chrome 웹 스토어 (설치 권장)
> [스토어 링크 https://chromewebstore.google.com/](https://chromewebstore.google.com/detail/shorts-autoskip/dkipdcdfoioldhfhekoanhkdepclmbca)

### 직접 설치 (개발자 모드)

```bash
# 1. 저장소 클론
git clone https://github.com/kimkee/ShortsAutoSkip.git

# 2. Chrome 주소창에 입력
chrome://extensions

# 3. 개발자 모드 ON

# 4. '압축 해제된 확장 프로그램 로드' → 클론한 폴더 선택
```

---

## 🖥 사용 방법

1. YouTube Shorts 페이지 접속
2. 브라우저 우측 상단 확장 프로그램 아이콘을 클릭하여 원하는 **반복 횟수** 설정 (1~10회)
3. 쇼츠 화면 우측 버튼바 하단에 생성된 **Shorts AutoSkip 버튼**을 클릭하여 빠르게 **자동 넘김 ON/OFF** 토글
4. 설정은 자동으로 저장 및 적용됩니다!

---

## 📁 파일 구조

```
ShortsAutoSkip/
├── manifest.json       # 익스텐션 설정 (Manifest V3)
├── content.js          # 핵심 로직 (쇼츠 감지 · 자동 넘김)
├── popup.html          # 팝업 UI
├── popup.js            # 팝업 동작 스크립트
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔒 개인정보처리방침

본 익스텐션은 **어떠한 개인정보도 수집하지 않습니다.**  
`chrome.storage.sync`를 통해 아래 설정값만 기기 내에 저장합니다.

- 자동 넘김 활성화 여부 (ON/OFF)
- 반복 재생 횟수
- UI 언어 설정

수집된 데이터는 외부 서버로 전송되거나 제3자에게 제공되지 않습니다.

---

## 🛠 기술 스택

| 항목 | 내용 |
|------|------|
| Manifest | V3 |
| 권한 | `storage` |
| 언어 | Vanilla JavaScript |
| 지원 브라우저 | Chrome / Chromium 기반 |

---

## 🐛 문제 신고 / 기능 제안

버그나 개선 사항은 [Issues](https://github.com/kimkee/ShortsAutoSkip/issues) 탭에 등록해 주세요.

---

## 📄 라이선스

[MIT License](LICENSE) © 2025 kimkee

---

## 📬 문의

- GitHub Issues: [https://github.com/kimkee/ShortsAutoSkip/issues](https://github.com/kimkee/ShortsAutoSkip/issues)
- Email: [EMAIL_ADDRESS]
