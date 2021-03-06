import {FaultProps, findAllFaults, getFaultS124ById} from "../../lib/service/faults";
import {newFault} from "../testdata";
import {dbTestBase, insert} from "../db-testutil";
import * as pgPromise from "pg-promise";
import * as xsdValidator from 'xsd-schema-validator';
import {Language} from "digitraffic-common/model/language";

// XML validation takes a while
jest.setTimeout(30000);

describe('faults', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('getFaultS124ById creates valid XML', async (done) => {
        const fault = newFault({
            geometry: {
                lat: 60.285807,
                lon: 27.321659
            }
        });
        await insert(db, [fault]);

        const faultS124 = await getFaultS124ById(fault.id);

        xsdValidator.validateXML(faultS124, 'test/service/S124.xsd', (err, result) => {
            if (err) {
                throw err;
            }
            expect(result.valid).toBe(true);
            done();
        });
    });

    test('findAllFaults', async () => {
        const fault = newFault();
        await insert(db, [fault]);

        const faults = await findAllFaults(Language.FI, 10);

        expect(faults.features.length).toBe(1);
        const props = faults.features[0].properties as FaultProps;
        expect(props.id).toBe(fault.id);
        expect(props.area_number).toBe(fault.area_number);
        expect(props.aton_id).toBe(fault.aton_id);
        expect(props.domain).toBe(fault.domain);
        expect(props.entry_timestamp.toISOString()).toBe(fault.entry_timestamp.toISOString());
        expect(props.fixed_timestamp.toISOString()).toBe(fault.fixed_timestamp?.toISOString());
        expect(props.fairway_number).toBe(fault.fairway_number);
        expect(props.state).toBe(fault.state);
        expect(props.type).toBe(fault.type);
        expect(props.aton_type).toBe(fault.aton_type_fi);
    });

}));
