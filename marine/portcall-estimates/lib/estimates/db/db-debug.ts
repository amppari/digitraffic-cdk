import {IDatabase, PreparedStatement} from "pg-promise";
import {EventType} from "../model/estimate";
import {ESTIMATES_BEFORE, ESTIMATES_IN_THE_FUTURE} from "./db-estimates";

export interface DbDebugShiplist {
    readonly event_type: EventType
    readonly event_time: Date
    readonly event_source: string
    readonly ship_name: string
}

const SELECT_BY_LOCODE_DEBUG = `
    SELECT DISTINCT
        pe.event_type,
        pe.event_time,
        pe.event_source,
        COALESCE(v.name, pc.vessel_name, 'Unknown') as ship_name
    FROM portcall_estimate pe
             LEFT JOIN vessel v on v.imo = pe.ship_imo
             LEFT JOIN port_call pc on pc.imo_lloyds = pe.ship_imo
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM portcall_estimate px
              WHERE px.event_type = pe.event_type AND
                  px.location_locode = pe.location_locode AND
                  px.ship_imo = pe.ship_imo AND
                  px.event_source = pe.event_source AND
                  CASE WHEN px.portcall_id IS NOT NULL AND pe.portcall_id IS NOT NULL
                  THEN px.portcall_id = pe.portcall_id
                  ELSE DATE(px.event_time) = DATE(pe.event_time)
                  END
          ) AND
        pe.event_time > NOW() AND
        pe.event_time < CURRENT_DATE + INTERVAL '3 DAYS' AND
        pe.location_locode = $1
    ORDER BY pe.event_time
`;

export function findByLocodeDebug(
    db: IDatabase<any, any>,
    locode: string
): Promise<DbDebugShiplist[]> {
    const ps = new PreparedStatement({
        name: 'find-by-locode-debug',
        text: SELECT_BY_LOCODE_DEBUG,
        values: [locode]
    });
    return db.tx(t => t.manyOrNone(ps));
}
