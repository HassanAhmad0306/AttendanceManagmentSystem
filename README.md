# Attendance Management System - Database First

## ✅ Successfully Converted to Database First Approach

**Previous**: Code First (Models → Migrations → Database)  
**Current**: Database First (SQL Script → Database → Scaffold → Models)

## Database Information
- **Server**: `(localdb)\MSSQLLocalDB`
- **Database Name**: `AttendanceManagementDB`
- **Total Tables**: 11 (All created and ready)

## View Database in Visual Studio 2022
1. Open Visual Studio 2022
2. **View** → **SQL Server Object Explorer**
3. Expand: **(localdb)\MSSQLLocalDB** → **Databases** → **AttendanceManagementDB** → **Tables**

## How to Run
```bash
dotnet run
```
Application runs at: **http://localhost:5000**

## Default Login
- Username: `admin`
- Password: `admin123`

## Swagger UI Usage
1. Open http://localhost:5000
2. Use **POST /api/auth/login** with admin credentials
3. Copy the token from response
4. Click **Authorize 🔒** button
5. Enter: `Bearer <your-token>`
6. Test any endpoint

## Project Structure
```
/Data
  └── AttendanceManagementDbContext.cs (Scaffolded from DB)
/Models
  ├── User.cs (Scaffolded)
  ├── Student.cs (Scaffolded)
  ├── Teacher.cs (Scaffolded)
  ├── Admin.cs (Scaffolded)
  ├── Course.cs (Scaffolded)
  ├── Section.cs (Scaffolded)
  ├── Session.cs (Scaffolded)
  ├── CourseEnrollment.cs (Scaffolded)
  ├── CourseTeacher.cs (Scaffolded)
  ├── Attendance.cs (Scaffolded)
  └── TimetableEntry.cs (Scaffolded)
/Controllers
  ├── AuthController.cs
  ├── AdminController.cs
  ├── TeacherController.cs
  ├── StudentController.cs
  └── ReportsController.cs
/Services
  └── JwtService.cs
```

## Features
✅ Admin: User, Course, Section, Session Management  
✅ Teacher: Mark Attendance, View Students  
✅ Student: View Attendance, Timetable, Summary  
✅ Reports: Monthly, Semester, Yearly, Defaulters  
✅ JWT Authentication with Role-Based Authorization  
✅ BCrypt Password Hashing

## Database Tables
1. Users - All user accounts
2. Admins - Admin profiles
3. Teachers - Teacher profiles  
4. Students - Student profiles
5. Courses - Course information
6. Sessions - Academic sessions
7. Sections - Student sections
8. CourseEnrollments - Student enrollments
9. CourseTeachers - Teacher assignments
10. Attendances - Attendance records
11. TimetableEntries - Class schedules
