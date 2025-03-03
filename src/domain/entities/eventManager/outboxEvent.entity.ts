
export class OutboxEventEntity {
    constructor(
        public id: number,
        public uuid: string,
        public type: string,
        public headers: object,
        public properties: object,
        public payload: object,
        public deliveryInfo: object | null,
        public attempts: number,
        public createdAt: Date,
        public updatedAt: Date,
        public deletedAt: Date | null
    ) {
    }
}
