export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface IDHolder {
  readonly id: string;
}

export interface Timestamped {
  readonly createdAt: string;
  readonly updatedAt: string;
}
