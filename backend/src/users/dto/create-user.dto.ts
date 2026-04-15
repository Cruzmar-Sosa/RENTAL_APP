export class CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
}
