import {dbTestBase2, insertServiceRequest2} from "../../db-testutil";
import {newServiceRequest} from "../../testdata";
import * as sinon from 'sinon';
import * as AWS from 'aws-sdk';
import {handler} from '../../../../lib/lambda/check-missing-states/lambda-check-missing-states';
import {IConnected} from "pg-promise";

describe('check-missing-states', () => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('missing state check send SNS event', dbTestBase2(async (db: IConnected<any,any>) => {
        await insertServiceRequest2(db, [newServiceRequest()]);
        const publishSpy = sinon.spy();
        sandbox.stub(AWS, 'SNS').returns({
            publish: publishSpy
        });

        await handler({}, {}, {}, db);

        expect(publishSpy.calledOnce).toBe(true);
    }));

    test('empty status_id does not send SNS event', dbTestBase2(async (db: IConnected<any,any>) => {
        await insertServiceRequest2(db, [{...newServiceRequest(), ...{
                status_id: ''
        }}]);
        const publishSpy = sinon.spy();
        sandbox.stub(AWS, 'SNS').returns({
            publish: publishSpy
        });

        await handler({}, {}, {}, db);

        expect(publishSpy.notCalled).toBe(true);
    }));

});
