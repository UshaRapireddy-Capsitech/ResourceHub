using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using ResourceHub.Server.Data;
using ResourceHub.Server.DTOs;
using ResourceHub.Server.Models;

namespace ResourceHub.Server.Services
{
    public class ResourceService
    {
        private const long MaxFileSizeInBytes = 25 * 1024 * 1024; // 25 MB limit
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".png", ".jpg", ".jpeg", ".webp", ".zip"
        };

        private readonly MongoDbContext _context;
        private readonly AzureBlobService _azureBlobService;
        private readonly ILogger<ResourceService> _logger;

        private static string? ValidateAttachment(IFormFile? file)
        {
            if (file == null) return null;

            if (file.Length == 0)
            {
                return "The uploaded file is empty.";
            }

            if (file.Length > MaxFileSizeInBytes)
            {
                return "File size exceeds the maximum allowed limit of 25 MB.";
            }

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            {
                return $"File type '{extension}' is not allowed. Supported formats: PDF, Word, Excel, PowerPoint, Text, CSV, Images (PNG/JPG/WEBP), and ZIP.";
            }

            return null;
        }

        public ResourceService(MongoDbContext context, AzureBlobService azureBlobService, ILogger<ResourceService> logger)
        {
            _context = context;
            _azureBlobService = azureBlobService;
            _logger = logger;
        }

        private async Task<string> GenerateNextRefNoAsync()
        {
            var filter = Builders<DatabaseCounter>.Filter.Eq(x => x.Id, "ResourceRefNo");
            var update = Builders<DatabaseCounter>.Update.Inc(x => x.SequenceValue, 1);
            var options = new FindOneAndUpdateOptions<DatabaseCounter>
            {
                IsUpsert = true,
                ReturnDocument = ReturnDocument.After
            };

            var counter = await _context.Counters.FindOneAndUpdateAsync(filter, update, options);
            return $"RES-{1000 + counter.SequenceValue}";
        }

        // 1. My Resources
        public async Task<ApiResponse<List<ResourceDto>>> GetMyResourcesAsync(string userId)
        {
            var items = await _context.Resources
                .Find(x => x.AuthorId == userId)
                .SortByDescending(x => x.CreatedAt)
                .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();
            return new ApiResponse<List<ResourceDto>> { Message = "My resources fetched successfully.", Data = dtos };
        }

        // 2. Shared Resources
        public async Task<ApiResponse<List<ResourceDto>>> GetSharedResourcesAsync(string userId)
        {
            var filter = Builders<Resource>.Filter.And(
                Builders<Resource>.Filter.Eq(x => x.Status, ResourceStatus.Approved),
                Builders<Resource>.Filter.Ne(x => x.AuthorId, userId),
                Builders<Resource>.Filter.Or(
                    Builders<Resource>.Filter.Eq(x => x.Scope, ResourceScope.OrgWide),
                    Builders<Resource>.Filter.AnyEq(x => x.SharedWithUserIds, userId)
                )
            );

            var items = await _context.Resources
                .Find(filter)
                .SortByDescending(x => x.UpdatedAt)
                .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();
            return new ApiResponse<List<ResourceDto>> { Message = "Shared resources fetched successfully.", Data = dtos };
        }

        // 3. Pending Queue
        public async Task<ApiResponse<List<ResourceDto>>> GetPendingResourcesAsync()
        {
            var items = await _context.Resources
                .Find(x => x.Status == ResourceStatus.Pending)
                .SortBy(x => x.CreatedAt)
                .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();
            return new ApiResponse<List<ResourceDto>> { Message = "Pending approval queue fetched.", Data = dtos };
        }

        // 4. Get By ID
        public async Task<ApiResponse<ResourceDto>> GetByIdAsync(string id, string userId, Role userRole)
        {
            if (!ObjectId.TryParse(id, out _))
            {
                return new ApiResponse<ResourceDto> { Message = "Resource not found.", Data = null };
            }

            var item = await _context.Resources.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (item == null)
            {
                return new ApiResponse<ResourceDto> { Message = "Resource not found.", Data = null };
            }

            bool hasAccess = item.AuthorId == userId
                || (item.Scope == ResourceScope.Custom && item.SharedWithUserIds.Contains(userId))
                || (item.Scope == ResourceScope.OrgWide && (item.Status == ResourceStatus.Approved || userRole == Role.Admin));

            if (!hasAccess)
            {
                return new ApiResponse<ResourceDto> { Message = "You do not have permission to view this resource.", Data = null };
            }

            return new ApiResponse<ResourceDto> { Message = "Resource fetched.", Data = MapToDto(item) };
        }

