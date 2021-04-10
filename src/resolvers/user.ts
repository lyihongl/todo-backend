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

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
  @Field()
  email: string;
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
  //   @Query(() => [User])
  //   users(@Ctx() { em }: MyContext): Promise<User[]> {
  //     return em.find(User, {});
  //   }
  //   @Query(() => User, { nullable: true })
  //   user(
  //     @Arg("id", () => Int) id: number,
  //     @Ctx() { em }: MyContext
  //   ): Promise<User | null> {
  //     return em.findOne(User, { id });
  //   }
  @Query(() => User, {nullable: true})
  me(
    @Ctx() { req }: MyContext
  ) {
      console.log(req.cookies)
  }

  @Mutation(() => UserResponse)
  async registerUser(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      email: options.email,
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
    @Ctx() { em, res }: MyContext
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
    const token = jwt.sign(
      {
        username: options.username,
      },
      jwt_secret,
      { expiresIn: 60 * 60 * 24 * 30 }
    );

    res.cookie("jwt", token, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      secure: __prod__,
      sameSite: "lax",
      httpOnly: true,
    });

    return {
      user,
    };
  }
}
