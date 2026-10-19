import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email.").max(120);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email,
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});
