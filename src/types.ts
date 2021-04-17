import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { PubSub } from "apollo-server-express";
import { Request, Response } from "express";

export type MyContext = {
  em: EntityManager<IDatabaseDriver<Connection>>;
  req: Request;
  res: Response;
  jwtUserId: String | null;
  pubsub: PubSub;
};
