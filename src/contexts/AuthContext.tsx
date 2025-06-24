import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

interface Teacher {
  uid: string
  email: string
  name: string
  roles: string[]
  isApproved: boolean
  createdAt: string
  approvedAt?: string
  homeroomClassId?: string
  subjectClasses?: string[]
}

interface AuthContextType {
  currentUser: User | null
  teacher: Teacher | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  return useContext(AuthContext)
}

// 관리자 이메일 목록 (자동 승인)
const ADMIN_EMAILS = [
  'admin@hanol.hs.kr',
  'kiyun0515@hanol.hs.kr',
]

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('로그인 시도:', email)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('로그인 성공:', result.user.uid)
    } catch (error: any) {
      console.error('로그인 오류:', error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      console.log('회원가입 시도:', email)
      
      // 도메인 검증
      if (!email.endsWith('@hanol.hs.kr')) {
        throw new Error('한올고등학교 이메일(@hanol.hs.kr)만 사용 가능합니다.')
      }

      const result = await createUserWithEmailAndPassword(auth, email, password)
      console.log('회원가입 성공:', result.user.uid)
      
      // 사용자 프로필 업데이트
      await updateProfile(result.user, { displayName: name })

      // 관리자 이메일인지 확인
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
      console.log('관리자 여부:', isAdmin)
      
      // Firestore에 교사 정보 저장
      const teacherData: Teacher = {
        uid: result.user.uid,
        email: email,
        name: name,
        roles: isAdmin ? ['admin'] : ['teacher'],
        isApproved: isAdmin, // 관리자는 자동 승인
        createdAt: new Date().toISOString(),
        approvedAt: isAdmin ? new Date().toISOString() : undefined
      }

      await setDoc(doc(db, 'teachers', result.user.uid), teacherData)
      console.log('교사 정보 저장 완료')
    } catch (error: any) {
      console.error('회원가입 오류:', error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth)
      console.log('로그아웃 완료')
    } catch (error: any) {
      console.error('로그아웃 오류:', error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email)
      console.log('비밀번호 재설정 이메일 발송 완료')
    } catch (error: any) {
      console.error('비밀번호 재설정 오류:', error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  const getErrorMessage = (errorCode: string): string => {
    console.log('Firebase 에러 코드:', errorCode)
    
    switch (errorCode) {
      case 'auth/user-not-found':
        return '등록되지 않은 이메일입니다.'
      case 'auth/wrong-password':
        return '비밀번호가 올바르지 않습니다.'
      case 'auth/email-already-in-use':
        return '이미 사용 중인 이메일입니다.'
      case 'auth/weak-password':
        return '비밀번호는 6자 이상이어야 합니다.'
      case 'auth/invalid-email':
        return '올바른 이메일 형식이 아닙니다.'
      case 'auth/too-many-requests':
        return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
      case 'auth/network-request-failed':
        return '네트워크 연결을 확인해주세요.'
      case 'auth/invalid-credential':
        return '잘못된 인증 정보입니다.'
      case 'auth/user-disabled':
        return '비활성화된 계정입니다.'
      case 'auth/operation-not-allowed':
        return '이 로그인 방법은 허용되지 않습니다.'
      default:
        return `인증 오류가 발생했습니다. (${errorCode})`
    }
  }

  useEffect(() => {
    console.log('AuthContext 초기화 시작')
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('인증 상태 변경:', user ? user.uid : 'null')
      setCurrentUser(user)
      
      if (user) {
        try {
          console.log('교사 정보 가져오기 시작:', user.uid)
          // Firestore에서 교사 정보 가져오기
          const teacherDoc = await getDoc(doc(db, 'teachers', user.uid))
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data() as Teacher
            setTeacher(teacherData)
            console.log('교사 정보 로드 완료:', teacherData.email, teacherData.roles, 'isApproved:', teacherData.isApproved)
          } else {
            console.log('교사 정보가 없습니다.')
            setTeacher(null)
          }
        } catch (error) {
          console.error('교사 정보 가져오기 실패:', error)
          setTeacher(null)
        }
      } else {
        console.log('사용자가 로그아웃됨')
        setTeacher(null)
      }
      
      setLoading(false)
      console.log('AuthContext 로딩 완료')
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    teacher,
    login,
    register,
    logout,
    resetPassword,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 