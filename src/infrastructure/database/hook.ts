import { RotationTables } from '@/domain/interfaces/rabbitMQResilienceConfig';
import { EventProcessLogSequelize, InboxEventSequelize, OutboxEventSequelize } from './models/eventManager'
import { Model, ModelStatic, Op, Sequelize, QueryTypes } from 'sequelize';
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import SFTPClient from 'ssh2-sftp-client'
import { Logs } from '../utils/logs';
import { MigrationHistorySequelize } from './models/eventManager/MigrationHistory';
import { MigrationHistoryDatasource } from '@/domain/datasources/eventManager/migrationHistory.datasource';
import { MigrationHistoryDatasourceImpl } from '../datasources/eventManager/migrationHistory.datasource.impl';

export default class DatabaseHook {
    public static config: RotationTables;
    public static checkRotation(): void {
        try {
            if (!DatabaseHook.config.enable) {
                return
            } else {
                this.checkConfiguration();
                if (!DatabaseHook.config.sftpServer) {
                    Logs.warn("SFTP server configuration is missing. Skipping rotation.");
                    return;
                }
                if (!DatabaseHook.config.maxRecords || DatabaseHook.config.maxRecords <= 0) {
                    Logs.warn("Invalid maxRecords configuration. Skipping rotation.");
                    return;
                }
                if (!DatabaseHook.config.sftpServer.host) {
                    Logs.warn("SFTP host configuration is missing. Skipping rotation.");
                    return;
                }
                if (!DatabaseHook.config.sftpServer.port) {
                    Logs.warn("SFTP port configuration is missing. Using default port 22.");
                    DatabaseHook.config.sftpServer.port = 22;
                }
                if (!DatabaseHook.config.sftpServer.username) {
                    Logs.warn("SFTP username configuration is missing. Skipping rotation.");
                    return;
                }
                if (!DatabaseHook.config.sftpServer.password) {
                    Logs.warn("SFTP password configuration is missing. Skipping rotation.");
                    return;
                }
                if (!DatabaseHook.config.sftpServer.sftpPath) {
                    Logs.warn("SFTP path configuration is missing. Using default path '/'.");
                    DatabaseHook.config.sftpServer.sftpPath = '/';
                }
            }
            const modelsToHook: Array<ModelStatic<Model<any, any>>> = [
                EventProcessLogSequelize,
                InboxEventSequelize,
                OutboxEventSequelize
            ];

            modelsToHook.forEach((model) => {
                model.afterCreate(async () => {
                    await this.handleAfterCreate(model);
                });
            });
        } catch (error) {
            Logs.error("Error checking rotation:", error);
        }
    }

    public static convertIntoSql(rows: Model[]): string {
        try {
            if (rows.length === 0) return '';

            const sequelize = rows[0].sequelize!;
            const modelInstance = rows[0];

            const modelName = modelInstance.constructor.name;
            const modelClass = sequelize.model(modelName);

            if (
                typeof modelClass.getTableName !== 'function' ||
                typeof modelClass.getAttributes !== 'function'
            ) {
                Logs.error(`El modelo ${modelName} no tiene métodos válidos`);
            }

            const tableName = modelClass.getTableName();
            const columns = Object.keys(modelClass.getAttributes());

            const insertStatements = rows.map(row => {
                const values = columns.map(col => {
                    let val = row.get(col);

                    if (
                        val === null ||
                        typeof val === 'string' ||
                        typeof val === 'number' ||
                        typeof val === 'boolean' ||
                        val instanceof Date
                    ) {
                        return sequelize.escape(val as any);
                    }

                    if (typeof val === 'object') {
                        return sequelize.escape(JSON.stringify(val));
                    }

                    return sequelize.escape(String(val));
                });

                return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
            });

            return insertStatements.join('\n');
        } catch (error) {
            Logs.error('Error converting rows to SQL:', error);
            return '';
        }
    }

