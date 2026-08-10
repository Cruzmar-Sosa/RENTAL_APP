export enum ReservationStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SETTLEMENT_PENDING = 'SETTLEMENT_PENDING',
  SETTLED = 'SETTLED',
  NO_SHOW = 'NO_SHOW',
}

export class ReservationStatus {
  constructor(public readonly value: ReservationStatusEnum) {}

  public isTerminal(): boolean {
    return (
      this.value === ReservationStatusEnum.COMPLETED ||
      this.value === ReservationStatusEnum.CANCELLED ||
      this.value === ReservationStatusEnum.SETTLED ||
      this.value === ReservationStatusEnum.NO_SHOW
    );
  }

  public isActive(): boolean {
    return (
      this.value === ReservationStatusEnum.CONFIRMED ||
      this.value === ReservationStatusEnum.CHECKED_IN ||
      this.value === ReservationStatusEnum.ACTIVE
    );
  }
}
