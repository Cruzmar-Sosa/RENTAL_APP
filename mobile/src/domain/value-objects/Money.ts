import { formatCentsToUSD } from '@core/utils/money.utils';

export class Money {
  private constructor(public readonly cents: number) {
    if (cents < 0) {
      throw new Error('Money cents cannot be negative');
    }
  }

  public static fromCents(cents: number): Money {
    return new Money(cents);
  }

  public static zero(): Money {
    return new Money(0);
  }

  public formatUSD(): string {
    return formatCentsToUSD(this.cents);
  }
}
