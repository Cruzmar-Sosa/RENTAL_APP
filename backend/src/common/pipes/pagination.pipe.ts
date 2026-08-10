import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaginationPipe implements PipeTransform {
  private readonly maxPageSize: number;

  constructor(private readonly configService: ConfigService) {
    this.maxPageSize = this.configService.get<number>('MAX_PAGE_SIZE', 100);
  }

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query' || typeof value !== 'object' || value === null) {
      return value;
    }

    const transformed = { ...value };

    if (transformed.page !== undefined) {
      const parsedPage = parseInt(transformed.page, 10);
      transformed.page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    }

    if (transformed.limit !== undefined) {
      const parsedLimit = parseInt(transformed.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        transformed.limit = 10;
      } else if (parsedLimit > this.maxPageSize) {
        transformed.limit = this.maxPageSize;
      } else {
        transformed.limit = parsedLimit;
      }
    }

    return transformed;
  }
}
