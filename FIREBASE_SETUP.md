# 🔥 Firebase 프로젝트 설정 가이드

## 1. Firebase Console에서 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `hanolchaeum` 입력
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. 웹 앱 등록

1. 프로젝트 개요 페이지에서 "웹" 아이콘 클릭
2. 앱 닉네임: `한올채움` 입력
3. Firebase Hosting 설정 체크 (선택사항)
4. 앱 등록 완료

## 3. Authentication 설정

### 3.1 로그인 방법 설정
1. 좌측 메뉴에서 "Authentication" 클릭
2. "Sign-in method" 탭 선택
3. "이메일/비밀번호" 활성화
4. "승인된 도메인"에 `hanol.hs.kr` 추가 (필요시)

### 3.2 사용자 관리
- 관리자 계정 직접 생성 가능
- 교사 승인 시스템 구현 예정

## 4. Firestore Database 설정

### 4.1 데이터베이스 생성
1. 좌측 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. 보안 규칙: "테스트 모드에서 시작" 선택
4. 위치: `asia-northeast3 (Seoul)` 선택

### 4.2 컬렉션 구조
```
📁 teachers/{teacherId}
  - uid: string
  - email: string
  - name: string  
  - roles: string[]
  - isApproved: boolean
  - createdAt: string
  - approvedAt?: string
  - homeroomClassId?: string
  - subjectClasses?: string[]

📁 classes/{classId}
  - year: number
  - semester: number
  - grade: number
  - room: number
  - students: string[]

📁 students/{studentId}
  - name: string
  - number: number
  - classId: string
  - surveys: object[]

📁 reports/{studentId_area_versionId}
  - studentId: string
  - area: string
  - content: string
  - createdBy: string
  - createdAt: string
```

## 5. 설정 파일 업데이트

Firebase 콘솔에서 제공하는 설정을 `src/lib/firebase.ts`에 업데이트:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "hanolchaeum.firebaseapp.com",
  projectId: "hanolchaeum", 
  storageBucket: "hanolchaeum.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

## 6. 보안 규칙 설정

### 6.1 Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 교사 문서는 본인만 읽기 가능
    match /teachers/{teacherId} {
      allow read: if request.auth != null && request.auth.uid == teacherId;
      allow write: if false; // 관리자만 수정 가능
    }
    
    // 학생 문서는 담당 교사만 읽기 가능
    match /students/{studentId} {
      allow read: if request.auth != null && isAuthorizedTeacher(studentId);
      allow write: if false; // Excel 업로드를 통해서만 생성
    }
    
    // 생활기록부는 작성 교사만 접근 가능
    match /reports/{reportId} {
      allow read, write: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
    
    function isAuthorizedTeacher(studentId) {
      let teacher = get(/databases/$(database)/documents/teachers/$(request.auth.uid));
      let student = get(/databases/$(database)/documents/students/$(studentId));
      
      return teacher.data.isApproved == true && (
        teacher.data.homeroomClassId == student.data.classId ||
        teacher.data.subjectClasses.hasAny([student.data.classId])
      );
    }
  }
}
```

### 6.2 Authentication Rules
- 이메일 도메인 제한: `@hanol.hs.kr`만 허용
- 신규 가입자는 자동으로 승인 대기 상태

## 7. 테스트 계정 생성

개발/테스트용 계정:
```
관리자: admin@hanol.hs.kr
담임교사: homeroom@hanol.hs.kr  
교과교사: subject@hanol.hs.kr
동아리교사: club@hanol.hs.kr
```

## 8. 배포 준비

1. Firebase Hosting 설정 (선택사항)
2. 환경 변수 설정
3. 프로덕션 빌드 테스트
4. 보안 규칙 최종 검토

---

⚠️ **중요**: 실제 운영 전에 보안 규칙을 철저히 검토하고 테스트해야 합니다. 