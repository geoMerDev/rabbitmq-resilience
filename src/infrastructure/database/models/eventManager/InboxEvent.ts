import {Model, DataTypes, Sequelize} from "sequelize";
import {EventProcessLogEntity} from "@/domain/entities/eventManager";

interface InboxEventRow {
    id: number,
    uuid: string,
    type: string,
    headers: object,
    properties: object,
    payload: object,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date
}

export class InboxEventSequelize extends Model<InboxEventRow, Omit<InboxEventRow, 'id'>> {
    declare id: number
    declare uuid: string
    declare type: string
    declare headers: object
    declare properties: object
    declare payload: object
    declare eventProcessLog: EventProcessLogEntity[]
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
    declare readonly deletedAt: Date
}

export const initInboxEventSequelize = (sequelize: Sequelize) => {
    InboxEventSequelize.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        uuid: {
            type: DataTypes.STRING(36),
            unique: true,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        headers: {
            type: DataTypes.JSON,
            allowNull: false
        },
        properties: {
            type: DataTypes.JSON,
            allowNull: false
        },
        payload: {
            type: DataTypes.JSON,
            allowNull: false
        },
    }, {
        sequelize,
        timestamps: true,
        paranoid: true,
        tableName: 'inbox_events',
        underscored: true
    });
};