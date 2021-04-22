import { rootCertificates } from "node:tls";
import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";

@ObjectType()
class Notification {
  @Field()
  name: String;

  @Field()
  desc?: String;

  @Field()
  info?: String;
}
@Resolver()
export class ExportCompleteNotificationResolver {
  @Subscription({
    topics: ({ args }) => args.topic,
    // topics: "TEST",
    filter: ({ payload, args, context }) => {
      console.log("payload", payload, "args", args, "context", context);
      return true;
    },
  })
  newNotification(
    @Arg("topic") topic: string,
    @Ctx() { connection}: MyContext,
    @Root() notificationPayload: Notification
  ): Notification {
    console.log("userid", connection)
    return notificationPayload;
  }
}
