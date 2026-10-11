export const TEAM_COUNT = 7;
export const TEAMS = Array.from({ length: TEAM_COUNT }, (_, i) => i + 1);

/** 한 팀 기준 상품 한 줄. 상품명은 모든 팀 공통, 수량은 팀마다 따로 */
export type Prize = {
  rank: number;
  name: string;
  stock: number;
  initialStock: number;
};

export type TeamBoard = { team: number; prizes: Prize[] };

export type Seed = {
  names: { rank: number; name: string }[];
  stock: { team: number; rank: number; stock: number; initialStock: number }[];
};

export interface PrizeStore {
  /** 그 팀의 상품, 등수 순 */
  list(team: number): Promise<Prize[]>;
  /** 그 팀 재고가 있을 때만 1 줄이고 성공 여부를 돌려준다 */
  take(team: number, rank: number): Promise<boolean>;
  /** 전체 팀, 팀 순 */
  listAll(): Promise<TeamBoard[]>;
  /** 상품명은 모든 팀에, 수량은 그 팀에만 반영하고 전체를 돌려준다 */
  update(team: number, prizes: Prize[]): Promise<TeamBoard[]>;
}

export type DrawResult = { rank: number; name: string } | { soldOut: true };