        // 5. Create Resource
        public async Task<ApiResponse<ResourceDto>> CreateResourceAsync(CreateResourceDto dto, string userId, string userName, Role userRole)
        {
            if (dto.Attachment != null)
            {
                var validationError = ValidateAttachment(dto.Attachment);
                if (validationError != null)
                {
                    return new ApiResponse<ResourceDto> { Message = validationError, Data = null };
                }
            }

            var refNo = await GenerateNextRefNoAsync();

            ResourceStatus status;
            List<string> sharedUserIds = new();

            if (dto.Scope == ResourceScope.Custom)
            {
                status = ResourceStatus.Approved;
                sharedUserIds = dto.SharedWithUserIds ?? new();
            }
            else if (dto.Scope == ResourceScope.OrgWide)
            {
                status = (userRole == Role.Admin) 
                    ? ResourceStatus.Approved 
                    : (dto.SendForReview ? ResourceStatus.Pending : ResourceStatus.Draft);
            }
            else
            {
                status = ResourceStatus.Draft;
            }

            var resource = new Resource
            {
                RefNo = refNo,
                Title = dto.Title,
                Content = dto.Content,
                Scope = dto.Scope,
                Status = status,
                SharedWithUserIds = sharedUserIds,
                AuthorId = userId,
                AuthorName = userName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (dto.Attachment != null && dto.Attachment.Length > 0)
            {
                var uploadResult = await _azureBlobService.UploadFileAsync(dto.Attachment);
                resource.AttachmentOriginalName = uploadResult.OriginalFileName;
                resource.AttachmentStoredFileName = uploadResult.StoredBlobName;
                resource.AttachmentFileSize = uploadResult.FileSize;
            }

            await _context.Resources.InsertOneAsync(resource);
            return new ApiResponse<ResourceDto> 
            { 
                Message = "Resource created successfully.", 
                Data = MapToDto(resource) 
            };
        }

        // 6. Update Resource
        public async Task<ApiResponse<ResourceDto>> UpdateResourceAsync(string id, UpdateResourceDto dto, string userId, string userName, Role userRole)
        {
            if (!ObjectId.TryParse(id, out _))
            {
                return new ApiResponse<ResourceDto> { Message = "Resource not found.", Data = null };
            }

            var existing = await _context.Resources.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (existing == null)
            {
                return new ApiResponse<ResourceDto> { Message = "Resource not found.", Data = null };
            }

            bool canEdit = existing.AuthorId == userId || (existing.Scope == ResourceScope.OrgWide && userRole == Role.Admin);
            if (!canEdit)
            {
                return new ApiResponse<ResourceDto> 
                { 
                    Message = "Unauthorized to edit this resource.", 
                    Data = null 
                };
            }

            if (dto.Attachment != null)
            {
                var validationError = ValidateAttachment(dto.Attachment);
                if (validationError != null)
                {
                    return new ApiResponse<ResourceDto> { Message = validationError, Data = null };
                }
            }

            existing.Title = dto.Title;
            existing.Content = dto.Content;
            existing.Scope = dto.Scope;
            existing.UpdatedById = userId;
            existing.UpdatedByName = userName;
            existing.UpdatedAt = DateTime.UtcNow;

            if (dto.Scope == ResourceScope.Custom)
            {
                existing.Status = ResourceStatus.Approved;
                existing.SharedWithUserIds = dto.SharedWithUserIds ?? new();
                existing.ReviewNote = null;
            }
            else if (dto.Scope == ResourceScope.OrgWide)
            {
                existing.SharedWithUserIds = new();
                if (dto.SendForReview)
                {
                    existing.Status = (userRole == Role.Admin) ? ResourceStatus.Approved : ResourceStatus.Pending;
                    existing.ReviewNote = null;
                }
            }
            else
            {
                // OnlyMe
                existing.Status = ResourceStatus.Draft;
                existing.SharedWithUserIds = new();
                existing.ReviewNote = null;
            }

            if (dto.RemoveExistingAttachment && !string.IsNullOrEmpty(existing.AttachmentStoredFileName))
            {
                try
                {
                    await _azureBlobService.DeleteFileAsync(existing.AttachmentStoredFileName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete old attachment blob {BlobName}", existing.AttachmentStoredFileName);
                }
                existing.AttachmentOriginalName = null;
                existing.AttachmentStoredFileName = null;
                existing.AttachmentFileSize = null;
            }

            if (dto.Attachment != null && dto.Attachment.Length > 0)
            {
                if (!string.IsNullOrEmpty(existing.AttachmentStoredFileName))
                {
                    try
                    {
                        await _azureBlobService.DeleteFileAsync(existing.AttachmentStoredFileName);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete replaced attachment blob {BlobName}", existing.AttachmentStoredFileName);
                    }
                }

                var uploadResult = await _azureBlobService.UploadFileAsync(dto.Attachment);
                existing.AttachmentOriginalName = uploadResult.OriginalFileName;
                existing.AttachmentStoredFileName = uploadResult.StoredBlobName;
                existing.AttachmentFileSize = uploadResult.FileSize;
            }

            await _context.Resources.ReplaceOneAsync(x => x.Id == id, existing);
            return new ApiResponse<ResourceDto> 
            { 
                Message = "Resource updated successfully.", 
                Data = MapToDto(existing) 
            };
        }

        // 7. Delete Resource with Attachment Cleanup
        public async Task<ApiResponse<bool>> DeleteResourceAsync(string id, string userId, Role userRole)
        {
            if (!ObjectId.TryParse(id, out _))
            {
                return new ApiResponse<bool> { Message = "Resource not found.", Data = false };
            }

            var existing = await _context.Resources.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (existing == null)
            {
                return new ApiResponse<bool> { Message = "Resource not found.", Data = false };
            }

            bool canDelete = existing.AuthorId == userId || (existing.Scope == ResourceScope.OrgWide && userRole == Role.Admin);
            if (!canDelete)
            {
                return new ApiResponse<bool> { Message = "Unauthorized to delete this resource.", Data = false };
            }

            if (!string.IsNullOrEmpty(existing.AttachmentStoredFileName))
            {
                try
                {
                    await _azureBlobService.DeleteFileAsync(existing.AttachmentStoredFileName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete attachment blob {BlobName} when deleting resource {ResourceId}", existing.AttachmentStoredFileName, id);
                }
            }

            await _context.Resources.DeleteOneAsync(x => x.Id == id);
            return new ApiResponse<bool> 
            { 
                Message = "Resource deleted successfully.", 
                Data = true 
            };
        }

        // 8. Review Resource
        public async Task<ApiResponse<bool>> ReviewResourceAsync(string id, ReviewDto dto, string reviewerId, string reviewerName)
        {
            if (!ObjectId.TryParse(id, out _))
            {
                return new ApiResponse<bool> { Message = "Resource not found.", Data = false };
            }

            var updateDef = Builders<Resource>.Update
                .Set(x => x.Status, dto.Status)
                .Set(x => x.ReviewNote, dto.ReviewNote)
                .Set(x => x.UpdatedById, reviewerId)
                .Set(x => x.UpdatedByName, reviewerName)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Resources.UpdateOneAsync(x => x.Id == id, updateDef);
            if (result.MatchedCount == 0)
            {
                return new ApiResponse<bool> { Message = "Resource not found.", Data = false };
            }

            return new ApiResponse<bool> 
            { 
                Message = $"Resource review completed: {dto.Status}", 
                Data = true 
            };
        }

        // 9. Share Resource
        public async Task<ApiResponse<bool>> ShareResourceAsync(string id, ShareDto dto, string userId, Role userRole)
        {
            if (!ObjectId.TryParse(id, out _))
            {
                return new ApiResponse<bool> { Message = "Resource not found.", Data = false };
            }

            var existing = await _context.Resources.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (existing == null)
            {
                return new ApiResponse<bool> { Message = "Resource not found.", Data = false };
            }

            if (existing.AuthorId != userId && userRole != Role.Admin)
            {
                return new ApiResponse<bool> { Message = "Unauthorized to change sharing settings.", Data = false };
            }

            var targetScope = dto.Scope == ResourceScope.OrgWide ? ResourceScope.OrgWide : ResourceScope.Custom;
            var userIds = targetScope == ResourceScope.Custom ? (dto.UserIds ?? new List<string>()) : new List<string>();

            var updateDef = Builders<Resource>.Update
                .Set(x => x.Scope, targetScope)
                .Set(x => x.Status, ResourceStatus.Approved)
                .Set(x => x.SharedWithUserIds, userIds)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);

            await _context.Resources.UpdateOneAsync(x => x.Id == id, updateDef);
            return new ApiResponse<bool> 
            { 
                Message = "Resource shared successfully.", 
                Data = true 
            };
        }

        // 10. Attachment file stream
        public async Task<(Stream Stream, string ContentType, string OriginalFileName)?> GetAttachmentStreamAsync(string id, string userId, Role userRole)
        {
            if (!ObjectId.TryParse(id, out _)) return null;

            var item = await _context.Resources.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (item == null || string.IsNullOrEmpty(item.AttachmentStoredFileName)) return null;

            bool hasAccess = item.AuthorId == userId
                || (item.Scope == ResourceScope.Custom && item.SharedWithUserIds.Contains(userId))
                || (item.Scope == ResourceScope.OrgWide && (item.Status == ResourceStatus.Approved || userRole == Role.Admin));

            if (!hasAccess) return null;

            var result = await _azureBlobService.DownloadFileAsync(item.AttachmentStoredFileName);
            if (result == null) return null;

            return (result.Value.Stream, result.Value.ContentType, item.AttachmentOriginalName ?? "attachment");
        }

        private static ResourceDto MapToDto(Resource r) => new()
        {
            Id = r.Id!,
            RefNo = r.RefNo,
            Title = r.Title,
            Content = r.Content,
            Scope = r.Scope,
            Status = r.Status,
            SharedWithUserIds = r.SharedWithUserIds,
            ReviewNote = r.ReviewNote,
            AttachmentOriginalName = r.AttachmentOriginalName,
            AttachmentFileSize = r.AttachmentFileSize,
            AuthorId = r.AuthorId,
            AuthorName = r.AuthorName,
            UpdatedById = r.UpdatedById,
            UpdatedByName = r.UpdatedByName,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }
}
