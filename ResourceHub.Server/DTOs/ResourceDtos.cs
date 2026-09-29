using ResourceHub.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace ResourceHub.Server.DTOs
{
    public class CreateResourceDto
    {
        [Required]
        public string Title { get; set; } = null!;
        [Required]
        public string Content { get; set; } = null!;
        public ResourceScope Scope { get; set; } = ResourceScope.OnlyMe;
        public List<string>? SharedWithUserIds { get; set; } = new();
        public bool SendForReview { get; set; } = false;
        public IFormFile? Attachment { get; set; }
    }

    public class UpdateResourceDto
    {
        [Required]
        public string Title { get; set; } = null!;
        [Required]
        public string Content { get; set; } = null!;
        public ResourceScope Scope { get; set; } = ResourceScope.OnlyMe;
        public List<string>? SharedWithUserIds { get; set; } = new();
        public bool SendForReview { get; set; } = false;
        public IFormFile? Attachment { get; set; }
        public bool RemoveExistingAttachment { get; set; } = false;
    }

    public class ReviewDto
    {
        [Required]
        public ResourceStatus Status { get; set; }
        public string? ReviewNote { get; set; }
    }

    public class ShareDto
    {
        public ResourceScope Scope { get; set; } = ResourceScope.Custom;
        public List<string> UserIds { get; set; } = new();
    }

    public class ResourceDto
    {
        public string Id { get; set; } = null!;
        public string RefNo { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Content { get; set; } = null!;
        public ResourceScope Scope { get; set; }
        public ResourceStatus Status { get; set; }
        public List<string> SharedWithUserIds { get; set; } = new();
        public string? ReviewNote { get; set; }
        public string? AttachmentOriginalName { get; set; }
        public long? AttachmentFileSize { get; set; }
        public bool HasAttachment => !string.IsNullOrEmpty(AttachmentOriginalName);
        public string AuthorId { get; set; } = null!;
        public string AuthorName { get; set; } = null!;
        public string? UpdatedById { get; set; }
        public string? UpdatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
