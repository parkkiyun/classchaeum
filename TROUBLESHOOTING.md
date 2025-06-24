# 🔧 Firebase 로그인 문제 해결 가이드

## 1. Firebase Console 설정 확인

### ✅ Authentication 활성화 확인
1. [Firebase Console](https://console.firebase.google.com/project/hanolchaeum/authentication) 접속
2. Authentication > Sign-in method 탭에서 "이메일/비밀번호"가 활성화되어 있는지 확인

### ✅ Firestore 데이터베이스 확인
1. [Firestore Database](https://console.firebase.google.com/project/hanolchaeum/firestore) 접속
2. 데이터베이스가 생성되어 있는지 확인

## 2. 브라우저 개발자 도구 확인

### 콘솔 오류 메시지 확인
1. F12 키를 눌러 개발자 도구 열기
2. Console 탭에서 오류 메시지 확인
3. 다음과 같은 오류가 있는지 확인:
   - `Firebase: Error (auth/...)` - Authentication 관련 오류
   - `Firebase: Error (firestore/...)` - Firestore 관련 오류

### 네트워크 탭 확인
1. Network 탭에서 Firebase API 호출 상태 확인
2. 빨간색(실패) 요청이 있는지 확인

## 3. 일반적인 오류 및 해결방법

### 🚫 "auth/user-not-found" 오류
**원인**: 존재하지 않는 계정으로 로그인 시도
**해결**: 
- 회원가입 먼저 진행
- 또는 Firebase Console에서 직접 사용자 생성

### 🚫 "auth/wrong-password" 오류
**원인**: 잘못된 비밀번호
**해결**: 
- 올바른 비밀번호 입력
- 비밀번호 재설정 기능 사용

### 🚫 "auth/weak-password" 오류
**원인**: 비밀번호가 6자 미만
**해결**: 6자 이상의 비밀번호 사용

### 🚫 "auth/email-already-in-use" 오류
**원인**: 이미 사용 중인 이메일
**해결**: 
- 다른 이메일 주소 사용
- 또는 로그인 시도

### 🚫 "auth/invalid-email" 오류
**원인**: 잘못된 이메일 형식
**해결**: 올바른 이메일 형식으로 입력 (예: user@hanol.hs.kr)

## 4. 도메인 제한 문제

### @hanol.hs.kr 도메인만 허용
현재 앱은 `@hanol.hs.kr` 도메인만 회원가입을 허용합니다.

**테스트용 이메일 예시**:
- `teacher@hanol.hs.kr`
- `admin@hanol.hs.kr`
- `test@hanol.hs.kr`

## 5. Firebase 프로젝트 권한 확인

### Google 계정 권한 확인
1. Firebase Console에 로그인한 Google 계정이 프로젝트 소유자인지 확인
2. 프로젝트 설정 > 사용자 및 권한에서 권한 확인

## 6. 캐시 및 쿠키 문제

### 브라우저 캐시 삭제
1. Ctrl + Shift + Delete (Windows) 또는 Cmd + Shift + Delete (Mac)
2. 캐시된 이미지 및 파일, 쿠키 삭제
3. 앱 새로고침

### 시크릿 모드에서 테스트
1. Ctrl + Shift + N (Chrome) 또는 Ctrl + Shift + P (Firefox)
2. 시크릿 모드에서 앱 접속하여 테스트

## 7. Firebase 설정 파일 확인

### src/lib/firebase.ts 설정 확인
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyCnNuJu6A6SgI6V_ZEH5ej7ICo0Zo-pxlM",
  authDomain: "hanolchaeum.firebaseapp.com",
  projectId: "hanolchaeum",
  storageBucket: "hanolchaeum.firebasestorage.app",
  messagingSenderId: "807965642924",
  appId: "1:807965642924:web:3aeae11c030c89dd370f09",
  measurementId: "G-ZVVSXFLN0E"
}
```

## 8. 단계별 디버깅

### 1단계: Firebase 연결 확인
브라우저 콘솔에서 다음 메시지 확인:
```
Firebase initialized successfully for Hanolchaeum
```

### 2단계: 회원가입 테스트
1. 새로운 이메일로 회원가입 시도
2. 성공 시 Firebase Console > Authentication > Users에서 사용자 확인

### 3단계: 로그인 테스트
1. 생성된 계정으로 로그인 시도
2. 성공 시 대시보드 페이지로 리다이렉션 확인

## 9. 추가 지원

### Firebase 지원 문서
- [Firebase Authentication 문제 해결](https://firebase.google.com/docs/auth/web/troubleshoot)
- [Firebase Console 도움말](https://support.google.com/firebase)

### 개발자 커뮤니티
- [Stack Overflow - Firebase](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase 공식 커뮤니티](https://firebase.google.com/community)

---

## 🚨 긴급 연락처

문제가 지속될 경우:
1. 브라우저 개발자 도구의 전체 오류 로그 캡처
2. Firebase Console 설정 스크린샷 준비
3. 기술 지원팀에 문의

**중요**: 실제 API 키나 민감한 정보는 절대 공유하지 마세요! 