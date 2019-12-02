import {ServiceRequest, ServiceRequestStatus} from "../../lib/model/service-request";

export function newServiceRequest(): ServiceRequest {
    const requested_datetime = new Date();
    requested_datetime.setMilliseconds(0);
    const updated_datetime = new Date();
    updated_datetime.setMilliseconds(0);
    const expected_datetime = new Date();
    expected_datetime.setMilliseconds(0);
    return {
        service_request_id: "SRQ" + Math.random().toFixed(10).split('.')[1],
        status: Math.floor(Math.random() * 10) > 5 ? ServiceRequestStatus.open : ServiceRequestStatus.closed,
        status_notes: "status_notes",
        service_name: "service_name",
        service_code: "123",
        description: "some description",
        agency_responsible: "some agency",
        service_notice: "some notice",
        requested_datetime,
        updated_datetime,
        expected_datetime,
        address: "some address",
        address_id: "2",
        zipcode: "123456",
        geometry: {
            long: 1,
            lat: 2
        },
        media_url: "some url"
    };
}
