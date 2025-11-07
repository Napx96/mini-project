# Employee Management System (EMS) - Product Requirements Document

## 1. Overview

The Employee Management System (EMS) is a comprehensive web-based application designed to streamline HR operations for small to medium-sized businesses. It provides tools for managing employee data, tracking attendance, handling leave requests, and maintaining organizational records. The system supports role-based access control with three user types: Admin, HR, and Employee.

### 1.1 Purpose
- Automate routine HR tasks
- Provide real-time attendance tracking
- Enable efficient leave management
- Maintain centralized employee records
- Support data-driven decision making through reporting

### 1.2 Target Users
- **Administrators**: System owners who need full control over users and system configuration
- **HR Managers**: Personnel responsible for employee management and leave approvals
- **Employees**: Staff members who need to track attendance and manage personal information

## 2. System Architecture

### 2.1 Technology Stack
- **Backend**: PHP 7+ with MySQL database
- **Frontend**: React.js with Bootstrap for UI
- **Authentication**: JWT (JSON Web Tokens)
- **Communication**: RESTful API with JSON responses

### 2.2 Architecture Pattern
- MVC-inspired structure with separate API layer
- Modular class-based backend design
- Component-based React frontend
- Database-first approach with PDO for data access

## 3. User Roles and Permissions

| Role       | Description                    | Key Permissions |
|------------|--------------------------------|-----------------|
| **Admin**  | System administrator           | Full system access, user management, system configuration |
| **HR**     | Human Resources manager        | Employee management, leave approvals, attendance oversight |
| **Employee**| Regular staff member          | Personal profile, attendance tracking, leave applications |

## 4. Core Features

### 4.1 Authentication & Authorization
- Secure login with email/password
- JWT-based session management
- Automatic logout on token expiration
- Role-based access control for UI and API endpoints
- Password hashing using PHP's `password_hash()`

### 4.2 Employee Management
- Complete CRUD operations for employee records
- Employee profile management (personal, contact, employment details)
- Bulk import/export capabilities
- Employee code generation and management
- Department and designation tracking

### 4.3 Attendance Management
- Real-time clock in/out functionality
- Support for overnight shifts (fixed bug)
- Automatic attendance state detection
- Admin/HR editing capabilities
- Attendance reporting and analytics
- Work hour calculations

### 4.4 Leave Management
- Multiple leave types (Annual, Sick, Personal, Maternity)
- Leave application workflow
- HR approval/rejection process
- Leave balance tracking
- Calendar integration for leave planning

### 4.5 Holiday Management
- Company holiday calendar
- Holiday definitions and management
- Integration with attendance and leave systems

### 4.6 Dashboard & Reporting
- Role-based dashboard views
- Real-time statistics and metrics
- Attendance reports
- Leave utilization reports
- Employee performance insights

### 4.7 Document Management
- Employee document storage
- Document type categorization
- Secure file upload and retrieval

### 4.8 Audit Logging
- Comprehensive audit trail
- User action tracking
- System change logging
- Security event monitoring

## 5. Database Schema

| Table Name          | Purpose |
|--------------------|---------|
| `users`            | User accounts, authentication, roles |
| `employees`        | Employee personal and employment details |
| `attendance`       | Clock in/out timestamps and records |
| `leaves`           | Leave applications and approvals |
| `leave_types`      | Predefined leave categories |
| `holidays`         | Company holiday calendar |
| `performance_reviews` | Employee performance evaluations |
| `employee_documents` | Document storage references |
| `audit_logs`       | System activity tracking |
| `notifications`    | User notifications |

## 6. API Endpoints

### Authentication
- `POST /api/auth.php` - User login and token generation

### Employee Management
- `GET /api/employees.php` - List employees (paginated)
- `POST /api/employees.php` - Create new employee
- `PUT /api/employees.php?id={id}` - Update employee
- `DELETE /api/employees.php?id={id}` - Delete employee

