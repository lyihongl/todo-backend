import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { jwt_secret, __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";

import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { UserResolver } from "./resolvers/user";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();
  const app = express();
;

  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(cookieParser());

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      em: orm.em,
      req,
      res,
      jwtUserId: req.cookies.jwt ? jwt.verify(req.cookies.jwt, jwt_secret) : null,
    }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {});
};

main();
