#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as cdkUtil from '../lib/cdkUtil';
import { SharedInfraStack } from '../lib/shared-infra-stack';
import { SharedApiGatewayStack } from '../lib/shared-apigateway-infra';
import { ServiceInfraStackProps } from '../lib/micro-svc-stacks';
const svcStacks = require('../lib/micro-svc-stacks');

const accountRegionEnv = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION //'us-east-1'
};

const app = new cdk.App();

const sharedInfraStack = new SharedInfraStack(app, cdkUtil.sharedInfraStackId, {
    env: accountRegionEnv
});

const svcProps : ServiceInfraStackProps = {
    env: accountRegionEnv,
    vpc: sharedInfraStack.vpc,
    dnsNamespace: sharedInfraStack.dnsNamespace,
    securityGroup: sharedInfraStack.securityGroup
}

const microaStack = new svcStacks.MicroaStack(
    app,
    cdkUtil.applicationName + '-microa-stack',
    svcProps,
    'microa'
);

const animalStack = new svcStacks.AnimalStack(
    app,
    cdkUtil.applicationName + '-animal-stack',
    svcProps,
    'animal'
);


cdkUtil.cloudMapSvcArray.push({
    micorSvcName: 'microa',
    cloudMapSvc: microaStack.cloudMapSvc
});
cdkUtil.cloudMapSvcArray.push({
    micorSvcName: 'animal',
    cloudMapSvc: animalStack.cloudMapSvc
});


new SharedApiGatewayStack(
    app,
    cdkUtil.sharedApiGatewayStackId,
    {
        env: accountRegionEnv,
        vpcLink: sharedInfraStack.vpcLink
    },
    cdkUtil.cloudMapSvcArray
);