import {getDocumentClient} from 'digitraffic-dynamodb/dynamodb';
import {DocumentClient} from "aws-sdk/clients/dynamodb";

const ddb = getDocumentClient();

// export for testing, same instance is required
export const _ddb: DocumentClient = ddb;

export const SUBSCRIPTIONS_TABLE_NAME = "PortcallEstimates.Subscriptions";
export const SUBSCRIPTIONS_PHONENUMBER_IDX_NAME = 'PortcallEstimateSubscriptions_PhoneNumber_Idx';
export const SUBSCRIPTIONS_TIME_IDX_NAME = 'PortcallEstimateSubscriptions_Time_Idx';
export const SUBSCRIPTIONS_LOCODE_IDX_NAME = 'PortcallEstimateSubscriptions_Locode_Idx';
export const SUBSCRIPTION_ID_ATTRIBUTE = "ID";

export interface DbSubscription {
    readonly ID: string
    readonly PhoneNumber: string
    readonly Locode: string
    readonly Time: string
    readonly Type: string
    readonly ShipsToNotificate?: any
}

export async function listSubscriptionsForLocode(locode: string): Promise<any> {
    return await ddb.query({
        TableName: SUBSCRIPTIONS_TABLE_NAME,
        IndexName: SUBSCRIPTIONS_LOCODE_IDX_NAME,
        ExpressionAttributeValues: {
            ":Locode": locode
        },
        KeyConditionExpression: 'Locode = :Locode'
    }).promise();
}

export async function listSubscriptionsForTime(time: string): Promise<any> {
    return await ddb.query({
        TableName: SUBSCRIPTIONS_TABLE_NAME,
        IndexName: SUBSCRIPTIONS_TIME_IDX_NAME,
        ExpressionAttributeValues: {
            ":Time": time
        },
        ExpressionAttributeNames: {
            "#time": "Time"
        },
        KeyConditionExpression: '#time = :Time'
    }).promise();
}

export async function getSubscriptionList(destinationNumber: string): Promise<any> {
    return await ddb.query({
        TableName: SUBSCRIPTIONS_TABLE_NAME,
        IndexName: SUBSCRIPTIONS_PHONENUMBER_IDX_NAME,
        ExpressionAttributeValues: {
            ":PhoneNumber": destinationNumber
        },
        KeyConditionExpression: 'PhoneNumber = :PhoneNumber'
    }).promise();
}

export async function insertSubscription(item: DbSubscription): Promise<any> {
    const params = {
        TableName: SUBSCRIPTIONS_TABLE_NAME,
        Item: item
    };

    return ddb.put(params).promise();
}

export async function updateNotifications(id: string, notifications: any): Promise<any> {
    return ddb.update({
        TableName: SUBSCRIPTIONS_TABLE_NAME,
        Key: {
            ID: id
        },
        UpdateExpression: "set ShipsToNotificate = :notificate",
        ExpressionAttributeValues: {
            ":notificate": notifications
        }
    }, (err: any, data: any) => {
        if (err) console.info(err, err.stack); // an error occurred
        else console.info(data);
    }).promise();
}