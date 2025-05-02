import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  isApproved: boolean;
}

export interface Pet {
  id: string;
  name: string;
  age: number;
  bio: string;
  photo: string;
  ownerId: string;
}

export interface PendingUser {
  id: string;
  email: string;
  fullName: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
}

export interface PetFormData {
  name: string;
  age: string;
  bio: string;
  photo: string;
}

export interface PetFormProps {
  onClose: () => void;
  onSuccess: () => void;
  ownerId?: string;
}

export interface LayoutProps {
  children: React.ReactNode;
  currentPageName: string;
}

export interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'user';
}

export class User {
  static async current(): Promise<User | null> {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  static async login(email: string, password: string): Promise<User> {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    return await response.json();
  }

  static async list(): Promise<User[]> {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  }

  static async logout(): Promise<void> {
    localStorage.removeItem('token');
  }
}

export class Pet {
  static async list(): Promise<Pet[]> {
    const response = await fetch('/api/pets');
    if (!response.ok) throw new Error('Failed to fetch pets');
    return await response.json();
  }

  static async filter(params: Partial<Pet>): Promise<Pet[]> {
    const query = new URLSearchParams(params as Record<string, string>);
    const response = await fetch(`/api/pets?${query}`);
    if (!response.ok) throw new Error('Failed to fetch pets');
    return await response.json();
  }

  static async create(data: Omit<Pet, 'id'>): Promise<Pet> {
    const response = await fetch('/api/pets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create pet');
    return await response.json();
  }

  static async update(id: number, data: Partial<Pet>): Promise<Pet> {
    const response = await fetch(`/api/pets/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update pet');
    return await response.json();
  }
} 