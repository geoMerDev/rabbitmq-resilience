import {Hono} from "hono";
import {EventManagerController} from "./controller";

export class EventManagerRoutes {
    public get routes(): Hono {
        const router = new Hono();
        const controller = new EventManagerController();
        router.get('/info', controller.getRabbitMQInfo);

        return router;
    }
}
