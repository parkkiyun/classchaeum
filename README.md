# 📘 AI 생활기록부 생성 앱

한올고등학교 교사 전용 생활기록부 AI 생성 데스크탑 애플리케이션

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 주요 기능

### 🔐 교사 전용 인증
- Firebase Authentication을 통한 안전한 로그인
- `@hanol.hs.kr` 도메인 교사 이메일만 접근 가능
- 담임교사, 교과교사, 동아리교사 권한별 기능 제한

### 🗂️ 학생 정보 관리
- Excel 템플릿을 통한 일괄 학생 정보 등록
- 학급별, 학년별 학생 필터링
- 개별 학생 정보 수정 및 관리

### 🤖 AI 기반 생활기록부 생성
- OpenAI API를 활용한 생활기록부 문항 자동 생성
- 5개 영역별 맞춤형 프롬프트 (자율/진로/행특/교과/동아리)
- 설문 데이터 기반 개인 맞춤형 내용 생성

### ✏️ 실시간 편집 및 버전 관리
- Rich Text Editor를 통한 직관적인 내용 편집
- 학생별, 영역별 버전 히스토리
- 변경 사항 추적 및 이전 버전 복원

### 📊 통계 및 분석
- 월별/학기별 작성 통계
- 교사별 사용 현황
- 영역별 생성 빈도 분석

## 🛠️ 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **Zustand** - 상태 관리
- **React Query** - 서버 상태 관리
- **React Router** - 라우팅

### Desktop
- **Electron 26** - 데스크탑 앱 프레임워크
- **Vite** - 빠른 개발 서버 및 빌드

### Backend & Services
- **Firebase Authentication** - 사용자 인증
- **Firestore** - 클라우드 데이터베이스
- **IndexedDB** - 로컬 데이터 저장 및 오프라인 지원
- **OpenAI API** - AI 텍스트 생성

### Libraries
- **SheetJS (xlsx)** - Excel 파일 처리
- **CryptoJS** - 로컬 데이터 암호화
- **Framer Motion** - 애니메이션
- **Lucide React** - 아이콘

## 📋 시스템 요구사항

### 지원 플랫폼
- Windows 10/11 (x64)
- macOS 10.15+ (Intel/Apple Silicon)
- Ubuntu 18.04+ (x64)

### 하드웨어 요구사항
- RAM: 최소 4GB, 권장 8GB
- 저장 공간: 최소 500MB
- 인터넷 연결 필수

### 소프트웨어 요구사항
- Node.js 18+ (개발 시)
- 최신 웹 브라우저 엔진 지원

## 🚀 설치 및 실행

### 📱 **빠른 실행 (Windows)**

**가장 쉬운 방법**: `start-app.bat` 파일을 더블클릭하세요!
- Node.js 자동 확인
- 의존성 자동 설치  
- 개발 서버 자동 시작

### 🌐 앱 접속 방법

- **브라우저**: http://localhost:5173 (권장)
- **Electron**: 자동으로 데스크탑 앱 창이 열립니다

### 🔧 현재 개발 상태 (2025년 1월)

✅ **동작하는 기능**:
- 로그인 페이지 UI (시연용)
- 대시보드 (개발 진행 상황 표시)
- 기본 네비게이션 및 레이아웃
- 년도/학기 선택 기능

⏳ **개발 중인 기능**:
- Firebase 실제 연동
- 교사 인증 시스템

❌ **예정된 기능**:
- 학생 관리 (Excel 업로드)
- AI 텍스트 생성
- 버전 관리

### 1. 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/hanol-hs-kr/ai-record-app.git
cd ai-record-app

# 의존성 설치
npm install

# 환경 변수 설정 (선택사항 - 현재는 Mock 데이터로 동작)
cp env.example .env
# .env 파일을 열어 Firebase 및 OpenAI API 키 설정

# 개발 서버 실행
npm run dev          # 브라우저용 (권장)
npm run electron:dev # 데스크탑용
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 정보를 입력하세요:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdefghijklmnop

