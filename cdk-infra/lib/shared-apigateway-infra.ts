import * as cdkUtil from './cdkUtil'
import {HttpApi, HttpMethod} from "@aws-cdk/aws-apigatewayv2-alpha";
import * as cdk from "aws-cdk-lib";
import {Construct} from "constructs";
import * as apigatewayv2_integrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as cloudmap from 'aws-cdk-lib/aws-servicediscovery';

export interface ApiGwStackProps extends cdk.StackProps {
    vpcLink: apigatewayv2.VpcLink
}

export class SharedApiGatewayStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: ApiGwStackProps,
                cloudMapSvcArray: { micorSvcName: string; cloudMapSvc: cloudmap.Service; }[]) {
        super(scope, id, props);

        const vpcLink = props.vpcLink;

        const apiGatewayId = cdkUtil.applicationName + '-apiGateway';
        const apiGateway = new HttpApi(this, apiGatewayId, {
            apiName: apiGatewayId,
            description: 'Labsys Microservices APIs',
        });
        cdkUtil.tagItem(apiGateway, apiGatewayId);

        for (const i of cloudMapSvcArray) {
            const microSvcName = i.micorSvcName;
            const cloudMapSvc = i.cloudMapSvc;
            apiGateway.addRoutes({
                integration: new apigatewayv2_integrations.HttpServiceDiscoveryIntegration(
                    microSvcName + '-ServiceDiscoveryIntegration',
                    cloudMapSvc,
                    {
                        vpcLink: vpcLink,
                    },
                ),
                path: '/' + microSvcName + '/{proxy+}',
                methods: [HttpMethod.ANY],
            });
        }

    }

}