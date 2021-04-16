import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { MyContext } from "src/types";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

import { User } from "../entities/User";
import { jwt_secret, __prod__ } from "../constants";
import { emitWarning } from "node:process";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  me(@Ctx() { jwtUserId }: MyContext) {
    console.log(jwtUserId);
  }

  @Mutation(() => UserResponse)
  async registerUser(
    @Arg("options") options: UsernamePasswordInput,
    @Arg("email") email: String,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      email: email,
    });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      if (err.constraint === "user_username_unique") {
        return {
          errors: [
            {
              field: "username",
              message: err.detail,
            },
          ],
        };
      }
    }
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, res, jwtUserId }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "user does not exist",
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }
    if (jwtUserId) {
      console.log(jwtUserId);
    }
    const token = jwt.sign(
      {
        userId: user.id,
      },
      jwt_secret,
      { expiresIn: 60 * 60 * 24 * 30 }
    );

    res.cookie("jwt", token, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      secure: __prod__,
      sameSite: "lax",
      httpOnly: true,
      domain: "localhost",
      path: "/",
    });

    return {
      user,
    };
  }
}
