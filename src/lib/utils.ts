import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createPageUrl(pageName: string): string {
  const pageRoutes: { [key: string]: string } = {
    'Login': '/login',
    'Register': '/register',
    'Dashboard': '/dashboard',
    'Admin': '/admin',
    'PetCounter': '/'
  };
  return pageRoutes[pageName] || '/';
}
