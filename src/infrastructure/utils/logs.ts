import { RabbitMQResilienceConfig } from "@/domain/interfaces/rabbitMQResilienceConfig";

export class Logs {
    public static config: RabbitMQResilienceConfig;
    
    public static log(message: string, ...optionalParams: any[]) {
        if (this.config.showLogs?.log) {
            console.log(message, ...optionalParams);
        }
    }

    public static error(message: string, ...optionalParams: any[]) {
        if (this.config.showLogs?.error) {
            console.error(message, ...optionalParams);
        }
    }

    public static warn(message: string, ...optionalParams: any[]) {
        if (this.config.showLogs?.warn) {
            console.warn(message, ...optionalParams);
        }
    }

    public static info(message: string, ...optionalParams: any[]) {
        if (this.config.showLogs?.info) {
            console.info(message, ...optionalParams);
        }
    }

    public static debug(message: string, ...optionalParams: any[]) {
        if (this.config.showLogs?.debug) {
            console.debug(message, ...optionalParams);
        }
    }

    public static trace(message: string, ...optionalParams: any[]) {
        if (this.config.showLogs?.trace) {
            console.trace(message, ...optionalParams);
        }
    }

    public static time(label: string) {
        if (this.config.showLogs?.time) {
            console.time(label);
        }
    }

    public static timeEnd(label: string) {
        if (this.config.showLogs?.time) {
            console.timeEnd(label);
        }
    }
}