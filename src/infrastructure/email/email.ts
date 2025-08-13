import { EmailConfigInterface } from "@/domain/interfaces/emailConfig";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import fs from "fs";
import { RabbitMQMessageDto } from "@/domain/dtos/eventManager";
import path from 'path';
import { Logs } from "../utils/logs";
import { EventException } from "../eventManager/eventException";

interface Replacements {
    [key: string]: string;
}
export class EmailConfig {
    public static transporter: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>;
    public static config: EmailConfigInterface;

    public static initialize() {
        if (!this.config) {
            throw new Error('Email configuration is not initialized');
        }

        this.transporter = nodemailer.createTransport({
            auth: {
                user: this.config.EMAIL_AUTH_USER,
                pass: this.config.EMAIL_AUTH_PASS,
            },
            host: this.config.EMAIL_HOST,
            port: this.config.EMAIL_PORT,
        });
    }

    public static async sendMessage(event: RabbitMQMessageDto, errors: EventException[]): Promise<void> {
        try {
            if (this.transporter) {
                const htmlContent = this.renderTemplate('../utils/template/error.template.html', {
                    errorTitle: `Error Notification - ${event.properties.type}`,
                    messageUuid: event.properties.messageId,
                    errorMessage: event.content.toString(),
                    errorStack: errors.map(error => error.stack).join('\n')
                });
                await this.transporter.sendMail({
                    from: `${this.config.APP_NAME} - rabbitmq-resilience <${this.config.APP_NAME.replace(/\s+/g, '').toLowerCase()}>`,
                    to: this.config.EMAIL,
                    subject: `${this.config.APP_NAME} Error Notification`,
                    html: htmlContent,
                });
            }
        } catch (error) {
            Logs.error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public static renderTemplate(relativePath: string, replacements: Replacements): string {
        const absolutePath = path.resolve(__dirname, relativePath);
        let html = fs.readFileSync(absolutePath, 'utf8');
        for (const key in replacements) {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
        }
        return html;
    }
}