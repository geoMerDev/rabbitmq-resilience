export class EventProcessLogDto {
    constructor(
        public id: number | null,
        public eventId: number,
        public processName: string,
        public duration?: number,
    ) {}

    static create(object: { [key: string]: any }): [string[], EventProcessLogDto?] {
        const [errors, isValid] = this.validate(object, 'create');
        if (!isValid) return [errors];

        return [[], this.mapToDto(object)];
    }

    static update(object: { [key: string]: any }): [string[], EventProcessLogDto?] {
        const [errors, isValid] = this.validate(object, 'update');
        if (!isValid) return [errors];

        return [[], this.mapToDto(object)];
    }

    private static validate(object: { [key: string]: any }, context: 'create' | 'update'): [string[], boolean] {
        const errors: string[] = [];
        const { id, eventId, processName, duration } = object;

        if (context === 'update') {
            if (typeof id !== 'number') errors.push('Invalid id');
        }
        if (typeof eventId !== 'number') errors.push('Invalid or missing eventId');
        if (typeof processName !== 'string' || processName.trim() === '') errors.push('Invalid or missing processName');
        if (duration !== undefined && typeof duration !== 'number') errors.push('Invalid duration');

        return [errors, errors.length === 0];
    }

    private static mapToDto(object: { [key: string]: any }): EventProcessLogDto {
        const { id = null, eventId, processName,  duration } = object;

        return new EventProcessLogDto(
            id,
            eventId,
            processName,
            duration,
        );
    }
}
