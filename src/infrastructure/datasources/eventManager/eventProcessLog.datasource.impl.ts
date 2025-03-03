import {EventProcessLogDatasource} from "@/domain/datasources/eventManager";
import {EventProcessLogDto} from "@/domain/dtos/eventManager";
import {EventProcessLogEntity} from "@/domain/entities/eventManager";
import {EventProcessLogSequelize} from "@/infrastructure/database/models/eventManager";

export class EventProcessLogDatasourceImpl implements EventProcessLogDatasource {

    mapToEntity(eventProcessLog: EventProcessLogSequelize): EventProcessLogEntity {
        return new EventProcessLogEntity(
            eventProcessLog.id,
            eventProcessLog.eventId,
            eventProcessLog.processName,
            eventProcessLog.duration,
            eventProcessLog.createdAt,
            eventProcessLog.updatedAt,
            eventProcessLog.deletedAt
        );
    }

    async createEventProcessLog(eventProcessLogDto: EventProcessLogDto): Promise<EventProcessLogEntity> {
        const eventProcessLog = await EventProcessLogSequelize.create({
            eventId: eventProcessLogDto.eventId,
            processName: eventProcessLogDto.processName,
            duration: eventProcessLogDto.duration
        })

        return this.mapToEntity(eventProcessLog);
    }

    async getEventProcessLogById(id: number): Promise<EventProcessLogEntity | null> {

        const eventProcessLog = await EventProcessLogSequelize.findByPk(id)
        if (!eventProcessLog) return null;
        return this.mapToEntity(eventProcessLog);
    }

    async getEventProcessLogByEventId(eventId: number): Promise<EventProcessLogEntity[]> {
        const eventProcessLogs = await EventProcessLogSequelize.findAll({
            where: {
                eventId
            }
        })
        return eventProcessLogs.map(this.mapToEntity);
    }


}