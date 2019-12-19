import "source-map-support/register";
import {
    Context,
    KinesisStreamEvent,
    KinesisStreamRecord,
    CloudWatchLogsDecodedData
} from "aws-lambda";

import * as AWSx from "aws-sdk";
const AWS = AWSx as any;
const zlib = require("zlib");

const esDomain = {
    region: process.env.AWS_REGION,
    endpoint: process.env.ES_ENDPOINT
};

const knownAccounts: [
    { accountNumber: string; env: string; app: string }
] = JSON.parse(process.env.KNOWN_ACCOUNTS as string);

const endpoint = new AWS.Endpoint(esDomain.endpoint);
const creds = new AWS.EnvironmentCredentials("AWS");

export const handler = (event: KinesisStreamEvent, context: Context): void => {
    event.Records.forEach(function(record: KinesisStreamRecord) {
        let zippedInput = Buffer.from(record.kinesis.data, "base64");

        // decompress the input
        zlib.gunzip(zippedInput, function(error: any, buffer: any) {
            if (error) {
                context.fail(error);
                return;
            }

            // parse the input from JSON
            let awslogsData: CloudWatchLogsDecodedData = JSON.parse(
                buffer.toString("utf8")
            );

            // transform the input to Elasticsearch documents
            let elasticsearchBulkData = transform(awslogsData);

            // skip control messages
            if (!elasticsearchBulkData) {
                console.log("Received a control message");
                context.succeed("Control message handled successfully");
                return;
            }
            postToES(elasticsearchBulkData, context);
        });
    });
};

function postToES(doc: string, context: Context) {
    let req = new AWS.HttpRequest(endpoint);

    req.method = "POST";
    req.path = "/_bulk";
    req.region = esDomain.region;
    req.headers["presigned-expires"] = false;
    req.headers["Host"] = endpoint.host;
    req.body = doc;
    req.headers["Content-Type"] = "application/json";

    let signer = new AWS.Signers.V4(req, "es");
    signer.addAuthorization(creds, new Date());

    let send = new AWS.NodeHttpClient();
    send.handleRequest(
        req,
        null,
        function(httpResp: any) {
            let respBody = "";
            httpResp.on("data", function(chunk: any) {
                respBody += chunk;
            });
            httpResp.on("end", function(chunk: any) {
                console.log("Response: " + respBody);
                context.succeed("Lambda added document " + doc);
            });
        },
        function(err: any) {
            console.log("Error: " + err);
            context.fail("Lambda failed with error " + err);
        }
    );
}

function transform(payload: CloudWatchLogsDecodedData) {
    if (payload.messageType === "CONTROL_MESSAGE") {
        return null;
    }

    let bulkRequestBody = "";

    payload.logEvents.forEach(logEvent => {
        if (isLambdaLifecycleEvent(logEvent.message)) {
            return;
        }

        const env = getEnvFromSenderAccount(payload.owner);
        const timestamp = new Date(1 * logEvent.timestamp);
        const year = timestamp.getUTCFullYear();
        const month = ("0" + (timestamp.getUTCMonth() + 1)).slice(-2);

        const indexName = `aws-${env}-${year}.${month}`;

        let source = buildSource(logEvent.message, logEvent.extractedFields) as any;
        source["id"] = logEvent.id;
        source["@timestamp"] = new Date(1 * logEvent.timestamp).toISOString();
        source["message"] = logEvent.message;
        source["log_group"] = payload.logGroup;
        source["app"] = getAppFromSenderAccount(payload.owner);

        let action = { index: { _id: logEvent.id, _index: null } } as any;
        action.index._index = indexName;
        action.index._type = 'doc';

        bulkRequestBody +=
            [JSON.stringify(action), JSON.stringify(source)].join("\n") + "\n";
    });
    return bulkRequestBody;
}

function isLambdaLifecycleEvent(message: string) {
    return message.startsWith('START RequestId') || message.startsWith('END RequestId') || message.startsWith('REPORT RequestId');
}

function buildSource(message: string, extractedFields: { [key: string]: string } | undefined): any {
    let jsonSubString: any;

    message = message.replace("[, ]", "[0.0,0.0]")
    message = message
        .replace(/\n/g, "\\n")
        .replace(/\'/g, "\\'")
        .replace(/\"/g, '\\"')
        .replace(/\&/g, "\\&")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
        .replace(/\b/g, "\\b")
        .replace(/\f/g, "\\f");

    if (extractedFields) {
        let source = new Array() as any;

        for (let key in extractedFields) {
            if (extractedFields.hasOwnProperty(key) && extractedFields[key]) {
                let value = extractedFields[key];

                if (isNumeric(value)) {
                    source[key] = 1 * (value as any);
                    continue;
                }

                jsonSubString = extractJson(value);
                if (jsonSubString !== null) {
                    source["$" + key] = JSON.parse(jsonSubString);
                }

                source[key] = value;
            }
        }
        source.message = message;
        return source;
    }
    message = message.replace("[, ]", "[0.0,0.0]");
    message = message
        .replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");
    jsonSubString = extractJson(message);
    if (jsonSubString !== null) {
        return JSON.parse(jsonSubString);
    } else {
        try {
            return JSON.parse('{"log_line": "' + message.replace(/["']/g, "") + '"}');
        } catch (ignored) {

        }
    }

    return {};
}

function extractJson(message: string): any {
    let jsonStart = message.indexOf("{");
    if (jsonStart < 0) return null;
    let jsonSubString = message.substring(jsonStart);
    return isValidJson(jsonSubString) ? jsonSubString : null;
}

function isValidJson(message: string): boolean {
    try {
        JSON.parse(message);
    } catch (e) {
        return false;
    }
    return true;
}

function isNumeric(n: any) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function getEnvFromSenderAccount(owner: string) {
    // @ts-ignore
    return knownAccounts.find(value => {
        if (value.accountNumber === owner) {
            return true;
        }
    }).env;
}

function getAppFromSenderAccount(owner: string) {
    // @ts-ignore
    return knownAccounts.find(value => {
        if (value.accountNumber === owner) {
            return true;
        }
    })?.app;
}