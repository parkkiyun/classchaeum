import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useAppStore } from '../../store/appStore'
import type { Report, Student, Group } from '../../types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

interface StudentRecord {
  studentId: string
  studentName: string
  studentNumber: number
  records: { [key: string]: {
    id?: string
    content: string
    version: number
    updatedAt: Date
  }}
}

interface EditingCell {
  studentId: string
  area: string
}

export const RecordsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const { teacher } = useAuth()
  const { students, groups, getGroupWithStudents } = useAppStore()
  
  const [loading, setLoading] = useState(true)
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([])
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedArea, setSelectedArea] = useState<string>('') // 선택된 영역

  // 현재 그룹 정보
  const currentGroup = groups.find(g => g.id === groupId)
  const groupWithStudents = currentGroup ? getGroupWithStudents(currentGroup.id, students) : null

  // 클래스 유형에 따른 영역 매핑 (메모이제이션)
  const availableAreas = useMemo(() => {
    if (!currentGroup) return []
    
    switch (currentGroup.type) {
      case '담임':
        return [
          { key: 'autonomous', label: '자율활동' },
          { key: 'career', label: '진로활동' }, 
          { key: 'behavior', label: '행동특성' }
        ]
      case '교과':
        return [{ key: 'subject', label: '교과세특' }]
      case '동아리':
        return [{ key: 'club', label: '동아리활동' }]
      default:
        return [{ key: 'autonomous', label: '자율활동' }]
    }
  }, [currentGroup?.type])

  // 첫 번째 영역을 기본 선택
  useEffect(() => {
    if (availableAreas.length > 0 && !selectedArea) {
      setSelectedArea(availableAreas[0].key)
    }
  }, [availableAreas, selectedArea])

  // 글자수를 바이트로 계산 (한글 3바이트, 영문/숫자 1바이트)
  const calculateBytes = (text: string): number => {
    let bytes = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i)
      if (char.match(/[가-힣]/)) {
        bytes += 3 // 한글
      } else if (char.match(/[a-zA-Z0-9\s]/)) {
        bytes += 1 // 영문, 숫자, 공백
      } else {
        bytes += 2 // 기타 특수문자
      }
    }
    return bytes
  }

  // 기록 데이터 로드 (의존성 단순화)
  const loadAllRecords = useCallback(async () => {
    if (!groupWithStudents?.students.length || !teacher || !groupId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('기록 로드 시작:', { groupId, teacherId: teacher.uid, studentCount: groupWithStudents.students.length })
      
      const reportsRef = collection(db, 'reports')
      const reportsQuery = query(
        reportsRef,
        where('groupId', '==', groupId),
        where('teacherId', '==', teacher.uid)
      )
      
      const reportsSnapshot = await getDocs(reportsQuery)
      console.log('Firebase에서 기록 조회 완료:', reportsSnapshot.size, '개')
      
      const recordsMap = new Map<string, Record<string, any>>()

      // Firebase에서 기록 로드
      reportsSnapshot.forEach(doc => {
        const data = doc.data()
        const key = `${data.studentId}-${data.area}`
        recordsMap.set(key, {
          id: doc.id,
          content: data.content || '',
          version: data.version || 1,
          updatedAt: data.updatedAt?.toDate() || new Date()
        })
      })

      // 현재 사용 가능한 영역 가져오기
      const currentAreas = currentGroup?.type === '담임' 
        ? [{ key: 'autonomous', label: '자율활동' }, { key: 'career', label: '진로활동' }, { key: 'behavior', label: '행동특성' }]
        : currentGroup?.type === '교과'
        ? [{ key: 'subject', label: '교과세특' }]
        : currentGroup?.type === '동아리'
        ? [{ key: 'club', label: '동아리활동' }]
        : [{ key: 'autonomous', label: '자율활동' }]

      // 학생별 기록 구성
      const studentRecordsData: StudentRecord[] = groupWithStudents.students
        .sort((a, b) => a.number - b.number) // 번호순 정렬
        .map(student => {
          const records: { [key: string]: any } = {}
          
          currentAreas.forEach(area => {
            const key = `${student.id}-${area.key}`
            records[area.key] = recordsMap.get(key) || {
              content: '',
              version: 1,
              updatedAt: new Date()
            }
          })

          return {
            studentId: student.id,
            studentName: student.name,
            studentNumber: student.number,
            records
          }
        })

      console.log('학생별 기록 구성 완료:', studentRecordsData.length, '명')
      setStudentRecords(studentRecordsData)
    } catch (error) {
      console.error('기록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [groupWithStudents?.students.length, teacher?.uid, groupId, currentGroup?.type])

  // 초기 로드
  useEffect(() => {
    console.log('useEffect 실행:', { 
      hasGroupWithStudents: !!groupWithStudents, 
      hasTeacher: !!teacher, 
      groupId 
    })
    loadAllRecords()
  }, [loadAllRecords])

  // 셀 편집 시작
  const handleCellClick = (studentId: string, area: string) => {
    const student = studentRecords.find(s => s.studentId === studentId)
    if (student) {
      setEditingCell({ studentId, area })
      setEditingContent(student.records[area]?.content || '')
    }
  }

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditingContent('')
  }

  // 기록 저장
  const handleSaveRecord = async () => {
    if (!editingCell || !teacher || !groupId) return

    try {
      setSaving(true)
      
      const student = studentRecords.find(s => s.studentId === editingCell.studentId)
      if (!student) return

      const currentRecord = student.records[editingCell.area]
      const reportId = currentRecord?.id

      if (reportId) {
        // 기존 기록 업데이트
        const reportRef = doc(db, 'reports', reportId)
        await updateDoc(reportRef, {
          content: editingContent,
          version: (currentRecord.version || 1) + 1,
          updatedAt: new Date()
        })
      } else {
        // 새 기록 생성
        const reportsRef = collection(db, 'reports')
        const newReport = {
          studentId: editingCell.studentId,
          teacherId: teacher.uid,
          groupId: groupId,
          area: editingCell.area,
          content: editingContent,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        const docRef = await addDoc(reportsRef, newReport)
        
        // 로컬 상태 업데이트 - 새 기록의 ID 추가
        setStudentRecords(prev => prev.map(s => 
          s.studentId === editingCell.studentId 
            ? {
                ...s,
                records: {
                  ...s.records,
                  [editingCell.area]: {
                    id: docRef.id,
                    content: editingContent,
                    version: 1,
                    updatedAt: new Date()
                  }
                }
              }
            : s
        ))
      }

      // 로컬 상태 업데이트
      if (reportId) {
        setStudentRecords(prev => prev.map(s => 
          s.studentId === editingCell.studentId 
            ? {
                ...s,
                records: {
                  ...s.records,
                  [editingCell.area]: {
                    ...currentRecord,
                    content: editingContent,
                    version: (currentRecord.version || 1) + 1,
                    updatedAt: new Date()
                  }
                }
              }
            : s
        ))
      }

      setEditingCell(null)
      setEditingContent('')
      
    } catch (error) {
      console.error('기록 저장 실패:', error)
      alert('기록 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 선택된 영역 정보
  const selectedAreaInfo = availableAreas.find(area => area.key === selectedArea)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">기록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 영역 선택 필터 */}
      <div className="flex flex-wrap gap-2">
        {availableAreas.map(area => (
          <button
            key={area.key}
            onClick={() => setSelectedArea(area.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedArea === area.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {area.label}
          </button>
        ))}
      </div>

      {/* 기록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="w-16 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번호
                </th>
                <th className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  성명
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[400px]">
                  {selectedAreaInfo?.label || '기록'}
                </th>
                <th className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  글자수
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentRecords.map((student) => {
                const recordContent = student.records[selectedArea]?.content || ''
                const bytes = calculateBytes(recordContent)
                
                return (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                      {student.studentNumber}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">
                      <div className="flex items-center justify-center">
                        <span className="text-blue-600 mr-1">👤</span>
                        {student.studentName}
                      </div>
                    </td>
                    <td className="px-2 py-3 relative">
                      {editingCell?.studentId === student.studentId && editingCell?.area === selectedArea ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full h-24 p-2 text-xs border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`${selectedAreaInfo?.label} 기록을 입력하세요...`}
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {calculateBytes(editingContent)} / 2100 Byte
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={handleCancelEdit}
                                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                disabled={saving}
                              >
                                취소
                              </button>
                              <button
                                onClick={handleSaveRecord}
                                disabled={saving}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {saving ? '저장중...' : '저장'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => handleCellClick(student.studentId, selectedArea)}
                          className="min-h-[60px] p-2 border border-gray-200 rounded cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <div className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                            {recordContent || (
                              <span className="text-gray-400">클릭하여 기록 입력</span>
                            )}
                          </div>
                          {recordContent && (
                            <div className="mt-1 text-xs text-gray-400">
                              v{student.records[selectedArea]?.version} • {student.records[selectedArea]?.updatedAt.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {bytes} / 2100 Byte
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
          이전 기록 보기
        </button>
        <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">
          전체 저장
        </button>
      </div>

      {/* 빈 상태 */}
      {studentRecords.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">배정된 학생이 없습니다</h4>
          <p className="text-gray-500">
            클래스 대시보드에서 학생을 배정해주세요.
          </p>
        </div>
      )}
    </div>
  )
} 