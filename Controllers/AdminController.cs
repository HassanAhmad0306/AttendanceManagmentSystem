using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceManagementSystem.Data;
using AttendanceManagementSystem.Models;
using BCrypt.Net;

namespace AttendanceManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AttendanceManagementDbContext _context;

        public AdminController(AttendanceManagementDbContext context)
        {
            _context = context;
        }

        // User Management
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest(new { message = "Username already exists. Please choose a different username." });
            }

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "Email already exists. Please use a different email address." });
            }

            // Email validation: must be @gmail.com
            if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.EndsWith("@gmail.com", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Email must be a valid @gmail.com address." });
            }

            // Password validation: must be >8 chars
            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            {
                return BadRequest(new { message = "Password must be at least 8 characters long." });
            }

            // Only one admin allowed
            if (request.Role == "Admin" && await _context.Admins.AnyAsync())
            {
                return BadRequest(new { message = "Only one admin account is allowed." });
            }

            var user = new User
            {
                Username = request.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role,
                FullName = request.FullName,
                Email = request.Email,
                IsFirstLogin = true,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create role-specific record
            if (request.Role == "Student")
            {
                var year = DateTime.Now.Year;
                var department = request.Department ?? "CS";
                var lastStudent = await _context.Students.OrderByDescending(s => s.StudentId).FirstOrDefaultAsync();
                var nextNumber = (lastStudent?.StudentId ?? 0) + 1;
                var rollNumber = $"{year}-{department}-{nextNumber:D3}";

                var student = new Student
                {
                    UserId = user.UserId,
                    RollNumber = rollNumber,
                    SectionId = request.SectionId
                };
                _context.Students.Add(student);
            }
            else if (request.Role == "Teacher")
            {
                var year = DateTime.Now.Year;
                var department = request.Department ?? "CS";
                var lastTeacher = await _context.Teachers.OrderByDescending(t => t.TeacherId).FirstOrDefaultAsync();
                var nextNumber = (lastTeacher?.TeacherId ?? 0) + 1;
                var employeeId = $"{year}-{department}-{nextNumber:D3}";

                var teacher = new Teacher
                {
                    UserId = user.UserId,
                    EmployeeId = employeeId,
                    Department = request.Department
                };
                _context.Teachers.Add(teacher);
            }
            else if (request.Role == "Admin")
            {
                var admin = new Admin { UserId = user.UserId };
                _context.Admins.Add(admin);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "User created successfully", userId = user.UserId });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Role,
                    u.FullName,
                    u.Email,
                    u.IsActive,
                    u.CreatedAt,
                    u.LastLogin
                })
                .ToListAsync();

            return Ok(users);
        }

        // Course Management
        [HttpPost("courses")]
        public async Task<IActionResult> CreateCourse([FromBody] Course course)
        {
            try
            {
                // Check if course code already exists
                if (await _context.Courses.AnyAsync(c => c.CourseCode == course.CourseCode))
                {
                    return BadRequest(new { message = "Course code already exists. Please use a different course code." });
                }

                _context.Courses.Add(course);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Course created successfully", courseId = course.CourseId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error creating course: {ex.Message}" });
            }
        }

        [HttpGet("courses")]
        public async Task<IActionResult> GetAllCourses()
        {
            var courses = await _context.Courses
                .Select(c => new
                {
                    c.CourseId,
                    c.CourseCode,
                    c.CourseName,
                    c.CreditHours,
                    c.Description,
                    c.IsActive
                })
                .ToListAsync();
            return Ok(courses);
        }

        [HttpPut("courses/{id}")]
        public async Task<IActionResult> UpdateCourse(int id, [FromBody] Course course)
        {
            try
            {
                var existingCourse = await _context.Courses.FindAsync(id);
                if (existingCourse == null)
                    return NotFound(new { message = "Course not found" });

                // Check if new course code conflicts with another course
                if (existingCourse.CourseCode != course.CourseCode)
                {
                    if (await _context.Courses.AnyAsync(c => c.CourseCode == course.CourseCode && c.CourseId != id))
                    {
                        return BadRequest(new { message = "Course code already exists. Please use a different course code." });
                    }
                }

                existingCourse.CourseCode = course.CourseCode;
                existingCourse.CourseName = course.CourseName;
                existingCourse.CreditHours = course.CreditHours;
                existingCourse.Description = course.Description;
                existingCourse.IsActive = course.IsActive;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Course updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating course: {ex.Message}" });
            }
        }

        [HttpDelete("courses/{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            try
            {
                var course = await _context.Courses.FindAsync(id);
                if (course == null)
                    return NotFound(new { message = "Course not found" });

                // Check for related records
                var hasTeachers = await _context.CourseTeachers.AnyAsync(ct => ct.CourseId == id);
                var hasEnrollments = await _context.CourseEnrollments.AnyAsync(ce => ce.CourseId == id);
                var hasAttendances = await _context.Attendances.AnyAsync(a => a.CourseId == id);
                var hasTimetable = await _context.TimetableEntries.AnyAsync(t => t.CourseId == id);

                if (hasTeachers || hasEnrollments || hasAttendances || hasTimetable)
                {
                    return BadRequest(new { message = "Cannot delete course. It has related records (teacher assignments, enrollments, attendance, or timetable entries). Please remove those first." });
                }

                _context.Courses.Remove(course);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Course deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error deleting course: {ex.Message}" });
            }
        }

        // Section Management
        [HttpPost("sections")]
        public async Task<IActionResult> CreateSection([FromBody] Section section)
        {
            try
            {
                // Check if section name already exists for the same session
                if (await _context.Sections.AnyAsync(s => s.SectionName == section.SectionName && s.SessionId == section.SessionId))
                {
                    return BadRequest(new { message = "Section name already exists for this session. Please use a different name." });
                }

                _context.Sections.Add(section);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Section created successfully", sectionId = section.SectionId });
            }
            catch (DbUpdateException ex)
            {
                if (ex.InnerException?.Message.Contains("UQ_Section_Name_Session") == true)
                {
                    return BadRequest(new { message = "Section name already exists for this session." });
                }
                return StatusCode(500, new { message = $"Database error: {ex.InnerException?.Message ?? ex.Message}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error creating section: {ex.Message}" });
            }
        }

        [HttpGet("sections")]
        public async Task<IActionResult> GetAllSections()
        {
            var sections = await _context.Sections
                .Select(s => new
                {
                    s.SectionId,
                    s.SectionName,
                    s.SessionId,
                    SessionName = s.Session != null ? s.Session.SessionName : null,
                    s.IsActive
                })
                .ToListAsync();
            return Ok(sections);
        }

        [HttpPut("sections/{id}")]
        public async Task<IActionResult> UpdateSection(int id, [FromBody] Section section)
        {
            try
            {
                var existingSection = await _context.Sections.FindAsync(id);
                if (existingSection == null)
                    return NotFound(new { message = "Section not found" });

                // Check for duplicate section name within the SAME session (excluding current section)
                var duplicate = await _context.Sections
                    .AnyAsync(s => s.SectionId != id && 
                                   s.SectionName == section.SectionName && 
                                   s.SessionId == section.SessionId);
                if (duplicate)
                    return BadRequest(new { message = "Section name already exists in this session. Please use a different name." });

                existingSection.SectionName = section.SectionName;
                existingSection.SessionId = section.SessionId;
                existingSection.IsActive = section.IsActive;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Section updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating section: {ex.Message}" });
            }
        }

        [HttpDelete("sections/{id}")]
        public async Task<IActionResult> DeleteSection(int id)
        {
            try
            {
                var section = await _context.Sections.FindAsync(id);
                if (section == null)
                    return NotFound(new { message = "Section not found" });

                // Check for related records
                var hasStudents = await _context.Students.AnyAsync(s => s.SectionId == id);
                var hasCourseTeachers = await _context.CourseTeachers.AnyAsync(ct => ct.SectionId == id);

                if (hasStudents || hasCourseTeachers)
                {
                    return BadRequest(new { message = "Cannot delete section. It has related students or teacher assignments. Please remove those first." });
                }

                _context.Sections.Remove(section);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Section deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error deleting section: {ex.Message}" });
            }
        }

        // Session Management
        [HttpPost("sessions")]
        public async Task<IActionResult> CreateSession([FromBody] Session session)
        {
            // Check if session name already exists
            if (await _context.Sessions.AnyAsync(s => s.SessionName == session.SessionName))
            {
                return BadRequest(new { message = "Session name already exists. Please use a different name." });
            }

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Session created successfully", sessionId = session.SessionId });
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetAllSessions()
        {
            var sessions = await _context.Sessions
                .Select(s => new
                {
                    s.SessionId,
                    s.SessionName,
                    s.StartDate,
                    s.EndDate,
                    s.IsActive
                })
                .ToListAsync();
            return Ok(sessions);
        }

        [HttpPut("sessions/{id}")]
        public async Task<IActionResult> UpdateSession(int id, [FromBody] Session session)
        {
            var existingSession = await _context.Sessions.FindAsync(id);
            if (existingSession == null)
                return NotFound(new { message = "Session not found" });

            existingSession.SessionName = session.SessionName;
            existingSession.StartDate = session.StartDate;
            existingSession.EndDate = session.EndDate;
            existingSession.IsActive = session.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Session updated successfully" });
        }

        [HttpDelete("sessions/{id}")]
        public async Task<IActionResult> DeleteSession(int id)
        {
            try
            {
                var session = await _context.Sessions.FindAsync(id);
                if (session == null)
                    return NotFound(new { message = "Session not found" });

                // Check for related records
                var hasSections = await _context.Sections.AnyAsync(s => s.SessionId == id);
                var hasCourseTeachers = await _context.CourseTeachers.AnyAsync(ct => ct.SessionId == id);
                var hasEnrollments = await _context.CourseEnrollments.AnyAsync(ce => ce.SessionId == id);

                if (hasSections || hasCourseTeachers || hasEnrollments)
                {
                    return BadRequest(new { message = "Cannot delete session. It has related sections, teacher assignments, or student enrollments. Please remove those first." });
                }

                _context.Sessions.Remove(session);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Session deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error deleting session: {ex.Message}" });
            }
        }

        // Assign Teacher to Course
        [HttpPost("assign-teacher")]
        public async Task<IActionResult> AssignTeacher([FromBody] AssignTeacherRequest request)
        {
            var courseTeacher = new CourseTeacher
            {
                TeacherId = request.TeacherId,
                CourseId = request.CourseId,
                SessionId = request.SessionId,
                SectionId = request.SectionId,
                AssignedDate = DateTime.Now
            };
            
            _context.CourseTeachers.Add(courseTeacher);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Teacher assigned successfully" });
        }

        [HttpGet("course-teachers")]
        public async Task<IActionResult> GetAllCourseTeachers()
        {
            var assignments = await _context.CourseTeachers
                .Select(ct => new
                {
                    ct.CourseTeacherId,
                    ct.TeacherId,
                    TeacherName = ct.Teacher.User.FullName,
                    ct.CourseId,
                    CourseName = ct.Course.CourseName,
                    ct.SessionId,
                    SessionName = ct.Session.SessionName,
                    ct.SectionId,
                    SectionName = ct.Section != null ? ct.Section.SectionName : null,
                    ct.AssignedDate
                })
                .ToListAsync();
            return Ok(assignments);
        }

        [HttpDelete("course-teachers/{id}")]
        public async Task<IActionResult> DeleteCourseTeacher(int id)
        {
            var courseTeacher = await _context.CourseTeachers.FindAsync(id);
            if (courseTeacher == null)
                return NotFound(new { message = "Assignment not found" });

            _context.CourseTeachers.Remove(courseTeacher);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Assignment deleted successfully" });
        }

        // Enroll Student in Course
        [HttpPost("enroll-student")]
        public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentRequest request)
        {
            try
            {
                // Check if student is already enrolled in this course for this session
                // Note: There's a unique constraint on (StudentId, CourseId, SessionId)
                var existingEnrollment = await _context.CourseEnrollments
                    .FirstOrDefaultAsync(ce => ce.StudentId == request.StudentId && 
                                              ce.CourseId == request.CourseId && 
                                              ce.SessionId == request.SessionId);

                if (existingEnrollment != null)
                {
                    if (existingEnrollment.Status == "Active")
                    {
                        return BadRequest(new { message = "Student is already enrolled in this course for this session." });
                    }
                    else if (existingEnrollment.Status == "Dropped" || existingEnrollment.Status == "Completed")
                    {
                        // Reactivate the existing enrollment
                        existingEnrollment.Status = "Active";
                        existingEnrollment.EnrollmentDate = DateTime.Now;
                        await _context.SaveChangesAsync();
                        
                        // Update student's section if different
                        var student = await _context.Students.FindAsync(request.StudentId);
                        if (student != null && student.SectionId != request.SectionId)
                        {
                            student.SectionId = request.SectionId;
                            await _context.SaveChangesAsync();
                        }
                        
                        return Ok(new { message = "Student re-enrolled successfully" });
                    }
                }

                // Update student's section if different
                var studentToUpdate = await _context.Students.FindAsync(request.StudentId);
                if (studentToUpdate != null && studentToUpdate.SectionId != request.SectionId)
                {
                    studentToUpdate.SectionId = request.SectionId;
                }

                // Create new enrollment
                var enrollment = new CourseEnrollment
                {
                    StudentId = request.StudentId,
                    CourseId = request.CourseId,
                    SessionId = request.SessionId,
                    EnrollmentDate = DateTime.Now,
                    Status = "Active"
                };
                
                _context.CourseEnrollments.Add(enrollment);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Student enrolled successfully" });
            }
            catch (DbUpdateException ex)
            {
                // Handle unique constraint violation
                if (ex.InnerException?.Message.Contains("UQ_Student_Course_Session") == true)
                {
                    return BadRequest(new { message = "Student is already enrolled in this course for this session." });
                }
                return StatusCode(500, new { message = $"Database error: {ex.InnerException?.Message ?? ex.Message}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error enrolling student: {ex.Message}" });
            }
        }

        [HttpGet("course-enrollments")]
        public async Task<IActionResult> GetAllCourseEnrollments()
        {
            var enrollments = await _context.CourseEnrollments
                .Select(ce => new
                {
                    ce.EnrollmentId,
                    ce.StudentId,
                    StudentName = ce.Student.User.FullName,
                    RollNumber = ce.Student.RollNumber,
                    SectionName = ce.Student.Section != null ? ce.Student.Section.SectionName : "N/A",
                    ce.CourseId,
                    CourseName = ce.Course.CourseName,
                    ce.SessionId,
                    SessionName = ce.Session.SessionName,
                    ce.EnrollmentDate,
                    ce.Status
                })
                .ToListAsync();
            return Ok(enrollments);
        }

        [HttpDelete("course-enrollments/{id}")]
        public async Task<IActionResult> DeleteCourseEnrollment(int id)
        {
            try
            {
                var enrollment = await _context.CourseEnrollments.FindAsync(id);
                    
                if (enrollment == null)
                    return NotFound(new { message = "Enrollment not found" });

                // Actually delete the enrollment from database
                _context.CourseEnrollments.Remove(enrollment);
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Enrollment removed successfully" });
            }
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { message = $"Database error: {innerMessage}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error removing enrollment: {ex.Message}" });
            }
        }

        // Update enrollment status
        [HttpPut("course-enrollments/{id}/status")]
        public async Task<IActionResult> UpdateEnrollmentStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            try
            {
                var enrollment = await _context.CourseEnrollments.FindAsync(id);
                
                if (enrollment == null)
                    return NotFound(new { message = "Enrollment not found" });

                // Validate status
                var validStatuses = new[] { "Active", "Dropped", "Completed" };
                if (!validStatuses.Contains(request.Status))
                    return BadRequest(new { message = "Invalid status. Must be Active, Dropped, or Completed." });

                enrollment.Status = request.Status;
                await _context.SaveChangesAsync();
                
                return Ok(new { message = $"Status updated to {request.Status}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating status: {ex.Message}" });
            }
        }

        // Update enrollment (course and session)
        [HttpPut("course-enrollments/{id}")]
        public async Task<IActionResult> UpdateEnrollment(int id, [FromBody] UpdateEnrollmentRequest request)
        {
            try
            {
                var enrollment = await _context.CourseEnrollments.FindAsync(id);
                
                if (enrollment == null)
                    return NotFound(new { message = "Enrollment not found" });

                // Check if new combination already exists (different enrollment with same student+course+session)
                var duplicate = await _context.CourseEnrollments
                    .FirstOrDefaultAsync(ce => ce.StudentId == enrollment.StudentId && 
                                              ce.CourseId == request.CourseId && 
                                              ce.SessionId == request.SessionId &&
                                              ce.EnrollmentId != id);

                if (duplicate != null)
                    return BadRequest(new { message = "Student is already enrolled in this course for this session." });

                enrollment.CourseId = request.CourseId;
                enrollment.SessionId = request.SessionId;
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Enrollment updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating enrollment: {ex.Message}" });
            }
        }

        // Get all teachers for dropdown
        [HttpGet("teachers")]
        public async Task<IActionResult> GetAllTeachers()
        {
            var teachers = await _context.Teachers
                .Select(t => new
                {
                    t.TeacherId,
                    t.EmployeeId,
                    FullName = t.User.FullName,
                    Email = t.User.Email,
                    t.Department
                })
                .ToListAsync();

            return Ok(teachers);
        }

        // Get all students for dropdown
        [HttpGet("students")]
        public async Task<IActionResult> GetAllStudents()
        {
            var students = await _context.Students
                .Select(s => new
                {
                    s.StudentId,
                    s.RollNumber,
                    FullName = s.User.FullName,
                    Email = s.User.Email,
                    SectionName = s.Section != null ? s.Section.SectionName : null
                })
                .ToListAsync();

            return Ok(students);
        }

        // Reset user password (Admin only)
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetUserPassword([FromBody] ResetPasswordRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.IsFirstLogin = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password reset successfully" });
        }

        // Update user
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Check for duplicate username (excluding current user)
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username && u.UserId != id);
                if (existingUser != null)
                    return BadRequest(new { message = "Username already exists" });

                // Check for duplicate email (excluding current user)
                var existingEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email && u.UserId != id);
                if (existingEmail != null)
                    return BadRequest(new { message = "Email already exists" });

                // Update user fields
                user.Username = request.Username;
                user.FullName = request.FullName;
                user.Email = request.Email;
                user.IsActive = request.IsActive;

                // Update role-specific data
                if (user.Role == "Student")
                {
                    var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == id);
                    if (student != null && request.SectionId.HasValue)
                    {
                        student.SectionId = request.SectionId.Value;
                    }
                }
                else if (user.Role == "Teacher")
                {
                    var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == id);
                    if (teacher != null && !string.IsNullOrEmpty(request.Department))
                    {
                        teacher.Department = request.Department;
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "User updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating user: {ex.Message}" });
            }
        }

        // Delete user
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Check if user is admin - prevent deleting admin
                if (user.Role == "Admin")
                    return BadRequest(new { message = "Cannot delete admin users" });

                // Check and delete role-specific records
                if (user.Role == "Student")
                {
                    var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == id);
                    if (student != null)
                    {
                        // Delete all enrollments (both active and inactive)
                        var enrollments = await _context.CourseEnrollments
                            .Where(e => e.StudentId == student.StudentId)
                            .ToListAsync();
                        _context.CourseEnrollments.RemoveRange(enrollments);
                        
                        // Delete all attendance records
                        var attendances = await _context.Attendances
                            .Where(a => a.StudentId == student.StudentId)
                            .ToListAsync();
                        _context.Attendances.RemoveRange(attendances);
                        
                        _context.Students.Remove(student);
                    }
                }
                else if (user.Role == "Teacher")
                {
                    var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == id);
                    if (teacher != null)
                    {
                        // Delete all course assignments
                        var assignments = await _context.CourseTeachers
                            .Where(ct => ct.TeacherId == teacher.TeacherId)
                            .ToListAsync();
                        _context.CourseTeachers.RemoveRange(assignments);
                        
                        // Delete all timetable entries
                        var timetableEntries = await _context.TimetableEntries
                            .Where(t => t.TeacherId == teacher.TeacherId)
                            .ToListAsync();
                        _context.TimetableEntries.RemoveRange(timetableEntries);
                        
                        _context.Teachers.Remove(teacher);
                    }
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                return Ok(new { message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error deleting user: {ex.Message}" });
            }
        }

        // Attendance Management
        [HttpGet("attendances")]
        public async Task<IActionResult> GetAllAttendances()
        {
            var attendances = await _context.Attendances
                .Include(a => a.Student)
                    .ThenInclude(s => s!.Section)
                        .ThenInclude(sec => sec!.Session)
                .Select(a => new
                {
                    a.AttendanceId,
                    a.StudentId,
                    StudentName = a.Student.User.FullName,
                    RollNumber = a.Student.RollNumber,
                    a.CourseId,
                    CourseName = a.Course.CourseName,
                    CourseCode = a.Course.CourseCode,
                    SectionName = a.Student.Section != null ? a.Student.Section.SectionName : "N/A",
                    SessionName = a.Student.Section != null && a.Student.Section.Session != null ? a.Student.Section.Session.SessionName : "N/A",
                    a.AttendanceDate,
                    a.Status,
                    a.MarkedAt,
                    a.Remarks
                })
                .OrderByDescending(a => a.AttendanceDate)
                .ToListAsync();
            return Ok(attendances);
        }

        [HttpDelete("attendances/{id}")]
        public async Task<IActionResult> DeleteAttendance(int id)
        {
            try
            {
                var attendance = await _context.Attendances.FindAsync(id);
                if (attendance == null)
                    return NotFound(new { message = "Attendance record not found" });

                _context.Attendances.Remove(attendance);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Attendance record deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error deleting attendance: {ex.Message}" });
            }
        }

        // Timetable Management
        [HttpGet("timetables")]
        public async Task<IActionResult> GetAllTimetables()
        {
            var timetables = await _context.TimetableEntries
                .Select(t => new
                {
                    t.TimetableId,
                    t.CourseId,
                    CourseName = t.Course.CourseName,
                    CourseCode = t.Course.CourseCode,
                    t.TeacherId,
                    TeacherName = t.Teacher.User.FullName,
                    t.SectionId,
                    SectionName = t.Section != null ? t.Section.SectionName : "N/A",
                    t.DayOfWeek,
                    t.StartTime,
                    t.EndTime,
                    t.RoomNumber
                })
                .OrderBy(t => t.DayOfWeek)
                .ThenBy(t => t.StartTime)
                .ToListAsync();
            return Ok(timetables);
        }

        [HttpPost("timetables")]
        public async Task<IActionResult> CreateTimetable([FromBody] CreateTimetableRequest request)
        {
            var timetable = new TimetableEntry
            {
                CourseId = request.CourseId,
                TeacherId = request.TeacherId,
                SectionId = request.SectionId,
                DayOfWeek = request.DayOfWeek,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                RoomNumber = request.RoomNumber
            };

            _context.TimetableEntries.Add(timetable);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Timetable entry created successfully", timetableId = timetable.TimetableId });
        }

        [HttpPut("timetables/{id}")]
        public async Task<IActionResult> UpdateTimetable(int id, [FromBody] CreateTimetableRequest request)
        {
            var timetable = await _context.TimetableEntries.FindAsync(id);
            if (timetable == null)
                return NotFound(new { message = "Timetable entry not found" });

            timetable.CourseId = request.CourseId;
            timetable.TeacherId = request.TeacherId;
            timetable.SectionId = request.SectionId;
            timetable.DayOfWeek = request.DayOfWeek;
            timetable.StartTime = request.StartTime;
            timetable.EndTime = request.EndTime;
            timetable.RoomNumber = request.RoomNumber;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Timetable entry updated successfully" });
        }

        [HttpDelete("timetables/{id}")]
        public async Task<IActionResult> DeleteTimetable(int id)
        {
            var timetable = await _context.TimetableEntries.FindAsync(id);
            if (timetable == null)
                return NotFound(new { message = "Timetable entry not found" });

            _context.TimetableEntries.Remove(timetable);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Timetable entry deleted successfully" });
        }
    }

    public class CreateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? RollNumber { get; set; }
        public string? EmployeeId { get; set; }
        public string? Department { get; set; }
        public int? SectionId { get; set; }
    }

    public class ResetPasswordRequest
    {
        public int UserId { get; set; }
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UpdateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public int? SectionId { get; set; }
        public string? Department { get; set; }
    }

    public class AssignTeacherRequest
    {
        public int TeacherId { get; set; }
        public int CourseId { get; set; }
        public int SessionId { get; set; }
        public int? SectionId { get; set; }
    }

    public class EnrollStudentRequest
    {
        public int StudentId { get; set; }
        public int CourseId { get; set; }
        public int SessionId { get; set; }
        public int SectionId { get; set; }
    }

    public class CreateTimetableRequest
    {
        public int CourseId { get; set; }
        public int TeacherId { get; set; }
        public int? SectionId { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public string? RoomNumber { get; set; }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class UpdateEnrollmentRequest
    {
        public int CourseId { get; set; }
        public int SessionId { get; set; }
    }
}
