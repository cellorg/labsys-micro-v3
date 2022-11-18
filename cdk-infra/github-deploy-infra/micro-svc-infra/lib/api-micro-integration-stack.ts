import * as cdk from "aws-cdk-lib";
import * as aws_apigateway from "aws-cdk-lib/aws-apigateway";
import { IntegrationOptions, IntegrationType } from "aws-cdk-lib/aws-apigateway";
import * as cdkUtil from '../common/cdkUtil';
import { allEnvConfig } from '../common/allEnvConfig';

export class ApiMicroIntegrationStack extends cdk.Stack {

    constructor(scope: cdk.App,
                id: string,
                targetEnv: string,
                microSvcName: string,
                apiIntegrationType: IntegrationType,
                integrationOptions: IntegrationOptions,
                props?: cdk.StackProps ) {
        super(scope, id, props);

        const nlbDnsName = cdk.Fn.importValue(cdkUtil.exportedNlbDnsName);

        const appEnvPrefix = `${cdkUtil.appPrefix}-${targetEnv}`;

        // look up the previously created API Gateway
        const exportedApiGatewayId = `${appEnvPrefix}${cdkUtil.exportedApiGatewayIdSuffix}`;
        const exportedApiRootId = `${appEnvPrefix}${cdkUtil.exportedApiRootIdSuffix}`;
        const apiGateway = aws_apigateway.RestApi.fromRestApiAttributes(this, exportedApiGatewayId, {
            restApiId: cdk.Fn.importValue(exportedApiGatewayId),
            rootResourceId: cdk.Fn.importValue(exportedApiRootId)
        });

        const envConfig = allEnvConfig[`${targetEnv}`];
        const containerPort = envConfig.NLB_ECS_PORTS[`${microSvcName}`];
        const uriNlb = `http://${nlbDnsName}:${containerPort}/${microSvcName}/{proxy}`;
        const apiIntegration = new aws_apigateway.Integration({
            type: apiIntegrationType,
            integrationHttpMethod: 'ANY',
            options: integrationOptions,
            uri: uriNlb
        });

        const apiResource = apiGateway.root.addResource(microSvcName).addResource('{proxy+}');

        apiResource.addMethod(
            'ANY',
            apiIntegration,
            {
                requestParameters: {
                    'method.request.path.proxy': true
                }
            }
        );

    }
}