import {InboxEventDatasource} from "@/domain/datasources/eventManager";
import {InboxEventDto} from "@/domain/dtos/eventManager";
import {InboxEventEntity} from "@/domain/entities/eventManager";
import {InboxEventSequelize} from "@/infrastructure/database/models/eventManager/InboxEvent";
import {Op, Order, WhereOptions} from "sequelize";
import {EventProcessLogSequelize} from "@/infrastructure/database/models/eventManager";
import {PaginationDto} from "@/domain/dtos/shared/pagination.dto";
import {InboxEventPaginatedEntity} from "@/domain/entities/eventManager/inboxEventPaginated.entity";
import {InboxEventAndProcessEntity} from "@/domain/entities/eventManager/inboxEventAndProcess.entity";
import {EventProcessLogDatasourceImpl} from "@/infrastructure/datasources/eventManager/eventProcessLog.datasource.impl";

export class InboxEventDatasourceImpl implements InboxEventDatasource {
    private validSortingKeys = ['id', 'type', 'createdAt', 'updatedAt']; // Add valid sorting keys here

    private mapToEntity(inboxEvent: InboxEventSequelize): InboxEventEntity {
        return new InboxEventEntity(
            inboxEvent.id,
            inboxEvent.uuid,
            inboxEvent.type,
            inboxEvent.headers,
            inboxEvent.properties,
            inboxEvent.payload,
            inboxEvent.createdAt,
            inboxEvent.updatedAt,
            inboxEvent.deletedAt
        )
    }

    async createInboxEvent(inboxEventDto: InboxEventDto): Promise<InboxEventEntity> {
        const [inboxEvent] = await InboxEventSequelize.findOrCreate({
            where: {uuid: inboxEventDto.uuid},
            defaults: {
                uuid: inboxEventDto.uuid,
                type: inboxEventDto.type,
                headers: inboxEventDto.headers,
                properties: inboxEventDto.properties,
                payload: inboxEventDto.payload
            }
        });
        return this.mapToEntity(inboxEvent);
    }

    async getByUuid(uuid: string): Promise<InboxEventEntity | null> {
        if (!uuid) {
            throw new Error('UUID parameter is required');
        }
        const inboxEvent = await InboxEventSequelize.findOne({
            where: {
                uuid: uuid
            }
        });
        if (!inboxEvent) {
            return null;
        }
        return this.mapToEntity(inboxEvent);
    }

    async countInboxEvents(): Promise<number> {
        return await InboxEventSequelize.count();
    }

    async countInboxEventsByType(type: string): Promise<number> {
        return await InboxEventSequelize.count({where: {type}});
    }

    async countInboxEventsByDateRange(startDate: Date, endDate: Date): Promise<number> {
        return await InboxEventSequelize.count({
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });
    }

    async countByType(type: string): Promise<number> {
        return await InboxEventSequelize.count({where: {type}});
    }

    async processSuccessByUuidAndProcessName(uuid: string, processName: string): Promise<boolean> {
        if (!uuid) throw new Error('UUID parameter is required');
        if (!processName) throw new Error('ProcessName parameter is required');
        const result = await InboxEventSequelize.findOne({
            where: {uuid},
            include: [{
                model: EventProcessLogSequelize,
                where: {processName},
                required: true
            }]
        });

        return result !== null;
    }


    async getPaginated(paginationDto: PaginationDto): Promise<InboxEventPaginatedEntity> {
        try {
            const {limit, offset} = paginationDto.getPaginationParams();
            const order: Order = paginationDto.sorting && this.validSortingKeys.includes(paginationDto.sorting.key) ? [[paginationDto.sorting.key, paginationDto.sorting.order]] : [];
            let where: WhereOptions = {}
            const search = paginationDto.search?.trim();
            if(search) {
                where = {
                    [Op.or]: [
                        {uuid: {[Op.like]: `%${search}%`}},
                        {type: {[Op.like]: `%${search}%`}},
                    ]
                }
            }

            const inboxEvents = await InboxEventSequelize.findAndCountAll({
                limit: limit,
                offset: offset,
                order: order,
                where: where
            });
            return new InboxEventPaginatedEntity(inboxEvents.count, inboxEvents.rows.map(inboxEvent => this.mapToEntity(inboxEvent)));
        } catch (error) {
            console.error(`Error fetching paginated inbox events:`, error);
            throw error;
        }
    }

    async getByUuidWhitProcess(uuid: string): Promise<InboxEventAndProcessEntity> {
        const inboxEvent = await InboxEventSequelize.findOne({
            where: {uuid},
        });
        if (!inboxEvent) {
            throw new Error('Inbox event not found');
        }
        //get process by event id
        const process = await new EventProcessLogDatasourceImpl().getEventProcessLogByEventId(inboxEvent.id);
        return new InboxEventAndProcessEntity(
            this.mapToEntity(inboxEvent),
            process
        )

    }


}
