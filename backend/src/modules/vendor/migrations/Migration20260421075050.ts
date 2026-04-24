import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260421075050 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor" drop constraint if exists "vendor_company_name_unique";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vendor_company_name_unique" ON "vendor" ("company_name") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_vendor_company_name_unique";`);
  }

}
