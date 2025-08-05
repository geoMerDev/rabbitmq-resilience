import { MigrationHistoryDatasource } from "@/domain/datasources/eventManager/migrationHistory.datasource";
import { MigrationHistoryEntity } from "@/domain/entities/eventManager/migrationHistory.entity";
import { MigrationHistorySequelize } from "@/infrastructure/database/models/eventManager/MigrationHistory";
import { Logs } from "@/infrastructure/utils/logs";

export class MigrationHistoryDatasourceImpl implements MigrationHistoryDatasource {
    async createMigrationHistory(name: string, server: string): Promise<MigrationHistoryEntity> {
        try {
            if (!name || !server) {
                throw new Error("Name and server are required to create migration history.");
            }
            const migration = await MigrationHistorySequelize.create({
                name,
                server
            });
            return MigrationHistoryEntity.fromRow(migration);
        } catch (error) {
            Logs.error("Error creating migration history:", error);
            throw new Error("Failed to create migration history.");
        }
    }
}