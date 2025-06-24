import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { StudentsPage } from './pages/StudentsPage'
import { GroupsPage } from './pages/GroupsPage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import { AdminPage } from './pages/AdminPage'
import { SurveysListPage } from './pages/surveys/SurveysListPage'
import { CreateSurveyPage } from './pages/surveys/CreateSurveyPage'
import { SurveyResponsePage } from './pages/surveys/SurveyResponsePage'
import { SurveyDetailPage } from './pages/surveys/SurveyDetailPage'

// DashboardPage를 감싸는 컴포넌트
const DashboardWrapper: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('')
  
  return (
    <Layout
      showSearch={true}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="클래스 검색..."
    >
      <DashboardPage searchTerm={searchTerm} onSearchChange={setSearchTerm} />
    </Layout>
  )
}

function App() {
  console.log('App 컴포넌트 렌더링 시작')
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardWrapper />
            </ProtectedRoute>
          } />
          <Route path="/students" element={
            <ProtectedRoute>
              <Layout title="학생 관리" subtitle="학생 정보 관리 시스템">
                <StudentsPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/surveys" element={
            <ProtectedRoute>
              <Layout title="설문 관리" subtitle="설문 생성 및 응답 관리">
                <SurveysListPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/surveys/create" element={
            <ProtectedRoute>
              <Layout title="새 설문 만들기" subtitle="설문을 생성하고 공유하세요">
                <CreateSurveyPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/surveys/:surveyId" element={
            <ProtectedRoute>
              <Layout title="설문 상세" subtitle="설문 응답 현황 및 관리">
                <SurveyDetailPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/survey/:surveyId" element={<SurveyResponsePage />} />
          <Route path="/survey/:surveyId/edit" element={<SurveyResponsePage />} />
          <Route path="/groups" element={
            <ProtectedRoute>
              <Layout title="클래스 관리" subtitle="클래스 및 그룹 관리">
                <GroupsPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/groups/:groupId" element={
            <ProtectedRoute>
              <Layout>
                <GroupDetailPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Layout title="관리자" subtitle="시스템 관리">
                <AdminPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={<Navigate to="/" replace />} />
          <Route path="/history" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App