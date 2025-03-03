import {RabbitMQMessageDto} from "@/domain/dtos/eventManager";

/**
 * Interface representing the configuration for processing events.
 */
export interface EventProcessConfig {
    /**
     * The type of event to be processed.
     */
    eventType: string;

    /**
     * An array of processes to be executed for the event.
     */
    processes: {
        /**
         * The function to process the event.
         * @param event - The event to be processed.
         * @returns A promise that resolves when the processing is complete.
         */
        processFunction: (event: RabbitMQMessageDto) => Promise<void>;

        /**
         * The name of the process.
         */
        processName: string;
    }[];
}