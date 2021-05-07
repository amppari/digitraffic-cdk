import {IDatabase, PreparedStatement} from "pg-promise";
import {Pilotage} from "../model/pilotage";

const GET_ACTIVE_PILOTAGE_TIMESTAMPS = 'select id, schedule_updated from pilotage where state != \'FINISHED\'';
const GET_ACTIVE_PILOTAGE_TIMESTAMPS_PS = new PreparedStatement({
    name: 'get-active-pilotage-timestamps',
    text: GET_ACTIVE_PILOTAGE_TIMESTAMPS
});

const UPSERT_PILOTAGES = `insert into pilotage(id, vessel_imo, vessel_mmsi, vessel_eta, pilot_boarding_time, pilotage_end_time, schedule_updated, schedule_source, state, vessel_name, start_code, start_berth, end_code, end_berth)
values($(id), $(vesselImo), $(vesselMmsi), $(vesselEta), $(pilotBoardingTime), $(endTime), $(scheduleUpdated), $(scheduleSource), $(state), $(vesselName), $(routeStart), $(routeStartBerth), $(routeEnd), $(routeEndBerth))
on conflict(id) do update set
    pilot_boarding_time = $(pilotBoardingTime),
    pilotage_end_time = $(endTime),
    schedule_updated = $(scheduleUpdated),
    state = $(state)
`;

const DELETE_PILOTAGES = 'delete from pilotage where id in ($1:list)';

export type DbPilotageTimestamp = {
    readonly id: number,
    readonly schedule_updated: Date
}

export type TimestampMap = {
    [key: number]: string
}

export async function getTimestamps(db: IDatabase<any, any>): Promise<TimestampMap> {
    const timestamps = await db.manyOrNone(GET_ACTIVE_PILOTAGE_TIMESTAMPS_PS) as DbPilotageTimestamp[];
    const idMap = {} as TimestampMap;

    timestamps.forEach(ts => idMap[ts.id] = ts.schedule_updated.toISOString());

    return idMap;
}

export async function updatePilotages(db: IDatabase<any, any>, pilotages: Pilotage[]): Promise<any> {
    if(pilotages && pilotages.length > 0) {
        return await Promise.all(pilotages.map(pilotage => db.none(UPSERT_PILOTAGES, {
            id: pilotage.id,
            vesselImo: pilotage.vessel.imo,
            vesselMmsi: pilotage.vessel.mmsi,
            vesselEta: pilotage.vesselEta,
            pilotBoardingTime: pilotage.pilotBoardingTime,
            endTime: pilotage.endTime,
            scheduleUpdated: pilotage.scheduleUpdated,
            scheduleSource: pilotage.scheduleSource,
            state: pilotage.state,
            vesselName: pilotage.vessel.name,
            routeStart: pilotage.route.start.code,
            routeStartBerth: pilotage.route.start.berth?.code,
            routeEnd: pilotage.route.end.code,
            routeEndBerth: pilotage.route.end.berth?.code,
        })));
    }

    return Promise.resolve();
}

export async function deletePilotages(db: IDatabase<any, any>, pilotageIds: number[]): Promise<any> {
    if(pilotageIds && pilotageIds.length > 0) {
        return db.none(DELETE_PILOTAGES, [pilotageIds]);
    }

    return Promise.resolve();
}