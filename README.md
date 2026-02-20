# Team5D

## Guardian PWA

Guardian 프론트는 Vite + PWA로 빌드됩니다. SPA 라우팅을 사용하는 환경에서 새로고침(예: /guardian 하위 경로 접근)을 할 경우 서버가 모든 경로를 `index.html`로 리라이트하도록 설정해야 404를 피할 수 있습니다. 배포 시 웹서버에 해당 리라이트 규칙을 추가하세요.
