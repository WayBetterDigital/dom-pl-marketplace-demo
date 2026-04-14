import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260410174043 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "plan_family" drop constraint if exists "plan_family_vendor_id_name_unique";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_plan_family_vendor_id_name_unique" ON "plan_family" ("vendor_id", "name") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "house_plan" drop column if exists "img";`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_plan_family_vendor_id_name_unique";`);

    this.addSql(`alter table if exists "house_plan" add column if not exists "img" text null;`);
  }

}
