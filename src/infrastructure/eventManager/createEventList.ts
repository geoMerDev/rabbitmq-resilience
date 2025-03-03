import {EventResilienceHandler} from "@/infrastructure/eventManager/eventResilienceHandler";
import {RabbitMQResilienceConfig} from "@/domain/interfaces/rabbitMQResilienceConfig";
import {RabbitMQMessageDto} from "@/domain/dtos/eventManager";

export function createEventList(config: RabbitMQResilienceConfig): Map<string, (rabbitMQMessageDto: RabbitMQMessageDto) => Promise<void>> {
    const customEventHandler = new EventResilienceHandler(config.eventResilienceHandlerConfig);
    const eventList = new Map<string, (rabbitMQMessageDto: RabbitMQMessageDto) => Promise<void>>();

    config.eventsToProcess.forEach(eventConfig => {
        eventList.set(eventConfig.eventType, async (event: RabbitMQMessageDto) => {
            await customEventHandler.execute(event, eventConfig.processes);
        });
    });

    return eventList;
}