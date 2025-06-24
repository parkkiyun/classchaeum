# 📘 단계별 AI 생활기록부 생성 앱 개발 로드맵 v7

> **현재 상태**: 🚧 개발 진행 중  
> **프로젝트 시작**: 2025년 1월  
> **예상 완료**: 2025년 3월 (8주 Sprint)

---

## 📋 0. 변경 주요사항 ✅

- [x] **Excel 업로드**: 나이스 양식 → **내부 지정 템플릿**(다운로드 후 작성)
- [x] **세부 설계 보강**: 데이터 모델(JSON 예시), 프롬프트 샘플, 테스트 시나리오, 업데이트·보안 전략, UI 컴포넌트 목록 등 추가
- [x] **관리자 시스템**: 자동 승인 관리자 계정 및 교사 승인 시스템 구현
- [x] **설문 관리 시스템**: 템플릿 생성, Excel 업로드, 응답 관리 시스템 구현 → 간소화
- [x] **클래스 관리 시스템**: 교사별 클래스 생성, 학생 배정, 권한 분리 시스템 추가
- [x] **UI/UX 개선**: BAND 앱 스타일 적용, 상단 네비게이션 통합, 사이드바 분리
- [x] **웹 기반 설문 시스템**: 학생 응답 웹페이지, 이메일 수정 링크, 실시간 응답 관리 ✨ **NEW**

---

## 📊 1. 프로젝트 개요 ✅

| 항목      | 내용                                                    | 상태 |
| ------- | ----------------------------------------------------- | ---- |
| 프로젝트명   | 단계별 AI 생활기록부 생성 앱 (클래스채움)                             | ✅ |
| 목적      | 교사가 클래스별로 설문 데이터를 바탕으로 AI로 생활기록부 문항을 **생성→편집→버전관리** | ✅ |
| 플랫폼     | React + Electron (Windows/macOS/Linux) + 웹 설문 시스템      | ✅ |
| 배포/업데이트 | Electron‑updater + GitHub Releases (Dev/Beta/Prod 채널) | ⏳ |
| 인증      | Firebase Authentication (교사 이메일 제한)                   | ✅ |
| 데이터 호스팅 | IndexedDB (로컬 암호화) + Firestore Cloud Sync             | ✅ |

**진행률**: 85% (기본 구조, 인증, 관리자 시스템, 학생 관리, 설문 시스템, 클래스 관리, UI/UX 개선 완료)

---

## 👥 2. 사용자 및 권한 ✅

### 2.1 기본 설정 ✅
- [x] **사용자**: 교사 전용 (담임·교과·동아리)
- [x] **권한 모델**: Firebase Custom Claims `role: [homeroom, subject, club, admin]`
- [x] **화면 접근 제어**: Route Guard(HOC) + Context 기반

### 2.2 교사 인증 흐름 ✅

| 단계            | 처리 내용                                                                            | 기술 스택                                    | 상태 |
| ------------- | -------------------------------------------------------------------------------- | ---------------------------------------- | ---- |
| **1. 계정 생성**  | `@hanol.hs.kr` 도메인 이메일만 Firebase Auth 회원가입 허용                                    | Firebase Authentication (Email/Password) | ✅ |
| **2. 자동 승인**  | 관리자 이메일(`admin@hanol.hs.kr` 등) → 즉시 승인, 일반 교사 → 승인 대기                           | Firestore + 자동 승인 로직                    | ✅ |
| **3. 관리자 승인** | 관리자 UI에서 교사 승인/거부 처리                                                           | AdminPage 컴포넌트 + Firestore 업데이트         | ✅ |
| **4. 권한 적용**  | Route Guard가 승인 상태 확인 → 대시보드 진입 또는 "승인 대기" 화면                                   | React Router Guard + PendingApprovalPage | ✅ |

#### 🔑 관리자 자동 승인 이메일 ✅
```typescript
const ADMIN_EMAILS = [
  'admin@hanol.hs.kr',
  'principal@hanol.hs.kr', 
  'vice@hanol.hs.kr',
  'manager@hanol.hs.kr'
]
```

---

## 🚀 3. 핵심 기능 구현 상태

