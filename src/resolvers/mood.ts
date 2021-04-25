import { Mood } from "src/entities/Mood";
import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  emitSchemaDefinitionFile,
  Mutation,
  Resolver,
} from "type-graphql";

@Resolver()
export class MoodResolver {
  @Mutation(() => String)
  async addMood(
    @Arg("mood") mood: String,
    @Ctx() { em, jwtUserId }: MyContext
  ) {
    if (jwtUserId) {
      const newMood = em.create(Mood, {
        mood,
      });
      await em.persistAndFlush(newMood);
    }
  }
}
