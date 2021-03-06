import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from "@aws-cdk/aws-apigateway";

export const ShipSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'PortActivity timestamps ship schema',
    properties: {
        mmsi: {
            type: [JsonSchemaType.NUMBER, JsonSchemaType.STRING, JsonSchemaType.NULL],
            description: 'MMSI'
        },
        imo: {
            type: [JsonSchemaType.NUMBER, JsonSchemaType.STRING, JsonSchemaType.NULL],
            description: 'IMO'
        }
    }
};

export const LocationSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: 'PortActivity timestamps location schema',
    required: ['port'],
    properties: {
        port: {
            type: JsonSchemaType.STRING,
            description: 'Port LOCODE'
        },
        portArea: {
            type: JsonSchemaType.STRING,
            description: 'Port area LOCODE'
        },
        from: {
            type: JsonSchemaType.STRING,
            description: 'Previous port area LOCODE'
        },
    }
};

export function createTimestampSchema(shipReference: string, locationReference: string): JsonSchema {
    return {
        schema: JsonSchemaVersion.DRAFT4,
        type: JsonSchemaType.OBJECT,
        description: 'PortActivity timestamps schema',
        required: [
            'eventType',
            'eventTime',
            'recordTime',
            'source',
            'ship',
            'location'
        ],
        properties: {
            eventType: {
                type: JsonSchemaType.STRING,
                enum: ['ATB', 'ETA', 'ETD', 'ATA'],
                description: 'Event type: ATB, ETA, ETD, ATA'
            },
            eventTime: {
                type: JsonSchemaType.STRING,
                description: 'Event time in ISO 8601 date format'
            },
            eventTimeConfidenceLower: {
                type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
                description: 'Event time confidence, lower. ISO 8601 formatted duration'
            },
            eventTimeConfidenceUpper: {
                type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
                description: 'Event time confidence, upper. ISO 8601 formatted duration'
            },
            recordTime: {
                type: JsonSchemaType.STRING,
                description: 'Timestamp of event creation in ISO 8601 date format'
            },
            source: {
                type: JsonSchemaType.STRING,
                description: 'Event source'
            },
            ship: {
                ref: shipReference
            },
            location: {
                ref: locationReference
            },
            portcallId: {
                type: [JsonSchemaType.NUMBER, JsonSchemaType.NULL],
                description: 'ID of Portnet port call'
            },
        }
    };
}
