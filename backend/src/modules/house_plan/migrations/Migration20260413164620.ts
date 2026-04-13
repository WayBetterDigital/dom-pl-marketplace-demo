import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260413164620 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "house_plan_sketch" ("id" text not null, "house_plan_id" text not null, "url" text not null, "floor" integer not null default '0', "sort_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "house_plan_sketch_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_house_plan_sketch_deleted_at" ON "house_plan_sketch" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "house_plan_sketch" cascade;`);
  }

}
