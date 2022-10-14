#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as cdkUtil from '../lib/cdkUtil';
import { SharedInfraStack } from '../lib/shared-infra-stack';
import { SharedApiGatewayStack } from '../lib/shared-apigateway-stack';
import { ServiceInfraStackProps } from '../lib/micro-svc-stacks';
import { MicroSvcStack } from '../lib/micro-svc-stacks';
import {SharedVpcStack} from "../lib/shared-vpc-stack";

const accountRegionEnv = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION //'us-east-1'
};

const app = new cdk.App();

new SharedVpcStack(app, cdkUtil.sharedInfraStackId, {
    env: accountRegionEnv,
});

new SharedApiGatewayStack(app, cdkUtil.sharedApiGatewayStackId, {
    env: accountRegionEnv,
});

const sharedInfraStack = new SharedInfraStack(app, cdkUtil.sharedInfraStackId, {
    env: accountRegionEnv
});

const svcProps : ServiceInfraStackProps = {
    env: accountRegionEnv,
    vpcLink: sharedInfraStack.vpcLink,
    dnsNamespace: sharedInfraStack.dnsNamespace,
    securityGroup: sharedInfraStack.securityGroup
}

new MicroSvcStack(
    app,
    cdkUtil.applicationName + '-microa-stack',
    svcProps,
    'microa'
);

new MicroSvcStack(
    app,
    cdkUtil.applicationName + '-animal-stack',
    svcProps,
    'animal'
);



