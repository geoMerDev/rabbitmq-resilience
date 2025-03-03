import {ServerType} from '@hono/node-server/dist/types';
import {Server, Socket} from 'socket.io'
import signatures from './signatures';

export class RabbitMQResilienceSocketManager {
    private static io: Server;


    public static initialize(server: ServerType, path: string) {
        if (!RabbitMQResilienceSocketManager.io) {
            RabbitMQResilienceSocketManager.io = new Server(server, {
                cors: {
                    origin: '*'
                },
                path
            });
            RabbitMQResilienceSocketManager.setupSocketEvents();
        } else {
            console.warn('SocketManager is already initialized.');
        }
    }

    private static setupSocketEvents() {
        RabbitMQResilienceSocketManager.io.on('connection', (socket: Socket) => {
            console.log('a user connected', socket.id);
        })
    }

    public static emit(eventName: string, data: any) {
        if (!RabbitMQResilienceSocketManager.allowedEmitMessages(eventName)) {
            throw new Error(`Invalid emit signature: ${eventName}`);
        }
        RabbitMQResilienceSocketManager.io.emit(eventName, data);
    }

    public static getSocket(): Server {
        return RabbitMQResilienceSocketManager.io;
    }

    public static allowedEmitMessages(emitSignature: string): boolean {
        const allowedEmitSignatures = [
            signatures.SEND_TO_RETRY_QUEUE.abbr,
            signatures.SEND_TO_DEAD_LETTER_QUEUE.abbr,
            signatures.IMMEDIATE_RETRY_ATTEMPTS.abbr,
            signatures.PROCESSING_SUCCESS.abbr,
            signatures.TOTAL_PROCESSING_SUCCESS.abbr,
            signatures.DISCARD_MESSAGE.abbr
        ];

        return allowedEmitSignatures.includes(emitSignature);
    }

}
