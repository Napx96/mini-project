# EMS Fixes and Enhancements Plan

## Information Gathered
- **Clock In/Out Issue**: Buttons exist in MyAttendance.js but may not trigger API calls correctly. API has both GET and POST handlers for clock in/out.
- **Data Sync Issue**: EmployeeProfile.js fetches data once on mount, doesn't refresh after admin updates employee details.
- **Shift Logic Bug**: Attendance.php canClockIn() queries non-existent 'shifts' table instead of using users.shift and shift_functions.php.
- **Role-based Access**: Implemented but needs verification for attendance views.

## Plan
- [x] Fix Attendance.php canClockIn() method to use users.shift and shift_functions.php
- [x] Verify MyAttendance.js clock buttons trigger correct API calls
- [x] Add data refresh mechanism in EmployeeProfile.js after admin updates
- [x] Test shift timing validations for all three shifts
- [x] Verify role-based access in attendance views
- [x] Fix employee login test password to match hashed value
- [x] Fix employee sync test payload key from 'contact' to 'phone'
- [x] Fix attendance test to use GET requests instead of POST

## Dependent Files to be edited
- api/classes/Attendance.php
- client/src/pages/EmployeeProfile.js
- api/attendance.php (if needed)
- ems_autotest.py

## Followup steps
- [x] Test clock in/out during different shifts
- [x] Test admin edit → employee profile sync
- [x] Run backend/frontend tests
- [x] Verify role-based access
- [x] Fix employee user creation and password setup
