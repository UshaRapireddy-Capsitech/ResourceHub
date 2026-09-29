using MongoDB.Bson.Serialization.Attributes;

namespace ResourceHub.Server.Models
{
    public class DatabaseCounter
    {
        [BsonId]
        public string Id { get; set; } = "ResourceRefNo";
        public long SequenceValue { get; set; }
    }
}