### Attendance
- `GET /api/attendance.php` - List attendance records
- `POST /api/attendance.php` - Clock in/out (auto-detect)
- `PUT /api/attendance.php?id={id}` - Update attendance record
- `DELETE /api/attendance.php?id={id}` - Delete attendance record

### Leave Management
- `GET /api/leaves.php` - List leave requests
- `POST /api/leaves.php` - Submit leave application
- `PUT /api/leaves.php?id={id}` - Approve/reject leave

### Other
- `GET /api/holidays.php` - Get holiday calendar
- `GET /api/stats.php` - System statistics
- `GET /api/notifications.php` - User notifications

## 7. Frontend Components

### Core Pages
- **Login** - Authentication interface
- **Dashboard** - Role-based overview and statistics
- **Employee Management** - CRUD operations for employees
- **My Attendance** - Personal attendance tracking
- **Admin Attendance** - Administrative attendance management
- **Leave Management** - Leave application and approval
- **Profile** - Personal information management

### Shared Components
- **Sidebar** - Navigation menu
- **Pagination** - Data pagination
- **EmployeeForm** - Employee data entry
- **AuthContext** - Authentication state management

## 8. Recent Updates

### Attendance Bug Fix
**Issue**: Clock out functionality failed for shifts spanning midnight due to date-based filtering.

**Solution**:
- Removed `work_date` constraint from clock out query
- Implemented automatic state detection in API
- Now supports multi-day attendance records

**Impact**: Employees can now work overnight shifts without clock out issues.

## 9. Non-Functional Requirements

### Performance
- API response time < 500ms for standard operations
- Support for 100+ concurrent users
- Efficient database queries with proper indexing

### Security
- JWT token-based authentication
- Password hashing and salting
- Input validation and sanitization
- CORS protection
- SQL injection prevention via prepared statements

### Usability
- Intuitive React-based interface
- Responsive Bootstrap design
- Role-based UI customization
- Clear error messages and feedback

### Maintainability
- Modular PHP class structure
- Component-based React architecture
- Comprehensive error logging
- Code documentation and comments

## 10. Testing Strategy

### Unit Testing
- PHP class method testing
- React component testing with Jest
- API endpoint validation

### Integration Testing
- End-to-end user workflows
- API integration testing
- Database operation verification

### Manual Testing Scenarios
- User authentication flows
- CRUD operations across all modules
- Attendance clock in/out (including overnight)
- Leave application and approval process
- Role-based access control

## 11. Deployment & Setup

### Prerequisites
- PHP 7.4+
- MySQL 5.7+
- Node.js 14+
- Apache/Nginx web server

### Installation Steps
1. Clone repository to web server directory
2. Import `schema.sql` into MySQL database
3. Configure database connection in `api/config/database.php`
4. Install frontend dependencies: `npm install`
5. Build frontend: `npm run build`
6. Set proper file permissions
7. Access application via web browser

### Environment Configuration
- Database credentials
- JWT secret key
- Timezone settings
- File upload paths

## 12. Future Enhancements

### Planned Features
- Payroll and salary management
- Advanced reporting and analytics
- Email notification system
- Mobile application
- Integration with third-party HR systems
- Advanced performance review system

### Technical Improvements
- API rate limiting
- Caching layer (Redis)
- Background job processing
- API documentation (Swagger)
- Automated testing pipeline

## 13. Acceptance Criteria

- [x] Secure user authentication with role-based access
- [x] Complete employee lifecycle management
- [x] Reliable attendance tracking including overnight shifts
- [x] Efficient leave management workflow
- [x] Comprehensive reporting capabilities
- [x] Responsive and intuitive user interface
- [x] Robust error handling and logging
- [x] Scalable and maintainable codebase

## 14. Support & Maintenance

### Documentation
- Inline code comments
- API endpoint documentation
- User manuals and guides
- Troubleshooting guides

### Monitoring
- Error logging and alerting
- Performance monitoring
- User activity tracking
- System health checks

---

**Document Version:** 1.0  
**Last Updated:** October 2024  
**Author:** AI Assistant (based on codebase analysis)