# OpenAI API Configuration
VITE_OPENAI_API_KEY=sk-your_openai_api_key_here
VITE_OPENAI_API_URL=https://api.openai.com/v1

# App Configuration
VITE_SCHOOL_DOMAIN=hanol.hs.kr
```

### 3. 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 설치 파일 생성
npm run electron:build

# 특정 플랫폼용 빌드
npm run electron:build -- --win    # Windows
npm run electron:build -- --mac    # macOS
npm run electron:build -- --linux  # Linux
```

## 📱 사용 방법

### 1. 로그인
1. 앱 실행 후 로그인 화면에서 `@hanol.hs.kr` 이메일로 로그인
2. 비밀번호 분실 시 '비밀번호 재설정' 이용

### 2. 학생 정보 등록
1. **수동 등록**: `학생 관리` > `새 학생 추가`
2. **Excel 일괄 등록**: `학생 관리` > `Excel 업로드`
   - 템플릿 다운로드 후 학생 정보 입력
   - 작성한 파일 업로드

### 3. 생활기록부 작성
1. `생활기록부 작성` 메뉴 선택
2. 학년/반 → 학생 → 영역 순으로 선택
3. 관련 설문 데이터 선택
4. `AI 생성` 버튼으로 초안 생성
5. 에디터에서 내용 수정 및 저장

### 4. 버전 관리
1. `버전 히스토리` 메뉴에서 작성 이력 확인
2. 이전 버전과 비교 및 복원 가능
3. 변경 사항 추적 및 백업

## 🔧 설정 및 커스터마이징

### 프롬프트 관리
- `설정` > `프롬프트 관리`에서 영역별 프롬프트 수정
- Temperature, Max Tokens 등 AI 파라미터 조정
- 과목별 맞춤 프롬프트 설정

### 백업 및 동기화
- 자동 클라우드 동기화 (Firebase)
- 로컬 백업 파일 생성
- 오프라인 모드 지원

## 🚨 문제 해결

### 일반적인 문제

#### 로그인 실패
- 이메일 도메인 확인 (`@hanol.hs.kr`)
- 인터넷 연결 상태 확인
- Firebase 설정 확인

#### Excel 업로드 오류
- 템플릿 형식 준수 확인
- 필수 필드 누락 확인
- 파일 형식 확인 (.xlsx)

#### AI 생성 실패
- OpenAI API 키 확인
- API 사용량 한도 확인
- 네트워크 연결 상태 확인

### 로그 및 디버깅
- 개발자 도구: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
- 로그 파일 위치: `%APPDATA%/ai-record-app/logs/` (Windows)

## 🔒 보안 및 개인정보

### 데이터 보호
- 로컬 데이터 AES-256 암호화
- Firebase Security Rules 적용
- API 키 안전한 저장 (Keytar)

### 개인정보 처리
- 학생 개인정보는 교육 목적으로만 사용
- 외부 유출 방지를 위한 암호화 저장
- 정기적인 보안 업데이트

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 🤝 기여하기

### 개발 가이드라인
1. Fork 후 feature 브랜치 생성
2. 변경 사항 개발 및 테스트
3. Pull Request 생성
4. 코드 리뷰 후 병합

### 이슈 리포팅
- GitHub Issues를 통한 버그 리포트
- 기능 요청 및 개선 제안
- 자세한 재현 과정 포함

## 📞 지원 및 문의

### 기술 지원
- **이메일**: support@hanol.hs.kr
- **GitHub Issues**: [이슈 등록](https://github.com/hanol-hs-kr/ai-record-app/issues)
- **위키**: [사용자 가이드](https://github.com/hanol-hs-kr/ai-record-app/wiki)

### 업데이트 정보
- **릴리스 노트**: [Releases](https://github.com/hanol-hs-kr/ai-record-app/releases)
- **로드맵**: [프로젝트 보드](https://github.com/hanol-hs-kr/ai-record-app/projects)

---

**개발팀**: 한올고등학교 AI 개발팀  
**최종 업데이트**: 2025년 1월  
**버전**: 1.0.0 