import React, { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useAppStore } from '../../store/appStore'
import type { Group, GroupType, Student } from '../../types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'

export const MyGroupsPage: React.FC = () => {
  const { teacher } = useAuth()
  const { 
    groups, 
    students,
    setGroups, 
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupsByTeacher,
    getGroupWithStudents,
    getAvailableStudents
  } = useAppStore()
  
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  
  // 클래스 생성 폼 상태
  const [classForm, setClassForm] = useState({
    name: '',
    type: '담임' as GroupType,
    description: ''
  })

  // Firebase에서 클래스 데이터 로드
  const loadGroups = async () => {
    if (!teacher) return

    try {
      setLoading(true)
      const groupsRef = collection(db, 'groups')
      const q = query(groupsRef, where('teacherId', '==', teacher.uid))
      const querySnapshot = await getDocs(q)
      
      const loadedGroups: Group[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        loadedGroups.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Group)
      })
      
      setGroups(loadedGroups)
      console.log('클래스 데이터 로드 완료:', loadedGroups.length, '개')
    } catch (error) {
      console.error('클래스 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [teacher])

  // 클래스 생성
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher || creating) return

    try {
      setCreating(true)
      
      const newGroup: Omit<Group, 'id'> = {
        name: classForm.name,
        type: classForm.type,
        teacherId: teacher.uid,
        studentIds: [],
        description: classForm.description,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const groupsRef = collection(db, 'groups')
      const docRef = await addDoc(groupsRef, newGroup)
      
      const createdGroup: Group = {
        id: docRef.id,
        ...newGroup
      }
      
      addGroup(createdGroup)
      setShowCreateModal(false)
      setClassForm({ name: '', type: '담임', description: '' })
      
      alert('클래스가 생성되었습니다.')
    } catch (error) {
      console.error('클래스 생성 실패:', error)
      alert('클래스 생성 중 오류가 발생했습니다.')
    } finally {
      setCreating(false)
    }
  }

  // 클래스 삭제
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('정말로 이 클래스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'groups', groupId))
      deleteGroup(groupId)
      alert('클래스가 삭제되었습니다.')
    } catch (error) {
      console.error('클래스 삭제 실패:', error)
      alert('클래스 삭제 중 오류가 발생했습니다.')
    }
  }

  // 학생 배정 모달 열기
  const openAssignModal = (group: Group) => {
    setSelectedGroup(group)
    setSelectedStudents([...group.studentIds])
    setShowAssignModal(true)
  }

  // 학생 배정 저장
  const handleAssignStudents = async () => {
    if (!selectedGroup) return

    try {
      const groupRef = doc(db, 'groups', selectedGroup.id)
      await updateDoc(groupRef, {
        studentIds: selectedStudents,
        updatedAt: new Date()
      })

      const updatedGroup = {
        ...selectedGroup,
        studentIds: selectedStudents,
        updatedAt: new Date()
      }
      
      updateGroup(updatedGroup)
      setShowAssignModal(false)
      setSelectedGroup(null)
      setSelectedStudents([])
      
      alert('학생 배정이 완료되었습니다.')
    } catch (error) {
      console.error('학생 배정 실패:', error)
      alert('학생 배정 중 오류가 발생했습니다.')
    }
  }

  const myGroups = teacher ? getGroupsByTeacher(teacher.uid) : []
  const availableStudents = getAvailableStudents()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">클래스 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">내 클래스</h2>
          <p className="text-sm text-gray-600 mt-1">클래스를 생성하고 학생을 배정할 수 있습니다</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          새 클래스 생성
        </Button>
      </div>

      {/* 클래스 목록 */}
      {myGroups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">클래스가 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">새 클래스를 생성하여 시작해보세요</p>
          <div className="mt-6">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              첫 번째 클래스 만들기
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myGroups.map(group => {
            const groupWithStudents = getGroupWithStudents(group.id, students)
            return (
              <div key={group.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.description}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      group.type === '담임' ? 'bg-blue-100 text-blue-800' :
                      group.type === '교과' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {group.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>배정된 학생: {groupWithStudents?.students.length || 0}명</span>
                  </div>

                  {/* 배정된 학생 미리보기 */}
                  {groupWithStudents && groupWithStudents.students.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {groupWithStudents.students.slice(0, 3).map(student => (
                          <span key={student.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            {student.name}
                          </span>
                        ))}
                        {groupWithStudents.students.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            +{groupWithStudents.students.length - 3}명
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => openAssignModal(group)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      학생 배정
                    </Button>
                    <Button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-3"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 클래스 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">새 클래스 생성</h3>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    클래스명
                  </label>
                  <input
                    type="text"
                    value={classForm.name}
                    onChange={(e) => setClassForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 1학년 3반 담임"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    클래스 유형
                  </label>
                  <select
                    value={classForm.type}
                    onChange={(e) => setClassForm(prev => ({ ...prev, type: e.target.value as GroupType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="담임">담임</option>
                    <option value="교과">교과</option>
                    <option value="동아리">동아리</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명 (선택사항)
                  </label>
                  <textarea
                    value={classForm.description}
                    onChange={(e) => setClassForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="클래스에 대한 간단한 설명을 입력하세요"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                    disabled={creating}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {creating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">생성 중...</span>
                      </>
                    ) : (
                      '생성'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 학생 배정 모달 */}
      {showAssignModal && selectedGroup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                학생 배정 - {selectedGroup.name}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  선택된 학생: {selectedStudents.length}명
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        선택
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        학생 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        학번
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        현재 배정 상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => {
                      const isSelected = selectedStudents.includes(student.id)
                      const currentGroup = groups.find(g => g.studentIds.includes(student.id))
                      const isInOtherGroup = currentGroup && currentGroup.id !== selectedGroup.id
                      
                      return (
                        <tr key={student.id} className={isSelected ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents(prev => [...prev, student.id])
                                } else {
                                  setSelectedStudents(prev => prev.filter(id => id !== student.id))
                                }
                              }}
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
                                <div className="text-sm text-gray-500">
                                  {student.grade}학년 {student.class}반
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.number}번
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isInOtherGroup ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                다른 클래스에 배정됨
                              </span>
                            ) : currentGroup?.id === selectedGroup.id ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                현재 클래스
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                미배정
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedGroup(null)
                    setSelectedStudents([])
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  취소
                </Button>
                <Button
                  onClick={handleAssignStudents}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  배정 완료
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
