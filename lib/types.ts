export type Prize = {
  rank: number;
  name: string;
  stock: number;
  initialStock: number;
};

export interface PrizeStore {
  /** 등수 순으로 정렬된 전체 상품 */
  list(): Promise<Prize[]>;
  /** 재고가 있을 때만 1 줄이고 성공 여부를 돌려준다 */
  take(rank: number): Promise<boolean>;
  /** 주어진 등수들의 상품명·수량을 덮어쓰고 전체 목록을 돌려준다 */
  update(prizes: Prize[]): Promise<Prize[]>;
}

export type DrawResult = { rank: number; name: string } | { soldOut: true };
