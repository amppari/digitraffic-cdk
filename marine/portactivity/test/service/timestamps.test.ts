import {dbTestBase, findAll, insert} from "../db-testutil";
import * as pgPromise from "pg-promise";
import {newTimestamp} from "../testdata";
import moment from 'moment-timezone';
import * as TimestampsService from "../../lib/service/timestamps";

describe('timestamps', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('findAllTimestamps - locode', async () => {
        const timestamp = newTimestamp();
        await insert(db, [timestamp]);

        const timestamps = await TimestampsService.findAllTimestamps(timestamp.location.port, undefined, undefined);

        expect(timestamps.length).toBe(1);
        expect(timestamps[0]).toMatchObject(timestamp);
    });

    test('findAllTimestamps - mmsi', async () => {
        const timestamp = newTimestamp();
        await insert(db, [timestamp]);

        const timestamps = await TimestampsService.findAllTimestamps(undefined, timestamp.ship.mmsi, undefined);

        expect(timestamps.length).toBe(1);
        expect(timestamps[0]).toMatchObject(timestamp);
    });

    test('findAllTimestamps - imo', async () => {
        const timestamp = newTimestamp();
        await insert(db, [timestamp]);

        const timestamps = await TimestampsService.findAllTimestamps(undefined, undefined, timestamp.ship.imo);

        expect(timestamps.length).toBe(1);
        expect(timestamps[0]).toMatchObject(timestamp);
    });

    test('saveTimestamp - no conflict returns updated', async () => {
        const timestamp = newTimestamp();

        const ret = await TimestampsService.saveTimestamp(timestamp);

        expect(ret?.location_locode).toBe(timestamp.location.port);
        expect(ret?.ship_mmsi).toBe(timestamp.ship.mmsi);
        expect(ret?.ship_imo).toBe(timestamp.ship.imo);
    });

    test('saveTimestamp - conflict returns undefined', async () => {
        const timestamp = newTimestamp();

        await TimestampsService.saveTimestamp(timestamp);
        const ret = await TimestampsService.saveTimestamp(timestamp);

        expect(ret).toBeNull();
    });

    test('saveTimestamp - Portnet timestamp with same portcallid, same locode is not replaced ', async () => {
        const olderTimestamp = newTimestamp({locode: 'FIRAU', source: 'Portnet'});
        const newerTimestamp = { ...olderTimestamp, eventTime: moment(olderTimestamp.eventTime).add(1,'hours').toISOString() };

        await TimestampsService.saveTimestamp(olderTimestamp);
        const ret = await TimestampsService.saveTimestamp(newerTimestamp);

        expect(ret.locodeChanged).toBe(false);
        expect((await findAll(db)).length).toBe(2);
    });

    test('saveTimestamp - Portnet timestamp with same portcallid, different locode is replaced ', async () => {
        const olderTimestamp = newTimestamp({locode: 'FIHKO', source: 'Portnet'});
        const newerTimestamp = { ...olderTimestamp, location: { port: 'FIRAU' } };

        await TimestampsService.saveTimestamp(olderTimestamp);
        const ret = await TimestampsService.saveTimestamp(newerTimestamp);

        expect(ret.locodeChanged).toBe(true);
        expect((await TimestampsService.findAllTimestamps(olderTimestamp.location.port)).length).toBe(0);
        expect((await TimestampsService.findAllTimestamps(newerTimestamp.location.port)).length).toBe(1);
    });

    test('saveTimestamps - multiple updates', async () => {
        const timestamp1 = newTimestamp();
        const timestamp2 = newTimestamp();

        const ret = await TimestampsService.saveTimestamps([timestamp1, timestamp2]);

        expect(ret[0]?.location_locode).toBe(timestamp1.location.port);
        expect(ret[0]?.ship_mmsi).toBe(timestamp1.ship.mmsi);
        expect(ret[0]?.ship_imo).toBe(timestamp1.ship.imo);

        expect(ret[1]?.location_locode).toBe(timestamp2.location.port);
        expect(ret[1]?.ship_mmsi).toBe(timestamp2.ship.mmsi);
        expect(ret[1]?.ship_imo).toBe(timestamp2.ship.imo);
    });

}));
