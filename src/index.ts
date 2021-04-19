import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { jwt_secret, __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer, PubSub } from "apollo-server-express";

import { buildSchema } from "type-graphql";
import { execute, graphql, subscribe } from "graphql";
import { UserResolver } from "./resolvers/user";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { ExportCompleteNotificationResolver } from "./resolvers/notification";
import { createServer } from "http";
import { TaskResolver } from "./resolvers/task";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();
  const app = express();
  const pubsub = new PubSub();
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(cookieParser());
  // app.use("/sub");

  const graphqlSchema = await buildSchema({
    resolvers: [UserResolver, ExportCompleteNotificationResolver, TaskResolver],
    validate: false,
  });

  const apolloServer = new ApolloServer({
    subscriptions: {
      path: "/sub",
    },
    schema: graphqlSchema,
    context: ({ req, res }) => ({
      em: orm.em,
      req,
      res,
      jwtUserId: req.cookies.jwt
        ? jwt.verify(req.cookies.jwt, jwt_secret)
        : null,
      pubsub,
    }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  const server = createServer(app);
  server.listen(4000, () => {
    new SubscriptionServer(
      {
        execute,
        subscribe,
        schema: graphqlSchema,
      },
      {
        server: server,
        path: "/sub",
      }
    );
  });

  // app.listen(4000, () => {
  //   new SubscriptionServer(
  //     {
  //       schema: await buildSchema({
  //         resolvers: [ExportCompleteNotificationResolver],
  //         validate: false,
  //       }),
  //     },
  //     {
  //       server: app,
  //       path: "/subscriptions",
  //     }
  //   );
  // });
};

main();
