import * as cdkUtil from './cdkUtil'
import {HttpApi} from "@aws-cdk/aws-apigatewayv2-alpha";
import * as cdk from "aws-cdk-lib";
import {Construct} from "constructs";

export class SharedApiGatewayStack extends cdk.Stack {
    public readonly apiGateway: HttpApi;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const apiGatewayId = cdkUtil.applicationName + '-apiGateway';
        this.apiGateway = new HttpApi(this, apiGatewayId, {
            apiName: apiGatewayId,
            description: 'Labsys Microservices APIs',
        });
        cdkUtil.tagItem(this.apiGateway, apiGatewayId);
    }
}