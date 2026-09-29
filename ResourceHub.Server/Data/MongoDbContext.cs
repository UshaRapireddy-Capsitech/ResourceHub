using Microsoft.Extensions.Options;
using MongoDB.Driver;
using ResourceHub.Server.Models;
using ResourceHub.Server.Settings;

namespace ResourceHub.Server.Data
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;
        private readonly ILogger<MongoDbContext> _logger;

        public IMongoCollection<Resource> Resources { get; }
        public IMongoCollection<User> Users { get; }
        public IMongoCollection<DatabaseCounter> Counters { get; }

        public MongoDbContext(IOptions<DatabaseSettings> dbSettings, ILogger<MongoDbContext> logger)
        {
            _logger = logger;
            var settings = dbSettings.Value;
            var client = new MongoClient(settings.ConnectionString);
            _database = client.GetDatabase(settings.DatabaseName);

            Resources = _database.GetCollection<Resource>(settings.ResourcesCollectionName);
            Users = _database.GetCollection<User>(settings.UserCollectionName);
            Counters = _database.GetCollection<DatabaseCounter>("Counters");
        }

        public async Task InitializeIndexesAsync()
        {
            try
            {
                // 1. User Email Unique Index (prevents duplicate accounts & speeds up login)
                var userEmailIndex = new CreateIndexModel<User>(
                    Builders<User>.IndexKeys.Ascending(u => u.Email),
                    new CreateIndexOptions { Unique = true, Name = "idx_user_email_unique" }
                );
                await Users.Indexes.CreateOneAsync(userEmailIndex);

                // 2. Resource RefNo Unique Index
                var refNoIndex = new CreateIndexModel<Resource>(
                    Builders<Resource>.IndexKeys.Ascending(r => r.RefNo),
                    new CreateIndexOptions { Unique = true, Name = "idx_resource_refno_unique" }
                );
                await Resources.Indexes.CreateOneAsync(refNoIndex);

                // 3. My Resources Index (AuthorId + CreatedAt)
                var authorIndex = new CreateIndexModel<Resource>(
                    Builders<Resource>.IndexKeys.Ascending(r => r.AuthorId).Descending(r => r.CreatedAt),
                    new CreateIndexOptions { Name = "idx_resource_author_created" }
                );
                await Resources.Indexes.CreateOneAsync(authorIndex);

                // 4. Status + UpdatedAt Index (powers Shared and Pending queries)
                var statusIndex = new CreateIndexModel<Resource>(
                    Builders<Resource>.IndexKeys.Ascending(r => r.Status).Descending(r => r.UpdatedAt),
                    new CreateIndexOptions { Name = "idx_resource_status_updated" }
                );
                await Resources.Indexes.CreateOneAsync(statusIndex);

                _logger.LogInformation("Essential MongoDB indexes verified.");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "MongoDB index initialization notice.");
            }
        }
    }
}
