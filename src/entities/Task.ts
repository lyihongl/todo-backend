import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { ObjectType } from "type-graphql";
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
}
