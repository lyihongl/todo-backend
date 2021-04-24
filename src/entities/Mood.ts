import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Mood {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field()
  @Property({ columnType: "varchar(2045)" })
  mood: string;
}
