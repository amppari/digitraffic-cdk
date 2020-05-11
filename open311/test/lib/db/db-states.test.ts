import {findAll, update} from "../../../lib/db/db-states";
import {newState} from "../testdata";
import {dbTestBase2} from "../db-testutil";
import {IConnected} from "pg-promise";

describe('db-states', () => {

    test('findAll', dbTestBase2(async (db: IConnected<any,any>) => {
        const states = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newState();
        });
        await update(states, db);

        const foundStates = await findAll(db);

        expect(foundStates.length).toBe(states.length);
    }));

});
