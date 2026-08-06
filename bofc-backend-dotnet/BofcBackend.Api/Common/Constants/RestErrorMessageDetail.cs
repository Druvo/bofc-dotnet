namespace BofcBackend.Api.Common.Constants;

public static class RestErrorMessageDetail
{
    public const string HttpRequestMethodNotSupported = "Sorry, the requested HTTP method is not supported.";
    public const string HttpMediaTypeNotSupported = "Unsupported media type in the request.";
    public const string HttpMediaTypeNotAcceptable = "None of the requested media types are acceptable.";
    public const string ConversionNotSupported = "Conversion not supported for the given data type.";
    public const string HttpMessageNotReadable = "Unable to read the HTTP message.";
    public const string HttpMessageNotWritable = "Unable to write the HTTP message.";
    public const string NoHandlerFound = "No handler found for the request.";
    public const string AsyncRequestTimeout = "Async request timed out.";
    public const string MissingPathVariable = "Missing path variable in the request.";
    public const string MissingRequestParameter = "Missing request parameter.";
    public const string TypeMismatch = "Type mismatch in request parameters.";
    public const string MissingRequestPart = "Missing request part.";
    public const string SqlError = "An error occurred while processing the database.";
    public const string AccessDenied = "You do not have permission to access this resource.";
    public const string ResourceNotFound = "The requested resource was not found.";
    public const string Unauthorized = "Authentication is required to access this resource.";
    public const string Forbidden = "You are not authorized to access this resource.";
    public const string InternalServerError = "An internal server error occurred. Please try again later.";

    public const string PlayerAlreadyExists = "Already a player registered with this email";
    public const string PlayerIsNotFound = "Player is not found";
    public const string IncorrectEmail = "Incorrect Email";
    public const string PasswordMismatch = "Password mismatch";
    public const string NewPasswordSameAsOld = "New password cannot be the same as old password";
    public const string PasswordResetNotRequired = "A password reset is not currently required for this account";
    public const string InvalidToken = "Invalid token";
    public const string EmailAlreadyInUse = "Email address is already in use by another player.";
    public const string EmployeeIdAlreadyInUse = "Employee ID is already in use by another player.";
    public const string TeamsIdAlreadyInUse = "Teams ID is already in use by another player.";

    public const string VenueIsNotFound = "Venue is not Found";
    public const string VenueAlreadyExists = "This Venue with this name already exists";
    public const string MatchDayIsNotFound = "MatchDay is not Found";
    public const string TeamIsNotFound = "Team is not Found";
    public const string CostTypeAlreadyExists = "Already a cost type is exists";
    public const string CostTypeIsNotFound = "Cost Type is not found";

    public const string RoundIsNotFound = "Round is not found";
    public const string GroupIsNotFound = "Group is not found";
    public const string MatchIsNotFound = "Match is not found";

    /// <summary>Java's UNAUTHORIZED constant — distinct from the generic 401-challenge Unauthorized text above.</summary>
    public const string NotAuthorizedForAction = "You are not authorized to do this action";

    public const string ParticipantNotFound = "Participant is not Found";
    public const string AlreadyParticipant = "Already given vote for participant";
    public const string MatchDayDateCannotBePastDate = "This MatchDay is already past";
    public const string NoUpcomingMatchDay = "No upcoming MatchDay";
    public const string PlayerIsNotParticipantYet = "Player is not a confirmed participant in the MatchDay";
    public const string PlayerAlreadyAddedAnotherTeam = "This player is already added another team";
    public const string PlayerIsNotPartOfThisTeam = "Player is not part of the specified team";

    public const string RoundNumberAlreadyExists = "A round with this round number already exists in the MatchDay";
    public const string RoundHasMatches = "Cannot delete round with existing matches";
    public const string RoundNotCompleted = "Round is not completed yet";
    public const string InvalidRoundSequence = "Invalid round sequence order";
    public const string GroupNameAlreadyExists = "A group with this name already exists in the round";
    public const string GroupHasTeams = "Cannot delete group with assigned teams";
    public const string GroupHasSubGroups = "Cannot delete a group that has sub-groups. Delete sub-groups first";
    public const string ParentGroupNotInSameRound = "Parent group must belong to the same round";
    public const string TeamAlreadyInGroup = "Team is already assigned to this group";
    public const string TeamAlreadyInRound = "Team is already assigned to this round";
    public const string GroupMaxTeamsReached = "Group has reached maximum team capacity";
    public const string StandingNotFound = "Standing is not found";
    public const string AdvancementRuleNotFound = "Advancement rule is not found";
    public const string LogicNodeIsNotFound = "Logic node is not found";

    public const string FixturesAlreadyExist = "Scheduled fixtures already exist for this MatchDay";
    public const string NoScheduledFixtures = "No scheduled fixtures found to clear";
    public const string InsufficientTeams = "Insufficient teams for this MatchDay type";

    public const string AcVoucherTypeNotFound = "Voucher type is not found!";
    public const string AcChartNotFound = "Chart of Account is not found!";
    public const string AcVoucherNotFound = "Voucher is not found!";
    public const string AcCollectionNotFound = "Collection is not found!";
    public const string PaymentAccountNotFound = "Payment account is not found!";

    /// <summary>Java's AC_BILL_PAYMENT_NOT_FOUND constant is copy-paste identical to AC_COLLECTION_NOT_FOUND — reproduced verbatim, not fixed.</summary>
    public const string AcBillPaymentNotFound = "Collection is not found!";

    public const string AcVoucherDrCrAmountNotSame = "Voucher amount Cr/Dr is not same!";
    public const string AcChartHasVoucher = "Cannot delete chart. There are vouchers associated with this chart.";
    public const string AcNatureNotFound = "AcNature not found for the given ID.";

    public const string NotificationNotFound = "Notification is not found";
    public const string NotificationTargetUsersRequired = "Select at least one recipient for a targeted notification";
}
