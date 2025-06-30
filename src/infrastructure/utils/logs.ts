import { ShowLogs } from "@/domain/interfaces/rabbitMQResilienceConfig";

export class Logs {
    public static config: ShowLogs

    public static log(message: string, ...optionalParams: any[]) {
        if (this.config.log) {
            console.log(message, ...optionalParams);
        }
    }

    public static error(message: string, ...optionalParams: any[]) {
        if (this.config.error) {
            console.error(message, ...optionalParams);
        }
    }

    public static warn(message: string, ...optionalParams: any[]) {
        if (this.config.warn) {
            console.warn(message, ...optionalParams);
        }
    }

    public static info(message: string, ...optionalParams: any[]) {
        if (this.config.info) {
            console.info(message, ...optionalParams);
        }
    }

    public static debug(message: string, ...optionalParams: any[]) {
        if (this.config.debug) {
            console.debug(message, ...optionalParams);
        }
    }

    public static trace(message: string, ...optionalParams: any[]) {
        if (this.config.trace) {
            console.trace(message, ...optionalParams);
        }
    }

    public static time(label: string) {
        if (this.config.time) {
            console.time(label);
        }
    }

    public static timeEnd(label: string) {
        if (this.config.time) {
            console.timeEnd(label);
        }
    }

    public static setDefaultConfig() {
        return {
            log: true,
            error: true,
            warn: true,
            info: true,
            debug: true,
            trace: true,
            time: true,
            timeEnd: true
        };
    }
}