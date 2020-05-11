import {handler} from "../../../../lib/lambda/get-states/lambda-get-states";
import {update} from "../../../../lib/db/db-states";
import {newState} from "../../testdata";
import {dbTestBase2} from "../../db-testutil";
import {IConnected} from "pg-promise";

describe('lambda-get-states', () => {

    test('no states', dbTestBase2(async (db: IConnected<any,any>) => {
        const response = await handler({}, {}, {}, db);

        expect(response).toMatchObject([]);
    }));

    test('some states', dbTestBase2(async (db: IConnected<any,any>) => {
        const states =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newState());
        await update(states, db);

        const response = await handler({}, {}, {}, db);

        expect(response.length).toBe(states.length);
    }));

});
