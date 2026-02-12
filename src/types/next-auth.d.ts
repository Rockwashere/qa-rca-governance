import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      fullName: string;
      site: 'UAE' | 'EG' | 'KSA';
      role: 'QA_MEMBER' | 'QA_LEAD' | 'MANAGER' | 'ADMIN';
      isActive: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    fullName: string;
    site: 'UAE' | 'EG' | 'KSA';
    role: 'QA_MEMBER' | 'QA_LEAD' | 'MANAGER' | 'ADMIN';
    isActive: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    fullName: string;
    site: 'UAE' | 'EG' | 'KSA';
    role: 'QA_MEMBER' | 'QA_LEAD' | 'MANAGER' | 'ADMIN';
    isActive: boolean;
  }
}
