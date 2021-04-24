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
import {
  ConnectionContext,
  ConnectionParams,
  ExecutionParams,
  SubscriptionServer,
} from "subscriptions-transport-ws";
import { ExportCompleteNotificationResolver } from "./resolvers/notification";
import { createServer } from "http";
import { TaskResolver } from "./resolvers/task";
import redis from "redis";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
// import { Kafka } from "kafkajs";

const main = async () => {
  const redisClient = redis.createClient();
  redisClient.on("message", (channel, message) => {
    console.log(
      "Message: " + message + " on channel: " + channel + " is arrive!"
    );
  });
  redisClient.subscribe("notification");
  // redisClient.set("key", "value", redis.print)
  // redisClient.get("key", redis.print)
  const orm = await MikroORM.init({ ...mikroConfig, driver: PostgreSqlDriver });
  await orm.getMigrator().up();
  const app = express();
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
    context: ({ req, res, connection }) => ({
      em: orm.em,
      req,
      res,
      connection,
      jwtUserId: req.cookies.jwt
        ? jwt.verify(req.cookies.jwt, jwt_secret)
        : null,
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
        onConnect: (connectionParams: Object, webSocket: WebSocket) => {
          console.log("connected", connectionParams);
          // return { test: connectionParams};
        },
      },
      {
        server: server,
        path: "/sub",
      }
    );
  });
  // const kafkaClient = new Kafka({
  //   clientId: "test",
  //   brokers: ["localhost:29092"],
  // });
  // const admin = kafkaClient.admin()
  // admin.connect()
  // console.log(await admin.listTopics())
  // admin.createTopics({
  //   validateOnly: false,
  //   waitForLeaders: true,
  //   timeout: 2000,
  //   topics: [
  //     {
  //       topic: 'test',
  //       numPartitions: 1,
  //       replicationFactor: 1
  //     }
  //   ]
  // })
  // admin.disconnect()

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
