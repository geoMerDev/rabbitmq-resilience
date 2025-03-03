import {Context} from "hono";
import {PaginationDto} from "@/domain/dtos/shared/pagination.dto";
import {OutboxEventRepositoryImpl} from "@/infrastructure/repositories/outboxEvent.repository.impl";
import {OutboxEventDatasourceImpl} from "@/infrastructure/datasources/eventManager";


export class OutboxEventController {
    private readonly outboxEventRepositoryImpl: OutboxEventRepositoryImpl;

    constructor() {
        this.outboxEventRepositoryImpl = new OutboxEventRepositoryImpl(
            new OutboxEventDatasourceImpl()
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
                const outboxEvent = await this.outboxEventRepositoryImpl.getPaginated(paginationDto);
                return c.json(outboxEvent);
            }
        } catch (error) {
            console.error(error);
            c.status(500);
        }
    };


}
