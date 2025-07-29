import { SlackConfig } from "@/domain/interfaces/slackConfig";
import { IncomingWebhook } from "@slack/webhook";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import fs from "fs";
import { RabbitMQMessageDto } from "@/domain/dtos/eventManager";
import path from 'path';

interface Replacements {
    [key: string]: string;
}
export class Slack {
    public static transporter: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>;
    public static config: SlackConfig;

    public static initialize() {
        if (!Slack.config) {
            throw new Error('Slack configuration is not initialized');
        }

        Slack.transporter = nodemailer.createTransport({
            auth: {
                user: Slack.config.EMAIL_AUTH_USER,
                pass: Slack.config.EMAIL_AUTH_PASS,
            },
            host: Slack.config.EMAIL_HOST,
            port: Slack.config.EMAIL_PORT,
        });
    }

    public static async sendMessage(event: RabbitMQMessageDto): Promise<void> {
        if (this.transporter) {
            const htmlContent = this.renderTemplate('../utils/template/error.template.html', {
                errorTitle: `Error Notification - ${event.properties.type}`,
                errorMessage: event.content.toString()
            });
            await this.transporter.sendMail({
                from: `${this.config.APP_NAME} <${this.config.APP_NAME.replace(/\s+/g, '').toLowerCase()}>`,
                to: Slack.config.SLACK_EMAIL,
                subject: `${this.config.APP_NAME} Error Notification`,
                html: htmlContent,
            });
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