import {Hono} from "hono";
import {InboxEventRoutes} from "@/presentation/routes/v1/inboxEvent/routes";
import {OutboxEventRoutes} from "@/presentation/routes/v1/outboxEvent/routes";
import {EventManagerRoutes} from "@/presentation/routes/v1/eventManager/routes";


export class V1Routes {
    public get routes(): Hono {
        const routes = new Hono();

        routes.route("/inbox-event", new InboxEventRoutes().routes);
        routes.route("/outbox-event", new OutboxEventRoutes().routes);
        routes.route("/rabbitmq", new EventManagerRoutes().routes);

        return routes;
    }
}
