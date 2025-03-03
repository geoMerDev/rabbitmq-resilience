import {EventProcessLogDto} from "@/domain/dtos/eventManager";
import {EventProcessLogEntity} from "@/domain/entities/eventManager";

export abstract class EventProcessLogDatasource {
    abstract createEventProcessLog(eventProcessLogDto: EventProcessLogDto): Promise<EventProcessLogEntity>;
    abstract getEventProcessLogById(id: number): Promise<EventProcessLogEntity|null>;
    abstract getEventProcessLogByEventId(eventId: number): Promise<EventProcessLogEntity[]>;
}