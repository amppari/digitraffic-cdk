import {IConnected} from "pg-promise";
import {handler} from '../../../../lib/lambda/update-states/lambda-update-states';
import {dbTestBase2} from "../../db-testutil";
import {TestHttpServer} from "../../../../../common/test/httpserver";
import {findAll} from "../../../../lib/db/db-states";
import {newState} from "../../testdata";
import {ServiceRequestState} from "../../../../lib/model/service-request-state";

const SERVER_PORT = 8089;

process.env.ENDPOINT_USER = "some_user";
process.env.ENDPOINT_PASS = "some_pass";
process.env.ENDPOINT_URL = `http://localhost:${SERVER_PORT}`;

describe('update-states', () => {

    test('update', dbTestBase2(async (db: IConnected<any,any>) => {
        const states = fakeStates();
        states.sort((a: ServiceRequestState,b: ServiceRequestState) => a.key > b.key ? 1 : a.key < b.key ? -1 : 0);
        const server = new TestHttpServer();
        server.listen(SERVER_PORT, {
            "/states": () => {
                return JSON.stringify(states);
            }
        });

        try {
            await handler({}, {}, {}, db);
            expect((await findAll(db))).toMatchObject(states);
        } finally {
            server.close();
        }
    }));

});

function fakeStates(): ServiceRequestState[] {
    return Array.from({length: Math.floor(1 + Math.random() * 10)}).map(() => newState())
}
