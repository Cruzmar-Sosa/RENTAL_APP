export interface UserProps {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'OPERATOR' | 'ADMIN';
  createdAt: string;
}

export class User {
  constructor(public readonly props: UserProps) {}

  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get fullName(): string {
    return this.props.fullName;
  }
  get role(): string {
    return this.props.role;
  }
}
