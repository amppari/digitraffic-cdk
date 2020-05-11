import * as pgPromise from "pg-promise";
import {handler} from "../../../../lib/lambda/get-requests/lambda-get-requests";
import {newServiceRequest} from "../../testdata";
import {dbTestBase2, insertServiceRequest2} from "../../db-testutil";
import {IConnected} from "pg-promise";

describe('lambda-get-requests', () => {

    test('no service requests', dbTestBase2(async (db: IConnected<any,any>) => {
        const response = await handler({extensions: 'false'}, {}, {}, db);

        expect(response).toMatchObject([]);
    }));

    test('some service requests', dbTestBase2(async (db: IConnected<any,any>) => {
        const serviceRequests =
            Array.from({length: Math.floor(Math.random() * 10)}).map(() => newServiceRequest());
        await insertServiceRequest2(db, serviceRequests);

        const response = await handler({extensions: 'false'}, {}, {}, db);

        expect(response.length).toBe(serviceRequests.length);
    }));

    test('extensions', dbTestBase2(async (db: IConnected<any,any>) => {
        await insertServiceRequest2(db, [newServiceRequest()]);

        const response = await handler({extensions: 'true'}, {}, {}, db);

        expect(response[0]['extended_attributes']).toBeDefined();
    }));

    test('no extensions', dbTestBase2(async (db: IConnected<any,any>) => {
        await insertServiceRequest2(db, [newServiceRequest()]);

        const response = await handler({extensions: 'false'}, {}, {}, db);

        expect(response[0]['extended_attributes']).toBeUndefined();
    }));

});
