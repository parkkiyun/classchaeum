import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Report } from '../types'
import type { GenerateRequest } from './openaiService'

export interface SaveRecordRequest {
  studentId: string
  teacherId: string
  groupId: string
  area: GenerateRequest['area']
  content: string
  surveyResponseId?: string
}

export interface GetRecordRequest {
  studentId: string
  teacherId: string
  area: GenerateRequest['area']
}

// 기록 저장
export const saveRecord = async (request: SaveRecordRequest): Promise<Report> => {
  try {
    console.log('💾 기록 저장 시작:', request)

    // 기존 기록 확인
    const existingRecord = await getRecord({
      studentId: request.studentId,
      teacherId: request.teacherId,
      area: request.area
    })

    if (existingRecord) {
      // 기존 기록 업데이트
      const recordRef = doc(db, 'reports', existingRecord.id)
      const updatedData = {
        content: request.content,
        version: existingRecord.version + 1,
        surveyResponseId: request.surveyResponseId,
        updatedAt: Timestamp.now()
      }

      await updateDoc(recordRef, updatedData)
      
      const updatedRecord: Report = {
        ...existingRecord,
        content: request.content,
        version: existingRecord.version + 1,
        surveyResponseId: request.surveyResponseId,
        updatedAt: new Date()
      }

      console.log('✅ 기록 업데이트 완료:', updatedRecord.id)
      return updatedRecord

    } else {
      // 새 기록 생성
      const newRecord = {
        studentId: request.studentId,
        teacherId: request.teacherId,
        groupId: request.groupId,
        area: request.area,
        content: request.content,
        version: 1,
        surveyResponseId: request.surveyResponseId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, 'reports'), newRecord)
      
      const savedRecord: Report = {
        id: docRef.id,
        studentId: request.studentId,
        teacherId: request.teacherId,
        groupId: request.groupId,
        area: request.area,
        content: request.content,
        version: 1,
        surveyResponseId: request.surveyResponseId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      console.log('✅ 새 기록 생성 완료:', savedRecord.id)
      return savedRecord
    }

  } catch (error) {
    console.error('❌ 기록 저장 실패:', error)
    throw new Error('기록 저장에 실패했습니다.')
  }
}

// 기록 불러오기
export const getRecord = async (request: GetRecordRequest): Promise<Report | null> => {
  try {
    console.log('📖 기록 조회 시작:', request)

    const reportsRef = collection(db, 'reports')
    const q = query(
      reportsRef,
      where('studentId', '==', request.studentId),
      where('teacherId', '==', request.teacherId),
      where('area', '==', request.area),
      orderBy('version', 'desc')
    )

    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log('📭 기록이 없습니다')
      return null
    }

    const doc = querySnapshot.docs[0]
    const data = doc.data()
    
    const record: Report = {
      id: doc.id,
      studentId: data.studentId,
      teacherId: data.teacherId,
      groupId: data.groupId,
      area: data.area,
      content: data.content,
      version: data.version,
      surveyResponseId: data.surveyResponseId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    }

    console.log('✅ 기록 조회 완료:', record.id)
    return record

  } catch (error) {
    console.error('❌ 기록 조회 실패:', error)
    return null
  }
}

// 학생의 모든 기록 조회
export const getStudentRecords = async (studentId: string, teacherId: string): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, 'reports')
    const q = query(
      reportsRef,
      where('studentId', '==', studentId),
      where('teacherId', '==', teacherId),
      orderBy('updatedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const records: Report[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      records.push({
        id: doc.id,
        studentId: data.studentId,
        teacherId: data.teacherId,
        groupId: data.groupId,
        area: data.area,
        content: data.content,
        version: data.version,
        surveyResponseId: data.surveyResponseId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })

    return records

  } catch (error) {
    console.error('❌ 학생 기록 조회 실패:', error)
    return []
  }
}

// 그룹의 모든 기록 조회
export const getGroupRecords = async (groupId: string, teacherId: string): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, 'reports')
    const q = query(
      reportsRef,
      where('groupId', '==', groupId),
      where('teacherId', '==', teacherId),
      orderBy('updatedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const records: Report[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      records.push({
        id: doc.id,
        studentId: data.studentId,
        teacherId: data.teacherId,
        groupId: data.groupId,
        area: data.area,
        content: data.content,
        version: data.version,
        surveyResponseId: data.surveyResponseId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })

    return records

  } catch (error) {
    console.error('❌ 그룹 기록 조회 실패:', error)
    return []
  }
} 