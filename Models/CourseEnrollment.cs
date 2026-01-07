using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AttendanceManagementSystem.Models;

[Index("StudentId", "CourseId", "SessionId", Name = "UQ_Student_Course_Session", IsUnique = true)]
public partial class CourseEnrollment
{
    [Key]
    public int EnrollmentId { get; set; }

    public int StudentId { get; set; }

    public int CourseId { get; set; }

    public int SessionId { get; set; }

    public DateTime EnrollmentDate { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = null!;

    [ForeignKey("CourseId")]
    [InverseProperty("CourseEnrollments")]
    public virtual Course Course { get; set; } = null!;

    [ForeignKey("SessionId")]
    [InverseProperty("CourseEnrollments")]
    public virtual Session Session { get; set; } = null!;

    [ForeignKey("StudentId")]
    [InverseProperty("CourseEnrollments")]
    public virtual Student Student { get; set; } = null!;
}
