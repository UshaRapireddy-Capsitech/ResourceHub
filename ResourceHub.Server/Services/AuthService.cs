using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ResourceHub.Server.Data;
using ResourceHub.Server.DTOs;
using ResourceHub.Server.Models;
using ResourceHub.Server.Settings;

namespace ResourceHub.Server.Services
{
    public class AuthService
    {
        private readonly MongoDbContext _context;
        private readonly JwtSettings _jwtSettings;

        public AuthService(MongoDbContext context, IOptions<JwtSettings> jwtSettings)
        {
            _context = context;
            _jwtSettings = jwtSettings.Value;
        }

        // 1. Login
        public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var user = await _context.Users
                .Find(u => u.Email.ToLower() == normalizedEmail)
                .FirstOrDefaultAsync();

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return new ApiResponse<AuthResponseDto> { Message = "Invalid email or password.", Data = null };
            }

            var token = GenerateToken(user);
            var authData = new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id!,
                    UserName = user.UserName,
                    Email = user.Email,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt
                }
            };

            return new ApiResponse<AuthResponseDto> 
            { 
                Message = "Login successful.", 
                Data = authData 
            };
        }

        // 2. Admin creates a new user (default password "welcome")
        public async Task<ApiResponse<UserDto>> CreateUserAsync(CreateUserDto dto)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var existingUser = await _context.Users
                .Find(u => u.Email.ToLower() == normalizedEmail)
                .FirstOrDefaultAsync();

            if (existingUser != null)
            {
                return new ApiResponse<UserDto> { Message = "Email already exists.", Data = null };
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword("welcome");
            var newUser = new User
            {
                UserName = dto.UserName.Trim(),
                Email = normalizedEmail,
                PasswordHash = passwordHash,
                Role = dto.Role,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.InsertOneAsync(newUser);

            var userDto = new UserDto
            {
                Id = newUser.Id!,
                UserName = newUser.UserName,
                Email = newUser.Email,
                Role = newUser.Role,
                CreatedAt = newUser.CreatedAt
            };

            return new ApiResponse<UserDto> 
            { 
                Message = "User created successfully.", 
                Data = userDto 
            };
        }

        // 3. Get all users
        public async Task<ApiResponse<List<UserDto>>> GetAllUsersAsync()
        {
            var list = await _context.Users
                .Find(_ => true)
                .Project(u => new UserDto
                {
                    Id = u.Id!,
                    UserName = u.UserName,
                    Email = u.Email,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return new ApiResponse<List<UserDto>> 
            { 
                Message = "Users fetched successfully.", 
                Data = list 
            };
        }

        // 4. Seed Admin
        public async Task<ApiResponse<bool>> SeedAdminAsync()
        {
            var existingAdmin = await _context.Users
                .Find(u => u.Email == "admin@example.com")
                .FirstOrDefaultAsync();

            if (existingAdmin != null)
            {
                return new ApiResponse<bool> { Message = "Admin already exists (admin@example.com / welcome).", Data = false };
            }

            var adminUser = new User
            {
                UserName = "Admin",
                Email = "admin@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("welcome"),
                Role = Role.Admin,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.InsertOneAsync(adminUser);
            return new ApiResponse<bool> 
            { 
                Message = "Admin seeded successfully (admin@example.com / welcome).", 
                Data = true 
            };
        }

        private string GenerateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id!),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(_jwtSettings.ExpiryInHours),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