    public static compressAndSaveSql(sql: string): Promise<string> {
        try {
            const exportDir = path.resolve('./exports')
            if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir)

            const docName = `export-${Date.now()}.sql`
            const sqlPath = path.join(exportDir, docName);
            const compressedPath = `${sqlPath}.gz`

            fs.writeFileSync(sqlPath, sql)

            const gzip = zlib.createGzip()
            const input = fs.createReadStream(sqlPath)
            const output = fs.createWriteStream(compressedPath)
            return new Promise<string>((resolve, reject) => {
                input.pipe(gzip).pipe(output)
                    .on('finish', async () => {
                        await this.sendToExternalServer(compressedPath, docName)
                        fs.unlinkSync(compressedPath)
                        fs.unlinkSync(sqlPath)
                        resolve(compressedPath)
                    })
                    .on('error', reject)
            })
        } catch (error) {
            Logs.error("Error compressing and saving SQL:", error);
            return Promise.reject(error);
        }
    }

    public static async sendToExternalServer(filePath: string, nameDoc: string): Promise<void> {
        const sftp = new SFTPClient()
        try {
            if (DatabaseHook.config.sftpServer) {
                await sftp.connect(DatabaseHook.config.sftpServer)
                await sftp.put(filePath, DatabaseHook.config.sftpServer.sftpPath! + nameDoc)
                await new MigrationHistoryDatasourceImpl().createMigrationHistory(nameDoc, DatabaseHook.config.sftpServer.sftpPath! + nameDoc);
            }
        } catch (error) {
            Logs.error("Error sending to external server:", error);
        } finally {
            sftp.end();
        }
    }

    public static async handleAfterCreate(model: ModelStatic<Model<any, any>>): Promise<void> {
        let records: Model<any, any>[] = [];
        switch (DatabaseHook.config.typeOfRotation) {
            case 'max-records':
                records = await this.handleMaxRecords(model);
                break;

            case 'size-table':
                records = await this.handleSizeRecords(model);
                break;

            case 'time-rotation':
                records = await this.handleTimeRotations(model);
                break;

            default:
                console.warn(`Tipo de rotación no soportado: ${DatabaseHook.config.typeOfRotation}`);
                break;
        }
        if (records && records.length > 0) {
            const sql = this.convertIntoSql(records);
            await this.compressAndSaveSql(sql);
            const ids = records.map(row => row.get('id'));

            await model.destroy({
                where: {
                    id: {
                        [Op.in]: ids
                    }
                }
            });
        }
    }

    public static async handleMaxRecords(model: ModelStatic<Model<any, any>>): Promise<Model<any, any>[]> {
        const totalCount = await model.count();
        if (totalCount >= DatabaseHook.config.maxRecords!) {
            return await model.findAll({
                order: [['createdAt', 'ASC']],
                limit: DatabaseHook.config.maxRecords
            });
        } else {
            return [];
        }
    }

    public static async handleSizeRecords(model: ModelStatic<Model<any, any>>): Promise<Model<any, any>[]> {
        const sequelize = model.sequelize!;
        const tableName = model.getTableName() as string;
        const dbName = (sequelize.config.database as string);

        // Consulta real del tamaño de la tabla (data + indexes)
        const [results] = await sequelize.query<{
            total_bytes: number;
        }>(`
            SELECT 
                (DATA_LENGTH + INDEX_LENGTH) AS total_bytes
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = :dbName
            AND TABLE_NAME = :tableName
            LIMIT 1;
        `, {
            replacements: { dbName, tableName },
            type: QueryTypes.SELECT
        });

        const tableSizeBytes = results?.total_bytes ?? 0;
        const maxBytes = (DatabaseHook.config.maxSizeMB ?? 300) * 1024 * 1024;

        if (tableSizeBytes >= maxBytes) {
            // Si supera el límite, devuelve todos los registros (por ejemplo, para archivarlos o eliminarlos)
            const records = await model.findAll({
                order: [['createdAt', 'ASC']],
            });
            return records;
        }

        return [];
    }

    public static async handleTimeRotations(model: ModelStatic<Model<any, any>>): Promise<Model<any, any>[]> {
        const maxAgeDays = DatabaseHook.config.maxAgeDays;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays!);

        const oldRecords = await model.findAll({
            where: {
                createdAt: {
                    [Op.lt]: cutoffDate
                }
            },
            order: [['createdAt', 'ASC']]
        });

        return oldRecords;
    }

    public static checkConfiguration(): void {
        if (DatabaseHook.config.typeOfRotation === 'max-records') {
            if (!DatabaseHook.config.maxRecords) throw new Error("maxRecords is required for max-records rotation type");
            if(DatabaseHook.config.maxRecords <= 0) throw new Error("maxRecords must be greater than 0");
        } else if (DatabaseHook.config.typeOfRotation === 'size-table') {
            if (!DatabaseHook.config.maxSizeMB) throw new Error("maxSizeMB is required for size-table rotation type");
            if(DatabaseHook.config.maxSizeMB <= 0) throw new Error("maxSizeMB must be greater than 0");
        } else if (DatabaseHook.config.typeOfRotation === 'time-rotation') {
            if (!DatabaseHook.config.maxAgeDays) throw new Error("maxAgeDays is required for time-rotation rotation type");
            if(DatabaseHook.config.maxAgeDays <= 0) throw new Error("maxAgeDays must be greater than 0");
        }
    }
}