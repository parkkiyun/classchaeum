const { contextBridge, ipcRenderer } = require('electron')

// 메인 프로세스와 렌더러 프로세스 간의 안전한 통신을 위한 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 앱 정보
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),

  // 파일 다이얼로그
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),

  // 파일 시스템
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),

  // 개발자 도구 (개발 모드에서만)
  openDevTools: () => {
    if (process.env.NODE_ENV === 'development') {
      ipcRenderer.invoke('dev:openDevTools')
    }
  }
})

// 타입 정의를 위한 전역 인터페이스 (TypeScript에서 사용)
if (typeof window !== 'undefined') {
  window.electronAPI = window.electronAPI || {}
} 