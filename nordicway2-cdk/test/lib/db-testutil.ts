import * as pgPromise from "pg-promise";
import {initDbConnection} from "digitraffic-lambda-postgres/database";

export function dbTestBase(fn: (db: pgPromise.IDatabase<any, any>) => void) {
    return () => {
        const db: pgPromise.IDatabase<any, any> = initDbConnection('road', 'road', 'localhost:54322/road', {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = 'road';
            process.env.DB_PASS = 'road';
            process.env.DB_URI = 'localhost:54322/road';
        });

        afterAll(async () => {
            await truncate(db);
            db.$pool.end();
        });

        // @ts-ignore
        fn(db);
    };
}

export async function truncate(db: pgPromise.IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
        return t.batch([
            db.none('DELETE FROM nw2_annotation')
        ]);
    });
}

