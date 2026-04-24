export interface Profile {
  profile_id: number;
  user_id: number;
  income: number;
  limit: number;
  goal: string;
  goal_amount: number | null;
}

export interface Transaction {
  transaction_id: number;
  user_id: number;
  name: string;
  amount: number;
  category: string;
  created_at: string;
}

export interface User {
  user_id: number;
  name: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  profile?: Profile;
  transactions: Transaction[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateTransactionRequest {
  name: string;
  amount: number;
  category: string;
}

export interface UpdateProfileRequest {
  income?: number;
  limit?: number;
  goal?: string;
  goal_amount?: number | null;
}
