using AttendanceManagementSystem.Data;
using AttendanceManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace AttendanceManagementSystem.Services;

public class DbSeeder
{
    private readonly AttendanceManagementDbContext _context;

    public DbSeeder(AttendanceManagementDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        try
        {
            // Ensure database is created
            await _context.Database.MigrateAsync();
            
            // Check if admin user already exists
            var adminUser = await _context.Users
                .Include(u => u.Admin)
                .FirstOrDefaultAsync(u => u.Username == "admin");

            if (adminUser == null)
            {
                // Create admin user
                var user = new User
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = "Admin",
                    FullName = "System Administrator",
                    Email = "admin@attendance.com",
                    IsFirstLogin = false,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Create admin record
                var admin = new Admin
                {
                    UserId = user.UserId
                };

                _context.Admins.Add(admin);
                await _context.SaveChangesAsync();

                Console.WriteLine("✓ Admin user created successfully");
                Console.WriteLine("  Username: admin");
                Console.WriteLine("  Password: Admin@123");
            }
            else
            {
                Console.WriteLine("✓ Admin user already exists");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error seeding database: {ex.Message}");
            throw;
        }
    }
}
