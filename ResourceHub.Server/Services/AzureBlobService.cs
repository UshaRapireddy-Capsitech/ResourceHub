using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;
using ResourceHub.Server.Settings;

namespace ResourceHub.Server.Services
{
    public class AzureBlobService
    {
        private readonly BlobContainerClient _containerClient;
        private readonly StorageConfiguration _storageConfig;
        private readonly ILogger<AzureBlobService> _logger;

        public AzureBlobService(IOptions<StorageConfiguration> storageConfig, ILogger<AzureBlobService> logger)
        {
            _storageConfig = storageConfig.Value;
            _logger = logger;
            try
            {
                var blobServiceClient = new BlobServiceClient(_storageConfig.ConnectionString);
                _containerClient = blobServiceClient.GetBlobContainerClient(_storageConfig.ContainerName);
                _containerClient.CreateIfNotExists(PublicAccessType.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Azure Blob Storage container client.");
                throw;
            }
        }

        public async Task<(string StoredBlobName, string OriginalFileName, long FileSize)> UploadFileAsync(IFormFile file)
        {
            var originalFileName = Path.GetFileName(file.FileName);
            var extension = Path.GetExtension(originalFileName);
            var storedBlobName = $"{Guid.NewGuid()}{extension}";

            try
            {
                var blobClient = _containerClient.GetBlobClient(storedBlobName);
                var blobHttpHeaders = new BlobHttpHeaders
                {
                    ContentType = string.IsNullOrEmpty(file.ContentType) ? "application/octet-stream" : file.ContentType
                };

                using (var stream = file.OpenReadStream())
                {
                    await blobClient.UploadAsync(stream, new BlobUploadOptions
                    {
                        HttpHeaders = blobHttpHeaders
                    });
                }

                return (storedBlobName, originalFileName, file.Length);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file {FileName} to Azure Blob Storage", originalFileName);
                throw;
            }
        }

        public async Task<(Stream Stream, string ContentType)?> DownloadFileAsync(string storedBlobName)
        {
            if (string.IsNullOrEmpty(storedBlobName))
                return null;

            try
            {
                var blobClient = _containerClient.GetBlobClient(storedBlobName);
                if (!await blobClient.ExistsAsync())
                    return null;

                var downloadInfo = await blobClient.DownloadStreamingAsync();
                var contentType = downloadInfo.Value.Details.ContentType ?? "application/octet-stream";

                return (downloadInfo.Value.Content, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading blob {BlobName} from Azure Blob Storage", storedBlobName);
                return null;
            }
        }

        public async Task<bool> DeleteFileAsync(string storedBlobName)
        {
            if (string.IsNullOrEmpty(storedBlobName))
                return false;

            try
            {
                var blobClient = _containerClient.GetBlobClient(storedBlobName);
                return await blobClient.DeleteIfExistsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error deleting blob {BlobName} from Azure Blob Storage", storedBlobName);
                return false;
            }
        }
    }
}
