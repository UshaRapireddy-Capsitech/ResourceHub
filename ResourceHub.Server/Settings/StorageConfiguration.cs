namespace ResourceHub.Server.Settings
{
    public class StorageConfiguration
    {
        public string Url { get; set; } = "https://actingofficeuat.blob.core.windows.net/";
        public string AccountName { get; set; } = "actingofficeuat";
        public string AccountKey { get; set; } = null!;
        public string ServiceType { get; set; } = "blob";
        public string ContainerName { get; set; } = "resourcehub-attachments";

        public string ConnectionString =>
            $"DefaultEndpointsProtocol=https;AccountName={AccountName};AccountKey={AccountKey};EndpointSuffix=core.windows.net";
    }
}
