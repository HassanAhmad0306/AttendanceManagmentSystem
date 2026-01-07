using AttendanceManagementSystem.Models;
using BCrypt.Net;

namespace AttendanceManagementSystem.Data;

public static class DbSeeder
{
    public static void Seed(AttendanceManagementDbContext context)
    {
        // Check if database is already seeded
        if (context.Users.Any())
        {
            return;
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
        var now = DateTime.UtcNow;

        // 1. Create Admin
        var adminUser = new User
        {
            Username = "Admin",
            PasswordHash = passwordHash,
            Role = "Admin",
            FullName = "System Admin",
            Email = "admin@system.com",
            IsActive = true,
            CreatedAt = now,
            IsFirstLogin = false
        };
        context.Users.Add(adminUser);
        context.SaveChanges(); // Save to get UserId

        context.Admins.Add(new Admin { UserId = adminUser.UserId });

        // 2. Create Teachers (Pakistani Single Names)
        string[] teacherNames = { "Ali", "Fatima", "Ahmed", "Zainab" };
        
        foreach (var name in teacherNames)
        {
            var teacherUser = new User
            {
                Username = name,
                PasswordHash = passwordHash,
                Role = "Teacher",
                FullName = name, // Single name as requested
                Email = $"{name.ToLower()}@school.com",
                IsActive = true,
                CreatedAt = now,
                IsFirstLogin = true
            };
            context.Users.Add(teacherUser);
            context.SaveChanges();

            context.Teachers.Add(new Teacher 
            { 
                UserId = teacherUser.UserId,
                Department = "Computer Science",
                EmployeeId = $"EMP-{name.ToUpper()}"
            });
        }

        // 3. Create Students (Pakistani Single Names)
        string[] studentNames = { "Bilal", "Hina", "Hamza", "Sara", "Omar", "Ayesha", "Usman", "Maria" };
        int rollCounter = 1;

        foreach (var name in studentNames)
        {
            var studentUser = new User
            {
                Username = name,
                PasswordHash = passwordHash,
                Role = "Student",
                FullName = name, // Single name as requested
                Email = $"{name.ToLower()}@student.school.com",
                IsActive = true,
                CreatedAt = now,
                IsFirstLogin = true
            };
            context.Users.Add(studentUser);
            context.SaveChanges();

            context.Students.Add(new Student
            {
                UserId = studentUser.UserId,
                RollNumber = $"FA23-BCS-{rollCounter:D3}"
            });
            rollCounter++;
        }

        context.SaveChanges();
    }
}
