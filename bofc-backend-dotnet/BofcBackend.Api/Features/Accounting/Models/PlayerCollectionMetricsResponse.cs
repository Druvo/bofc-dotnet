namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/report/PlayerCollectionMetricsResponse.java.</summary>
public class PlayerCollectionMetricsResponse
{
    public List<PlayerCollectionReport> Metrics { get; set; } = [];
    public List<int> Years { get; set; } = [];
}
