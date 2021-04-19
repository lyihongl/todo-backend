import {
  Arg,
  Args,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { wrap } from "@mikro-orm/core";
import { Task } from "../entities/Task";
import { User } from "../entities/User";
import { CompletedTask } from "../entities/CompletedTask";
import { MyContext } from "../types";

@ObjectType()
class TaskResponse {
  @Field()
  id: Number;
  @Field()
  title: String;
  @Field()
  description: String;
}

@InputType()
class CreateTaskInput {
  @Field()
  title: string;
  @Field()
  desc: string;
  @Field()
  time: number;
}

@Resolver()
export class TaskResolver {
  @Query(() => [TaskResponse])
  async getTasks(@Ctx() { em, res, jwtUserId }: MyContext) {
    if (jwtUserId) {
      // const user = new User();
      // user.id = jwtUserId.userId;
      // console.log(jwtUserId.userId);
      let taskList;
      try {
        taskList = await em.find(Task, {
          userId: jwtUserId.userId,
        });
        taskList.forEach(async (task) => {
          const test = await em.find(CompletedTask, {
            $and: [
              { taskId: task },
              { timeOfCompletion: { $gt: "2021-04-18" } },
            ],
          });
          console.log(test);
        });
      } catch (err) {}
      console.log(taskList);
      return taskList;
    }
  }
  @Mutation(() => String)
  async createTask(
    @Arg("taskInfo") taskInfo: CreateTaskInput,
    @Ctx() { em, res, jwtUserId }: MyContext
  ) {
    if (jwtUserId) {
      // const user = new User();
      // user.id = jwtUserId.userId;
      const newTask = em.create(Task, {
        title: taskInfo.title,
        description: taskInfo.desc,
        userId: jwtUserId.userId,
        time: taskInfo.time,
      });

      await em.persistAndFlush(newTask);
    }
    return "ok";
  }
  @Mutation(() => String)
  async completeTask(
    @Arg("taskid") taskid: number,
    @Ctx() { em, jwtUserId }: MyContext
  ) {
    if (jwtUserId) {
      const completedTask = em.create(CompletedTask, {
        timeOfCompletion: Date.now(),
        taskId: taskid,
      });
      await em.persistAndFlush(completedTask);
    }
    return "ok";
  }
}
