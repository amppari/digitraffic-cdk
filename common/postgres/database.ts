import {IConnected, IDatabase, ILostContext} from "pg-promise";

const pgp = require('pg-promise')();

export function initDbConnection(
    username: string,
    password: string,
    url: string,
    options?: object
): IDatabase<any, any> {
    return pgp(`postgresql://${username}:${password}@${url}`, options);
}

let db: IDatabase<any, any>;

export async function inDatabase(
    fn: (db: IDatabase<any, any>) => any,
    dbParam?: IDatabase<any, any>)
{
    db = db ?? dbParam ?? initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );
    try {
        return await fn(db);
    } catch(e) {
        console.error("Error in db:", e);
    }
}

export async function initDbConnection2(
    username: string,
    password: string,
    url: string,
    options?: object
): Promise<ConnectionAndDb> {
    db = pgp(`postgresql://${username}:${password}@${url}`, options);
    await reconnect();
    sendNotifications();
    return {
        conn: connection!!,
        db: db
    };
}

export interface ConnectionAndDb {
    readonly conn: IConnected<any, any>;
    readonly db: IDatabase<any, any>;
}

let connection: IConnected<any, any> | undefined | null; // global connection for permanent event listeners

function onNotification(data: any) {
    console.log('Received Payload:', data.payload);
}

function setListeners(client: any) {
    client.on('notification', onNotification);
    return connection!!.none('LISTEN $1~', 'my-channel')
        .catch(error => {
            console.log(error); // unlikely to ever happen
        });
}

function removeListeners(client: any) {
    client.removeListener('notification', onNotification);
}

function onConnectionLost(err: Error, e: ILostContext) {
    console.log('Connectivity Problem:', err);
    connection = null; // prevent use of the broken connection
    removeListeners(e.client);
    reconnect(5000, 10) // retry 10 times, with 5-second intervals
        .then(() => {
            console.log('Successfully Reconnected');
        })
        .catch(() => {
            // failed after 10 attempts
            console.error('Connection Lost Permanently');
            process.exit(); // exiting the process
        });
}

function reconnect(delay?: any, maxAttempts?: any) {
    delay = delay > 0 ? parseInt(delay) : 0;
    maxAttempts = maxAttempts > 0 ? parseInt(maxAttempts) : 1;
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            db.connect({direct: true, onLost: onConnectionLost})
                .then(obj => {
                    connection = obj; // global connection is now available
                    resolve(obj);
                    return setListeners(obj.client);
                })
                .catch(error => {
                    console.log('Error Connecting:', error);
                    if (--maxAttempts) {
                        reconnect(delay, maxAttempts)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(error);
                    }
                });
        }, delay);
    });
}

function sendNotifications() {
    // send a notification to our listener every second:
    setInterval(() => {
        if (connection) {
            connection.none('NOTIFY $1~, $2', ['my-channel', 'my payload string'])
                .catch(error => {
                    console.log('Failed to Notify:', error); // unlikely to ever happen
                })
        }
    }, 1000);
}

export async function inDatabase2(
    fn: (db: IConnected<any, any>) => any,
    dbParam?: IConnected<any, any>)
{
    db = db ?? dbParam ?? await initDbConnection2(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );
    try {
        return await fn(connection as IConnected<any, any>);
    } catch(e) {
        console.error("Error in db:", e);
    }
}
