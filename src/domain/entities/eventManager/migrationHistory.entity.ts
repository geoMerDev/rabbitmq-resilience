import { MigrationHistorySequelize } from "@/infrastructure/database/models/eventManager/MigrationHistory";

export class MigrationHistoryEntity {
    constructor(
        public id: number,
        public name: string,
        public server: string,
        public createdAt: Date,
        public updatedAt: Date,
        public deletedAt: Date
    ) {}

    static fromRow(row: MigrationHistorySequelize): MigrationHistoryEntity {
        return new MigrationHistoryEntity(
            row.id,
            row.name,
            row.server,
            row.createdAt,
            row.updatedAt,
            row.deletedAt
        );
    }
}