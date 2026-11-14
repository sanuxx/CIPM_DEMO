import { z } from 'zod'
import { PHONE_RE, normalisePhone } from './utils'

export const passwordRule = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number')

export const phoneRule = z
  .string()
  .min(1, 'Enter your phone number')
  .refine((v) => PHONE_RE.test(normalisePhone(v)), 'Use a Sri Lankan mobile number, e.g. 077 123 4567 or +94 77 123 4567')

export const registerSchema = z
  .object({
    name: z.string().trim().min(3, 'Enter your full name').max(80),
    email: z.string().min(1, 'Enter your email').email('Enter a valid email address'),
    phone: phoneRule,
    password: passwordRule,
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })

export const changePasswordSchema = z
  .object({ current: z.string().min(1, 'Enter your current password'), next: passwordRule, confirm: z.string().min(1, 'Confirm the new password') })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