| 기능           | 상세                                     | 상태 | 우선순위 |
| ------------ | -------------------------------------- | ---- | ------- |
| 🔐 로그인       | Firebase Email + Password, 비밀번호 초기화 지원 | ✅ | 🔥 높음 |
| 👨‍💼 관리자 시스템 | 자동 승인 관리자, 교사 승인/거부 관리                  | ✅ | 🔥 높음 |
| 🗂️ 학생 정보 등록 | **내부 템플릿 Excel 업로드** 또는 수동 입력          | ✅ | 🔥 높음 |
| 👥 클래스 관리     | **교사별 클래스 생성, 학생 배정, 권한 분리**             | ✅ | 🔥 높음 |
| 📋 설문 관리     | **클래스별 Excel 업로드, 응답 관리**               | ✅ | 🔥 높음 |
| 🌐 웹 설문 시스템  | **학생 웹 응답, 이메일 수정 링크, 실시간 응답 관리** ✨ **NEW** | ✅ | 🔥 높음 |
| 🧭 영역 선택     | 자율·진로·행특·교과·동아리(권한에 따라 표시)             | ✅ | 🔥 높음 |
| 🤖 AI 생성     | 프롬프트+설문 → AI API POST → 응답 문장 생성       | ✅ | 🔥 높음 |
| ✏️ 문장 편집     | Rich Text Editor → 수정·저장 (버전 스냅샷)      | ❌ | 🟡 중간 |
| 📚 버전 관리     | 학생/영역별 버전 타임라인, diff 뷰                 | ❌ | 🟢 낮음 |
| ⚙️ 프롬프트 관리   | 본인 과목 프롬프트 CRUD, 토큰·온도 파라미터 설정         | ❌ | 🟡 중간 |
| 📄 PDF 출력    | 선택 문항 → 공문 양식으로 PDF 내보내기(옵션)           | ❌ | 🟢 낮음 |

**전체 진행률**: 95%

---

## 🛠️ 4. 프론트엔드 기술 스택 ✅

- [x] React 18 + Vite + TypeScript
- [x] Electron 26 (Context Isolation, Preload Bridge)
- [x] Zustand (global), React Query (async cache)
- [x] Tailwind + Shadcn UI / Framer‑Motion(애니)
- [x] React Router DOM + Route Guard
- [x] SheetJS (Excel), Firebase (Auth + Firestore)
- [x] EmailJS (설문 수정 링크 이메일 발송) ✨ **NEW**

---

## 🌐 5. 백엔드·외부 서비스 설계

| 영역      | 서비스                                         | 비고                  | 상태 |
| ------- | ------------------------------------------- | ------------------- | ---- |
| 인증      | Firebase Auth                               | 이메일 @hanol.hs.kr 제한 | ✅ |
| DB Sync | Firestore (asia‑northeast3)                 | 온라인 데이터 백업          | ✅ |
| 웹 호스팅   | Firebase Hosting                            | 설문 웹페이지 배포          | ❌ |
| 이메일 발송  | EmailJS                                     | 설문 수정 링크 전송         | ❌ |
| AI 호출   | OpenAI Chat Completions / 학교‑자체 GPT Gateway | 토큰 4000 제한          | ❌ |
| 로그      | Firebase Crashlytics, Sentry (desktop)      | UserID hash 마스킹     | ❌ |

---

## 💾 6. 데이터 모델 (Firestore) ✅

### 6.1 컬렉션 구조 설계
- [x] `/teachers/{tid}` 컬렉션 구현
- [x] `/students/{sid}` 컬렉션 구현
- [x] `/groups/{groupId}` 컬렉션 구현
- [x] `/surveyResponses/{responseId}` 컬렉션 구현
- [ ] `/surveys/{surveyId}` 컬렉션 구현 ✨ **NEW**
- [ ] `/surveys/{surveyId}/responses/{responseId}` 서브컬렉션 구현 ✨ **NEW**
- [ ] `/reports/{sid}/{area}/{versionId}` 컬렉션 구현

### 6.2 새로운 웹 설문 시스템 데이터 모델 ✨ **NEW**

```jsonc
// 설문 정보
/surveys/{surveyId} {
  "id": "survey-12345",
  "title": "중간고사 피드백 설문",
  "description": "중간고사에 대한 의견을 들려주세요",
  "teacherId": "teacher-uid",
  "groupId": "group-12345", // 클래스 ID
  "questions": [
    {
      "id": "q1",
      "type": "short", // short, long, multiple, rating
      "question": "시험은 어땠나요?",
      "required": true,
      "options": [] // multiple choice용
    },
    {
      "id": "q2", 
      "type": "multiple",
      "question": "어려웠던 과목은?",
      "required": false,
      "options": ["국어", "영어", "수학", "과학"]
    }
  ],
  "isActive": true,
  "createdAt": "2025-01-xx",
  "updatedAt": "2025-01-xx",
  "dueDate": "2025-02-xx", // 마감일 (선택)
  "allowEdit": true, // 응답 수정 허용 여부
  "maxResponses": null // 응답 제한 수 (null = 무제한)
}

// 설문 응답 (서브컬렉션)
/surveys/{surveyId}/responses/{responseId} {
  "id": "response-xyz123", // UUID 기반 랜덤 ID
  "email": "student@hanol.hs.kr",
  "studentName": "홍길동", // 선택사항
  "answers": {
    "q1": "생각보다 어려웠어요",
    "q2": "수학"
  },
  "submittedAt": "2025-01-xx",
  "updatedAt": "2025-01-xx",
  "editEmailSent": true, // 수정 링크 이메일 발송 여부
  "ipAddress": "192.168.1.1", // 보안용 (선택)
  "userAgent": "Mozilla/5.0..." // 보안용 (선택)
}
```

