namespace BofcBackend.Api.Features.Accounting.Models;

/// <summary>
/// Mirrors the shape of Spring Data's Page&lt;T&gt; JSON serialization - Java's
/// AcBillPaymentController.getAcBillPayments returns a raw Page directly (bypassing the app's
/// usual ResponseBuilder envelope), so this reproduces that same wire shape rather than the
/// normal {message, statusCode, content} envelope used everywhere else.
/// </summary>
public class SpringPageResponse<T>(List<T> content, long totalElements, int page, int size)
{
    public List<T> Content { get; } = content;
    public long TotalElements { get; } = totalElements;
    public int TotalPages { get; } = size == 0 ? 0 : (int)Math.Ceiling((double)totalElements / size);
    public int Number { get; } = page;
    public int Size { get; } = size;
    public int NumberOfElements { get; } = content.Count;
    public bool First { get; } = page == 0;
    public bool Last { get; } = (page + 1) * size >= totalElements;
    public bool Empty { get; } = content.Count == 0;
}
