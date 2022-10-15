import * as cdkUtil from './cdkUtil'
import * as cdk from 'aws-cdk-lib';
import { aws_ec2 } from 'aws-cdk-lib';
import {exportedApiGatewayId} from "./cdkUtil";

export class SharedVpcStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new aws_ec2.Vpc(this, cdkUtil.vpcId, {
            vpcName: cdkUtil.vpcId,
            maxAzs: cdkUtil.maxAzs,
        });
        cdkUtil.tagItem(vpc, cdkUtil.vpcId);

        // new cdk.CfnOutput(this, cdkUtil.exportedVpcId, {
        //     exportName: cdkUtil.exportedVpcId,
        //     value: vpc.vpcId,
        // });
    }
}
