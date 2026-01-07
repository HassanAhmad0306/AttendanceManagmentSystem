using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AttendanceManagementSystem.Models;

[Index("SectionName", "SessionId", Name = "UQ_Section_Name_Session", IsUnique = true)]
public partial class Section
{
    [Key]
    public int SectionId { get; set; }

    [StringLength(50)]
    public string SectionName { get; set; } = null!;

    public int? SessionId { get; set; }

    public bool IsActive { get; set; }

    [InverseProperty("Section")]
    public virtual ICollection<CourseTeacher> CourseTeachers { get; set; } = new List<CourseTeacher>();

    [ForeignKey("SessionId")]
    [InverseProperty("Sections")]
    public virtual Session? Session { get; set; }

    [InverseProperty("Section")]
    public virtual ICollection<Student> Students { get; set; } = new List<Student>();

    [InverseProperty("Section")]
    public virtual ICollection<TimetableEntry> TimetableEntries { get; set; } = new List<TimetableEntry>();
}
