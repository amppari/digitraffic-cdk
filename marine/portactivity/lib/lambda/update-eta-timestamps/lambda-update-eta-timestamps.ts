import {getPortAreaGeometries, Port} from '../../service/portareas';
import {findETAShipsByLocode} from '../../service/timestamps';
import {updateETATimestamps} from '../../service/etas';
import {SNS} from 'aws-sdk';
import {DbETAShip} from "../../db/db-timestamps";
import {ShipETA} from "../../api/api-etas";
import {withDbSecret} from "../../../../../common/secrets/dbsecret";

export const KEY_ENDPOINT_CLIENT_ID = 'ENDPOINT_CLIENT_ID'
export const KEY_ENDPOINT_CLIENT_SECRET = 'ENDPOINT_CLIENT_SECRET'
export const KEY_ENDPOINT_AUDIENCE = 'ENDPOINT_AUDIENCE'
export const KEY_ENDPOINT_AUTH_URL = 'ENDPOINT_AUTH_URL'
export const KEY_ENDPOINT_URL = 'ENDPOINT_URL'
export const KEY_ESTIMATE_SOURCE = 'ESTIMATE_SOURCE'
export const KEY_ESTIMATE_SNS_TOPIC_ARN = 'ESTIMATE_SNS_TOPIC_ARN';

const endpointClientId = process.env[KEY_ENDPOINT_CLIENT_ID] as string;
const endpointClientSecret = process.env[KEY_ENDPOINT_CLIENT_SECRET] as string;
const endpointClientAudience = process.env[KEY_ENDPOINT_AUDIENCE] as string;
const endpointAuthUrl = process.env[KEY_ENDPOINT_AUTH_URL] as string;
const endpointUrl = process.env[KEY_ENDPOINT_URL] as string;
const endpointSource = process.env[KEY_ESTIMATE_SOURCE] as string;
const snsTopicArn = process.env[KEY_ESTIMATE_SNS_TOPIC_ARN] as string;

const portAreaGeometries = getPortAreaGeometries();
const locodes = portAreaGeometries.map(p => p.locode);

export function handlerFn(
    withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>) => Promise<any>,
    sns: SNS,
    doUpdateETATimestamps: (
        endpointClientId: string,
        endpointClientSecret: string,
        endpointClientAudience: string,
        endpointAuthUrl: string,
        endpointUrl: string,
        endpointSource: string,
        ships: DbETAShip[],
        portAreaGeometries: Port[]) => Promise<ShipETA[]>
): () => Promise<any> {

    return async () => {
        return withDbSecretFn(process.env.SECRET_ID as string, async (_: any): Promise<any> => {
            const ships = await findETAShipsByLocode(locodes);

            if (ships.length) {
                console.log('About to fetch ETAs for ships:', ships);
                const etas = await doUpdateETATimestamps(endpointClientId,
                    endpointClientSecret,
                    endpointClientAudience,
                    endpointAuthUrl,
                    endpointUrl,
                    endpointSource,
                    ships,
                    portAreaGeometries);

                await sns.publish({
                    Message: JSON.stringify(etas.map(eta => ({
                        ship_mmsi: eta.mmsi,
                        ship_imo: eta.imo,
                        location_locode: eta.locode,
                        portcall_id: eta.portcall_id
                    }))),
                    TopicArn: snsTopicArn
                }).promise();
            } else {
                console.log('No ships for ETA update');
            }
        });
    };
}

export const handler = handlerFn(withDbSecret, new SNS(), updateETATimestamps);