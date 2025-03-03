import {Context} from "hono";
import {InboxEventRepositoryImpl} from "@/infrastructure/repositories/inboxEvent.repository.impl";
import {InboxEventDatasourceImpl} from "@/infrastructure/datasources/eventManager";
import {PaginationDto} from "@/domain/dtos/shared/pagination.dto";


export class InboxEventController {
    private readonly inboxEventRepositoryImpl: InboxEventRepositoryImpl;

    constructor() {
        this.inboxEventRepositoryImpl = new InboxEventRepositoryImpl(
            new InboxEventDatasourceImpl()
        );
    }

    private async parseRequestBody(context: Context) {
        try {
            return await context.req.json();
        } catch {
            context.status(400);
            context.json({message: "Invalid JSON input"});
            return null;
        }
    }


    public getPaginated = async (c: Context) => {
        try {
            const {itemsPerPage, page, sortingKey, sortingOrder, search} = await this.parseRequestBody(c);

            const [error, paginationDto] = PaginationDto.create({
                itemsPerPage: parseInt(itemsPerPage, 10),
                page: parseInt(page, 10),
                sorting: sortingKey && sortingOrder ? {key: sortingKey, order: sortingOrder} : undefined,
                search: search
            });

            if (error) {
                return c.json({error}, 400);
            }

            if (paginationDto) {
                const inboxEvent = await this.inboxEventRepositoryImpl.getPaginated(paginationDto);
                return c.json(inboxEvent);
            }
        } catch (error) {
            console.error(error);
            c.status(500);
        }
    };

    public getByUuid = async (c: Context) => {
        try {
            const { uuid } = c.req.param();
            const inboxEvent = await this.inboxEventRepositoryImpl.getByUuid(uuid);
            return c.json(inboxEvent);
        } catch (error) {
            console.error(error);
            c.status(500);
            return c.json({error});
        }
    }


}
