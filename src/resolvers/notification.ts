import { rootCertificates } from "node:tls";
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
  })
  newNotification(
    @Arg("topic") topic: string,
    @Root() notificationPayload: Notification
  ): Notification {
    return notificationPayload;
  }
}
