import {Model, DataTypes, Sequelize} from "sequelize";
import {InboxEventSequelize} from "@/infrastructure/database/models/eventManager/InboxEvent";

interface EventProcessLogRow {
    id: number,
    eventId: number,
    processName: string,
    duration?: number,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date
}

export class EventProcessLogSequelize extends Model<EventProcessLogRow, Omit<EventProcessLogRow, 'id'>> {
    declare id: number
    declare eventId: number
    declare processName: string
    declare duration?: number
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
    declare readonly deletedAt: Date
}

export const initEventProcessLogSequelize = (sequelize: Sequelize) => {
    EventProcessLogSequelize.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        eventId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: InboxEventSequelize,
                key: 'id'
            }
        },
        processName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        }
    }, {
        sequelize,
        timestamps: true,
        paranoid: true,
        tableName: 'event_process_logs',
        underscored: true
    });

    EventProcessLogSequelize.belongsTo(InboxEventSequelize, {foreignKey: 'event_id'});
    InboxEventSequelize.hasMany(EventProcessLogSequelize, {foreignKey: 'event_id'});
};