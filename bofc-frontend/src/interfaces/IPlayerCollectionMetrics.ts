interface YearMonthAmount {
  [year: string]: {
    [month: string]: number;
  };
}

interface PlayerMetric {
  playerId: number;
  playerName: string;
  yearMonthAmount: YearMonthAmount;
  active: boolean;
  /** Temporarily away - see the backend's Player.IsPaused. A paused player is never chased
   * for dues; their history still shows. Optional so an older payload simply reads false. */
  paused?: boolean;
  /** year -> months (1-12) an admin has omitted for this player. An omitted month is never
   * Due and never reminded about. Optional so an older payload simply reads "none". */
  waivedMonths?: { [year: string]: number[] };
}

interface IPlayerCollectionMetrics {
  metrics: PlayerMetric[];
  years: number[];
}

export default IPlayerCollectionMetrics;
export type { YearMonthAmount, PlayerMetric };
