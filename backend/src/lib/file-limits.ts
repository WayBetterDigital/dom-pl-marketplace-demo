/**
* File size limits used across backend (middlewares, multer) and admin widgets.
* Change here → takes effect everywhere.
*/

export const MB = 1024 * 1024

export const FILE_LIMITS = {
  /** Downloadable plan files (PDF, DWG, ZIP, …) */
  planFiles: 35 * MB,
  /** Gallery images */
  gallery: 10 * MB,
  /** Floor-plan sketches */
  sketches: 10 * MB,
} as const

/**
 * Body-parser string limits for Base64 JSON routes.
 * Base64 adds ~33% overhead, so the body limit must be larger than the file limit.
 */
export const BODY_LIMITS = {
  gallery: "15mb",
  sketches: "15mb",
} as const
