export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'contributor';
  created_at: string;
}
