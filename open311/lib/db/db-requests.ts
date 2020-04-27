import {ServiceRequestStatus, ServiceRequestWithExtensions} from "../model/service-request";
import {IDatabase} from "pg-promise";

interface ServiceRequestServiceCode {
    readonly service_code: string | null;
}

interface ServiceRequestStatusId {
    readonly status_id: string | null;
}

export function findServiceCodes(db: IDatabase<any, any>): Promise<ServiceRequestServiceCode[]> {
    return db.manyOrNone("SELECT service_code FROM open311_service_request");
}

export function findStateIds(db: IDatabase<any, any>): Promise<ServiceRequestStatusId[]> {
    return db.manyOrNone("SELECT status_id FROM open311_service_request");
}

export function findAll(db: IDatabase<any, any>): Promise<ServiceRequestWithExtensions[]> {
    return db.manyOrNone(`${SELECT_REQUEST} ORDER BY service_request_id`).then(requests => requests.map(r => toServiceRequest(r)));
}

export function find(
    service_request_id: string,
    db: IDatabase<any, any>
): Promise<ServiceRequestWithExtensions | null > {
    return db.oneOrNone(`${SELECT_REQUEST} WHERE service_request_id = $1`, service_request_id).then(r => r == null ? null : toServiceRequest(r));
}

export function update(
    serviceRequests: ServiceRequestWithExtensions[],
    db: IDatabase<any, any>
): Promise<void> {
    return db.tx(t => {
        const queries: any[] = serviceRequests.map(serviceRequest => {
            if (serviceRequest.status == ServiceRequestStatus.closed) {
                return t.none('DELETE FROM open311_service_request WHERE service_request_id = $1', serviceRequest.service_request_id);
            } else {
                return t.none(
                        `INSERT INTO open311_service_request(
                            service_request_id,
                            status,
                            status_notes,
                            service_name,
                            service_code,
                            description,
                            agency_responsible,
                            service_notice,
                            requested_datetime,
                            updated_datetime,
                            expected_datetime,
                            address,
                            address_id,
                            zipcode,
                            geometry,
                            media_url,
                            status_id,
                            vendor_status,
                            title,
                            service_object_id,
                            service_object_type,
                            media_urls)
                         VALUES ($(service_request_id),
                                 $(status),
                                 $(status_notes),
                                 $(service_name),
                                 $(service_code),
                                 $(description),
                                 $(agency_responsible),
                                 $(service_notice),
                                 $(requested_datetime),
                                 $(updated_datetime),
                                 $(expected_datetime),
                                 $(address),
                                 $(address_id),
                                 $(zipcode),
                                 ST_POINT($(long), $(lat)),
                                 $(media_url),
                                 $(status_id),
                                 $(vendor_status),
                                 $(title),
                                 $(service_object_id),
                                 $(service_object_type),
                                 $(media_urls))
                         ON CONFLICT (service_request_id) DO UPDATE SET
                                 status_notes = $(status_notes),
                                     service_name = $(service_name),
                                     service_code = $(service_code),
                                     description = $(description),
                                     agency_responsible = $(agency_responsible),
                                     service_notice = $(service_notice),
                                     requested_datetime = $(requested_datetime),
                                     updated_datetime = $(updated_datetime),
                                     expected_datetime = $(expected_datetime),
                                     address = $(address),
                                     address_id = $(address_id),
                                     zipcode = $(zipcode),
                                     geometry = ST_POINT($(long), $(lat)),
                                     media_url = $(media_url),
                                     status_id = $(status_id),
                                     vendor_status = $(vendor_status),
                                     title = $(title),
                                     service_object_id = $(service_object_id),
                                     service_object_type = $(service_object_type),
                                     media_urls = $(media_urls)
                    `, createEditObject(serviceRequest));
            }
        });
        return t.batch(queries);
    });
}

export function doDelete(
    serviceRequestId: string,
    db: IDatabase<any, any>
) {
    return db.tx(t => {
        return t.none('DELETE FROM open311_service_request WHERE service_request_id = $1', serviceRequestId);
    });
}

const SELECT_REQUEST = `SELECT service_request_id,
                               status,
                               status_notes,
                               service_name,
                               service_code,
                               description,
                               agency_responsible,
                               service_notice,
                               requested_datetime,
                               updated_datetime,
                               expected_datetime,
                               address,
                               address_id,
                               zipcode,
                               ST_X(geometry) AS long,
                               ST_Y(geometry) AS lat,
                               media_url,
                               status_id,
                               vendor_status,
                               title,
                               service_object_id,
                               service_object_type,
                               media_urls
                        FROM open311_service_request`;

function toServiceRequest(r: any): ServiceRequestWithExtensions {
    return {
        service_request_id: r.service_request_id,
        status: r.status,
        status_notes: r.status_notes,
        service_name: r.service_name,
        service_code: r.service_code,
        description: r.description,
        agency_responsible: r.agency_responsible,
        service_notice: r.service_notice,
        requested_datetime: r.requested_datetime,
        updated_datetime: r.updated_datetime,
        expected_datetime: r.expected_datetime,
        address: r.address,
        address_id: r.address_id,
        zipcode: r.zipcode,
        long: r.long,
        lat: r.lat,
        media_url: r.media_url,
        status_id: r.status_id,
        vendor_status: r.vendor_status,
        title: r.title,
        service_object_id: r.service_object_id,
        service_object_type: r.service_object_type,
        media_urls: r.media_urls
    };
}

/**
 * Creates an object with all necessary properties for pg-promise
 */
export function createEditObject(serviceRequest: ServiceRequestWithExtensions): ServiceRequestWithExtensions {
    return Object.assign({
        status_notes: undefined,
        service_name: undefined,
        service_code: undefined,
        agency_responsible: undefined,
        service_notice: undefined,
        updated_datetime: undefined,
        expected_datetime: undefined,
        address: undefined,
        address_id: undefined,
        zipcode: undefined,
        long: undefined,
        lat: undefined,
        media_url: undefined,
        status_id: undefined,
        vendor_status: undefined,
        title: undefined,
        service_object_id: undefined,
        service_object_type: undefined,
        media_urls: undefined
    }, serviceRequest);
}