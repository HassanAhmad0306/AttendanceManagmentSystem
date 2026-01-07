using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AttendanceManagementSystem.Models;

[Index("SessionName", Name = "UQ__Sessions__919C70DECEB8C7B2", IsUnique = true)]
public partial class Session
{
    [Key]
    public int SessionId { get; set; }

    [StringLength(50)]
    public string SessionName { get; set; } = null!;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; }

    [InverseProperty("Session")]
    public virtual ICollection<CourseEnrollment> CourseEnrollments { get; set; } = new List<CourseEnrollment>();

    [InverseProperty("Session")]
    public virtual ICollection<CourseTeacher> CourseTeachers { get; set; } = new List<CourseTeacher>();

    [InverseProperty("Session")]
    public virtual ICollection<Section> Sections { get; set; } = new List<Section>();
}
