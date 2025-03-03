
export class EventProcessLogEntity {
    constructor(
        public id: number,
        public eventId: number,
        public processName: string,
        public duration: number | undefined,
        public createdAt: Date,
        public updatedAt: Date,
        public deletedAt: Date | null
    ) {}
}
