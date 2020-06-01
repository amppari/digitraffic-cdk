import * as DeviceDB from "../db/db-datex2";
import * as LastUpdatedDB from "../../../common/db/last-updated";
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";

const payloadRegexp = /\<payloadPublication/g;
const situationRegexp = /\<situation/g;

const VS_DATEX2_DATA_TYPE = "VS_DATEX2";

export interface Situation {
    readonly id: string,
    readonly datex2: string,
    readonly effect_date: Date
}

export async function updateDatex2(datex2: string): Promise<any> {
    const start = Date.now();

    if(!validate(datex2)) {
        return {statusCode: 400}
    }

    const situations = parseDatex(datex2);

    await inDatabase(async (db: IDatabase<any,any>) => {
        return await db.tx(t => {
            return t.batch(
                DeviceDB.saveDatex2(db, situations),
                LastUpdatedDB.updateLastUpdated(db, VS_DATEX2_DATA_TYPE, new Date(start))
            );
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=updateDatex2 updatedCount=%d tookMs=%d", situations.length, (end-start));
    })

    return {statusCode: 200};
}

function parseDatex(datex2: string): Situation[] {
    const situations: Situation[] = parseSituations(datex2);

    return situations;
}

function parseSituations(datex2: string): Situation[] {
    const situations: Situation[] = [];
    var index = 0;

    while(true) {
        const sitIndex = datex2.indexOf('<situation ', index)

        if(sitIndex == -1) {
            break;
        }

        const sitEndIndex = datex2.indexOf('</situation>', sitIndex);
        index = sitEndIndex;

        situations.push(parseSituation(datex2.substr(sitIndex, sitEndIndex - sitIndex + 12)));
    }

    return situations;
}

function parseSituation(datex2: string): Situation {
    return {
        id: parseId(datex2),
        datex2: datex2,
        effect_date: parseEffectDate(datex2)
    }
}

function parseId(datex2: string): string {
    const index = datex2.indexOf('version=');
    return datex2.substring(15, index-2);
}

function parseEffectDate(datex2: string): Date {
    const index = datex2.indexOf('<overallStartTime>') + 18;
    const index2 = datex2.indexOf('</overallStartTime>', index);
    const dateString = datex2.substring(index, index2);

    console.log("index=%d index2=%d substring=%s", index, index2, dateString)

    return new Date(dateString);
}

function validate(datex2: string): boolean {
    if(!datex2.includes('<?xml')) {
        console.log('does not contain xml-tag')
        return false;
    }

    const ppCount = occurances(datex2, payloadRegexp);
    if(ppCount != 1) {
        console.log('contains {} payloadPublications', ppCount);
        return false;
    }

    const situationCount = occurances(datex2, situationRegexp);
    if(situationCount < 1) {
        console.log('did not contain any sitations');
        return false;
    }

    return true;
}

function occurances(string: string, regexp: any): number {
    return (string.match(regexp)||[]).length;
}
