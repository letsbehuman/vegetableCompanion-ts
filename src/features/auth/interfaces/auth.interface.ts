import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
// import { IUserDocument } from '@user/interfaces/user.interface';

//creating a new propety inside req from express
declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthPayload;
    }
  }
}

export interface AuthPayload {
  userId: string;
  uId: string;
  email: string;
  username: string;
  iat?: number;
}

export interface IAuthDocument extends Document {
  _id: string | ObjectId;
  uId: string;
  username: string;
  email: string;
  password?: string; // it is optional because we dont want to send it back to the client
  createdAt: Date;
  passwordResetToken?: string;
  passwordResetExpires?: number | string;
  comparePassword(password: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
}

export interface ISignUpData {
  _id: ObjectId;
  uId: string;
  email: string;
  username: string;
  password: string;
}

export interface IAuthJob {
  value?: string | IAuthDocument;
}
