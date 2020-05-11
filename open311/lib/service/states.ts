import {IConnected} from "pg-promise";
import {findAll as dbFindAll, update as dbUpdate} from '../db/db-states';
import {inDatabase2} from "digitraffic-lambda-postgres/database";
import {ServiceRequestState} from "../model/service-request-state";

export async function findAll(dbParam?: IConnected<any, any>): Promise<ServiceRequestState[]> {
    return inDatabase2(async (db: IConnected<any, any>) => {
        return await dbFindAll(db);
    }, dbParam);
}

export async function update(
    states: ServiceRequestState[],
    dbParam?: IConnected<any, any>
): Promise<void> {
    return inDatabase2(async (db: IConnected<any, any>) => {
        return await dbUpdate(states, db);
    }, dbParam);
}
