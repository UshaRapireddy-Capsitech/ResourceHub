using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace ResourceHub.Server.Models
{
    public enum ResourceScope
    {
        OnlyMe,
        Custom,
        OrgWide
    }

    public enum ResourceStatus
    {
        Draft,
        Pending,
        Approved,
        Rejected
    }

    public class Resource
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string RefNo { get; set; } = null!;

        [Required]
        public string Title { get; set; } = null!;

        [Required]
        public string Content { get; set; } = null!;

        [BsonRepresentation(BsonType.String)]
        public ResourceScope Scope { get; set; } = ResourceScope.OnlyMe;

        [BsonRepresentation(BsonType.String)]
        public ResourceStatus Status { get; set; } = ResourceStatus.Draft;

        public List<string> SharedWithUserIds { get; set; } = new();

        public string? ReviewNote { get; set; }

        // Local attachment metadata
        public string? AttachmentOriginalName { get; set; }
        public string? AttachmentStoredFileName { get; set; }
        public long? AttachmentFileSize { get; set; }

        // Author details
        public string AuthorId { get; set; } = null!;
        public string AuthorName { get; set; } = null!;

        // Last updated by details
        public string? UpdatedById { get; set; }
        public string? UpdatedByName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
