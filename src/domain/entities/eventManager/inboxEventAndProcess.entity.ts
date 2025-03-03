import {InboxEventEntity} from "@/domain/entities/eventManager/inboxEvent.entity";
import {EventProcessLogEntity} from "@/domain/entities/eventManager/eventProcessLog.entity";

export class InboxEventAndProcessEntity {
    constructor(
        public inboxEvent: InboxEventEntity,
        public process: EventProcessLogEntity[]
    ) {
    }
    toJSON() {
        return {
            inboxEvent: {
                ...this.inboxEvent,
                process: this.process,
            },
        };
    }


}
