using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AttendanceManagementSystem.Models;

[Index("StudentId", "CourseId", "AttendanceDate", Name = "UQ_Student_Course_Date", IsUnique = true)]
public partial class Attendance
{
    [Key]
    public int AttendanceId { get; set; }

    public int StudentId { get; set; }

    public int CourseId { get; set; }

    public DateOnly AttendanceDate { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = null!;

    public int? MarkedByTeacherId { get; set; }

    public DateTime MarkedAt { get; set; }

    [StringLength(500)]
    public string? Remarks { get; set; }

    [ForeignKey("CourseId")]
    [InverseProperty("Attendances")]
    public virtual Course Course { get; set; } = null!;

    [ForeignKey("MarkedByTeacherId")]
    [InverseProperty("Attendances")]
    public virtual Teacher? MarkedByTeacher { get; set; }

    [ForeignKey("StudentId")]
    [InverseProperty("Attendances")]
    public virtual Student Student { get; set; } = null!;
}
