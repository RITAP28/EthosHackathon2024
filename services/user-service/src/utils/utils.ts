import { z } from "zod";

export interface Register {
  name: string;
  email: string;
  password: string;
};

export interface Login {
    email: string;
    password: string;
};

export const UserRegisterSchema = z.object({
  username: z.string().min(5, "Username shall be at least 5 characters long."),
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