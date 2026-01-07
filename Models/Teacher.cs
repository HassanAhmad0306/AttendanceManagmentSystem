using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AttendanceManagementSystem.Models;

[Index("UserId", Name = "UQ__Teachers__1788CC4DE3F731D6", IsUnique = true)]
[Index("EmployeeId", Name = "UQ__Teachers__7AD04F10AE5FCDDA", IsUnique = true)]
public partial class Teacher
{
    [Key]
    public int TeacherId { get; set; }

    public int UserId { get; set; }

    [StringLength(50)]
    public string EmployeeId { get; set; } = null!;

    [StringLength(100)]
    public string? Department { get; set; }

    [InverseProperty("MarkedByTeacher")]
    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    [InverseProperty("Teacher")]
    public virtual ICollection<CourseTeacher> CourseTeachers { get; set; } = new List<CourseTeacher>();

    [InverseProperty("Teacher")]
    public virtual ICollection<TimetableEntry> TimetableEntries { get; set; } = new List<TimetableEntry>();

    [ForeignKey("UserId")]
    [InverseProperty("Teacher")]
    public virtual User User { get; set; } = null!;
}
