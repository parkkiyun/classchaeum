import React, { useState, useRef, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../store/appStore'
import type { Student } from '../types'
import * as XLSX from 'xlsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'

interface ExcelRow {
  StudentID?: string
  Name?: string
  Grade?: number
  Class?: number
  Number?: number
  Birthdate?: string
  Gender?: string
  Subjects?: string
}

export const StudentsPage: React.FC = () => {
  const { teacher } = useAuth()
  const { students, setStudents } = useAppStore()
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadResult, setUploadResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Firebase에서 학생 데이터 로드
  const loadStudentsFromFirebase = async () => {
    if (!teacher) return

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
      console.log('Firebase에서 학생 데이터 로드 완료:', loadedStudents.length, '명')
    } catch (error) {
      console.error('학생 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // Firebase에 학생 데이터 저장
  const saveStudentToFirebase = async (student: Student) => {
    try {
      const studentsRef = collection(db, 'students')
      const docRef = await addDoc(studentsRef, {
        ...student,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return { ...student, id: docRef.id }
    } catch (error) {
      console.error('학생 데이터 저장 실패:', error)
      throw error
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadStudentsFromFirebase()
  }, [teacher])

  // Excel 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet)

      const errors: string[] = []
      const validStudents: Student[] = []

      jsonData.forEach((row, index) => {
        const rowNum = index + 2 // Excel 행 번호 (헤더 제외)

        // 필수 필드 검증
        if (!row.StudentID) {
          errors.push(`${rowNum}행: StudentID가 누락되었습니다`)
          return
        }
        if (!row.Name) {
          errors.push(`${rowNum}행: Name이 누락되었습니다`)
          return
        }
        if (!row.Grade || !row.Class || !row.Number) {
          errors.push(`${rowNum}행: Grade, Class, Number가 누락되었습니다`)
          return
        }

        // 중복 체크
        if (validStudents.some(s => s.id === row.StudentID)) {
          errors.push(`${rowNum}행: 중복된 StudentID입니다 (${row.StudentID})`)
          return
        }

        // 유효한 학생 데이터 생성
        const student: Student = {
          id: row.StudentID,
          name: row.Name,
          grade: Number(row.Grade),
          class: Number(row.Class),
          number: Number(row.Number),
          birthdate: row.Birthdate,
          gender: row.Gender as 'M' | 'F',
          subjects: row.Subjects ? row.Subjects.split(',').map(s => s.trim()) : [],
          createdAt: new Date(),
          updatedAt: new Date()
        }

        validStudents.push(student)
      })

      // Firebase에 새로운 학생들 저장
      const savedStudents: Student[] = []
      for (const student of validStudents) {
        // 기존 학생 중복 체크
        const existingStudent = students.find(s => s.id === student.id)
        if (existingStudent) {
          errors.push(`중복된 학생 ID: ${student.id} (${student.name})`)
          continue
        }

        try {
          const savedStudent = await saveStudentToFirebase(student)
          savedStudents.push(savedStudent)
        } catch (error) {
          errors.push(`${student.name} 저장 실패`)
        }
      }

      // 상태 업데이트 및 새로고침
      if (savedStudents.length > 0) {
        await loadStudentsFromFirebase() // 전체 데이터 새로고침
      }

      setUploadResult({
        success: savedStudents.length,
        errors
      })

    } catch (error) {
      console.error('Excel 업로드 오류:', error)
      setUploadResult({
        success: 0,
        errors: ['파일을 읽는 중 오류가 발생했습니다. Excel 파일 형식을 확인해주세요.']
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
        Birthdate: '2008-03-15',
        Gender: 'M',
        Subjects: '국어,수학,영어'
      },
      {
        StudentID: '2025-1-3-02',
        Name: '이영희',
        Grade: 1,
        Class: 3,
        Number: 2,
        Birthdate: '2008-05-22',
        Gender: 'F',
        Subjects: '국어,수학,과학'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'student_template.xlsx')
  }

  // 교사 권한에 따른 학생 필터링
  const getFilteredStudents = () => {
    if (!teacher) return []
    
    return students.filter(student => {
      // 관리자는 모든 학생 조회 가능
      if (teacher.roles.includes('admin')) return true
      
      // 담임교사: 자기 반 학생들
      if (teacher.roles.includes('homeroom') && teacher.homeroomClassId) {
        const [year, grade, classNum] = teacher.homeroomClassId.split('-')
        return student.grade === parseInt(grade) && student.class === parseInt(classNum)
      }
      
      // 교과교사: 담당 반 학생들
      if (teacher.roles.includes('subject') && teacher.subjectClasses) {
        return teacher.subjectClasses.some((classId: string) => {
          const [year, grade, classNum] = classId.split('-')
          return student.grade === parseInt(grade) && student.class === parseInt(classNum)
        })
      }
      
      return false
    })
  }

  const filteredStudents = getFilteredStudents()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">학생 데이터를 불러오는 중...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">학생 관리</h1>
            <p className="mt-1 text-sm text-gray-600">
              Excel 파일로 학생 정보를 업로드하거나 개별 관리할 수 있습니다
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              총 {filteredStudents.length}명
            </span>
          </div>
        </div>

        {/* Excel 업로드 섹션 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Excel 업로드</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 템플릿 다운로드 */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">1. 템플릿 다운로드</h3>
                  <p className="text-sm text-blue-700 mt-1">지정된 양식에 맞춰 학생 정보를 입력하세요</p>
                </div>
                <Button
                  onClick={downloadTemplate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  📥 템플릿 다운로드
                </Button>
              </div>
            </div>

            {/* 파일 업로드 */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-green-900">2. 파일 업로드</h3>
                  <p className="text-sm text-green-700 mt-1">작성한 Excel 파일을 업로드하세요</p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
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
          </div>

          {/* 업로드 결과 */}
          {uploadResult && (
            <div className="mt-4 p-4 rounded-lg border">
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
        </div>

        {/* 학생 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">학생 목록</h2>
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className="px-6 py-12 text-center">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학년/반/번호</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생년월일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성별</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당 과목</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
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
                        {student.grade}학년 {student.class}반 {student.number}번
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.birthdate || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.gender === 'M' ? '남' : student.gender === 'F' ? '여' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {student.subjects?.map((subject, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {subject}
                            </span>
                          )) || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 