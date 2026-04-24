import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260420160636 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor" add column if not exists "password_hash" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor" drop column if exists "password_hash";`);
  }

}
