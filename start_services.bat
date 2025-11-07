@echo off
echo Starting EMS Services...

REM Start XAMPP Control Panel
start "" "C:\xampp\xampp-control.exe"

REM Wait for services to start
timeout /t 10 /nobreak > nul

REM Run backend tests
echo Running backend PHP tests...
php test_auth.php
php test_db.php
php test_api.php
php test_clock_in_out.php
php test_double_clock_in.php
php test_token.php
php test_token2.php
php test_debug.php
php test_time.php
php test_time_debug.php
php test_timezone.php
php test_time_sync2.php
php test_time2.php

echo Backend tests completed.

REM Run API tests (if server is running)
echo Running API tests...
python testsprite_tests/TC001_login_with_valid_credentials.py
python testsprite_tests/TC002_login_with_invalid_credentials.py

echo API tests completed.

REM Run frontend tests
echo Running frontend Jest tests...
cd client
npm test -- --watchAll=false --coverage
cd ..

echo All tests completed.
echo Services are running. You can access the application at:
echo Frontend: http://localhost/ems/client
echo API: http://localhost/ems/api/

pause
