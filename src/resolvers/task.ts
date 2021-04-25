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
import { LoadStrategy, wrap } from "@mikro-orm/core";
import { Task } from "../entities/Task";
import { User } from "../entities/User";
import { CompletedTask } from "../entities/CompletedTask";
import { MyContext } from "../types";
import { asyncForEach } from "../utils/utils";

@ObjectType()
class TaskResponse {
  @Field()
  id: Number;
  @Field()
  title: String;
  @Field()
  time: Number;
  @Field({ defaultValue: false })
  completed: Boolean;
}

@InputType()
class CreateTaskInput {
  @Field()
  title: string;

  @Field(() => Int)
  time: number;
}

@Resolver()
export class TaskResolver {
  @Query(() => [TaskResponse])
  async getTasks(@Ctx() { em, res, jwtUserId }: MyContext) {
    if (jwtUserId) {
      console.log("ok");
      const qb = em.createQueryBuilder(Task);
      const qb1 = em.createQueryBuilder(CompletedTask);
      // const user = new User();
      // user.id = jwtUserId.userId;
      // console.log(jwtUserId.userId);
      try {
        qb.select("*").where({
          $and: [
            {
              userId: jwtUserId.userId,
            },
            {
              enabled: true,
            },
          ],
        });
        const tasks: Task[] = await qb.execute();
        // let completedTasks: CompletedTask[] = [];
        let completedTasks: { [id: number]: CompletedTask[] } = {};

        const now = new Date(Date.now());
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        await asyncForEach(tasks, async (task) => {
          qb1.select("*").where({
            $and: [{ taskId: task.id }, { timeOfCompletion: { $gte: today } }],
          });
          console.log("a");

          const compTasksRes: CompletedTask[] | null = await qb1.execute();
          if (compTasksRes) {
            compTasksRes.forEach((e) => {
              if (!completedTasks[task.id]) {
                completedTasks[task.id] = [];
              }
              completedTasks[task.id].push(e);
            });
          }
          // completedTasks.push(await qb1.execute());
        });
        console.log(tasks);
        console.log(completedTasks);
        const response: TaskResponse[] = tasks.map((e) => {
          return {
            id: e.id,
            title: e.title,
            time: e.time,
            completed: e.id in completedTasks,
          };
        });
        return response;

        // console.log(tasks);
        // qb.select(["*"])
        //   .where({
        //     $and: [{ timeOfCompletion: { $gte: "2021-04-20" } }],
        //   })
        //   .join("t.taskId", "Task");
        // console.log(qb.getQuery());
        // const res = await qb.execute();
        // console.log(res);
        // em.createQueryBuilder()
        // const taskList = await em.find(Task, {
        //   $and: [
        //     {
        //       userId: jwtUserId.userId,
        //     },
        //   ],
        // });
        // const taskListCompletions: Task[] = await em.find(
        //   Task,
        //   {
        //     $and: [
        //       {
        //         userId: jwtUserId.userId,
        //       },
        //       {
        //         CompletedTasks: {
        //           timeOfCompletion: {
        //             $gte: "2021-04-22T23:38:26.000Z",
        //           },
        //         },
        //       },
        //     ],
        //   },

        //   {
        //     populate: {
        //       CompletedTasks: {},
        //     },
        //     strategy: LoadStrategy.SELECT_IN,
        //   }
        // );

        // console.log(taskList);
        // console.log(taskListCompletions);
        // taskList.forEach((e) => {
        //   console.log(e.CompletedTasks);
        // });
        // return taskListCompletions;
        // return [];
      } catch (err) {
        console.log(err);
        return [];
      }
      // try {
      //   // const taskListResponse = await Promise.all(
      //   taskList.forEach((task) => {
      //     const now = new Date(Date.now());
      //     const today = new Date(
      //       now.getFullYear(),
      //       now.getMonth(),
      //       now.getDate()
      //     );
      //     console.log(today.toLocaleString());
      //     let test: CompletedTask[] = [];
      //     em.find(CompletedTask, {
      //       $and: [
      //         { taskId: task },
      //         { timeOfCompletion: { $gt: "2021-04-18" } },
      //       ],
      //     })
      //       .then((e) => (test = e))
      //       .catch((e) => console.log("error", e));
      //     // return {
      //     //   id: task.id,
      //     //   title: task.title,
      //     //   description: task.description,
      //     //   time: task.time,
      //     //   completed: false,
      //     // };
      //   });
      //   // );
      //   // return taskListResponse;
      // } catch (err) {
      //   return {};
      // }
    }
  }
  @Query(() => String)
  async testNotif(
    @Ctx() { jwtUserId }: MyContext,
    @PubSub() pubsub: PubSubEngine
  ) {
    console.log("pre publish", jwtUserId);
    if (jwtUserId?.userId) {
      console.log("publishing");
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
        userId: jwtUserId.userId,
        time: taskInfo.time,
        enabled: true,
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
      const now = new Date(Date.now());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const existing = await em.findOne(CompletedTask, {
        $and: [{ taskId: taskid }, { timeOfCompletion: { $gte: today } }],
      });
      if (!existing) {
        const completedTask = em.create(CompletedTask, {
          timeOfCompletion: Date.now(),
          taskId: taskid,
        });
        await em.persistAndFlush(completedTask);
      }
    }
    return "ok";
  }
  @Mutation(() => String)
  async disableTask(
    @Arg("taskid", () => Int) taskid: number,
    @Ctx() { em, jwtUserId }: MyContext
  ) {
    if (jwtUserId) {
      const task = await em.findOne(Task, { id: taskid });
      if (task) {
        task.enabled = false;
      }
      await em.flush();
    }
    return "ok";
  }
}
