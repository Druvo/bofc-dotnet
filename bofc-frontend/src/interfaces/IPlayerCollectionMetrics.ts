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
}

interface IPlayerCollectionMetrics {
  metrics: PlayerMetric[];
  years: number[];
}

export default IPlayerCollectionMetrics;
export type { YearMonthAmount, PlayerMetric };
