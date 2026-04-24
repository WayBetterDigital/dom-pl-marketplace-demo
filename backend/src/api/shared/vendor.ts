import * as crypto from "crypto"
import * as jwt from "jsonwebtoken"

export const VENDOR_GRAPH_FIELDS = [
  "id", "company_name", "first_name", "last_name", "email",
  "revenue", "average_rating", "created_at",
  "house_plans.id",
] as const

export type VendorAuthResponse = {
  id: string
  email: string
  first_name: string
  last_name: string
  company_name: string
}

export function toVendorWithCount(raw: any): any {
  const { house_plans, ...rest } = raw
  return { ...rest, house_plans_count: house_plans?.length ?? 0 }
}

export function toVendorAuthResponse(vendor: any): VendorAuthResponse {
  return {
    id: vendor.id,
    email: vendor.email,
    first_name: vendor.first_name,
    last_name: vendor.last_name,
    company_name: vendor.company_name,
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  return hash === storedHash
}

export function signVendorToken(vendor: VendorAuthResponse): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET environment variable is not set")
  return jwt.sign(
    {
      vendor_id: vendor.id,
      email: vendor.email,
      first_name: vendor.first_name,
      last_name: vendor.last_name,
      company_name: vendor.company_name,
      type: "vendor",
    },
    secret,
    { expiresIn: "7d" }
  )
}
