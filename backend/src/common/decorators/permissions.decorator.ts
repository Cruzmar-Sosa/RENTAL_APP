import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (module: string, action: string) =>
  SetMetadata(PERMISSIONS_KEY, { module, action });
