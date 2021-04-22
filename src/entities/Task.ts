import {
  Cascade,
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { ObjectType } from "type-graphql";
import { CompletedTask } from "./CompletedTask";
import { User } from "./User";

@ObjectType()
@Entity()
export class Task {
  @PrimaryKey()
  id!: number;

  @Property({ columnType: "varchar(255)" })
  title!: string;

  @Property({ columnType: "varchar(511)" })
  description!: string;

  @Property()
  time!: number;

  @ManyToOne(() => User, { onDelete: "cascade" })
  userId!: User;

  @OneToMany(() => CompletedTask, (task) => task.taskId, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
    strategy: LoadStrategy.JOINED
  })
  CompletedTasks = new Collection<CompletedTask>(this);
}
