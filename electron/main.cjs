const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

// 개발 모드 확인
const isDev = process.env.IS_DEV === 'true'

let mainWindow

// 메인 윈도우 생성
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false // 준비될 때까지 숨김
  })

  // 개발 모드에서는 Vite 서버에 연결, 프로덕션에서는 빌드된 파일 로드
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174')
    mainWindow.webContents.openDevTools() // 개발자 도구 자동 열기
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 윈도우가 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    if (isDev) {
      console.log('🚀 Electron 개발 모드로 실행 중')
      console.log('📱 React 앱 URL: http://localhost:5174')
    }
  })

  // 윈도우 닫기 처리
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 외부 링크는 기본 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// 앱 준비 완료
app.whenReady().then(() => {
  createWindow()

  // macOS에서 독에서 클릭 시 윈도우 재생성
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 모든 윈도우가 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 핸들러들
ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})

ipcMain.handle('app:getPlatform', () => {
  return process.platform
})

// 파일 다이얼로그
ipcMain.handle('dialog:openFile', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      ...options
    })
    return result
  } catch (error) {
    console.error('파일 다이얼로그 오류:', error)
    throw error
  }
})

// 파일 저장 다이얼로그
ipcMain.handle('dialog:saveFile', async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'Excel Files', extensions: ['xlsx'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      ...options
    })
    return result
  } catch (error) {
    console.error('파일 저장 다이얼로그 오류:', error)
    throw error
  }
})

// 파일 읽기
ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath)
    return data
  } catch (error) {
    console.error('파일 읽기 오류:', error)
    throw error
  }
})

// 파일 쓰기
ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data)
    return { success: true }
  } catch (error) {
    console.error('파일 쓰기 오류:', error)
    throw error
  }
})

// 보안 강화: 개발 모드가 아닐 때 개발자 도구 비활성화
if (!isDev) {
  app.on('web-contents-created', (event, contents) => {
    contents.on('devtools-opened', () => {
      contents.closeDevTools()
    })
  })
} 