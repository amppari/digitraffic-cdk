import * as pgPromise from "pg-promise";
import {dbTestBase, insert} from "../db-testutil";
import {newFault} from "../testdata";
import {findFaultIdsByRoute,getFaultById} from "../../lib/db/db-faults";
import {LineString, Point} from "wkx";

describe('db-voyageplan-faults', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('findFaultsByArea - within 15 nautical miles', async () => {
        const fault = newFault({
            geometry: {
                lat: 60.285807,
                lon: 27.321659
            }
        });
        const route = new LineString([
            new Point(27.029835, 60.474496,),
            new Point(27.224842, 60.400138)
        ]);

        await insert(db, [fault]);

        const faults = await findFaultIdsByRoute(db, route);
        expect(faults.length).toBe(1);
    });

    test('findFaultsByArea - outside range', async () => {
        const fault = newFault({
            geometry: {
                lat: 60.177569,
                lon: 27.502246
            }
        });
        const route = new LineString([
            new Point(27.029835, 60.474496),
            new Point(27.224842, 60.400138)
        ]);

        await insert(db, [fault]);

        const faults = await findFaultIdsByRoute(db, route);
        expect(faults.length).toBe(0);
    });

    test('getFaultById - found', async () => {
        const fault = newFault();
        await insert(db, [fault]);

        const foundFault = await getFaultById(db, fault.id);

        expect(Number(foundFault?.id)).toBe(fault.id);
    });

    test('getFaultById - not found', async () => {
        const fault = newFault();
        await insert(db, [fault]);

        await expect(getFaultById(db, fault.id + 1)).rejects.toThrow();
    });

}));
