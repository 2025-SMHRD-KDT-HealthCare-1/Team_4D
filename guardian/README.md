# Guardian PWA Guide

## 개요
- 이 문서는 `Team5D/guardian`에만 적용된 PWA 설정과 설치/검증 방법을 설명합니다.
- `admin`에는 PWA 변경을 적용하지 않습니다.

## 사전 조건
- 배포 환경에서는 HTTPS가 필요합니다.
- 로컬 개발은 `npm run dev:guardian` 또는 `cd guardian && npm run dev`로 실행합니다.

## Android Chrome 설치 방법
1. guardian 페이지 접속
2. 하단 설치 배너가 보이면 `설치` 클릭
3. 또는 브라우저 메뉴의 `앱 설치` 사용

## iOS Safari 설치 방법
1. Safari에서 guardian 페이지 접속
2. 공유 버튼(⬆️) 탭
3. `홈 화면에 추가` 선택

## DevTools 확인 방법
1. Chrome DevTools > `Application` 탭
2. `Manifest`에서 이름/아이콘/display 확인
3. `Service Workers`에서 활성화 여부 확인
4. `Storage`에서 캐시/오프라인 리소스 확인

## 배너가 안 뜰 때 점검 체크리스트
- `public/pwa-192x192.png`, `public/pwa-512x512.png`가 404가 아닌지
- `manifest.webmanifest`가 정상 로드되는지
- Service Worker가 activated 상태인지
- `start_url`과 `scope`가 `/`인지
- 이미 설치된 앱이면 Android 설치 배너가 다시 안 뜰 수 있음
