import { z } from "zod";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createLogger } from "../../../shared/logger";

dotenv.config();
export const logger = createLogger("user-service");

export interface Register {
  name: string;
  email: string;
  password: string;
};

export interface Login {
    email: string;
    password: string;
};

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    isAuthenticated: boolean;
};

export const UserRegisterSchema = z.object({
  name: z.string().min(5, "Username shall be at least 5 characters long."),
  email: z.string().email("Invalid Email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one digit")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
});

export const UserLoginSchema = z.object({
    email: z.string().email("Invalid Email"),
    password: z.string()
});

export const generateJWT = (userId: number, name: string, email: string, secret: string, expirationTime: number) => {
  return jwt.sign(
    {
      id: userId,
      name: name,
      email: email
    },
    secret,
    {
      expiresIn: expirationTime
    }
  );
};

export const Port = process.env.PORT;

export const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
export const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;

export const accessTokenExpiry = Number(process.env.ACCESS_TOKEN_EXPIRY);
export const refreshTokenExpiry = Number(process.env.REFRESH_TOKEN_EXPIRY);
