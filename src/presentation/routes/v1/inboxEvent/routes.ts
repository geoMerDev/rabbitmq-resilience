import {Hono} from "hono";
import {InboxEventController} from "./controller";

export class InboxEventRoutes {
    public get routes(): Hono {
        const router = new Hono();
        const controller = new InboxEventController();

        router.post('/pagination', controller.getPaginated);
        router.get('/:uuid', controller.getByUuid);

        return router;
    }
}
