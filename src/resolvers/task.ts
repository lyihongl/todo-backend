import {
  Arg,
  Args,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  PubSub,
  PubSubEngine,
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
  @Field()
  time: Number;
  @Field({ defaultValue: false })
  completed: Boolean;
}

@InputType()
class CreateTaskInput {
  @Field()
  title: string;
  @Field()
  desc: string;
  @Field(() => Int)
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
      let taskList: Task[];
      try {
        taskList = await em.find(Task, {
          userId: jwtUserId.userId,
        });
        const taskListResponse = taskList.map((task) => {
          const now = new Date(Date.now());
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          console.log(today.toLocaleString());
          let test: CompletedTask[] = [];
          try {
            em.find(CompletedTask, {
              $and: [
                { taskId: task },
                { timeOfCompletion: { $gt: "2021-04-18" } },
              ],
            })
              .then((e) => {
                test = e;
              })
              .catch(() => console.log("error"));
          } catch (e) {
            console.log(e);
          }
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            time: task.time,
            completed: test.length > 0,
          };
        });
        return taskListResponse;
      } catch (err) {
        console.log(err);
        return {};
      }
    }
  }
  @Query(() => String)
  async testNotif(
    @Ctx() { jwtUserId }: MyContext,
    @PubSub() pubsub: PubSubEngine
  ) {
    if (jwtUserId?.userId) {
      await pubsub.publish(`${jwtUserId.userId}`, {
        name: `${jwtUserId.userId}`,
      });
    }
    return "ok";
  }
  @Mutation(() => String)
  async createTask(
    @Arg("taskInfo") taskInfo: CreateTaskInput,
    @Ctx() { em, res, jwtUserId }: MyContext
  ) {
    console.log("create task", taskInfo);
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
  async deleteTask() {
    return "ok";
  }
  @Mutation(() => String)
  async completeTask(
    @Arg("taskid", () => Int) taskid: number,
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
