import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_SYMBOLS: Record<string, string> = { MNT: '₮' }

/** 7900, "MNT" → "₮7,900" */
export function formatPrice(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency]
  const number = new Intl.NumberFormat('en-US').format(amount)
  return symbol ? `${symbol}${number}` : `${number} ${currency}`
}
