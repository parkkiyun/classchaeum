import React, { useState, useEffect, useRef } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../store/appStore'
import type { Student, ExcelStudent, SchoolAPIConfig, AIProvider } from '../types'
import * as XLSX from 'xlsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { schoolAPIService } from '../services/apiConfigService'
import { AI_PROVIDERS, AI_MODELS, DEFAULT_API_CONFIG } from '../constants/aiModels'

interface PendingTeacher {
  uid: string
  email: string
  name: string
  roles: string[]
  isApproved: boolean
  createdAt: string
}

export const AdminPage: React.FC = () => {
  const { teacher } = useAuth()
  const { students, setStudents } = useAppStore()
  const [activeTab, setActiveTab] = useState<'teachers' | 'students' | 'api'>('teachers')
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // API 설정 관련 상태
  const [apiConfigs, setApiConfigs] = useState<SchoolAPIConfig[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiSaving, setApiSaving] = useState(false)
  const [newApiConfig, setNewApiConfig] = useState<{
    provider: AIProvider
    apiKey: string
    baseURL: string
    model: string
    maxTokens: number
    temperature: number
    description: string
  }>({
    provider: 'openai',
    apiKey: '',
    baseURL: AI_PROVIDERS.openai.baseURL,
    model: 'gpt-4o-mini',
    maxTokens: DEFAULT_API_CONFIG.maxTokens,
    temperature: DEFAULT_API_CONFIG.temperature,
    description: ''
  })

  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchPendingTeachers()
    } else if (activeTab === 'students') {
      loadStudentsFromFirebase()
    } else if (activeTab === 'api') {
      loadAPIConfigs()
    }
  }, [activeTab])

  const fetchPendingTeachers = async () => {
    try {
      setLoading(true)
      const q = query(
        collection(db, 'teachers'),
        where('isApproved', '==', false)
      )
      const querySnapshot = await getDocs(q)
      const teachers: PendingTeacher[] = []
      
      querySnapshot.forEach((doc) => {
        teachers.push(doc.data() as PendingTeacher)
      })
      
      setPendingTeachers(teachers)
    } catch (error) {
      console.error('승인 대기 교사 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStudentsFromFirebase = async () => {
    try {
      setLoading(true)
      const studentsRef = collection(db, 'students')
      const querySnapshot = await getDocs(studentsRef)
      
      const loadedStudents: Student[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        loadedStudents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Student)
      })
      
      setStudents(loadedStudents)
    } catch (error) {
      console.error('학생 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveTeacher = async (teacherUid: string) => {
    try {
      setApproving(teacherUid)
      
      const teacherRef = doc(db, 'teachers', teacherUid)
      await updateDoc(teacherRef, {
        isApproved: true,
        approvedAt: new Date().toISOString(),
        roles: ['teacher']
      })
      
      setPendingTeachers(prev => prev.filter(t => t.uid !== teacherUid))
      alert('교사 승인이 완료되었습니다.')
    } catch (error) {
      console.error('교사 승인 실패:', error)
      alert('승인 처리 중 오류가 발생했습니다.')
    } finally {
      setApproving(null)
    }
  }

  const rejectTeacher = async (teacherUid: string) => {
    if (!confirm('정말로 이 교사의 가입을 거부하시겠습니까?')) {
      return
    }

    try {
      setPendingTeachers(prev => prev.filter(t => t.uid !== teacherUid))
      alert('교사 가입이 거부되었습니다.')
    } catch (error) {
      console.error('교사 거부 실패:', error)
      alert('거부 처리 중 오류가 발생했습니다.')
    }
  }

  // 학생 Excel 업로드 처리
  const handleStudentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.warn('⚠️ 파일이 선택되지 않음')
      return
    }

    console.log('🚀 학생 업로드 시작')
    console.log('📁 선택된 파일:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    })

    setUploading(true)
    setUploadResult(null)

    try {
      console.log('📖 Excel 파일 읽기 시작')
      const data = await file.arrayBuffer()
      console.log('📊 파일 버퍼 크기:', data.byteLength, 'bytes')
      
      const workbook = XLSX.read(data, { type: 'array' })
      console.log('📚 워크북 시트 목록:', workbook.SheetNames)
      
      const sheetName = workbook.SheetNames[0]
      console.log('📄 사용할 시트:', sheetName)
      
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: ExcelStudent[] = XLSX.utils.sheet_to_json(worksheet)
      console.log('📋 JSON 변환 완료, 행 수:', jsonData.length)

      const errors: string[] = []
      const validStudents: Student[] = []

      console.log('📊 Excel 데이터 파싱 시작:', jsonData.length, '행')
      console.log('📋 원본 데이터:', jsonData)

      jsonData.forEach((row, index) => {
        const rowNum = index + 2
        console.log(`🔍 ${rowNum}행 처리 중:`, row)

        // 필수 필드 검증 (StudentID, Name, Grade, Class, Number만 필수)
        if (!row.StudentID) {
          console.error(`❌ ${rowNum}행: StudentID 누락`)
          errors.push(`${rowNum}행: StudentID가 누락되었습니다`)
          return
        }
        if (!row.Name) {
          console.error(`❌ ${rowNum}행: Name 누락`)
          errors.push(`${rowNum}행: Name이 누락되었습니다`)
          return
        }
        if (!row.Grade) {
          console.error(`❌ ${rowNum}행: Grade 누락`)
          errors.push(`${rowNum}행: Grade가 누락되었습니다`)
          return
        }
        if (!row.Class) {
          console.error(`❌ ${rowNum}행: Class 누락`)
          errors.push(`${rowNum}행: Class가 누락되었습니다`)
          return
        }
        if (!row.Number) {
          console.error(`❌ ${rowNum}행: Number 누락`)
          errors.push(`${rowNum}행: Number가 누락되었습니다`)
          return
        }

        if (validStudents.some(s => s.id === row.StudentID)) {
          console.error(`❌ ${rowNum}행: 중복 StudentID:`, row.StudentID)
          errors.push(`${rowNum}행: 중복된 StudentID입니다 (${row.StudentID})`)
          return
        }

        try {
          const student: Student = {
            id: row.StudentID,
            name: row.Name,
            email: row.Email || undefined,
            grade: Number(row.Grade),
            class: Number(row.Class),
            number: Number(row.Number),
            birthdate: row.Birthdate || undefined,
            gender: (row.Gender as 'M' | 'F') || undefined,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          console.log(`✅ ${rowNum}행 학생 객체 생성 성공:`, student)
          validStudents.push(student)
        } catch (error) {
          console.error(`❌ ${rowNum}행 학생 객체 생성 실패:`, error)
          errors.push(`${rowNum}행: 학생 데이터 생성 실패 - ${error}`)
        }
      })

      console.log('📈 검증 완료 - 유효한 학생:', validStudents.length, '개, 오류:', errors.length, '개')

      // Firebase에 저장
      console.log('🔥 Firebase 저장 시작 - 대상 학생:', validStudents.length, '명')
      console.log('👥 기존 학생 목록:', students.map(s => ({ id: s.id, name: s.name })))
      
      const savedStudents: Student[] = []
      for (const student of validStudents) {
        console.log(`💾 학생 저장 시도: ${student.name} (ID: ${student.id})`)
        
        const existingStudent = students.find(s => s.id === student.id)
        if (existingStudent) {
          console.warn(`⚠️ 중복 학생 발견: ${student.id} (${student.name})`)
          errors.push(`중복된 학생 ID: ${student.id} (${student.name})`)
          continue
        }

        try {
          console.log('📝 Firebase 문서 생성 중:', student)
          
          // Firebase에 저장할 데이터 준비
          const studentData = {
            id: student.id,
            name: student.name,
            email: student.email || null,
            grade: student.grade,
            class: student.class,
            number: student.number,
            birthdate: student.birthdate || null,
            gender: student.gender || null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          console.log('📤 Firebase에 저장할 데이터:', studentData)
          
          const studentsRef = collection(db, 'students')
          const docRef = await addDoc(studentsRef, studentData)
          
          console.log(`✅ Firebase 저장 성공 - 문서 ID: ${docRef.id}`)
          savedStudents.push({ ...student, id: docRef.id })
          
        } catch (error) {
          console.error(`❌ Firebase 저장 실패 - ${student.name}:`, error)
          console.error('🔍 상세 오류:', {
            code: (error as any)?.code,
            message: (error as any)?.message,
            stack: (error as any)?.stack
          })
          errors.push(`${student.name} 저장 실패: ${(error as any)?.message || error}`)
        }
      }
      
      console.log('📊 Firebase 저장 완료 - 성공:', savedStudents.length, '명, 실패:', errors.length - (validStudents.length - savedStudents.length), '건')

      if (savedStudents.length > 0) {
        console.log('🔄 학생 목록 새로고침 시작')
        await loadStudentsFromFirebase()
        console.log('✅ 학생 목록 새로고침 완료')
      }

      const result = {
        success: savedStudents.length,
        errors
      }
      
      console.log('🎯 최종 업로드 결과:', result)
      setUploadResult(result)

    } catch (error) {
      console.error('❌ Excel 업로드 전체 오류:', error)
      console.error('🔍 상세 오류 정보:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      })
      
      const errorResult = {
        success: 0,
        errors: [`파일을 읽는 중 오류가 발생했습니다: ${(error as any)?.message || error}`]
      }
      
      console.log('💥 오류 결과:', errorResult)
      setUploadResult(errorResult)
    } finally {
      console.log('🏁 업로드 프로세스 종료')
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 학생 삭제
  const deleteStudent = async (studentId: string) => {
    if (!confirm('정말로 이 학생을 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'students', studentId))
      await loadStudentsFromFirebase()
      alert('학생이 삭제되었습니다.')
    } catch (error) {
      console.error('학생 삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // 템플릿 다운로드
  const downloadTemplate = () => {
    const templateData = [
      {
        StudentID: '2025-1-3-01',
        Name: '김철수',
        Grade: 1,
        Class: 3,
        Number: 1,
        Email: '',
        Birthdate: '',
        Gender: ''
      },
      {
        StudentID: '2025-1-3-02',
        Name: '이영희',
        Grade: 1,
        Class: 3,
        Number: 2,
        Email: '',
        Birthdate: '',
        Gender: ''
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'student_template.xlsx')
  }

  // API 설정 관련 함수들
  const loadAPIConfigs = async () => {
    try {
      setApiLoading(true)
      const configs = await schoolAPIService.getSchoolAPIConfigs()
      setApiConfigs(configs)
    } catch (error) {
      console.error('API 설정 로드 실패:', error)
    } finally {
      setApiLoading(false)
    }
  }

  const handleProviderChange = (provider: AIProvider) => {
    setNewApiConfig(prev => ({
      ...prev,
      provider,
      baseURL: AI_PROVIDERS[provider].baseURL,
      model: AI_MODELS[provider][0]?.id || ''
    }))
  }

  const handleSaveAPIConfig = async () => {
    if (!newApiConfig.apiKey.trim()) {
      alert('API 키를 입력해주세요.')
      return
    }

    try {
      setApiSaving(true)
      await schoolAPIService.saveSchoolAPIConfig({
        provider: newApiConfig.provider,
        apiKey: newApiConfig.apiKey,
        baseURL: newApiConfig.baseURL,
        model: newApiConfig.model,
        maxTokens: newApiConfig.maxTokens,
        temperature: newApiConfig.temperature,
        isActive: true,
        schoolId: 'hanol-hs',
        configuredBy: teacher?.uid || '',
        description: newApiConfig.description
      })

      // 폼 초기화
      setNewApiConfig({
        provider: 'openai',
        apiKey: '',
        baseURL: AI_PROVIDERS.openai.baseURL,
        model: 'gpt-4o-mini',
        maxTokens: DEFAULT_API_CONFIG.maxTokens,
        temperature: DEFAULT_API_CONFIG.temperature,
        description: ''
      })

      // 목록 새로고침
      await loadAPIConfigs()
      alert('API 설정이 저장되었습니다.')
    } catch (error) {
      console.error('API 설정 저장 실패:', error)
      alert('API 설정 저장에 실패했습니다.')
    } finally {
      setApiSaving(false)
    }
  }

  const handleToggleAPIConfig = async (configId: string, isActive: boolean) => {
    try {
      await schoolAPIService.updateSchoolAPIConfig(configId, { isActive })
      await loadAPIConfigs()
    } catch (error) {
      console.error('API 설정 토글 실패:', error)
      alert('API 설정 변경에 실패했습니다.')
    }
  }

  const handleDeleteAPIConfig = async (configId: string) => {
    if (!confirm('정말로 이 API 설정을 삭제하시겠습니까?')) {
      return
    }

    try {
      await schoolAPIService.deleteSchoolAPIConfig(configId)
      await loadAPIConfigs()
      alert('API 설정이 삭제되었습니다.')
    } catch (error) {
      console.error('API 설정 삭제 실패:', error)
      alert('API 설정 삭제에 실패했습니다.')
    }
  }

  // 관리자 권한 확인
  if (!teacher?.roles.includes('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h2>
          <p className="text-gray-600">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
            <p className="mt-1 text-sm text-gray-600">
              교사 승인 및 학생 관리를 할 수 있습니다
            </p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('teachers')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'teachers'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👨‍🏫 교사 승인
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'students'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👥 학생 관리
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'api'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔧 API 설정
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'teachers' && (
                  <div className="space-y-6">
                    {/* 통계 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-yellow-50 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-yellow-800">승인 대기</p>
                            <p className="text-2xl font-bold text-yellow-900">{pendingTeachers.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 승인 대기 목록 */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">승인 대기 교사 목록</h3>
                      
                      {pendingTeachers.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">승인 대기 중인 교사가 없습니다</h3>
                          <p className="mt-1 text-sm text-gray-500">모든 교사가 승인 완료되었습니다.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pendingTeachers.map((pendingTeacher) => (
                            <div key={pendingTeacher.uid} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-700">
                                        {pendingTeacher.name.charAt(0)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {pendingTeacher.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {pendingTeacher.email}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      가입일: {new Date(pendingTeacher.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <Button
                                    onClick={() => approveTeacher(pendingTeacher.uid)}
                                    disabled={approving === pendingTeacher.uid}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {approving === pendingTeacher.uid ? (
                                      <>
                                        <LoadingSpinner size="sm" />
                                        <span className="ml-2">승인 중...</span>
                                      </>
                                    ) : (
                                      '✅ 승인'
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => rejectTeacher(pendingTeacher.uid)}
                                    disabled={approving === pendingTeacher.uid}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    ❌ 거부
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'students' && (
                  <div className="space-y-6">
                    {/* Excel 업로드 섹션 */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-blue-900">학생 데이터 관리</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Excel 파일로 학생 정보를 일괄 업로드하세요<br/>
                            <strong>필수 필드:</strong> StudentID, Name, Grade, Class, Number<br/>
                            <strong>선택 필드:</strong> Email, Birthdate, Gender
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={downloadTemplate}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            📥 템플릿 다운로드
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleStudentUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {uploading ? (
                              <>
                                <LoadingSpinner size="sm" />
                                <span className="ml-2">업로드 중...</span>
                              </>
                            ) : (
                              '📤 파일 업로드'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 업로드 결과 */}
                    {uploadResult && (
                      <div className="p-4 rounded-lg border">
                        <h3 className="font-medium mb-2">업로드 결과</h3>
                        <div className="space-y-2">
                          {uploadResult.success > 0 && (
                            <div className="flex items-center text-green-700">
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              성공: {uploadResult.success}명의 학생이 추가되었습니다
                            </div>
                          )}
                          {uploadResult.errors.length > 0 && (
                            <div className="text-red-700">
                              <div className="flex items-center mb-1">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                오류 {uploadResult.errors.length}개:
                              </div>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {uploadResult.errors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 학생 목록 */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        전체 학생 목록 ({students.length}명)
                      </h3>
                      
                      {students.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">학생이 없습니다</h3>
                          <p className="mt-1 text-sm text-gray-500">Excel 파일을 업로드하여 학생을 추가해보세요.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학생 정보</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학년/반/번호</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생년월일</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성별</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                                          <span className="text-sm font-medium text-gray-700">
                                            {student.name.charAt(0)}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                        <div className="text-sm text-gray-500">{student.id}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {student.email || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {student.grade}학년 {student.class}반 {student.number}번
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {student.birthdate || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {student.gender === 'M' ? '남' : student.gender === 'F' ? '여' : '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <Button
                                      onClick={() => deleteStudent(student.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white text-xs"
                                    >
                                      삭제
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'api' && (
                  <div className="space-y-6">
                    {/* API 설정 안내 */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="p-2 bg-blue-100 rounded-lg mr-4">
                          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-blue-900">학교 공용 API 설정</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            교사들이 사용할 AI API를 설정합니다. 활성화된 설정이 학교 공용 API로 사용됩니다.<br/>
                            교사들은 개인 설정에서 학교 공용 API 또는 개인 API를 선택할 수 있습니다.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 새 API 설정 추가 */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">새 API 설정 추가</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* AI 제공업체 선택 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            AI 제공업체
                          </label>
                          <select
                            value={newApiConfig.provider}
                            onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                              <option key={key} value={key}>
                                {provider.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 모델 선택 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            모델
                          </label>
                          <select
                            value={newApiConfig.model}
                            onChange={(e) => setNewApiConfig(prev => ({ ...prev, model: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {AI_MODELS[newApiConfig.provider].map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.name} (최대 {model.maxTokens.toLocaleString()} 토큰)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* API 키 */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            API 키
                          </label>
                          <input
                            type="password"
                            value={newApiConfig.apiKey}
                            onChange={(e) => setNewApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder="API 키를 입력하세요"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Base URL */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Base URL
                          </label>
                          <input
                            type="url"
                            value={newApiConfig.baseURL}
                            onChange={(e) => setNewApiConfig(prev => ({ ...prev, baseURL: e.target.value }))}
                            placeholder="API Base URL"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* 최대 토큰 수 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            최대 토큰 수
                          </label>
                          <input
                            type="number"
                            value={newApiConfig.maxTokens}
                            onChange={(e) => setNewApiConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 4000 }))}
                            min="100"
                            max="128000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Temperature */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Temperature (창의성)
                          </label>
                          <input
                            type="number"
                            value={newApiConfig.temperature}
                            onChange={(e) => setNewApiConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                            min="0"
                            max="2"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* 설명 */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            설명 (선택사항)
                          </label>
                          <textarea
                            value={newApiConfig.description}
                            onChange={(e) => setNewApiConfig(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="이 API 설정에 대한 설명을 입력하세요"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Button
                          onClick={handleSaveAPIConfig}
                          disabled={apiSaving}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {apiSaving ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-2">저장 중...</span>
                            </>
                          ) : (
                            '💾 API 설정 저장'
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* 기존 API 설정 목록 */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        등록된 API 설정 ({apiConfigs.length}개)
                      </h3>

                      {apiLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <LoadingSpinner size="lg" />
                          <span className="ml-2 text-gray-600">API 설정을 불러오는 중...</span>
                        </div>
                      ) : apiConfigs.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 API 설정이 없습니다</h3>
                          <p className="mt-1 text-sm text-gray-500">위에서 새 API 설정을 추가해보세요.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {apiConfigs.map((config) => (
                            <div
                              key={config.id}
                              className={`border rounded-lg p-4 ${
                                config.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-lg font-medium text-gray-900">
                                      {AI_PROVIDERS[config.provider].name}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      ({config.model})
                                    </span>
                                    {config.isActive && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        활성화
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                                    <div>
                                      <span className="font-medium">최대 토큰:</span> {config.maxTokens.toLocaleString()}
                                    </div>
                                    <div>
                                      <span className="font-medium">Temperature:</span> {config.temperature}
                                    </div>
                                    <div>
                                      <span className="font-medium">등록일:</span> {config.createdAt.toLocaleDateString()}
                                    </div>
                                    <div>
                                      <span className="font-medium">API 키:</span> ****{config.apiKey.slice(-4)}
                                    </div>
                                  </div>

                                  {config.description && (
                                    <p className="text-sm text-gray-600 mt-2">
                                      {config.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                  <Button
                                    onClick={() => handleToggleAPIConfig(config.id, !config.isActive)}
                                    className={`text-sm ${
                                      config.isActive
                                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                  >
                                    {config.isActive ? '비활성화' : '활성화'}
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteAPIConfig(config.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white text-sm"
                                  >
                                    삭제
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 