import {Hono} from "hono";
import {V1Routes} from "@/presentation/routes/v1/routes";

export class RabbitMQResilienceRoutes {
    public get routes(): Hono {
        const routes = new Hono();
        routes.route("/api/v1", new V1Routes().routes);
        return routes;
    }
}
