using ResourceHub.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace ResourceHub.Server.DTOs
{
    public class CreateUserDto
    {
        [Required]
        public string UserName { get; set; } = null!;

        [Required, EmailAddress]
        public string Email { get; set; } = null!;
        public Role Role { get; set; } = Role.User;
    }

    public class UserDto
    {
        public string Id { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public Role Role { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
