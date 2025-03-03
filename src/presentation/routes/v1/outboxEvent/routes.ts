import {Hono} from "hono";
import {OutboxEventController} from "./controller";

export class OutboxEventRoutes {
    public get routes(): Hono {
        const router = new Hono();
        const controller = new OutboxEventController();

        router.post('/pagination', controller.getPaginated);

        return router;
    }
}
