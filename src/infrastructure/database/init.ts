import {Sequelize, Options} from "sequelize";
import {InboxEventSequelize, initInboxEventSequelize} from "@/infrastructure/database/models/eventManager/InboxEvent";
import {
    EventProcessLogSequelize,
    initEventProcessLogSequelize
} from "@/infrastructure/database/models/eventManager/EventProcessLog";
import {
    initOutboxEventSequelize,
    OutboxEventSequelize
} from "@/infrastructure/database/models/eventManager/OutboxEvent";
import { Logs } from '@/infrastructure/utils/logs';
import Rotation from "./hook";
import { initMigrationHistorySequelize, MigrationHistorySequelize } from "./models/eventManager/MigrationHistory";

export const sequelize = (config: Options): Sequelize => new Sequelize(config);

export const DbSequelize = async (sequelize: Sequelize): Promise<void> => {

    try {
        initInboxEventSequelize(sequelize);
        initEventProcessLogSequelize(sequelize);
        initOutboxEventSequelize(sequelize);
        initMigrationHistorySequelize(sequelize);

        await InboxEventSequelize.sync();
        await EventProcessLogSequelize.sync();
        await OutboxEventSequelize.sync();
        await MigrationHistorySequelize.sync();

        Rotation.checkRotation();
    } catch (e) {
        Logs.error(e as string);
        throw e;
    }
};