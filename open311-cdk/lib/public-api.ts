import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
const lambda = require('@aws-cdk/aws-lambda');
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import * as TestStackProps from "./stackprops-test";
import {Construct} from "@aws-cdk/core";

export function create(stack: Construct) {
    const publicApi = new apigateway.RestApi(stack, 'Open311-public', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Open311 public API',
        endpointTypes: [EndpointType.PRIVATE],
        policy: new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "execute-api:Invoke"
                    ],
                    resources: [
                        "*"
                    ],
                    conditions: {
                        "StringEquals": {
                            "aws:sourceVpc": TestStackProps.default.vpcId
                        }
                    },
                    principals: [
                        new iam.AnyPrincipal()
                    ]
                })
            ]
        })
    });

    const getRequestsHandler = new lambda.Function(stack, 'GetRequestsLambda', {
        code: new lambda.AssetCode('lib'),
        handler: 'get-requests.handler',
        runtime: lambda.Runtime.NODEJS_10_X
    });
    const getRequestsIntegration = new LambdaIntegration(getRequestsHandler);
    const requests = publicApi.root.addResource("requests");
    requests.addMethod("GET", getRequestsIntegration);

    const getRequestHandler = new lambda.Function(stack, 'GetRequestLambda', {
        code: new lambda.AssetCode('lib'),
        handler: 'get-request.handler',
        runtime: lambda.Runtime.NODEJS_10_X
    });
    const getRequestIntegration = new LambdaIntegration(getRequestHandler);
    const request = requests.addResource("{request_id}")
    request.addMethod("GET", getRequestIntegration)
}
