import { UserRole } from "src/common/enums/user-role.enum";


export class RegisterResponseDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  mfa_enabled: boolean;
  created_at: Date;
  updated_at: Date;
} 