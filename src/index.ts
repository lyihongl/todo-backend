import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
// import { CompletedTask } from "./entities/CompletedTask";
// import { Task } from "./entities/Task";
// import { User } from "./entities/User";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
};

main();
