import React, { useState, useEffect, useRef } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../store/appStore'
import type { Student, ExcelStudent } from '../types'
import * as XLSX from 'xlsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'

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
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers')
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchPendingTeachers()
    } else {
      loadStudentsFromFirebase()
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
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: ExcelStudent[] = XLSX.utils.sheet_to_json(worksheet)

      const errors: string[] = []
      const validStudents: Student[] = []

      jsonData.forEach((row, index) => {
        const rowNum = index + 2

        if (!row.StudentID || !row.Name || !row.Grade || !row.Class || !row.Number) {
          errors.push(`${rowNum}행: 필수 필드가 누락되었습니다`)
          return
        }

        if (validStudents.some(s => s.id === row.StudentID)) {
          errors.push(`${rowNum}행: 중복된 StudentID입니다 (${row.StudentID})`)
          return
        }

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

      // Firebase에 저장
      const savedStudents: Student[] = []
      for (const student of validStudents) {
        const existingStudent = students.find(s => s.id === student.id)
        if (existingStudent) {
          errors.push(`중복된 학생 ID: ${student.id} (${student.name})`)
          continue
        }

        try {
          const studentsRef = collection(db, 'students')
          const docRef = await addDoc(studentsRef, {
            ...student,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          savedStudents.push({ ...student, id: docRef.id })
        } catch (error) {
          errors.push(`${student.name} 저장 실패`)
        }
      }

      if (savedStudents.length > 0) {
        await loadStudentsFromFirebase()
      }

      setUploadResult({
        success: savedStudents.length,
        errors
      })

    } catch (error) {
      console.error('Excel 업로드 오류:', error)
      setUploadResult({
        success: 0,
        errors: ['파일을 읽는 중 오류가 발생했습니다.']
      })
    } finally {
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
                          <p className="text-sm text-blue-700 mt-1">Excel 파일로 학생 정보를 일괄 업로드하거나 개별 관리하세요</p>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학년/반/번호</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생년월일</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성별</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당 과목</th>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 