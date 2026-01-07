using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AttendanceManagementSystem.Models;

public partial class TimetableEntry
{
    [Key]
    public int TimetableId { get; set; }

    public int CourseId { get; set; }

    public int TeacherId { get; set; }

    public int? SectionId { get; set; }

    [StringLength(20)]
    public string DayOfWeek { get; set; } = null!;

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    [StringLength(50)]
    public string? RoomNumber { get; set; }

    [ForeignKey("CourseId")]
    [InverseProperty("TimetableEntries")]
    public virtual Course Course { get; set; } = null!;

    [ForeignKey("SectionId")]
    [InverseProperty("TimetableEntries")]
    public virtual Section? Section { get; set; }

    [ForeignKey("TeacherId")]
    [InverseProperty("TimetableEntries")]
    public virtual Teacher Teacher { get; set; } = null!;
}
