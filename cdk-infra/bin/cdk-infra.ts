#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as cdkUtil from '../lib/cdkUtil';
import { SharedInfraStack } from '../lib/shared-infra-stack';
import { SharedApiGatewayStack } from '../lib/shared-apigateway-infra';
import { ServiceInfraStackProps } from '../lib/cdkUtil';
const svcStacks = require('../lib/micro-svc-stacks');

const accountRegionEnv = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION //'us-east-1'
};

const app = new cdk.App();

const sharedApiGatewayStack = new SharedApiGatewayStack(app, cdkUtil.sharedApiGatewayStackId, {
    env: accountRegionEnv
});

const sharedInfraStack = new SharedInfraStack(app, cdkUtil.sharedInfraStackId, {
    env: accountRegionEnv
});

const svcProps : ServiceInfraStackProps = {
    env: accountRegionEnv,
    apiGateway: sharedApiGatewayStack.apiGateway,
    vpc: sharedInfraStack.vpc,
    vpcLink: sharedInfraStack.vpcLink,
    dnsNamespace: sharedInfraStack.dnsNamespace,
    securityGroup: sharedInfraStack.securityGroup
}

new svcStacks.MicroaStack(app, cdkUtil.applicationName + '-microa-stack', svcProps, 'microa');

new svcStacks.AnimalStack(app, cdkUtil.applicationName + '-animal-stack', svcProps, 'animal');
