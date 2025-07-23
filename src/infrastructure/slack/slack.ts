import { SlackConfig } from "@/domain/interfaces/slackConfig";
import { IncomingWebhook } from "@slack/webhook";

export class Slack {
    private static _config: SlackConfig;
    private static _channel: IncomingWebhook;

    public static set config(config: SlackConfig) {
        this._config = config;
    }

    public static setChannel() {
        this._channel = new IncomingWebhook(this._config.SLACK_WEBHOOK_URL);
    }

    public static async sendNotification(message: string): Promise<void> {
        if (!this._channel) {
            throw new Error("Slack channel is not initialized. Call Slack.config first.");
        }

        try {
            await this._channel.send({
                text: message
            });
        } catch (error) {
            console.error("Error sending Slack notification:", error);
        }
    }
}