import { User, Document } from '../db/schema';


export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}



export interface CreateDocumentRequest {
  title: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface DocumentWithUser extends Document {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface DocumentListResponse {
  documents: DocumentWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}



export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  userId?: string;
}