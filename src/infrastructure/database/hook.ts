import { RotationTables } from '@/domain/interfaces/rabbitMQResilienceConfig';
import { EventProcessLogSequelize, InboxEventSequelize, OutboxEventSequelize } from './models/eventManager'
import { Model } from 'sequelize';
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import SFTPClient from 'ssh2-sftp-client'
import { Logs } from '../utils/logs';

export default class DatabaseHook {
    public static config: RotationTables;
    public static checkRotation(): void {
        try {
            if (!DatabaseHook.config.enable) {
                return
            } else {
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
            EventProcessLogSequelize.afterCreate(async () => {
                const totalCount = await EventProcessLogSequelize.count();
                if (totalCount >= DatabaseHook.config.maxRecords) {
                    const rows = await EventProcessLogSequelize.findAll({
                        order: [['createdAt', 'ASC']],
                        limit: DatabaseHook.config.maxRecords
                    });

                    const sql = this.convertIntoSql(rows);
                    await this.compressAndSaveSql(sql);

                }
            });
            InboxEventSequelize.afterCreate(async () => {
                const totalCount = await InboxEventSequelize.count();
                if (totalCount >= DatabaseHook.config.maxRecords) {
                    const rows = await InboxEventSequelize.findAll({
                        order: [['createdAt', 'ASC']],
                        limit: DatabaseHook.config.maxRecords
                    });
                    const sql = this.convertIntoSql(rows);
                    await this.compressAndSaveSql(sql);
                }
            });
            OutboxEventSequelize.afterCreate(async () => {
                const totalCount = await OutboxEventSequelize.count();
                if (totalCount >= DatabaseHook.config.maxRecords) {
                    const rows = await OutboxEventSequelize.findAll({
                        order: [['createdAt', 'ASC']],
                        limit: DatabaseHook.config.maxRecords
                    });
                    const sql = this.convertIntoSql(rows);
                    await this.compressAndSaveSql(sql);
                }
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
            }
        } catch (error) {
            Logs.error("Error sending to external server:", error);
        } finally {
            sftp.end();
        }
    }
}