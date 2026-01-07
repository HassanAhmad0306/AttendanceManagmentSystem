using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceManagementSystem.Data;
using AttendanceManagementSystem.Models;

namespace AttendanceManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Student")]
    public class StudentController : ControllerBase
    {
        private readonly AttendanceManagementDbContext _context;

        public StudentController(AttendanceManagementDbContext context)
        {
            _context = context;
        }

        [HttpGet("my-attendance")]
        public async Task<IActionResult> GetMyAttendance()
        {
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return Unauthorized();

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.UserId);
            if (student == null) return NotFound(new { message = "Student profile not found" });

            var attendance = await _context.Attendances
                .Where(a => a.StudentId == student.StudentId)
                .Include(a => a.Course)
                .OrderByDescending(a => a.AttendanceDate)
                .Select(a => new
                {
                    a.AttendanceId,
                    a.CourseId,
                    course = new
                    {
                        courseName = a.Course.CourseName,
                        courseCode = a.Course.CourseCode
                    },
                    date = a.AttendanceDate.ToString(),
                    a.Status,
                    markedAt = a.MarkedAt,
                    a.Remarks
                })
                .ToListAsync();

            return Ok(attendance);
        }

        [HttpGet("my-courses")]
        public async Task<IActionResult> GetMyCourses()
        {
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return Unauthorized();

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.UserId);
            if (student == null) return NotFound(new { message = "Student profile not found" });

            var courses = await _context.CourseEnrollments
                .Where(ce => ce.StudentId == student.StudentId && ce.Status == "Active")
                .Include(ce => ce.Course)
                .Include(ce => ce.Session)
                .Include(ce => ce.Student)
                    .ThenInclude(s => s.Section)
                .Select(ce => new
                {
                    ce.EnrollmentId,
                    ce.CourseId,
                    CourseName = ce.Course.CourseName,
                    CourseCode = ce.Course.CourseCode,
                    CreditHours = ce.Course.CreditHours,
                    SectionName = ce.Student.Section != null ? ce.Student.Section.SectionName : "N/A",
                    SessionName = ce.Session.SessionName,
                    ce.EnrollmentDate
                })
                .ToListAsync();

            return Ok(courses);
        }

        [HttpGet("my-timetable")]
        public async Task<IActionResult> GetMyTimetable()
        {
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return Unauthorized();

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.UserId);
            if (student == null) return NotFound(new { message = "Student profile not found" });

            var timetable = await _context.TimetableEntries
                .Where(te => te.SectionId == student.SectionId)
                .Include(te => te.Course)
                .Include(te => te.Teacher)
                .ThenInclude(t => t.User)
                .OrderBy(te => te.DayOfWeek)
                .ThenBy(te => te.StartTime)
                .Select(te => new
                {
                    te.TimetableId,
                    courseName = te.Course.CourseName,
                    courseCode = te.Course.CourseCode,
                    teacherName = te.Teacher.User.FullName,
                    dayOfWeek = te.DayOfWeek,
                    startTime = te.StartTime.ToString(),
                    endTime = te.EndTime.ToString(),
                    roomNumber = te.RoomNumber
                })
                .ToListAsync();

            return Ok(timetable);
        }

        [HttpGet("my-timetable/{sessionId}")]
        public async Task<IActionResult> GetMyTimetableBySession(int sessionId)
        {
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return Unauthorized();

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.UserId);
            if (student == null) return NotFound(new { message = "Student profile not found" });

            var timetable = await _context.TimetableEntries
                .Where(te => te.SectionId == student.SectionId)
                .Include(te => te.Course)
                .Include(te => te.Teacher)
                .ThenInclude(t => t.User)
                .OrderBy(te => te.DayOfWeek)
                .ThenBy(te => te.StartTime)
                .Select(te => new
                {
                    te.TimetableId,
                    course = new
                    {
                        courseName = te.Course.CourseName,
                        courseCode = te.Course.CourseCode
                    },
                    teacher = new
                    {
                        fullName = te.Teacher.User.FullName
                    },
                    dayOfWeek = te.DayOfWeek,
                    startTime = te.StartTime.ToString(),
                    endTime = te.EndTime.ToString(),
                    room = te.RoomNumber
                })
                .ToListAsync();

            return Ok(timetable);
        }

        [HttpGet("attendance-summary")]
        public async Task<IActionResult> GetAttendanceSummary()
        {
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return Unauthorized();

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.UserId);
            if (student == null) return NotFound(new { message = "Student profile not found" });

            var summary = await _context.Attendances
                .Where(a => a.StudentId == student.StudentId)
                .GroupBy(a => a.Course)
                .Select(g => new
                {
                    CourseCode = g.Key.CourseCode,
                    CourseName = g.Key.CourseName,
                    TotalClasses = g.Count(),
                    Present = g.Count(a => a.Status == "Present"),
                    Absent = g.Count(a => a.Status == "Absent"),
                    Late = g.Count(a => a.Status == "Late"),
                    Leave = g.Count(a => a.Status == "Leave"),
                    AttendancePercentage = g.Count() > 0 ? Math.Round((double)g.Count(a => a.Status == "Present") / g.Count() * 100, 2) : 0
                })
                .ToListAsync();

            return Ok(summary);
        }

        [HttpGet("available-courses")]
        public async Task<IActionResult> GetAvailableCourses()
        {
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return Unauthorized();

            var student = await _context.Students
                .Include(s => s.Section)
                .FirstOrDefaultAsync(s => s.UserId == user.UserId);
            if (student == null) return NotFound(new { message = "Student profile not found" });

            // Get active sessions
            var activeSessions = await _context.Sessions
                .Where(s => s.IsActive)
                .ToListAsync();

            // Get courses student is already enrolled in (active enrollments)
            var enrolledCourseIds = await _context.CourseEnrollments
                .Where(ce => ce.StudentId == student.StudentId && ce.Status == "Active")
                .Select(ce => ce.CourseId)
                .ToListAsync();

            // Get available courses (not enrolled, active courses)
            var availableCourses = await _context.Courses
                .Where(c => c.IsActive && !enrolledCourseIds.Contains(c.CourseId))
                .Select(c => new
                {
                    c.CourseId,
                    c.CourseCode,
                    c.CourseName,
                    c.CreditHours,
                    c.Description
                })
                .ToListAsync();

            return Ok(new
            {
                courses = availableCourses,
                sessions = activeSessions.Select(s => new { s.SessionId, s.SessionName }),
                studentSection = student.Section != null ? new { student.Section.SectionId, student.Section.SectionName } : null
            });
        }

        [HttpPost("enroll")]
        public async Task<IActionResult> SelfEnroll([FromBody] StudentEnrollRequest request)
        {
            try
            {
                var username = User.Identity?.Name;
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (user == null) return Unauthorized();

                var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.UserId);
                if (student == null) return NotFound(new { message = "Student profile not found" });

                // Check if already enrolled in this course
                // Note: There's a unique constraint on (StudentId, CourseId, SessionId)
                var existingEnrollment = await _context.CourseEnrollments
                    .FirstOrDefaultAsync(ce => ce.StudentId == student.StudentId && 
                                              ce.CourseId == request.CourseId && 
                                              ce.SessionId == request.SessionId);

                if (existingEnrollment != null)
                {
                    if (existingEnrollment.Status == "Active")
                    {
                        return BadRequest(new { message = "You are already enrolled in this course" });
                    }
                    else if (existingEnrollment.Status == "Dropped" || existingEnrollment.Status == "Completed")
                    {
                        // Reactivate the enrollment
                        existingEnrollment.Status = "Active";
                        existingEnrollment.EnrollmentDate = DateTime.Now;
                        await _context.SaveChangesAsync();
                        return Ok(new { message = "Successfully re-enrolled in course" });
                    }
                }

                // Create new enrollment
                var enrollment = new CourseEnrollment
                {
                    StudentId = student.StudentId,
                    CourseId = request.CourseId,
                    SessionId = request.SessionId,
                    EnrollmentDate = DateTime.Now,
                    Status = "Active"
                };

                _context.CourseEnrollments.Add(enrollment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Successfully enrolled in course" });
            }
            catch (DbUpdateException ex)
            {
                // Handle unique constraint violation
                if (ex.InnerException?.Message.Contains("UQ_Student_Course_Session") == true)
                {
                    return BadRequest(new { message = "You are already enrolled in this course for this session." });
                }
                return StatusCode(500, new { message = $"Database error: {ex.InnerException?.Message ?? ex.Message}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error during enrollment: {ex.Message}" });
            }
        }

        [HttpDelete("unenroll/{enrollmentId}")]
        public async Task<IActionResult> Unenroll(int enrollmentId)
        {
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return Unauthorized();

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.UserId);
            if (student == null) return NotFound(new { message = "Student profile not found" });

            var enrollment = await _context.CourseEnrollments
                .FirstOrDefaultAsync(ce => ce.EnrollmentId == enrollmentId && ce.StudentId == student.StudentId);

            if (enrollment == null)
                return NotFound(new { message = "Enrollment not found" });

            // Mark as dropped
            enrollment.Status = "Dropped";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Successfully unenrolled from course" });
        }
    }

    public class StudentEnrollRequest
    {
        public int CourseId { get; set; }
        public int SessionId { get; set; }
    }
}
