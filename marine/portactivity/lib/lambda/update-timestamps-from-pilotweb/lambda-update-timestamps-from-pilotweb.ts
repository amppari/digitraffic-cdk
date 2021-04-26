import {withSecret} from "../../../../../common/secrets/secret";
import {sendMessage} from "../../service/queue-service";
import * as PilotwebService from "../../service/pilotweb";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";

export const handler = async function () {
    return withSecret(process.env[PortactivityEnvKeys.SECRET_ID] as string, async (secret: any) => {
        const pilotwebUrl = secret[PortactivitySecretKeys.PILOTWEB_URL];
        const authHeader = secret[PortactivitySecretKeys.PILOTWEB_AUTH];
        const sqsQueueUrl = secret[PortactivitySecretKeys.PORTACTIVITY_QUEUE];

        const timestamps = await PilotwebService.getMessagesFromPilotweb(pilotwebUrl, authHeader);

        console.info("sending %d messages", timestamps.length);

        timestamps.forEach(ts => sendMessage(ts, sqsQueueUrl));
    });
}