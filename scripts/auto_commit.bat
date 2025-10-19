@echo off
setlocal
set PHASE_FILE=phase.txt
if exist "%PHASE_FILE%" (
  for /f "usebackq delims=" %%i in ("%PHASE_FILE%") do set PHASE=%%i
) else (
  set PHASE=unlabeled
)
for /f "tokens=*" %%i in ('git symbolic-ref --short HEAD 2^>nul') do set BRANCH=%%i
if "%BRANCH%"=="" set BRANCH=main
set MESSAGE=Auto commit for %PHASE% on %date% %time%
echo ------------------------------------------------- >> version_log.md
echo ## [%PHASE%] - %MESSAGE% >> version_log.md
git diff --name-only >> version_log.md
echo ------------------------------------------------- >> version_log.md
git add .
git commit -m "[%PHASE%] %MESSAGE%"
git tag -f "%PHASE%-%date:~10,4%%date:~4,2%%date:~7,2%%time:~0,2%%time:~3,2%%time:~6,2%"
git push origin %BRANCH% --follow-tags
echo ✅ Auto Git Commit Complete (%PHASE% on %BRANCH%)
endlocal
