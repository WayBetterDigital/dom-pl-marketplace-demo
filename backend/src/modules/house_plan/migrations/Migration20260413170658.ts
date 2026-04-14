import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260413170658 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`update "house_plan_sketch" set "type" = '0' where "type" = 'szkic';`);
    this.addSql(`update "house_plan_sketch" set "type" = '1' where "type" = 'szkic_z_opisami';`);
    this.addSql(`alter table if exists "house_plan_sketch" alter column "type" drop default;`);
    this.addSql(`alter table if exists "house_plan_sketch" alter column "type" type integer using ("type"::integer);`);
    this.addSql(`alter table if exists "house_plan_sketch" alter column "type" set default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "house_plan_sketch" alter column "type" type text using ("type"::text);`);
    this.addSql(`alter table if exists "house_plan_sketch" alter column "type" set default 'szkic';`);
  }

}
