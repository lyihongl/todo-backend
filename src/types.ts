import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { PubSub } from "apollo-server-express";
import { Request, Response } from "express";

export type MyJwt = {
  userId: number;
  iat: number;
  exp: number;
};

export type MyContext = {
  em: EntityManager<IDatabaseDriver<Connection>>;
  req: Request;
  res: Response;
  jwtUserId: MyJwt | null;
  pubsub: PubSub;
};
