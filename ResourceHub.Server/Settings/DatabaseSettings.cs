namespace ResourceHub.Server.Settings
{
    public class DatabaseSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string UserCollectionName { get; set; } = null!;
        public string ResourcesCollectionName { get; set; } = null!;
    }
}
