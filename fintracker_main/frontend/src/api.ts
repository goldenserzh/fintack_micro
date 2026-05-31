import axios from 'axios';
import {
  User, Profile, Transaction, AuthResponse,
  CreateUserRequest, CreateTransactionRequest, UpdateProfileRequest, LoginRequest,
} from './types';

const TOKEN_KEY = 'fintracker_token';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000' });

// Attach Bearer token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 — clear session and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('fintracker_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ─── Auth ─────────────────────────────────────────

export const checkHasUsers = async (): Promise<boolean> => {
  const res = await api.get('/auth/has_users');
  return res.data.has_users;
};

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const res = await api.post('/auth/login', credentials);
  return res.data;
};

export const registerFirst = async (data: CreateUserRequest): Promise<AuthResponse> => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

// ─── Users ────────────────────────────────────────

export const getUsers = async (): Promise<User[]> => {
  const res = await api.get('/users/');
  return res.data;
};

export const getUser = async (userId: number): Promise<User> => {
  const res = await api.get(`/users/${userId}`);
  return res.data;
};

export const createUser = async (user: CreateUserRequest): Promise<User> => {
  const res = await api.post(`/users/${Date.now()}`, user);
  return res.data;
};

export const updateUser = async (
  userId: number,
  data: { name?: string; email?: string; password?: string },
): Promise<User> => {
  const res = await api.patch(`/users/${userId}`, data);
  return res.data;
};

export const deleteUser = async (userId: number): Promise<User> => {
  const res = await api.delete(`/users/${userId}`);
  return res.data;
};

// ─── Profile ──────────────────────────────────────

export const getProfile = async (userId: number): Promise<Profile> => {
  const res = await api.get(`/profile/${userId}`);
  return res.data;
};

export const updateProfile = async (userId: number, profile: UpdateProfileRequest): Promise<Profile> => {
  const res = await api.patch(`/profile/${userId}`, profile);
  return res.data;
};

// ─── Transactions ─────────────────────────────────

export const getTransactions = async (userId: number): Promise<Transaction[]> => {
  const res = await api.get(`/transactions/${userId}`);
  return res.data;
};

export const getTransaction = async (userId: number, transactionId: number): Promise<Transaction> => {
  const res = await api.get(`/transactions/${userId}/${transactionId}`);
  return res.data;
};

export const createTransaction = async (
  userId: number,
  transaction: CreateTransactionRequest,
): Promise<Transaction> => {
  const res = await api.post(`/transactions/${userId}`, transaction);
  return res.data;
};

export const deleteTransaction = async (userId: number, transactionId: number): Promise<void> => {
  await api.delete(`/transactions/${userId}/${transactionId}`);
};

// ─── AI Agent ──────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSessionSummary {
  session_id: number;
  title: string;
  created_at: string;
}

export interface ChatSessionFull extends ChatSessionSummary {
  messages: Array<{ message_id: number; role: string; content: string; created_at: string }>;
}

export const getSessions = async (userId: number): Promise<ChatSessionSummary[]> => {
  const res = await api.get(`/ai/sessions/${userId}`);
  return res.data;
};

export const createSession = async (userId: number): Promise<ChatSessionFull> => {
  const res = await api.post(`/ai/sessions/${userId}`);
  return res.data;
};

export const getSession = async (userId: number, sessionId: number): Promise<ChatSessionFull> => {
  const res = await api.get(`/ai/sessions/${userId}/${sessionId}`);
  return res.data;
};

export const deleteSession = async (userId: number, sessionId: number): Promise<void> => {
  await api.delete(`/ai/sessions/${userId}/${sessionId}`);
};

export const sendMessage = async (
  userId: number,
  sessionId: number,
  message: string,
): Promise<{ reply: string; title: string | null }> => {
  const res = await api.post(`/ai/chat/${userId}/${sessionId}`, { message });
  return { reply: res.data.reply, title: res.data.title ?? null };
};

// ─── Quick Import ──────────────────────────────────

export interface ParsedTransaction {
  name: string;
  amount: number;
  category: string;
}

export const parseTransactionsFromText = async (
  userId: number,
  text: string,
): Promise<ParsedTransaction[]> => {
  const form = new FormData();
  form.append('text', text);
  const res = await api.post(`/ai/parse/${userId}`, form);
  return res.data.transactions;
};

export const parseTransactionsFromImage = async (
  userId: number,
  file: File,
): Promise<ParsedTransaction[]> => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post(`/ai/parse/${userId}`, form);
  return res.data.transactions;
};
