import { MigrationHistoryEntity } from "@/domain/entities/eventManager/migrationHistory.entity";

export abstract class MigrationHistoryDatasource {
    abstract createMigrationHistory(name:string, server: string): Promise<MigrationHistoryEntity>;
}