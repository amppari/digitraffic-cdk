import {Model, Resource, RestApi} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {Construct} from "@aws-cdk/core";
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {createSubscription} from "../../../common/stack/subscription";
import {dbLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createRestApi} from "../../../common/api/rest_apis";
import {Topic} from "@aws-cdk/aws-sns";
import {createUsagePlan} from "../../../common/stack/usage-plans";
import {KEY_SECRET_ID, KEY_SEND_FAULT_SNS_TOPIC_ARN} from "./lambda/upload-voyage-plan/lambda-upload-voyage-plan";
import {AtonProps} from "./app-props";
import {defaultIntegration, methodResponse} from "../../../common/api/responses";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {MediaType} from "../../../common/api/mediatypes";
import {MessageModel} from "../../../common/api/response";

export function create(
    secret: ISecret,
    sendFaultTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Construct) {

    const integrationApi = createRestApi(
        stack,
        'ATONFaults-Integration',
        'ATON Faults integration API');
    createUsagePlan(integrationApi, 'ATON Faults CloudFront API Key', 'ATON Faults CloudFront Usage Plan');
    const messageResponseModel = integrationApi.addModel('MessageResponseModel', MessageModel);
    createUploadAreaHandler(messageResponseModel, secret, sendFaultTopic, stack, integrationApi, vpc, lambdaDbSg, props);
}

function createUploadAreaHandler(
    messageResponseModel: Model,
    secret: ISecret,
    sendFaultTopic: Topic,
    stack: Construct,
    integrationApi: RestApi,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps) {
    const handler = createHandler(sendFaultTopic, stack, vpc, lambdaDbSg, props);
    secret.grantRead(handler);
    const resource = integrationApi.root.addResource("upload-area")
    createIntegrationResource(messageResponseModel, resource, handler);
    sendFaultTopic.grantPublish(handler);
}

function createIntegrationResource(
    messageResponseModel: Model,
    resource: Resource,
    handler: Function) {

    const integration = defaultIntegration(handler, {
        disableCors: true,
        requestParameters: {
            'integration.request.querystring.callbackEndpoint': 'method.request.querystring.callbackEndpoint',
            'integration.request.querystring.deliveryAckEndPoint': 'method.request.querystring.deliveryAckEndPoint'
        },
        requestTemplates: {
            // transformation from XML to JSON in API Gateway
            // some stuff needs to be quotes, other stuff does not, it's magic
            'application/xml': `{
                "callbackEndpoint": "$util.escapeJavaScript($input.params('callbackEndpoint'))",
                "deliveryAckEndPoint": "$util.escapeJavaScript($input.params('deliveryAckEndPoint'))",
                "voyagePlan": $input.json('$')
            }`
        }
    });
    resource.addMethod("POST", integration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.callbackEndpoint': false,
            'method.request.querystring.deliveryAckEndPoint': false
        },
        methodResponses: [
            methodResponse("200", MediaType.APPLICATION_JSON, messageResponseModel),
            methodResponse("400", MediaType.APPLICATION_JSON, messageResponseModel),
            methodResponse("500", MediaType.APPLICATION_JSON, messageResponseModel)
        ]
    });
}

function createHandler(
    sendFaultTopic: Topic,
    stack: Construct,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
): Function {
    const functionName = 'ATONFaults-UploadVoyagePlan';
    const environment: any = {};
    environment[KEY_SECRET_ID] = props.secretId;
    environment[KEY_SEND_FAULT_SNS_TOPIC_ARN] = sendFaultTopic.topicArn;
    const handler = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName,
        code: new AssetCode('dist/lambda/upload-voyage-plan'),
        handler: 'lambda-upload-voyage-plan.handler',
        environment
    }));
    createSubscription(handler, functionName, props.logsDestinationArn, stack);
    return handler;
}
