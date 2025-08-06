import {EventProcessLogDto, InboxEventDto, RabbitMQMessageDto} from "@/domain/dtos/eventManager";
import {EventException} from "@/infrastructure/eventManager/eventException";
import {RabbitMQ} from "@/infrastructure/eventManager/rabbitmq";
import {InboxEventDatasourceImpl} from "@/infrastructure/datasources/eventManager";
import {EventProcessLogDatasourceImpl} from "@/infrastructure/datasources/eventManager/eventProcessLog.datasource.impl";
import {RabbitMQResilienceSocketManager} from "@/infrastructure/socket/rabbitMQResilienceSocketManager";
import signature from "@/infrastructure/socket/signatures";
import {EventResilienceHandlerConfig} from "@/domain/interfaces/eventResilienceHandlerConfig";
import { Logs } from '@/infrastructure/utils/logs';
import { EmailConfig } from "../email/email";

type EventProcessFunction<T> = (event: RabbitMQMessageDto) => Promise<T>;

export enum EventStatus {
    IMMEDIATE_RETRY = 'IMMEDIATE_RETRY',
    SEND_TO_RETRY_QUEUE = 'SEND_TO_RETRY_QUEUE',
    SEND_TO_DEAD_LETTER_QUEUE = 'SEND_TO_DEAD_LETTER_QUEUE',
    PROCESSING_SUCCESS = 'PROCESSING_SUCCESS',
    TOTAL_PROCESSING_SUCCESS = 'TOTAL_PROCESSING_SUCCESS',
    DISCARD_MESSAGE = 'DISCARD_MESSAGE'
}

interface ProcessWithName<T> {
    processFunction: EventProcessFunction<T>;
    processName: string;
}

/**
 * Class to handle event processing with resilience, including retries and error handling.
 */
export class EventResilienceHandler {
    private readonly immediateRetryAttempts: number;
    private readonly delayedRetryAttempts: number;
    private readonly delayInMs: number;
    private readonly devMode: boolean;

    /**
     * Constructor to initialize the EventResilienceHandler.
     * @param immediateRetryAttempts - Number of immediate retry attempts.
     * @param delayedRetryAttempts - Number of delayed retry attempts.
     * @param delayInMs - Delay in milliseconds between retries.
     */
    constructor(config: EventResilienceHandlerConfig = {
                    immediateRetryAttempts: 5,
                    delayedRetryAttempts: 3,
                    delayInMs: 1000,
                    devMode: false,
                }
    ) {
        this.immediateRetryAttempts = config.immediateRetryAttempts;
        this.delayedRetryAttempts = config.delayedRetryAttempts;
        this.delayInMs = config.delayInMs;
        this.devMode = config.devMode ?? false;
        if(this.devMode){
            this.immediateRetryAttempts = 1;
            this.delayedRetryAttempts = 0;
        }
    }

    /**
     * Executes the provided processes with resilience, handling retries and errors.
     * @param event - The RabbitMQ message event.
     * @param processes - Array of processes to execute.
     */
    async execute<T>(
        event: RabbitMQMessageDto,
        processes: ProcessWithName<T>[],
    ): Promise<void> {
        const redeliveryCount = this.getRedeliveryCount(event);
        const eventErrors: EventException[] = [];

        for (const {processFunction, processName} of processes) {
            if (await this.isEventProcessed(event, processName)) continue;

            const processError = await this.processWithImmediateRetries(event, processFunction, processName);
            if (processError) eventErrors.push(processError);
        }

        if (eventErrors.length > 0) {
            redeliveryCount < this.delayedRetryAttempts
                ? await this.publishToRetryQueue(event, redeliveryCount + 1)
                : await this.publishToDeadLetterQueue(event, eventErrors);
        } else {
            if (RabbitMQResilienceSocketManager.getSocket()) {
                RabbitMQResilienceSocketManager.emit(signature.TOTAL_PROCESSING_SUCCESS.abbr,
                    {
                        message: `Event ${event.properties.messageId} - ${EventStatus.TOTAL_PROCESSING_SUCCESS}`,
                        eventUuid: event.properties.messageId,
                        status: EventStatus.TOTAL_PROCESSING_SUCCESS,
                        type: event.properties.type,
                    }
                );
            }
            Logs.info(`RabbitMQResilience: Event ${event.properties.messageId} - ${EventStatus.TOTAL_PROCESSING_SUCCESS}`);
            Logs.info('\n');
        }
    }

