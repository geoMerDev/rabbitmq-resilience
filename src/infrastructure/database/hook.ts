import { RotationTables } from '@/domain/interfaces/rabbitMQResilienceConfig';
import { EventProcessLogSequelize, InboxEventSequelize, OutboxEventSequelize } from './models/eventManager'
import { Model } from 'sequelize';
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

export default class DatabaseHook {
    public static config: RotationTables;
    public static checkRotation(): void {
        try {
            if (!DatabaseHook.config.enable) {
                return
            }
            EventProcessLogSequelize.afterCreate(async () => {
                const totalCount = await EventProcessLogSequelize.count();
                if (totalCount >= DatabaseHook.config.maxRecords) {
                    const rows = await EventProcessLogSequelize.findAll({
                        order: [['createdAt', 'ASC']],
                        limit: DatabaseHook.config.maxRecords,
                        raw: true
                    });

                    const sql = this.convertIntoSql(rows);
                    console.log(sql);

                    await this.compressAndSaveSql(sql);

                }
            });
            InboxEventSequelize.afterCreate(async () => {
                const totalCount = await InboxEventSequelize.count();
                if (totalCount >= DatabaseHook.config.maxRecords) {
                    const rows = await InboxEventSequelize.findAll({
                        order: [['createdAt', 'ASC']],
                        limit: DatabaseHook.config.maxRecords,
                        raw: true
                    });
                    const sql = this.convertIntoSql(rows);
                    console.log(sql);

                    await this.compressAndSaveSql(sql);
                }
            });
            OutboxEventSequelize.afterCreate(async () => {
                const totalCount = await OutboxEventSequelize.count();
                if (totalCount >= DatabaseHook.config.maxRecords) {
                    const rows = await OutboxEventSequelize.findAll({
                        order: [['createdAt', 'ASC']],
                        limit: DatabaseHook.config.maxRecords,
                        raw: true
                    });
                    const sql = this.convertIntoSql(rows);
                    await this.compressAndSaveSql(sql);
                }
            });
        } catch (error) {
            console.error("Error checking rotation:", error);
        }
    }

    public static convertIntoSql(rows: Model[]): string {
        if (rows.length === 0) return '';

        const sequelize = rows[0].sequelize!;
        const modelClass = rows[0].constructor as typeof Model & { getTableName(): string, getAttributes(): any };
        const tableName = modelClass.getTableName();
        const attributes = modelClass.getAttributes();
        const columns = Object.keys(attributes);

        const insertStatements = rows.map(row => {
            const values = columns.map(col => {
                let val = row.get(col);
                console.log(val);
                
                sequelize.escape(row.get(col) as any)
            });
            return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
        });

        return insertStatements.join('\n');
    }

    public static compressAndSaveSql(sql: string): Promise<string> {
        try {
            const exportDir = path.resolve('./exports')
            if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir)

            const sqlPath = path.join(exportDir, `export-${Date.now()}.sql`);
            const compressedPath = `${sqlPath}.gz`

            fs.writeFileSync(sqlPath, sql)

            const gzip = zlib.createGzip()
            const input = fs.createReadStream(sqlPath)
            const output = fs.createWriteStream(compressedPath)
            return new Promise<string>((resolve, reject) => {
                input.pipe(gzip).pipe(output)
                    .on('finish', () => {
                        fs.unlinkSync(sqlPath)
                        resolve(compressedPath)
                    })
                    .on('error', reject)
            })
        } catch (error) {
            console.error("Error compressing and saving SQL:", error);
            return Promise.reject(error);
        }
    }
}