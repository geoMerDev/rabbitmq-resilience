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

export const sequelize = (config: Options): Sequelize => new Sequelize(config);

export const DbSequelize = async (sequelize: Sequelize): Promise<void> => {

    try {
        initInboxEventSequelize(sequelize);
        initEventProcessLogSequelize(sequelize);
        initOutboxEventSequelize(sequelize);

        await InboxEventSequelize.sync();
        await EventProcessLogSequelize.sync();
        await OutboxEventSequelize.sync();
    } catch (e) {
        console.log(e);
        throw e;
    }
};