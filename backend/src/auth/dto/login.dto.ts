import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser un email válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido.' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser un texto.' })
  @IsNotEmpty({ message: 'La contraseña es requerida.' })
  password!: string;
}
