using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceManagementSystem.Data;

namespace AttendanceManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Teacher")]
    public class ReportsController : ControllerBase
    {
        private readonly AttendanceManagementDbContext _context;

        public ReportsController(AttendanceManagementDbContext context)
        {
            _context = context;
        }

        [HttpGet("monthly/{year}/{month}")]
        public async Task<IActionResult> GetMonthlyReport(int year, int month, [FromQuery] int? courseId)
        {
            var query = _context.Attendances
                .Where(a => a.AttendanceDate.Year == year && a.AttendanceDate.Month == month);

            if (courseId.HasValue)
            {
                query = query.Where(a => a.CourseId == courseId.Value);
            }

            var report = await query
                .Include(a => a.Student).ThenInclude(s => s.User)
                .Include(a => a.Course)
                .GroupBy(a => new { a.StudentId, a.CourseId })
                .Select(g => new
                {
                    StudentId = g.Key.StudentId,
                    StudentName = g.First().Student.User.FullName,
                    RollNumber = g.First().Student.RollNumber,
                    CourseCode = g.First().Course.CourseCode,
                    CourseName = g.First().Course.CourseName,
                    TotalClasses = g.Count(),
                    Present = g.Count(a => a.Status == "Present"),
                    Absent = g.Count(a => a.Status == "Absent"),
                    Late = g.Count(a => a.Status == "Late"),
                    Leave = g.Count(a => a.Status == "Leave"),
                    Percentage = Math.Round((double)g.Count(a => a.Status == "Present") / g.Count() * 100, 2)
                })
                .ToListAsync();

            return Ok(report);
        }

        [HttpGet("semester/{sessionId}")]
        public async Task<IActionResult> GetSemesterReport(int sessionId)
        {
            var session = await _context.Sessions.FindAsync(sessionId);
            if (session == null) return NotFound(new { message = "Session not found" });

            var report = await _context.Attendances
                .Where(a => a.AttendanceDate >= DateOnly.FromDateTime(session.StartDate) && 
                           a.AttendanceDate <= DateOnly.FromDateTime(session.EndDate))
                .Include(a => a.Student).ThenInclude(s => s.User)
                .Include(a => a.Course)
                .GroupBy(a => new { a.StudentId, a.CourseId })
                .Select(g => new
                {
                    StudentId = g.Key.StudentId,
                    StudentName = g.First().Student.User.FullName,
                    RollNumber = g.First().Student.RollNumber,
                    CourseCode = g.First().Course.CourseCode,
                    CourseName = g.First().Course.CourseName,
                    TotalClasses = g.Count(),
                    Present = g.Count(a => a.Status == "Present"),
                    Absent = g.Count(a => a.Status == "Absent"),
                    Late = g.Count(a => a.Status == "Late"),
                    Leave = g.Count(a => a.Status == "Leave"),
                    Percentage = Math.Round((double)g.Count(a => a.Status == "Present") / g.Count() * 100, 2)
                })
                .ToListAsync();

            return Ok(new { SessionName = session.SessionName, Report = report });
        }

        [HttpGet("yearly/{year}")]
        public async Task<IActionResult> GetYearlyReport(int year)
        {
            var report = await _context.Attendances
                .Where(a => a.AttendanceDate.Year == year)
                .Include(a => a.Student).ThenInclude(s => s.User)
                .Include(a => a.Course)
                .GroupBy(a => new { a.StudentId, a.CourseId })
                .Select(g => new
                {
                    StudentId = g.Key.StudentId,
                    StudentName = g.First().Student.User.FullName,
                    RollNumber = g.First().Student.RollNumber,
                    CourseCode = g.First().Course.CourseCode,
                    CourseName = g.First().Course.CourseName,
                    TotalClasses = g.Count(),
                    Present = g.Count(a => a.Status == "Present"),
                    Absent = g.Count(a => a.Status == "Absent"),
                    Late = g.Count(a => a.Status == "Late"),
                    Leave = g.Count(a => a.Status == "Leave"),
                    Percentage = Math.Round((double)g.Count(a => a.Status == "Present") / g.Count() * 100, 2)
                })
                .ToListAsync();

            return Ok(report);
        }

        [HttpGet("defaulters")]
        public async Task<IActionResult> GetDefaulters([FromQuery] double threshold = 75.0)
        {
            var allAttendance = await _context.Attendances
                .Include(a => a.Student).ThenInclude(s => s.User)
                .Include(a => a.Course)
                .GroupBy(a => new { a.StudentId, a.CourseId })
                .Select(g => new
                {
                    StudentId = g.Key.StudentId,
                    StudentName = g.First().Student.User.FullName,
                    RollNumber = g.First().Student.RollNumber,
                    CourseCode = g.First().Course.CourseCode,
                    CourseName = g.First().Course.CourseName,
                    TotalClasses = g.Count(),
                    Present = g.Count(a => a.Status == "Present"),
                    Percentage = Math.Round((double)g.Count(a => a.Status == "Present") / g.Count() * 100, 2)
                })
                .ToListAsync();

            var defaulters = allAttendance.Where(a => a.Percentage < threshold).ToList();

            return Ok(defaulters);
        }
    }
}
