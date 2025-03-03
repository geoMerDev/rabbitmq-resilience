/**
 * Interface representing the delivery information.
 */
export interface DeliveryInfo {
    /**
     * The timestamp of the delivery.
     */
    timestamp: Date;

    /**
     * The host where the delivery occurred.
     */
    host: string;

    /**
     * The virtual host where the delivery occurred.
     */
    virtualHost: string;

    /**
     * The type of the destination, either 'queue' or 'exchange'.
     */
    destinationType: 'queue' | 'exchange';

    /**
     * The name of the destination.
     */
    destinationName: string;

    /**
     * The routing key used for the delivery (optional).
     */
    routingKey?: string;
}