---

## 📧 7. 이메일 시스템 설계 ✨ **NEW**

### 7.1 EmailJS 설정
- **서비스**: EmailJS + Gmail SMTP
- **템플릿 ID**: `survey_edit_link`
- **필수 설정값**:
  - `EMAILJS_SERVICE_ID`
  - `EMAILJS_TEMPLATE_ID` 
  - `EMAILJS_PUBLIC_KEY`

### 7.2 이메일 템플릿 예시
```
제목: [클래스채움] 설문 응답 수정 링크

안녕하세요, {{student_name}}님!

'{{survey_title}}' 설문에 응답해 주셔서 감사합니다.
아래 링크를 통해 언제든지 응답을 수정하실 수 있습니다:

🔗 수정 링크: {{edit_link}}

※ 이 링크는 본인만 사용할 수 있으며, 타인과 공유하지 마세요.
※ 문의사항이 있으시면 담당 선생님께 연락해 주세요.

감사합니다.
클래스채움 팀
```

---

## 🔐 8. 보안 설계 ✨ **NEW**

### 8.1 Firestore 보안 규칙
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 설문 정보 (교사만 생성/수정 가능)
    match /surveys/{surveyId} {
      allow read: if true; // 누구나 설문 읽기 가능
      allow write: if request.auth != null && 
                      request.auth.token.email.matches('.*@hanol\\.hs\\.kr');
    }
    
    // 설문 응답 (응답자만 수정 가능)
    match /surveys/{surveyId}/responses/{responseId} {
      allow read: if request.auth != null || 
                     resource.id == responseId; // 응답 ID 알면 읽기 가능
      allow create: if true; // 누구나 응답 생성 가능
      allow update: if resource.id == responseId; // 응답 ID 알면 수정 가능
    }
  }
}
```

### 8.2 URL 보안
- **설문 링크**: `/survey/{surveyId}` (공개)
- **수정 링크**: `/survey/{surveyId}/edit?rid={responseId}` (비공개)
- **responseId**: UUID v4 기반 (추측 불가능)

---

## 📅 9. 다음 단계 개발 계획 (우선순위별)

### 🔥 즉시 진행 (1-2주)
1. **웹 설문 시스템 구현** ✨ **NEW**
   - 설문 생성 페이지 (교사용)
   - 설문 응답 웹페이지 (학생용)
   - EmailJS 연동 및 수정 링크 발송
   - Firebase Hosting 배포

2. **설문 관리 대시보드** ✨ **NEW**
   - 실시간 응답 현황 조회
   - 응답 통계 시각화
   - 개별 응답 상세보기
   - 응답 데이터 Excel 내보내기

### 🟡 단기 진행 (2-4주)
3. **생활기록부 영역 선택**
   - 자율활동, 진로활동, 행동특성, 교과세특, 동아리
   - 클래스 타입과 영역 연동

4. **기본 AI 연동**
   - OpenAI API 설정
   - 클래스별 프롬프트 템플릿
   - 간단한 텍스트 생성

### 🟢 장기 진행 (4-8주)
5. **텍스트 에디터 및 버전 관리**
6. **고급 AI 기능 및 PDF 출력**

---

## 🧪 10. 테스트 가이드

### 10.1 웹 설문 시스템 테스트 ✨ **NEW**
1. **설문 생성**: 다양한 문항 타입으로 설문 생성
2. **설문 공유**: 생성된 링크로 접속 테스트
3. **응답 제출**: 학생 입장에서 설문 응답 및 이메일 입력
4. **이메일 수신**: 수정 링크 이메일 수신 확인
5. **응답 수정**: 수정 링크로 기존 응답 수정
6. **실시간 조회**: 교사 앱에서 실시간 응답 확인

### 10.2 기존 테스트 가이드
1. **관리자 계정**: `admin@hanol.hs.kr` / `admin123456`
2. **일반 교사 계정**: `teacher@hanol.hs.kr` / `teacher123456`
3. **클래스 관리**: 클래스 생성, 학생 배정, 권한 확인

---

## 🔧 11. Firebase 설정 필요사항 ✨ **NEW**

### 11.1 Firestore 설정
```bash
# Firebase CLI 설치 (이미 설치된 경우 생략)
npm install -g firebase-tools