    /**
     * Checks if the event has already been processed.
     * @param event - The RabbitMQ message event.
     * @param processName - The name of the process.
     * @returns A promise that resolves to a boolean indicating if the event has been processed.
     */
    private async isEventProcessed(event: RabbitMQMessageDto, processName: string): Promise<boolean> {
        return new InboxEventDatasourceImpl().processSuccessByUuidAndProcessName(
            event.properties.messageId, processName
        );
    }

    /**
     * Processes the event with immediate retries.
     * @param event - The RabbitMQ message event.
     * @param processFunction - The function to process the event.
     * @param processName - The name of the process.
     * @returns A promise that resolves to a CustomException or null.
     */
    private async processWithImmediateRetries<T>(
        event: RabbitMQMessageDto,
        processFunction: EventProcessFunction<T>,
        processName: string
    ): Promise<EventException | null> {
        for (let attempt = 1; attempt <= this.immediateRetryAttempts; attempt++) {
            this.logEventStatus(event.properties.messageId, event.properties.type, attempt, EventStatus.IMMEDIATE_RETRY, processName);
            try {
                await this.processEvent(event, processFunction, processName);
                this.logEventStatus(event.properties.messageId,event.properties.type, attempt, EventStatus.PROCESSING_SUCCESS, processName);
                return null;
            } catch (err) {
                const processError = this.handleProcessError(err, attempt, processName);
                if (attempt < this.immediateRetryAttempts) await this.delay(this.delayInMs);
                else return processError;
            }
        }
        return null;
    }

    /**
     * Processes the event.
     * @param event - The RabbitMQ message event.
     * @param processFunction - The function to process the event.
     * @param processName - The name of the process.
     */
    private async processEvent<T>(
        event: RabbitMQMessageDto,
        processFunction: EventProcessFunction<T>,
        processName: string
    ): Promise<void> {
        const startTime = Date.now();
        await processFunction(event);
        const duration = Date.now() - startTime;
        await this.saveToInbox(event, processName, duration);
    }

    /**
     * Handles the process error.
     * @param err - The error object.
     * @param attempt - The attempt number.
     * @param processName - The name of the process.
     * @returns A CustomException object.
     */
    private handleProcessError(err: unknown, attempt: number, processName: string): EventException {
        if (err instanceof EventException) {
            err.additionalData = {attempt, processName};
            return err;
        } else {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return new EventException(errorMessage, 'ProcessingError', {attempt, processName});
        }
    }

    /**
     * Delays the execution for a specified time.
     * @param ms - The delay time in milliseconds.
     * @returns A promise that resolves after the delay.
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gets the redelivery count from the event headers.
     * @param event - The RabbitMQ message event.
     * @returns The redelivery count.
     */
    private getRedeliveryCount(event: RabbitMQMessageDto): number {
        return event.properties.headers?.redelivery_count ?? 0;
    }

    /**
     * Saves the event to the inbox.
     * @param event - The RabbitMQ message event.
     * @param processName - The name of the process.
     * @param duration - The duration of the process.
     */
    private async saveToInbox(event: RabbitMQMessageDto, processName: string, duration: number): Promise<void> {
        try {
            const [errors, inboxEventDto] = InboxEventDto.create({
                uuid: event.properties.messageId,
                type: event.properties.type,
                headers: event.properties.headers ?? {},
                properties: event.properties,
                payload: JSON.parse(event.content.toString()),
            });
            if (errors.length > 0 || !inboxEventDto) throw new Error('Error creating InboxEventDto');

            const inboxEventEntity = await new InboxEventDatasourceImpl().createInboxEvent(inboxEventDto);
            if (inboxEventEntity) {
                const [logErrors, eventProcessLogDto] = EventProcessLogDto.create({
                    eventId: inboxEventEntity.id,
                    processName: processName,
                    duration: duration,
                });
                if (logErrors.length > 0 || !eventProcessLogDto) throw new Error('Error creating EventProcessLogDto');
                await new EventProcessLogDatasourceImpl().createEventProcessLog(eventProcessLogDto);
            }
        } catch (error) {
            console.error(`Error saving event ${event.properties.messageId} to inbox for process ${processName}:`, error);
        }
    }

