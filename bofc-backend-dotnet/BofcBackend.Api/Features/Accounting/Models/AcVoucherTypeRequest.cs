using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using BofcBackend.Api.Domain.Enums;

namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>Port of model/account/AcVoucherTypeRequest.java.</summary>
public class AcVoucherTypeRequest
{
    [Required(ErrorMessage = "Name is required.")]
    public string? Name { get; set; }

    [Required(ErrorMessage = "Alias is required.")]
    public string? Alias { get; set; }

    public string? Description { get; set; }

    [Required(ErrorMessage = "Transaction type is required.")]
    public AcTransactionType? AcTransactionType { get; set; }

    /// <summary>Java's `private boolean isDefault` - Jackson strips the "is" prefix, wire property is "default".</summary>
    [JsonPropertyName("default")]
    public bool IsDefault { get; set; }
}
