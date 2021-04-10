import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
  @Field(() => Int)
  @PrimaryKey()
  id!: number;

  @Field()
  @Property({unique: true})
  username!: string;

  @Property()
  password!: string;

  @Field()
  @Property({unique: true})
  email!: string;
}
