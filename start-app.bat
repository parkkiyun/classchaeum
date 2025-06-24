@echo off
echo ===========================================
echo   AI 생활기록부 생성기 - 시작 스크립트
echo ===========================================
echo.

REM Node.js 설치 확인
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo.
    echo Node.js 설치가 필요합니다:
    echo 1. https://nodejs.org 방문
    echo 2. LTS 버전 다운로드 및 설치
    echo 3. 설치 후 이 스크립트를 다시 실행하세요.
    echo.
    pause
    exit /b 1
)

echo [정보] Node.js 버전 확인 중...
node --version
npm --version
echo.

REM 의존성 설치 확인
if not exist "node_modules" (
    echo [설치] 의존성 패키지 설치 중... (시간이 걸릴 수 있습니다)
    npm install
    if %errorlevel% neq 0 (
        echo [오류] 의존성 설치에 실패했습니다.
        pause
        exit /b 1
    )
) else (
    echo [정보] 의존성 패키지가 이미 설치되어 있습니다.
)

echo.
echo [시작] 개발 서버를 시작합니다...
echo.
echo 브라우저에서 http://localhost:5173 를 열어주세요.
echo (Vite 개발 서버가 자동으로 브라우저를 열 수도 있습니다)
echo.
echo 종료하려면 Ctrl+C를 누르세요.
echo.

npm run dev

pause 