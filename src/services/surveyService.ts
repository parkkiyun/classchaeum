import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../lib/firebase'
import { Survey, SurveyQuestion, SurveyResponse } from '../types/survey'
import { sendEditLink } from './emailService'

// 설문 생성
export const createSurvey = async (
  teacherId: string,
  groupId: string,
  title: string,
  description: string,
  questions: SurveyQuestion[]
): Promise<string> => {
  try {
    const surveyData = {
      title,
      description,
      teacherId,
      groupId,
      questions,
      isActive: true,
      allowEdit: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    const docRef = await addDoc(collection(db, 'surveys'), surveyData)
    return docRef.id
  } catch (error) {
    console.error('설문 생성 실패:', error)
    throw error
  }
}

// 설문 조회
export const getSurvey = async (surveyId: string): Promise<Survey | null> => {
  try {
    const docRef = doc(db, 'surveys', surveyId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate()
      } as Survey
    }
    
    return null
  } catch (error) {
    console.error('설문 조회 실패:', error)
    throw error
  }
}

// 교사의 설문 목록 조회
export const getTeacherSurveys = async (teacherId: string): Promise<Survey[]> => {
  try {
    console.log('getTeacherSurveys 시작 - teacherId:', teacherId)
    
    const q = query(
      collection(db, 'surveys'),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    )
    
    console.log('쿼리 생성 완료')
    
    const querySnapshot = await getDocs(q)
    console.log('쿼리 실행 완료 - 문서 수:', querySnapshot.size)
    
    const surveys: Survey[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log('설문 문서:', doc.id, data)
      surveys.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate()
      } as Survey)
    })
    
    console.log('최종 설문 목록:', surveys)
    return surveys
  } catch (error) {
    console.error('설문 목록 조회 실패:', error)
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message)
      console.error('에러 스택:', error.stack)
    }
    throw error
  }
}

// 설문 응답 제출
export const submitSurveyResponse = async (
  surveyId: string,
  email: string,
  studentName: string,
  answers: Record<string, string | string[]>
): Promise<string> => {
  try {
    const responseId = uuidv4()
    const responseData = {
      id: responseId,
      surveyId,
      email,
      studentName,
      answers,
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      editEmailSent: false,
      ipAddress: '', // 클라이언트에서는 비워둠
      userAgent: navigator.userAgent
    }

    // responses 서브컬렉션에 저장
    const responsesRef = collection(db, 'surveys', surveyId, 'responses')
    await addDoc(responsesRef, responseData)

    return responseId
  } catch (error) {
    console.error('설문 응답 제출 실패:', error)
    throw error
  }
}

// 설문 응답 수정 링크 이메일 발송
export const sendEditLinkEmail = async (
  surveyId: string,
  responseId: string,
  email: string,
  studentName: string,
  surveyTitle: string
): Promise<boolean> => {
  try {
    const editLink = `${window.location.origin}/survey/${surveyId}/edit?rid=${responseId}`
    
    const success = await sendEditLink({
      to_email: email,
      student_name: studentName,
      survey_title: surveyTitle,
      edit_link: editLink
    })

    if (success) {
      // 이메일 발송 상태 업데이트
      const responseRef = doc(db, 'surveys', surveyId, 'responses', responseId)
      await updateDoc(responseRef, {
        editEmailSent: true,
        updatedAt: Timestamp.now()
      })
    }

    return success
  } catch (error) {
    console.error('수정 링크 이메일 발송 실패:', error)
    return false
  }
}

// 설문 응답 조회 (수정용)
export const getSurveyResponse = async (
  surveyId: string,
  responseId: string
): Promise<SurveyResponse | null> => {
  try {
    const responseRef = doc(db, 'surveys', surveyId, 'responses', responseId)
    const docSnap = await getDoc(responseRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        ...data,
        submittedAt: data.submittedAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as SurveyResponse
    }
    
    return null
  } catch (error) {
    console.error('설문 응답 조회 실패:', error)
    throw error
  }
}

// 설문 응답 수정
export const updateSurveyResponse = async (
  surveyId: string,
  responseId: string,
  answers: Record<string, string | string[]>
): Promise<boolean> => {
  try {
    const responseRef = doc(db, 'surveys', surveyId, 'responses', responseId)
    await updateDoc(responseRef, {
      answers,
      updatedAt: Timestamp.now()
    })
    
    return true
  } catch (error) {
    console.error('설문 응답 수정 실패:', error)
    return false
  }
}

// 설문의 모든 응답 조회 (교사용)
export const getSurveyResponses = async (surveyId: string): Promise<SurveyResponse[]> => {
  try {
    const responsesRef = collection(db, 'surveys', surveyId, 'responses')
    const q = query(responsesRef, orderBy('submittedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const responses: SurveyResponse[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      responses.push({
        ...data,
        submittedAt: data.submittedAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as SurveyResponse)
    })
    
    return responses
  } catch (error) {
    console.error('설문 응답 목록 조회 실패:', error)
    throw error
  }
} 