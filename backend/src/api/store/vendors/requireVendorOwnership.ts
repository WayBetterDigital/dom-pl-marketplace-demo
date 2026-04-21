import * as jwt from "jsonwebtoken"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { NextFunction } from "express"

export function requireVendorOwnership(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Brak autoryzacji" })
  }

  const token = authHeader.slice(7)
  const secret = process.env.JWT_SECRET

  if (!secret) {
    return res.status(500).json({ message: "Błąd konfiguracji serwera" })
  }

  try {
    const payload = jwt.verify(token, secret) as any

    if (payload.type !== "vendor") {
      return res.status(401).json({ message: "Nieprawidłowy token" })
    }

    if (payload.vendor_id !== req.params.id) {
      return res.status(403).json({ message: "Brak dostępu do tego konta" })
    }

    next()
  } catch {
    return res.status(401).json({ message: "Token nieważny lub wygasły" })
  }
}
