import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    openid: string;
    role: number;
  };
}
