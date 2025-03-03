/**
 * Interface representing the configuration for the event resilience handler.
 */
export interface EventResilienceHandlerConfig {
    /**
     * The number of immediate retry attempts.
     */
    immediateRetryAttempts: number;

    /**
     * The number of delayed retry attempts.
     */
    delayedRetryAttempts: number;

    /**
     * The delay in milliseconds between retry attempts.
     */
    delayInMs: number;
}