import { Migration } from '@mikro-orm/migrations';

export class Migration20210410050457 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" serial primary key, "username" varchar(255) not null, "password" varchar(255) not null, "email" varchar(255) not null);');

    this.addSql('create table "task" ("id" serial primary key, "title" varchar(255) not null, "description" varchar(511) not null, "user_id_id" int4 not null);');

    this.addSql('create table "completed_task" ("id" serial primary key, "time_of_completion" timestamptz(0) not null, "task_id_id" int4 not null);');

    this.addSql('alter table "task" add constraint "task_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update cascade;');

    this.addSql('alter table "completed_task" add constraint "completed_task_task_id_id_foreign" foreign key ("task_id_id") references "task" ("id") on update cascade;');

    this.addSql('drop table if exists "test" cascade;');
  }

}
