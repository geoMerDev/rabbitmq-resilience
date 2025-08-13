import { DataTypes, Model, Sequelize } from "sequelize";

interface MigrationHistoryRow {
    id: number,
    name: string,
    server: string,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date
}

export class MigrationHistorySequelize extends Model<MigrationHistoryRow, Omit<MigrationHistoryRow, 'id'>> {
    declare id: number
    declare name: string
    declare server: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
    declare readonly deletedAt: Date
}

export const initMigrationHistorySequelize = (sequelize: Sequelize) => {
    MigrationHistorySequelize.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        server: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        tableName: 'migration_history',
        timestamps: true,
        paranoid: true,
        underscored: true,
    });
}