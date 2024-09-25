import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(5, 'Username must be at least 5 characters long')
    .max(15, 'Username must not be greater than 15 characters'),
  email: z.string().email('Invalid Email'),
  password: z
    .string()
    .min(8, 'Password must be least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one special character')
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      'Password must contain at least one special character',
    ),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid Email'),
  password: z.string(),
});
