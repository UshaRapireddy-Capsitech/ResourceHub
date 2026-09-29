using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace ResourceHub.Server.Models
{
    public enum Role
    {
        Admin,
        Staff,
        User
    }
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [Required]
        public string UserName { get; set; } = null!;

        [Required,EmailAddress]
        public string Email { get; set; } = null!;
        public string? PasswordHash { get; set; }= null!;

        [BsonRepresentation(BsonType.String)]
        public Role Role { get; set; } = Role.User;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
