using System;
using System.Collections.Generic;
using AttendanceManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace AttendanceManagementSystem.Data;

public partial class AttendanceManagementDbContext : DbContext
{
    public AttendanceManagementDbContext()
    {
    }

    public AttendanceManagementDbContext(DbContextOptions<AttendanceManagementDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Admin> Admins { get; set; }

    public virtual DbSet<Attendance> Attendances { get; set; }

    public virtual DbSet<Course> Courses { get; set; }

    public virtual DbSet<CourseEnrollment> CourseEnrollments { get; set; }

    public virtual DbSet<CourseTeacher> CourseTeachers { get; set; }

    public virtual DbSet<Section> Sections { get; set; }

    public virtual DbSet<Session> Sessions { get; set; }

    public virtual DbSet<Student> Students { get; set; }

    public virtual DbSet<Teacher> Teachers { get; set; }

    public virtual DbSet<TimetableEntry> TimetableEntries { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Connection string is configured in Program.cs from appsettings.json
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=AttendanceManagementDB;Trusted_Connection=true;TrustServerCertificate=true");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Admin>(entity =>
        {
            entity.HasKey(e => e.AdminId).HasName("PK__Admins__719FE4888F58EDBE");

            entity.HasOne(d => d.User).WithOne(p => p.Admin).HasConstraintName("FK_Admins_Users");
        });

        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.HasKey(e => e.AttendanceId).HasName("PK__Attendan__8B69261C656BB0F7");

            entity.Property(e => e.MarkedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Course).WithMany(p => p.Attendances)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Attendances_Courses");

            entity.HasOne(d => d.MarkedByTeacher).WithMany(p => p.Attendances).HasConstraintName("FK_Attendances_Teachers");

            entity.HasOne(d => d.Student).WithMany(p => p.Attendances)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Attendances_Students");
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(e => e.CourseId).HasName("PK__Courses__C92D71A7D7C337B9");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<CourseEnrollment>(entity =>
        {
            entity.HasKey(e => e.EnrollmentId).HasName("PK__CourseEn__7F68771B8693726F");

            entity.Property(e => e.EnrollmentDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Status).HasDefaultValue("Active");

            entity.HasOne(d => d.Course).WithMany(p => p.CourseEnrollments).HasConstraintName("FK_CourseEnrollments_Courses");

            entity.HasOne(d => d.Session).WithMany(p => p.CourseEnrollments).HasConstraintName("FK_CourseEnrollments_Sessions");

            entity.HasOne(d => d.Student).WithMany(p => p.CourseEnrollments).HasConstraintName("FK_CourseEnrollments_Students");
        });

        modelBuilder.Entity<CourseTeacher>(entity =>
        {
            entity.HasKey(e => e.CourseTeacherId).HasName("PK__CourseTe__CD7EDFDC1DAF0F4B");

            entity.Property(e => e.AssignedDate).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Course).WithMany(p => p.CourseTeachers).HasConstraintName("FK_CourseTeachers_Courses");

            entity.HasOne(d => d.Section).WithMany(p => p.CourseTeachers)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_CourseTeachers_Sections");

            entity.HasOne(d => d.Session).WithMany(p => p.CourseTeachers).HasConstraintName("FK_CourseTeachers_Sessions");

            entity.HasOne(d => d.Teacher).WithMany(p => p.CourseTeachers).HasConstraintName("FK_CourseTeachers_Teachers");
        });

        modelBuilder.Entity<Section>(entity =>
        {
            entity.HasKey(e => e.SectionId).HasName("PK__Sections__80EF0872158AAAB8");

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Session).WithMany(p => p.Sections)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Sections_Sessions");
        });

        modelBuilder.Entity<Session>(entity =>
        {
            entity.HasKey(e => e.SessionId).HasName("PK__Sessions__C9F4929057BDC0B7");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Student>(entity =>
        {
            entity.HasKey(e => e.StudentId).HasName("PK__Students__32C52B99AD2DBF7D");

            entity.HasOne(d => d.Section).WithMany(p => p.Students)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Students_Sections");

            entity.HasOne(d => d.User).WithOne(p => p.Student).HasConstraintName("FK_Students_Users");
        });

        modelBuilder.Entity<Teacher>(entity =>
        {
            entity.HasKey(e => e.TeacherId).HasName("PK__Teachers__EDF2596414B66F89");

            entity.HasOne(d => d.User).WithOne(p => p.Teacher).HasConstraintName("FK_Teachers_Users");
        });

        modelBuilder.Entity<TimetableEntry>(entity =>
        {
            entity.HasKey(e => e.TimetableId).HasName("PK__Timetabl__68413F6023B4A64D");

            entity.HasOne(d => d.Course).WithMany(p => p.TimetableEntries).HasConstraintName("FK_TimetableEntries_Courses");

            entity.HasOne(d => d.Section).WithMany(p => p.TimetableEntries)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_TimetableEntries_Sections");

            entity.HasOne(d => d.Teacher).WithMany(p => p.TimetableEntries).HasConstraintName("FK_TimetableEntries_Teachers");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CC4C7D413BCD");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsFirstLogin).HasDefaultValue(true);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
