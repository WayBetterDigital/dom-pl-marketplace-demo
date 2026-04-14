import { Migration } from "@mikro-orm/migrations"

/**
 * Drops B-tree indexes on the product `image.url` column.
 *
 * Medusa admin has a race condition where it sends a base64 data URI as the
 * product thumbnail/image URL before the MinIO upload completes. Base64
 * strings can exceed 8 KB, which PostgreSQL B-tree indexes cannot handle
 * (limit ~8191 bytes), causing a 500 error on every media save.
 *
 * A subscriber (fix-product-base64-images.ts) replaces the stored base64
 * with the real MinIO URL asynchronously after the save succeeds.
 *
 * The dropped indexes are not needed for correctness — they only optimise
 * lookups by URL, which we don't use. The rank+product_id composite is
 * already covered by IDX_product_image_rank_product_id.
 */
export class Migration20260410000000 extends Migration {
  async up(): Promise<void> {
    await this.execute(
      `DROP INDEX IF EXISTS "IDX_product_image_url";`
    )
    await this.execute(
      `DROP INDEX IF EXISTS "IDX_product_image_url_rank_product_id";`
    )
  }

  async down(): Promise<void> {
    await this.execute(
      `CREATE INDEX IF NOT EXISTS "IDX_product_image_url"
       ON public.image USING btree (url)
       WHERE (deleted_at IS NULL);`
    )
    await this.execute(
      `CREATE INDEX IF NOT EXISTS "IDX_product_image_url_rank_product_id"
       ON public.image USING btree (url, rank, product_id)
       WHERE (deleted_at IS NULL);`
    )
  }
}
