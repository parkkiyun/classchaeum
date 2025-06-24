import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export const StudentAssignmentPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { groups, students, getGroupWithStudents, assignStudentsToGroup } = useAppStore()
  
  const [loading, setLoading] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('')
  const [selectedClass, setSelectedClass] = useState<number | ''>('')
  
  const currentGroup = groups.find(g => g.id === groupId)
  const groupWithStudents = groupId ? getGroupWithStudents(groupId, students) : null
  
  // 배정 가능한 학생들 (아직 이 그룹에 배정되지 않은 학생들)
  const availableStudents = useMemo(() => {
    return students.filter(student => 
      !groupWithStudents?.students.some(groupStudent => groupStudent.id === student.id)
    )
  }, [students, groupWithStudents])
  
  // 필터링된 학생들
  const filteredStudents = useMemo(() => {
    let filtered = availableStudents
    
    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(query)
      )
    }
    
    // 학년 필터링
    if (selectedGrade !== '') {
      filtered = filtered.filter(student => student.grade === selectedGrade)
    }
    
    // 반 필터링
    if (selectedClass !== '') {
      filtered = filtered.filter(student => student.class === selectedClass)
    }
    
    return filtered.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade
      if (a.class !== b.class) return a.class - b.class
      return a.number - b.number
    })
  }, [availableStudents, searchQuery, selectedGrade, selectedClass])
  
  // 선택된 학생 정보
  const selectedStudentDetails = useMemo(() => {
    return students.filter(student => selectedStudents.includes(student.id))
  }, [students, selectedStudents])
  
  // 학년/반 옵션
  const availableGrades = useMemo(() => {
    const grades = [...new Set(availableStudents.map(s => s.grade))].sort()
    return grades
  }, [availableStudents])
  
  const availableClasses = useMemo(() => {
    const classes = [...new Set(
      availableStudents
        .filter(s => selectedGrade === '' || s.grade === selectedGrade)
        .map(s => s.class)
    )].sort()
    return classes
  }, [availableStudents, selectedGrade])
  
  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }
  
  const handleSelectAll = () => {
    const currentPageStudentIds = filteredStudents.map(s => s.id)
    const newSelected = [...new Set([...selectedStudents, ...currentPageStudentIds])]
    setSelectedStudents(newSelected)
  }
  
  const handleDeselectAll = () => {
    const currentPageStudentIds = filteredStudents.map(s => s.id)
    setSelectedStudents(prev => prev.filter(id => !currentPageStudentIds.includes(id)))
  }
  
  const handleAssignStudents = async () => {
    if (!groupId || selectedStudents.length === 0) return
    
    try {
      setLoading(true)
      await assignStudentsToGroup(groupId, selectedStudents)
      alert(`${selectedStudents.length}명의 학생이 배정되었습니다.`)
      navigate(`/groups/${groupId}`)
    } catch (error) {
      console.error('학생 배정 실패:', error)
      alert('학생 배정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleRemoveSelected = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(id => id !== studentId))
  }
  
  if (!currentGroup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">클래스를 찾을 수 없습니다</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/groups/${groupId}`)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">학생 배정</h1>
              <p className="text-gray-600">{currentGroup.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">현재 배정된 학생</div>
              <div className="text-lg font-semibold text-gray-900">
                {groupWithStudents?.students.length || 0}명
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 선택된 학생 표시 */}
      {selectedStudents.length > 0 && (
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">
              현재 선택된 학생 ({selectedStudents.length}명)
            </h3>
            <button
              onClick={() => setSelectedStudents([])}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              전체 선택 해제
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedStudentDetails.map((student) => (
              <div key={student.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-800">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500">
                      {student.grade}학년 {student.class}반 {student.number}번
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveSelected(student.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학생 검색
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름으로 검색"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학년
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value === '' ? '' : Number(e.target.value))
                setSelectedClass('') // 학년 변경 시 반 초기화
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 학년</option>
              {availableGrades.map(grade => (
                <option key={grade} value={grade}>{grade}학년</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              반
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 반</option>
              {availableClasses.map(classNum => (
                <option key={classNum} value={classNum}>{classNum}반</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              현재 페이지 전체 선택
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              현재 페이지 선택 해제
            </button>
          </div>
        </div>
      </div>
      
      {/* 학생 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            배정 가능한 학생 ({filteredStudents.length}명)
          </h3>
          <div className="text-sm text-gray-600">
            전체 {availableStudents.length}명 중 {filteredStudents.length}명 표시
          </div>
        </div>
        
        {filteredStudents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <h4 className="mt-2 text-sm font-medium text-gray-900">
              {availableStudents.length === 0 ? '배정 가능한 학생이 없습니다' : '검색 조건에 맞는 학생이 없습니다'}
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              {availableStudents.length === 0 
                ? '모든 학생이 이미 이 클래스에 배정되어 있습니다.' 
                : '다른 검색 조건을 시도해보세요.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">선택</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학생 정보</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학번</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학년</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className={`hover:bg-gray-50 ${selectedStudents.includes(student.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentToggle(student.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.grade}학년
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.class}반
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.number}번
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* 하단 액션 버튼 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedStudents.length > 0 && (
              <span>{selectedStudents.length}명의 학생이 선택되었습니다.</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/groups/${groupId}`)}
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleAssignStudents}
              disabled={selectedStudents.length === 0 || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>
                {loading ? '배정 중...' : `${selectedStudents.length}명 배정하기`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 