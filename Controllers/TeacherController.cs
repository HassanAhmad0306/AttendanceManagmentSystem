using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceManagementSystem.Data;
using AttendanceManagementSystem.Models;

namespace AttendanceManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Teacher")]
    public class TeacherController : ControllerBase
    {
        private readonly AttendanceManagementDbContext _context;

        public TeacherController(AttendanceManagementDbContext context)
        {
            _context = context;
        }

        [HttpGet("my-courses")]
        public async Task<IActionResult> GetMyCourses()
        {
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return Unauthorized();

            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == user.UserId);
            if (teacher == null) return NotFound(new { message = "Teacher profile not found" });

            var courseTeachers = await _context.CourseTeachers
                .Where(ct => ct.TeacherId == teacher.TeacherId)
                .Include(ct => ct.Course)
                .Include(ct => ct.Section)
                .Include(ct => ct.Session)
                .ToListAsync();

            // Group by CourseId to avoid duplicates
            var groupedCourses = courseTeachers
                .GroupBy(ct => ct.CourseId)
                .Select(g => g.First())
                .ToList();

            var courses = new List<object>();
            
            foreach (var ct in groupedCourses)
            {
                // Count enrolled students for this course across ALL sections taught by this teacher
                var teacherSections = courseTeachers
                    .Where(x => x.CourseId == ct.CourseId)
                    .Select(x => x.SessionId)
                    .Distinct()
                    .ToList();
                
                var enrolledCount = await _context.CourseEnrollments
                    .CountAsync(ce => ce.CourseId == ct.CourseId && 
                                     teacherSections.Contains(ce.SessionId) && 
                                     ce.Status == "Active");

                // Get all sections where this teacher teaches this course
                var sections = courseTeachers
                    .Where(x => x.CourseId == ct.CourseId)
                    .Select(x => x.Section != null ? x.Section.SectionName : "N/A")
                    .Distinct()
                    .ToList();

                courses.Add(new
                {
                    ct.CourseTeacherId,
                    ct.CourseId,
                    CourseName = ct.Course.CourseName,
                    CourseCode = ct.Course.CourseCode,
                    CreditHours = ct.Course.CreditHours,
                    SectionName = string.Join(", ", sections),
                    SessionName = ct.Session.SessionName,
                    EnrolledStudents = enrolledCount
                });
            }

            return Ok(courses);
        }

        [HttpPost("mark-attendance")]
        public async Task<IActionResult> MarkAttendance([FromBody] MarkAttendanceRequest request)
        {
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return Unauthorized();

            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == user.UserId);
            if (teacher == null) return NotFound(new { message = "Teacher profile not found" });

            // Parse date from string
            DateOnly attendanceDate;
            if (!string.IsNullOrEmpty(request.Date))
            {
                attendanceDate = DateOnly.Parse(request.Date);
            }
            else
            {
                attendanceDate = DateOnly.FromDateTime(DateTime.Today);
            }

            // Prevent marking attendance for future dates
            if (attendanceDate > DateOnly.FromDateTime(DateTime.Today))
            {
                return BadRequest(new { message = "Cannot mark attendance for future dates" });
            }

            // Check if attendance already marked
            var existing = await _context.Attendances
                .FirstOrDefaultAsync(a => a.StudentId == request.StudentId &&
                                         a.CourseId == request.CourseId &&
                                         a.AttendanceDate == attendanceDate);

            if (existing != null)
            {
                existing.Status = request.Status;
                existing.MarkedByTeacherId = teacher.TeacherId;
                existing.MarkedAt = DateTime.Now;
                existing.Remarks = request.Remarks;
            }
            else
            {
                var attendance = new Attendance
                {
                    StudentId = request.StudentId,
                    CourseId = request.CourseId,
                    AttendanceDate = attendanceDate,
                    Status = request.Status,
                    MarkedByTeacherId = teacher.TeacherId,
                    MarkedAt = DateTime.Now,
                    Remarks = request.Remarks
                };
                _context.Attendances.Add(attendance);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Attendance marked successfully" });
        }

        [HttpGet("course-students/{courseId}")]
        public async Task<IActionResult> GetCourseStudents(int courseId)
        {
            var students = await _context.CourseEnrollments
                .Where(ce => ce.CourseId == courseId && ce.Status == "Active")
                .Include(ce => ce.Student)
                .ThenInclude(s => s.User)
                .Select(ce => new
                {
                    ce.Student.StudentId,
                    ce.Student.RollNumber,
                    FullName = ce.Student.User.FullName,
                    Email = ce.Student.User.Email
                })
                .ToListAsync();

            return Ok(students);
        }

        [HttpGet("attendance/{courseId}")]
        public async Task<IActionResult> GetCourseAttendance(int courseId, [FromQuery] DateTime? date)
        {
            var query = _context.Attendances
                .Where(a => a.CourseId == courseId);

            if (date.HasValue)
            {
                query = query.Where(a => a.AttendanceDate == DateOnly.FromDateTime(date.Value));
            }

            var attendance = await query
                .Include(a => a.Student)
                .ThenInclude(s => s.User)
                .Select(a => new
                {
                    a.AttendanceId,
                    a.StudentId,
                    StudentName = a.Student.User.FullName,
                    RollNumber = a.Student.RollNumber,
                    a.AttendanceDate,
                    a.Status,
                    a.MarkedAt,
                    a.Remarks
                })
                .ToListAsync();

            return Ok(attendance);
        }

        [HttpGet("attendance-records/{courseId}")]
        public async Task<IActionResult> GetAttendanceRecords(int courseId, [FromQuery] string? date)
        {
            var query = _context.Attendances
                .Where(a => a.CourseId == courseId);

            if (!string.IsNullOrEmpty(date))
            {
                var filterDate = DateOnly.Parse(date);
                query = query.Where(a => a.AttendanceDate == filterDate);
            }

            var records = await query
                .Include(a => a.Student)
                .ThenInclude(s => s.User)
                .Include(a => a.Course)
                .OrderByDescending(a => a.AttendanceDate)
                .Select(a => new
                {
                    a.AttendanceId,
                    a.StudentId,
                    a.CourseId,
                    student = new
                    {
                        rollNumber = a.Student.RollNumber,
                        fullName = a.Student.User.FullName
                    },
                    date = a.AttendanceDate.ToString(),
                    a.Status,
                    markedAt = a.MarkedAt,
                    a.Remarks
                })
                .ToListAsync();

            return Ok(records);
        }

        [HttpGet("my-timetable")]
        public async Task<IActionResult> GetMyTimetable()
        {
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return Unauthorized();

            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == user.UserId);
            if (teacher == null) return NotFound(new { message = "Teacher profile not found" });

            var timetable = await _context.TimetableEntries
                .Where(te => te.TeacherId == teacher.TeacherId)
                .Include(te => te.Course)
                .Include(te => te.Section)
                .OrderBy(te => te.DayOfWeek)
                .ThenBy(te => te.StartTime)
                .Select(te => new
                {
                    te.TimetableId,
                    CourseName = te.Course.CourseName,
                    CourseCode = te.Course.CourseCode,
                    SectionName = te.Section != null ? te.Section.SectionName : "N/A",
                    DayOfWeek = te.DayOfWeek,
                    StartTime = te.StartTime.ToString(),
                    EndTime = te.EndTime.ToString(),
                    RoomNumber = te.RoomNumber
                })
                .ToListAsync();

            return Ok(timetable);
        }
    }

    public class MarkAttendanceRequest
    {
        public int StudentId { get; set; }
        public int CourseId { get; set; }
        public string Date { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Remarks { get; set; }
    }
}
