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
}

interface IPlayerCollectionMetrics {
  metrics: PlayerMetric[];
  years: number[];
}

export default IPlayerCollectionMetrics;
export type { YearMonthAmount, PlayerMetric };
