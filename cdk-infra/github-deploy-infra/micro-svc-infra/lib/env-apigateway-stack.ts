import * as cdkUtil from '../common/cdkUtil';
import * as cdk from 'aws-cdk-lib';
import { aws_apigateway, aws_iam } from 'aws-cdk-lib';
import { InterfaceVpcEndpoint } from 'aws-cdk-lib/aws-ec2';
import { Deployment, RestApi } from 'aws-cdk-lib/aws-apigateway';

export class EnvApigatewayStack extends cdk.Stack {

    constructor(scope: cdk.App, id: string, targetEnv:string, vpcEndpoint: InterfaceVpcEndpoint,
                apiResourcePolicy: aws_iam.PolicyDocument, props?: cdk.StackProps) {
        super(scope, id, props);

        const appEnvPrefix = `${cdkUtil.appPrefix}-${targetEnv}`;

        const apiGatewayName = `${appEnvPrefix}-apiGateway`;
        const apiDescription = `Labsys Microservices private APIs, updated at ${cdkUtil.timeStampStr()}`;
        const apiGateway = new RestApi(this, apiGatewayName, {
            restApiName: apiGatewayName,
            description: apiDescription,
            endpointConfiguration: {
                types: [aws_apigateway.EndpointType.PRIVATE],
                vpcEndpoints: [vpcEndpoint]
            },
            policy: apiResourcePolicy,
            deploy: false,
            //cloudWatchRole: true,
        });
        cdkUtil.tagItem(apiGateway, apiGatewayName);

        apiGateway.root.addMethod('ANY');

        const deploymentId = appEnvPrefix + '-api-deployment-' + cdkUtil.timeStampStr();
        const deployment = new Deployment(this, deploymentId, {api: apiGateway});
        (deployment as any).resource.stageName = targetEnv;

        const exportedApiGatewayId = appEnvPrefix + cdkUtil.exportedApiGatewayIdSuffix;
        new cdk.CfnOutput(this, exportedApiGatewayId, {
            exportName: exportedApiGatewayId,
            value: apiGateway.restApiId,
        });

        const exportedApiRootId = appEnvPrefix + cdkUtil.exportedApiRootIdSuffix;
        new cdk.CfnOutput(this, exportedApiRootId, {
            exportName: exportedApiRootId,
            value: apiGateway.restApiRootResourceId,
        });

        const exportedApiUrl = appEnvPrefix + '-apiUrl-export';
        new cdk.CfnOutput(this, exportedApiUrl, {
            value: `https://${apiGateway.restApiId}-${vpcEndpoint.vpcEndpointId}.execute-api.${this.region}.amazonaws.com/${targetEnv}`,
            exportName: exportedApiUrl,
            description: 'This is the api url that needs to be invoked from an ec2 instance or corporate vpn',
        });
    }
}

