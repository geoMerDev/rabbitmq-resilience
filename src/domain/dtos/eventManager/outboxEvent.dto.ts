
export class OutboxEventDto {
    constructor(
        public id: number | null,
        public uuid: string,
        public type: string,
        public headers: object,
        public properties: object,
        public payload: object,
        public deliveryInfo: object | null,
        public attempts: number,
    ) {}

    static create(object: { [key: string]: any }): [string[], OutboxEventDto?] {
        const [errors, isValid] = this.validate(object, 'create');
        if (!isValid) return [errors];

        return [[], this.mapToDto(object)];
    }

    static update(object: { [key: string]: any }): [string[], OutboxEventDto?] {
        const [errors, isValid] = this.validate(object, 'update');
        if (!isValid) return [errors];

        return [[], this.mapToDto(object)];
    }

    private static validate(object: { [key: string]: any }, context: 'create' | 'update'): [string[], boolean] {
        const errors: string[] = [];
        const { id, uuid, type, headers, properties, payload,  attempts } = object;

        if (context === 'update') {
            if (typeof id !== 'number') errors.push('Invalid id');
        }
        if (typeof uuid !== 'string' || uuid.trim() === '') errors.push('Invalid or missing uuid');
        if (typeof type !== 'string' || type.trim() === '') errors.push('Invalid or missing type');
        if (typeof headers !== 'object' || headers === null) errors.push('Invalid or missing headers');
        if (typeof properties !== 'object' || properties === null) errors.push('Invalid or missing properties');
        if (typeof payload !== 'object' || payload === null) errors.push('Invalid or missing payload');
        if (typeof attempts !== 'number') errors.push('Invalid or missing attempts');

        return [errors, errors.length === 0];
    }

    private static mapToDto(object: { [key: string]: any }): OutboxEventDto {
        const { id = null, uuid, type, headers, properties, payload, deliveryInfo = null, attempts } = object;

        return new OutboxEventDto(
            id,
            uuid,
            type,
            headers,
            properties,
            payload,
            deliveryInfo,
            attempts,
        );
    }
}
