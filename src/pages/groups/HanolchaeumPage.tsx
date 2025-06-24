import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useAppStore } from '../../store/appStore'
import { openaiService, type GenerateRequest } from '../../services/openaiService'
import { saveRecord, getRecord } from '../../services/recordService'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Group, Student, SurveyResponse } from '../../types'
import type { SurveyResponse as WebSurveyResponse } from '../../types/survey'

// 단계별 컴포넌트 import
import { Step0AreaSelection } from './record-steps/Step0AreaSelection'
import { Step1StudentSelection } from './record-steps/Step1StudentSelection'
import { Step2RecordEditing } from './record-steps/Step2RecordEditing'
import { Step3Completion } from './record-steps/Step3Completion'
import { GroupPromptSettingsPage } from './GroupPromptSettingsPage'

type StepType = 0 | 1 | 2 | 3 | 'settings'

interface RecordData {
  area: GenerateRequest['area']
  student: Student
  surveyResponse: SurveyResponse
  aiContent: string
}

interface HanolchaeumPageProps {
  group: Group
}

export const HanolchaeumPage: React.FC<HanolchaeumPageProps> = ({ group }) => {
  const { teacher } = useAuth()
  const { students, surveyResponses } = useAppStore()

  // 현재 단계
  const [currentStep, setCurrentStep] = useState<StepType>(0)

  // 단계별 데이터
  const [selectedArea, setSelectedArea] = useState<GenerateRequest['area'] | ''>('')
  const [recordData, setRecordData] = useState<RecordData | null>(null)

  // 웹 설문 응답 데이터
  const [webSurveyResponses, setWebSurveyResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(false)

  // 현재 클래스의 학생 목록
  const groupStudents = group 
    ? students.filter(student => group.studentIds.includes(student.id))
    : []

  // 통합된 설문 응답 (기존 + 웹)
  const allSurveyResponses = [...surveyResponses, ...webSurveyResponses]

  // 웹 설문 응답 로드
  useEffect(() => {
    const loadWebSurveyResponses = async () => {
      if (!group || !teacher) return

      try {
        setLoading(true)
        
        // 해당 클래스의 설문 조회
        const surveysRef = collection(db, 'surveys')
        const surveysQuery = query(surveysRef, where('groupId', '==', group.id))
        const surveysSnapshot = await getDocs(surveysQuery)
        
        const webResponses: SurveyResponse[] = []
        
        // 각 설문의 응답 조회
        for (const surveyDoc of surveysSnapshot.docs) {
          const surveyId = surveyDoc.id
          const surveyData = surveyDoc.data()
          const responsesRef = collection(db, 'surveys', surveyId, 'responses')
          const responsesSnapshot = await getDocs(responsesRef)
          
          responsesSnapshot.forEach((responseDoc) => {
            const responseData = responseDoc.data() as WebSurveyResponse
            
            // 학생 이름으로 학생 ID 찾기
            const student = groupStudents.find(s => 
              s.name === responseData.studentName || 
              s.email === responseData.email
            )
            
            if (student) {
              // 설문 질문 정보 매핑
              const questionMap = new Map()
              if (surveyData.questions) {
                surveyData.questions.forEach((q: any) => {
                  questionMap.set(q.id, q.question)
                })
              }
              
              // 웹 설문 응답을 기존 형식으로 변환
              const convertedResponse: SurveyResponse = {
                id: responseDoc.id,
                templateId: surveyData.title,
                groupId: group.id,
                studentId: student.id,
                teacherId: teacher.uid,
                responses: Object.entries(responseData.answers).map(([questionId, answer]) => ({
                  questionId,
                  answer: Array.isArray(answer) ? answer.join(', ') : answer,
                  textAnswer: questionMap.get(questionId) || `질문 ${questionId}`
                })),
                status: 'submitted',
                submittedAt: responseData.submittedAt,
                createdAt: responseData.submittedAt,
                updatedAt: responseData.updatedAt
              }
              
              webResponses.push(convertedResponse)
            }
          })
        }
        
        setWebSurveyResponses(webResponses)
        
      } catch (error) {
        console.error('❌ 웹 설문 응답 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWebSurveyResponses()
  }, [group, teacher, groupStudents])

  // 0단계 -> 1단계
  const handleAreaNext = () => {
    setCurrentStep(1)
  }

  // 1단계 -> 0단계 (뒤로가기)
  const handleStudentBack = () => {
    setCurrentStep(0)
  }

  // 1단계 -> 2단계 (AI 생성 완료)
  const handleStudentNext = (data: {
    student: Student
    surveyResponse: SurveyResponse
    aiContent: string
  }) => {
    setRecordData({
      area: selectedArea as GenerateRequest['area'],
      student: data.student,
      surveyResponse: data.surveyResponse,
      aiContent: data.aiContent
    })
    setCurrentStep(2)
  }

  // 2단계 -> 1단계 (뒤로가기)
  const handleRecordBack = () => {
    setCurrentStep(1)
  }

  // 2단계 -> 3단계 (작성 완료)
  const handleRecordNext = () => {
    setCurrentStep(3)
  }

  // 기록 저장 함수
  const handleSave = async (content: string) => {
    if (!recordData || !teacher || !group) return

    try {
      await saveRecord({
        studentId: recordData.student.id,
        teacherId: teacher.uid,
        groupId: group.id,
        area: recordData.area,
        content: content,
        surveyResponseId: recordData.surveyResponse.id
      })
      
      console.log('✅ 기록 저장 완료')
    } catch (error) {
      console.error('❌ 기록 저장 실패:', error)
      throw error
    }
  }

  // 3단계 -> 1단계 (같은 영역, 다른 학생)
  const handleContinueWithSameArea = () => {
    setRecordData(null)
    setCurrentStep(1)
  }

  // 3단계 -> 0단계 (다른 영역)
  const handleContinueWithDifferentArea = () => {
    setSelectedArea('')
    setRecordData(null)
    setCurrentStep(0)
  }

  // 설정 페이지로 이동
  const handleGoToSettings = () => {
    setCurrentStep('settings')
  }

  // 설정에서 돌아가기
  const handleBackFromSettings = () => {
    setCurrentStep(0)
  }

  // 기존 기록 불러오기
  const getExistingRecord = async (studentId: string, area: GenerateRequest['area']): Promise<string | undefined> => {
    if (!teacher) return undefined

    try {
      const record = await getRecord({
        studentId,
        teacherId: teacher.uid,
        area
      })
      
      return record?.content
    } catch (error) {
      console.error('❌ 기존 기록 조회 실패:', error)
      return undefined
    }
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">클래스 정보를 불러오는 중...</p>
      </div>
    )
  }

  // 단계별 렌더링
  switch (currentStep) {
    case 0:
      return (
        <Step0AreaSelection
          selectedArea={selectedArea}
          onAreaSelect={setSelectedArea}
          onNext={handleAreaNext}
          onGoToSettings={handleGoToSettings}
          groupName={group.name}
          groupType={group.type}
        />
      )

    case 1:
      if (!selectedArea) {
        setCurrentStep(0)
        return null
      }
      return (
        <Step1StudentSelection
          selectedArea={selectedArea}
          students={groupStudents}
          surveyResponses={allSurveyResponses}
          onBack={handleStudentBack}
          onNext={handleStudentNext}
          groupName={group.name}
          groupId={group.id}
          teacherId={teacher?.uid}
        />
      )

    case 2:
      if (!recordData) {
        setCurrentStep(1)
        return null
      }
      return (
        <Step2RecordEditing
          selectedArea={recordData.area}
          student={recordData.student}
          surveyResponse={recordData.surveyResponse}
          aiContent={recordData.aiContent}
          onBack={handleRecordBack}
          onNext={handleRecordNext}
          onSave={handleSave}
          groupName={group.name}
          getExistingRecord={getExistingRecord}
        />
      )

    case 3:
      if (!recordData) {
        setCurrentStep(0)
        return null
      }
      return (
        <Step3Completion
          selectedArea={recordData.area}
          student={recordData.student}
          onContinueWithSameArea={handleContinueWithSameArea}
          onContinueWithDifferentArea={handleContinueWithDifferentArea}
          groupName={group.name}
        />
      )

    case 'settings':
      return (
        <GroupPromptSettingsPage
          group={group}
          onBack={handleBackFromSettings}
        />
      )

    default:
      return null
  }
} 