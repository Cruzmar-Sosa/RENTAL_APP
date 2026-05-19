import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido.' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es requerido.' })
  name: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsOptional()
  phone?: string;
}

