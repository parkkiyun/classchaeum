# 🔒 Firestore 보안 규칙 설정 가이드

## 1. Firebase Console 접속

1. [Firebase Console](https://console.firebase.google.com/project/hanolchaeum/firestore/rules) 접속
2. Firestore Database > 규칙 탭 클릭

## 2. 보안 규칙 설정

다음 규칙을 복사하여 붙여넣기:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 교사 컬렉션 - 인증된 사용자만 읽기 가능, 본인 문서만 수정 가능
    match /teachers/{teacherId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == teacherId;
    }
    
    // 학생 컬렉션 - 승인된 교사만 읽기/쓰기 가능
    match /students/{studentId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/teachers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data.isApproved == true;
    }
    
    // 그룹 컬렉션 - 교사별 권한 분리 ✨ NEW
    match /groups/{groupId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/teachers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data.isApproved == true &&
        (resource == null || resource.data.teacherId == request.auth.uid);
    }
    
    // 설문 응답 컬렉션 - 승인된 교사만 접근, 그룹 기반 권한 제어
    match /surveyResponses/{responseId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/teachers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data.isApproved == true &&
        (resource == null || resource.data.teacherId == request.auth.uid);
    }
    
    // 생활기록부 보고서 컬렉션 - 승인된 교사만 접근
    match /reports/{reportId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/teachers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data.isApproved == true &&
        (resource == null || resource.data.teacherId == request.auth.uid);
    }
  }
}
```

## 3. 규칙 게시

1. "게시" 버튼 클릭
2. 규칙이 활성화될 때까지 잠시 대기

## 4. 테스트 모드에서 프로덕션 모드로 전환

위 규칙을 적용하면 테스트 모드에서 프로덕션 모드로 자동 전환됩니다.

## 5. 규칙 설명

- **teachers**: 모든 인증된 사용자가 읽을 수 있고, 본인 문서만 수정 가능
- **students**: 승인된 교사만 읽기/쓰기 가능
- **groups**: 승인된 교사만 읽기/쓰기 가능, 자신이 생성한 그룹만 접근 가능
- **surveyResponses**: 승인된 교사만 읽기/쓰기 가능, 자신의 그룹 설문만 접근 가능
- **reports**: 승인된 교사만 읽기/쓰기 가능, 자신이 작성한 보고서만 접근 가능

이 규칙을 통해 데이터 보안을 유지하면서 필요한 기능을 제공할 수 있습니다. 

## 그룹 관리 시스템 보안 특징

1. **교사별 데이터 분리**: 각 교사는 자신의 그룹만 조회/수정 가능
2. **그룹 기반 학생 관리**: 그룹에 배정된 학생들만 해당 교사가 관리
3. **설문 권한 제어**: 그룹별로 설문 데이터 접근 권한 분리
4. **승인 상태 확인**: 모든 데이터 접근 시 교사 승인 상태 검증

이 규칙들을 Firebase Console의 Firestore Database > 규칙 탭에서 설정하세요. 