    /**
     * Publishes the event to the retry queue.
     * @param event - The RabbitMQ message event.
     * @param redeliveryCount - The redelivery count.
     */
    private async publishToRetryQueue(event: RabbitMQMessageDto, redeliveryCount: number): Promise<void> {
        await RabbitMQ.publishToRetryQueue(event, redeliveryCount);
        this.logEventStatus(event.properties.messageId, event.properties.type, redeliveryCount, EventStatus.SEND_TO_RETRY_QUEUE);
    }

    /**
     * Publishes the event to the dead letter queue.
     * @param event - The RabbitMQ message event.
     * @param errors - Array of CustomException errors.
     */
    private async publishToDeadLetterQueue(event: RabbitMQMessageDto, errors: EventException[]): Promise<void> {
        await RabbitMQ.publishToDeadLetterQueue(event, errors);
        this.logEventStatus(event.properties.messageId, event.properties.type, this.delayedRetryAttempts, EventStatus.SEND_TO_DEAD_LETTER_QUEUE);
        await EmailConfig.sendMessage(event, errors);
    }

    /**
     * Logs the event status.
     * @param eventId - The event ID.
     * @param attempt - The attempt number.
     * @param status - The event status.
     * @param processName - The name of the process (optional).
     */
    private logEventStatus(eventId: string | undefined, type: string | undefined , attempt: number, status: EventStatus, processName?: string): void {
        if(RabbitMQResilienceSocketManager.getSocket()) {
            // Message structure: event uuid - status - attempt - process
            let message = `Event ${eventId} - Type ${type} -  ${status} - Attempt ${attempt}`;
            if (processName) message += ` - Process: ${processName}`;

            // Add clear separators for different statuses
            if (status === EventStatus.SEND_TO_RETRY_QUEUE) {
                RabbitMQResilienceSocketManager.emit(signature.SEND_TO_RETRY_QUEUE.abbr,
                    {
                        message: `Event ${eventId} - Type ${type} - ${status} - Attempt ${attempt} - Process: ${processName}`,
                        eventUuid: eventId,
                        status: status,
                        attempt: attempt,
                        type:type,
                    });
                Logs.info('--- Sent to Retry Queue ---\n');
                Logs.info("RabbitMQResilience: ",message);
                Logs.info('\n');
            }
            if (status === EventStatus.SEND_TO_DEAD_LETTER_QUEUE) {
                RabbitMQResilienceSocketManager.emit(signature.SEND_TO_DEAD_LETTER_QUEUE.abbr,
                    {
                        message: `Event ${eventId} - Type ${type} - ${status} - Attempt ${attempt} - Process: ${processName}`,
                        eventUuid: eventId,
                        status: status,
                        attempt: attempt,
                        type:type,
                    });
                Logs.info('*** Sent to Dead Letter Queue ***\n\n');
                Logs.info("RabbitMQResilience: ",message);
                Logs.info('\n');
            }

            if (status === EventStatus.IMMEDIATE_RETRY) {
                RabbitMQResilienceSocketManager.emit(signature.IMMEDIATE_RETRY_ATTEMPTS.abbr,
                    {
                        message: `Event ${eventId} - Type ${type} - ${status} - Attempt ${attempt} - Process: ${processName}`,
                        eventUuid: eventId,
                        status: status,
                        attempt: attempt,
                        processName: processName,
                        type:type,
                    });
                Logs.info("RabbitMQResilience: ",message);
            }
            if (status === EventStatus.PROCESSING_SUCCESS) {
                RabbitMQResilienceSocketManager.emit(signature.PROCESSING_SUCCESS.abbr,
                    {
                        message: `Event ${eventId} - Type ${type} - ${status} - Attempt ${attempt} - Process: ${processName}`,
                        eventUuid: eventId,
                        status: status,
                        attempt: attempt,
                        processName: processName,
                        type:type,
                    });
                Logs.info("RabbitMQResilience: ",message);
            }
        }
    }
}
