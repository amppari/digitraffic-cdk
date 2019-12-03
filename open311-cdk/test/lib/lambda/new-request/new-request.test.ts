import * as pgPromise from "pg-promise";
import {initDb} from 'digitraffic-lambda-postgres/database';
import {handler} from "../../../../lib/lambda/new-request/lambda-new-request";
import {newServiceRequest} from "../../testdata";
import {dbTestBase} from "../../db-testutil";
const testEvent = require('../../test-event');

describe('lambda-new-request', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('No body - invalid request', async () => {
        const response = await handler(Object.assign({}, testEvent, {
            body: null
        }));

        expect(response.statusCode).toBe(400);
    });

    test('Empty array - invalid request', async () => {
        const response = await handler(Object.assign({}, testEvent, {
            body: "[]"
        }));

        expect(response.statusCode).toBe(400);
    });

    test('Single service request - created', async () => {
        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([newServiceRequest()])
        }));

        expect(response.statusCode).toBe(201);
    });

    test('Multiple service requests - created', async () => {
        const response = await handler(Object.assign({}, testEvent, {
            body: JSON.stringify([newServiceRequest(), newServiceRequest(), newServiceRequest()])
        }));

        expect(response.statusCode).toBe(201);
    });

}));