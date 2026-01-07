using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AttendanceManagementSystem.Models;

[Index("UserId", Name = "UQ__Students__1788CC4D9DCE015A", IsUnique = true)]
[Index("RollNumber", Name = "UQ__Students__E9F06F16A743A6DF", IsUnique = true)]
public partial class Student
{
    [Key]
    public int StudentId { get; set; }

    public int UserId { get; set; }

    [StringLength(50)]
    public string RollNumber { get; set; } = null!;

    public int? SectionId { get; set; }

    [InverseProperty("Student")]
    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    [InverseProperty("Student")]
    public virtual ICollection<CourseEnrollment> CourseEnrollments { get; set; } = new List<CourseEnrollment>();

    [ForeignKey("SectionId")]
    [InverseProperty("Students")]
    public virtual Section? Section { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Student")]
    public virtual User User { get; set; } = null!;
}
