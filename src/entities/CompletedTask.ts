import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Task } from "./Task";

@Entity()
export class CompletedTask {
  @PrimaryKey()
  id!: number;

  @Property({ type: "date" })
  timeOfCompletion!: Date;

  @ManyToOne()
  taskId!: Task;
}
