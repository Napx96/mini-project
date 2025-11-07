# Project Reorganization Plan

Goal: Move files into a clearer `client/` and `server/` structure and modularize pages into `AdminDashboard/` and `EmployeeDashboard/` folders.

Proposed folder structure (partial):

/project-root
├── client
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   │   ├── AdminDashboard
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── AdminAttendance.jsx
│   │   │   │   └── LeaveManagement.jsx
│   │   │   ├── EmployeeDashboard
│   │   │   │   ├── MyAttendance.jsx
│   │   │   │   └── Profile.jsx
│   │   ├── context
│   │   └── services
│   └── package.json
├── server
│   ├── api
│   ├── classes
│   └── config
├── database
│   ├── schema.sql
│   └── migrations


Step-by-step (PowerShell) move commands

Note: Run these from the repo root. Review each move before executing. Use `git mv` in a git repo to preserve history.

# Create directories
mkdir client\src\pages\AdminDashboard -Force
mkdir client\src\pages\EmployeeDashboard -Force

# Move files (examples)
# Move Dashboard page into AdminDashboard
git mv client\src\pages\Dashboard.js client\src\pages\AdminDashboard\Dashboard.js

# Move Admin pages
git mv client\src\pages\AdminAttendance.js client\src\pages\AdminDashboard\AdminAttendance.js
git mv client\src\pages\LeaveManagement.js client\src\pages\AdminDashboard\LeaveManagement.js

# Move Employee pages
git mv client\src\pages\MyAttendance.js client\src\pages\EmployeeDashboard\MyAttendance.js
git mv client\src\pages\Profile.jsx client\src\pages\EmployeeDashboard\Profile.jsx

# Update imports
# After moving, update import paths in files that referenced moved files. This must be done incrementally.

# Commit the reorganization
git add -A
git commit -m "Reorganize pages into AdminDashboard and EmployeeDashboard folders"


Integration notes
- After moves, update your router (client/src/index.js or App.jsx) to point routes to the new locations.
- Update tests paths if moved files are referenced in tests.
- Run `npm test` and fix any broken imports.

*** End Patch