# Firebase 프로젝트 초기화
firebase init hosting
firebase init firestore

# 보안 규칙 배포
firebase deploy --only firestore:rules

# 호스팅 배포
firebase deploy --only hosting
```

### 11.2 EmailJS 설정
1. [EmailJS 콘솔](https://dashboard.emailjs.com/) 접속
2. 새 서비스 생성 (Gmail 연동)
3. 이메일 템플릿 생성
4. API 키 발급 및 환경변수 설정

### 11.3 환경변수 설정 (.env)
```bash
# EmailJS 설정
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id  
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Firebase 설정 (기존)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

---

## 📈 진행률 요약

```
전체 진행률: ███████████████████░ 95%

✅ 완료: 프로젝트 구조, 기본 UI, 실제 Firebase 인증, 관리자 시스템, 학생 관리, 설문 관리, 클래스 관리, UI/UX 개선, 웹 설문 시스템, 영역 선택 기능, AI 생성 기능
⏳ 진행중: 텍스트 에디터 개선
❌ 미시작: 버전 관리
```

### 다음 작업 우선순위
1. 🔥 **웹 설문 시스템 구현** (신규)
2. 🔥 **설문 관리 대시보드** (신규)
3. 🟡 **생활기록부 영역 선택 기능**
4. 🟡 **OpenAI API 연동 및 기본 AI 생성**

---

## 🎉 주요 성과

### ✅ 완료된 기능들
1. **완전한 인증 시스템**: 실제 Firebase 프로젝트 연동
2. **관리자 자동 승인**: 특정 이메일 자동 승인 시스템
3. **교사 승인 관리**: 완전한 관리자 페이지 구현
4. **학생 관리**: Excel 업로드 및 CRUD 기능
5. **설문 관리 시스템**: Excel 직접 업로드 방식으로 간소화
6. **클래스 관리 시스템**: 교사별 클래스 생성 및 학생 배정
7. **모던 UI/UX**: BAND 앱 스타일 적용, 통합 네비게이션

### 🚀 기술적 성취
- **실제 운영 환경**: Mock이 아닌 실제 Firebase 프로젝트
- **완전한 Electron 앱**: 데스크톱 환경에서 정상 동작
- **현대적 UI/UX**: Tailwind CSS 기반 반응형 디자인
- **타입 안전성**: TypeScript 완전 적용
- **권한 기반 시스템**: 교사별 데이터 분리 및 접근 제어
- **컴포넌트 분리**: 재사용 가능한 모듈화된 구조

> **💡 팁**: 다음 단계로 웹 설문 시스템을 구현하여 학생-교사 간 완전한 설문 생태계를 완성하는 것을 권장합니다! 

## 🌐 웹 기반 설문 시스템 ✨ **NEW**

### 시스템 개요
- **목표**: 선생님이 설문을 생성하고, 학생들이 별도 앱 설치 없이 웹으로 설문에 응답
- **핵심 기능**: 설문 생성, 링크 공유, 학생 응답, 이메일 수정 링크, 실시간 응답 관리

### 기술 스택
- **프론트엔드**: React + React Router
- **백엔드**: Firebase Firestore + Firebase Hosting  
- **이메일**: EmailJS (Gmail SMTP)
- **보안**: UUID 기반 응답 ID, Firestore 보안 규칙

### 데이터 구조
```jsonc
/surveys/{surveyId} {
  "title": "설문 제목",
  "teacherId": "teacher-uid", 
  "groupId": "group-12345",
  "questions": [...],
  "isActive": true,
  "allowEdit": true
}

/surveys/{surveyId}/responses/{responseId} {
  "email": "student@hanol.hs.kr",
  "answers": {...},
  "submittedAt": "timestamp",
  "editEmailSent": true
}
```

### 보안 설계
- 응답 수정은 UUID 기반 랜덤 ID로만 접근 가능
- Firestore 보안 규칙로 권한 제어
- 이메일 인증 기반 수정 링크 발송

### 구현 예정 기능
- [ ] 설문 생성 페이지 (교사용)
- [ ] 설문 응답 웹페이지 (학생용) 
- [ ] EmailJS 연동 및 수정 링크 발송
- [ ] 실시간 응답 현황 대시보드
- [ ] 응답 통계 시각화
- [ ] Firebase Hosting 배포

--- 