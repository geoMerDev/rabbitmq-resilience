
export class InboxEventEntity {
    constructor(
        public id: number,
        public uuid: string,
        public type: string,
        public headers: object,
        public properties: object,
        public payload: object,
        public createdAt: Date,
        public updatedAt: Date,
        public deletedAt: Date | null
    )
    {}

}
