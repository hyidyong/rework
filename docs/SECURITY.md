# Security model

## 보호 대상과 신뢰 경계

보호 대상은 업로드된 연구계획서 원문, 최종 논문, 사용자 식별자, Supabase service-role key, 데이터 암호화 키, 모델·MCP 자격 증명입니다. 브라우저는 비신뢰 경계이며 publishable key와 소유자에게 허용된 RLS 데이터만 받습니다. Next.js route handler와 worker만 service-role key 및 복호화 키를 사용합니다.

## 적용된 통제

- 모든 앱 테이블에 RLS를 활성화하고 `owner_id = (select auth.uid())` 소유권 정책을 적용했습니다. Worker 권한은 service role로 분리하며 큐 claim 함수는 일반 역할에서 실행할 수 없습니다.
- 업로드 원본은 private Storage bucket에 저장되고 경로의 첫 segment가 사용자 UUID와 일치해야 합니다.
- 계획서 추출문과 최종 Markdown은 AES-256-GCM으로 암호화합니다. 매 암호문에 96-bit random IV와 인증 태그를 쓰고, 사용자·계획서 식별자를 AAD로 결합해 바꿔치기를 탐지합니다.
- 요청마다 서버가 Supabase Auth로 사용자를 재검증합니다. 상태 변경 POST는 same-origin을 검사하고 PDF/DOCX signature, MIME, 확장자, 최대 20 MiB, UTF-8 및 추출문 크기를 검증합니다.
- 공개 Realtime 이벤트는 허용 필드만 직렬화하고 bearer token, 이메일, confidential metadata와 원문을 제거합니다. 암호화 원문·원고 컬럼은 Realtime publication에 포함하지 않습니다.
- 모델 출력과 외부 연구 메타데이터는 Zod 스키마로 검증합니다. DOI를 정규화해 중복을 제거하고 확인할 수 없는 출처를 최종 인용 근거로 사용하지 않습니다.
- MCP는 HTTPS와 호스트 allowlist를 요구하고 기본적으로 도구 승인을 요청합니다. 동적 스킬 로더는 크기, SHA-256, 역할 호환성을 확인하는 prompt-only manifest만 허용하며 원격 실행 파일을 설치하지 않습니다.
- `.env`와 로컬 Supabase 상태는 `.gitignore` 대상입니다. GitHub Actions의 Gitleaks와 dependency audit가 푸시·PR을 검사합니다.

## 로컬 네트워크 주의사항

Supabase CLI 개발 포트는 로컬 개발용입니다. 같은 LAN의 비신뢰 장치가 접근하지 못하도록 Windows 방화벽을 유지하고 54321–54324, 54322 포트를 라우터나 공인 인터넷에 포워딩하지 마십시오. Studio/pgMeta를 공용 서비스처럼 노출하면 안 됩니다. 원격 운영이 필요하면 로컬 키를 재사용하지 말고 별도 호스팅 환경과 TLS, 접근 제어, secret manager를 구성해야 합니다.

## 의존성 감사 기록

2026-07-17 기준 `npm audit`은 high/critical 0건, moderate 2건을 보고합니다. 두 항목은 현재 Next.js가 내부적으로 사용하는 PostCSS `<8.5.10`의 upstream advisory에서 파생됩니다. `npm audit fix --force`가 제안하는 Next.js 9로의 강제 downgrade는 보안·호환성을 악화시키므로 적용하지 않았습니다. 이 애플리케이션은 사용자가 제공한 CSS를 컴파일하지 않아 알려진 공격 경로를 제한하며, Next.js가 수정된 PostCSS를 채택하면 즉시 업데이트합니다. CI는 high 이상을 차단하고 정기적으로 moderate 상태도 재검토해야 합니다.

## 사고 대응

비밀 노출이 의심되면 `.env`의 모델/MCP 키를 발급처에서 폐기·재발급하고 `npm run supabase:stop` 후 로컬 Supabase 스택을 재생성하며 `DATA_ENCRYPTION_KEY` 변경 시 기존 암호문을 안전하게 마이그레이션합니다. Git에 비밀이 들어갔다면 커밋 삭제만으로 충분하지 않으므로 먼저 자격 증명을 회전하고 저장소 관리자에게 기록 정리를 요청합니다.
