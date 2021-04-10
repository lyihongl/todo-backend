import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "./User";

@Entity()
export class Task {
  @PrimaryKey()
  id!: number;

  @Property({ columnType: "varchar(255)" })
  title!: string;

  @Property({ columnType: "varchar(511)" })
  description!: string;

  @ManyToOne()
  userId!: User;
}
