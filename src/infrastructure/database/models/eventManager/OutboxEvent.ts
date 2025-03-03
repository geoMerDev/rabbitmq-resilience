import {Model, DataTypes, Sequelize} from "sequelize";

interface OutboxEventRow {
    id: number,
    uuid: string,
    type: string,
    headers: object,
    properties: object,
    payload: object,
    deliveryInfo: object | null,
    attempts: number,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date
}

export class OutboxEventSequelize extends Model<OutboxEventRow, Omit<OutboxEventRow, 'id'>> {
    declare id: number
    declare uuid: string
    declare type: string
    declare headers: object
    declare properties: object
    declare payload: object
    declare deliveryInfo: object | null
    declare attempts: number
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
    declare readonly deletedAt: Date
}

export const initOutboxEventSequelize = (sequelize: Sequelize) => {
    OutboxEventSequelize.init({
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
        deliveryInfo: {
            type: DataTypes.JSON,
            allowNull: true
        },
        attempts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
    }, {
        sequelize,
        timestamps: true,
        paranoid: true,
        tableName: 'outbox_events',
        underscored: true
    });
};