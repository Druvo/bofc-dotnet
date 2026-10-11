import { PlayerMetric } from "../interfaces/IPlayerCollectionMetrics";

/**
 * Is the club chasing this player for their monthly contribution at all?
 *
 * The rule lives here rather than inside each widget because it is asked in five places -
 * the Payment Due tile, the Payments Due This Month list, a player's own contributions
 * card, and both the desktop and mobile collection tables. They have to agree: a tile that
 * says four while the list below it shows three is worse than either number being wrong on
 * its own.
 *
 * Two reasons a player is not chased:
 *
 * - They are not active. They have left the club, so the months after they left are blank,
 *   not overdue.
 * - They are paused. Pausing is how an organiser says "stop asking" for someone travelling,
 *   injured or on leave, and the payment reminder emails have always honoured it (see
 *   PaymentDueReminderBackgroundService). The dashboard was the one place still counting
 *   them, which is what made the emails and the tile disagree.
 *
 * Neither hides the player's history: what they have paid stays in the report, since
 * pausing stops the club asking, it does not erase what was paid.
 */
export function isChasedForDues(metric: PlayerMetric | undefined | null): boolean {
    if (!metric) return false;
    return metric.active === true && metric.paused !== true;
}

/** Amount this player contributed in the given month, 0 when there is no record. */
export function contributionFor(
    metric: PlayerMetric | undefined | null,
    year: number,
    month: number
): number {
    return metric?.yearMonthAmount?.[year.toString()]?.[month] || 0;
}

/**
 * An admin has omitted this month's dues for this player ("Omit payment" on the Player Monthly
 * Payments page). Unlike pausing, this covers one month and nothing else. The payment reminder
 * emails skip the player for that month too (PaymentDueReminderBackgroundService).
 */
export function isWaivedForMonth(
    metric: PlayerMetric | undefined | null,
    year: number,
    month: number
): boolean {
    return metric?.waivedMonths?.[year.toString()]?.includes(month) ?? false;
}

/** Behind for this month: chased for dues, the month not omitted, and nothing recorded
 * against it. */
export function isDueForMonth(
    metric: PlayerMetric | undefined | null,
    year: number,
    month: number
): boolean {
    return (
        isChasedForDues(metric) &&
        !isWaivedForMonth(metric, year, month) &&
        contributionFor(metric, year, month) <= 0
    );
}
