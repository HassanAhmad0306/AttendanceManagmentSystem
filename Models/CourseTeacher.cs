using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AttendanceManagementSystem.Models;

[Index("CourseId", "TeacherId", "SectionId", "SessionId", Name = "UQ_CourseTeacher_Section", IsUnique = true)]
public partial class CourseTeacher
{
    [Key]
    public int CourseTeacherId { get; set; }

    public int CourseId { get; set; }

    public int TeacherId { get; set; }

    public int? SectionId { get; set; }

    public int SessionId { get; set; }

    public DateTime AssignedDate { get; set; }

    [ForeignKey("CourseId")]
    [InverseProperty("CourseTeachers")]
    public virtual Course Course { get; set; } = null!;

    [ForeignKey("SectionId")]
    [InverseProperty("CourseTeachers")]
    public virtual Section? Section { get; set; }

    [ForeignKey("SessionId")]
    [InverseProperty("CourseTeachers")]
    public virtual Session Session { get; set; } = null!;

    [ForeignKey("TeacherId")]
    [InverseProperty("CourseTeachers")]
    public virtual Teacher Teacher { get; set; } = null!;
}
