import axios from 'axios';
import { User, Profile, Transaction, CreateUserRequest, CreateTransactionRequest, UpdateProfileRequest, LoginRequest } from './types';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000' });

export const checkHasUsers = async (): Promise<boolean> => {
  const res = await api.get('/auth/has_users');
  return res.data.has_users;
};

export const login = async (credentials: LoginRequest): Promise<User> => {
  const res = await api.post('/auth/login', credentials);
  return res.data;
};

export const registerFirst = async (data: CreateUserRequest): Promise<User> => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

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

export const updateUser = async (userId: number, data: { name?: string; email?: string; password?: string }): Promise<User> => {
  const res = await api.patch(`/users/${userId}`, data);
  return res.data;
};

export const deleteUser = async (userId: number): Promise<User> => {
  const res = await api.delete(`/users/${userId}`);
  return res.data;
};

export const getProfile = async (userId: number): Promise<Profile> => {
  const res = await api.get(`/profile/${userId}`);
  return res.data;
};

export const updateProfile = async (userId: number, profile: UpdateProfileRequest): Promise<Profile> => {
  const res = await api.patch(`/profile/${userId}`, profile);
  return res.data;
};

export const getTransactions = async (userId: number): Promise<Transaction[]> => {
  const res = await api.get(`/transactions/${userId}`);
  return res.data;
};

export const getTransaction = async (userId: number, transactionId: number): Promise<Transaction> => {
  const res = await api.get(`/transactions/${userId}/${transactionId}`);
  return res.data;
};

export const createTransaction = async (userId: number, transaction: CreateTransactionRequest): Promise<Transaction> => {
  const res = await api.post(`/transactions/${userId}`, transaction);
  return res.data;
};

export const deleteTransaction = async (userId: number, transactionId: number): Promise<void> => {
  await api.delete(`/transactions/${userId}/${transactionId}`);
};
