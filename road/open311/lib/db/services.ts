import {Service} from "../model/service";
import {IDatabase, PreparedStatement} from "pg-promise";

const DELETE_SERVICES_PS = new PreparedStatement({
    name: 'delete-service',
    text: 'DELETE FROM open311_service'
});

const INSERT_SERVICE_PS = new PreparedStatement({
    name: 'insert-service',
    text: `INSERT INTO open311_service(
               service_code,
               service_name,
               description,
               metadata,
               type,
               keywords,
               "group")
           VALUES (
               $1,
               $2,
               $3,
               $4::boolean,
               $5,
               $6,
               $7)`
});

const SELECT_SERVICES_PS = new PreparedStatement({
    name: 'select-services',
    text: `SELECT service_code,
                  service_name,
                  description,
                  metadata,
                  type,
                  keywords,
                  "group"
           FROM open311_service ORDER BY service_code`
});

const SELECT_SERVICE_BY_CODE_PS = new PreparedStatement({
    name: 'select-service-by-code',
    text: `SELECT service_code,
                  service_name,
                  description,
                  metadata,
                  type,
                  keywords,
                  "group"
           FROM open311_service WHERE service_code = $1`
});

const SELECT_SERVICE_CODES_PS = new PreparedStatement({
    name: 'select-servicecodes',
    text: 'SELECT service_code FROM open311_service'
});

interface ServiceServiceCode {
    readonly service_code: string;
}

export function update(
    services: Service[],
    db: IDatabase<any, any>
): Promise<void> {
    return db.tx(t => {
        t.none(DELETE_SERVICES_PS);
        const queries: any[] = services.map(service => {
            return t.none(INSERT_SERVICE_PS, createEditObject(service));
        });
        return t.batch(queries);
    });
}

export function findAllServiceCodes(db: IDatabase<any, any>): Promise<ServiceServiceCode[]> {
    return db.manyOrNone(SELECT_SERVICE_CODES_PS);
}

export function findAll(db: IDatabase<any, any>): Promise<Service[]> {
    return db.manyOrNone(SELECT_SERVICES_PS).then(requests => requests.map(r => toService(r)));
}

export function find(
    service_request_id: string,
    db: IDatabase<any, any>
): Promise<Service | null > {
    return db.oneOrNone(SELECT_SERVICE_BY_CODE_PS, [service_request_id]).then(r => r == null ? null : toService(r));
}

function toService(s: any): Service {
    return {
        service_code: s.service_code,
        service_name: s.service_name,
        description: s.description,
        metadata: s.metadata,
        type: s.type,
        keywords: s.keywords,
        group: s.group
    };
}


/**
 * Creates an object with all necessary properties for pg-promise
 */
function createEditObject(service: Service): any[] {
    const editObject = { ...{
        service_code: undefined,
        service_name: undefined,
        description: undefined,
        metadata: undefined,
        type: undefined,
        keywords: undefined,
        group: undefined
    }, ...service};

    // ordering is important!
    const ret = [];
    ret.push(editObject.service_code);
    ret.push(editObject.service_name);
    ret.push(editObject.description);
    ret.push(editObject.metadata);
    ret.push(editObject.type);
    ret.push(editObject.keywords);
    ret.push(editObject.group);

    return ret;
}