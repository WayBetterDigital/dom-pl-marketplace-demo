import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260413165918 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "house_plan_sketch" add column if not exists "type" text not null default 'szkic';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "house_plan_sketch" drop column if exists "type";`);
  }

}
