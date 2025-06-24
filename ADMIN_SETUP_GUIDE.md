# 🔧 관리자 계정 설정 가이드

## 문제 상황
`kiyun0515@hanol.hs.kr` 계정이 이미 생성되었지만 일반 교사로 등록되어 승인 대기 상태입니다.

## 해결 방법

### 방법 1: Firebase Console에서 직접 수정 (권장)

1. **Firebase Console 접속**
   - https://console.firebase.google.com/project/hanolchaeum/firestore 접속

2. **Firestore Database에서 수정**
   - `teachers` 컬렉션 클릭
   - `kiyun0515@hanol.hs.kr` 계정의 문서 찾기
   - 다음 필드들을 수정:
     ```json
     {
       "roles": ["admin"],
       "isApproved": true,
       "approvedAt": "2025-01-23T12:00:00.000Z"
     }
     ```

3. **저장 후 앱에서 다시 로그인**

### 방법 2: 계정 삭제 후 재생성

1. **Firebase Console에서 계정 삭제**
   - Authentication > Users 탭
   - `kiyun0515@hanol.hs.kr` 계정 삭제
   - Firestore > teachers 컬렉션에서도 해당 문서 삭제

2. **앱에서 다시 회원가입**
   - 이제 관리자 이메일 목록에 포함되어 있으므로 자동 승인됨

### 방법 3: 임시 관리자 계정 사용

1. **임시 관리자 계정으로 로그인**
   - 이메일: `admin@hanol.hs.kr`
   - 비밀번호: `admin123456`

2. **관리자 페이지에서 승인**
   - 사이드바 "관리자" 메뉴 클릭
   - `kiyun0515@hanol.hs.kr` 계정 승인

## 현재 관리자 이메일 목록

```typescript
const ADMIN_EMAILS = [
  'admin@hanol.hs.kr',
  'kiyun0515@hanol.hs.kr'
]
```

## 확인 방법

1. 로그인 후 사이드바에 "관리자" 메뉴가 표시되는지 확인
2. 사용자 정보에 "관리자" 배지가 표시되는지 확인
3. 관리자 페이지 접근이 가능한지 확인 