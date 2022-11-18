#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { allMicroSvsNames, allTargetEnvs } from '../common/allEnvConfig';
import { SharedInfraStack } from '../lib/shared-infra-stack';
import { MicroSvcStack } from '../lib/micro-svc-stacks';
import { EnvSecretsStack } from '../lib/env-secrets-stack';
import { ApiMicroIntegrationStack } from '../lib/api-micro-integration-stack';
import * as cdkUtil from "../common/cdkUtil";
import {EnvApigatewayStack} from "../lib/env-apigateway-stack";

const accountRegionEnv = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION //'us-east-1'
};

const app = new cdk.App();

// shared infra for all environments: vpcEndpoint, networkLoadBalancer, etc.
const sharedInfraStack = new SharedInfraStack(app,
    `${cdkUtil.appPrefix}-sharedInfra-stack`,
    { env: accountRegionEnv }
);

for (let targetEnv of allTargetEnvs) {
    const appEnvApiPrefix = `${cdkUtil.appPrefix}-env-${targetEnv}`;

    // each environment will have its own API Gateway instance / deployment
    new EnvApigatewayStack(app,
        `${appEnvApiPrefix}-apiGateway-stack`,
        targetEnv,
        sharedInfraStack.vpcEndpoint,
        sharedInfraStack.apiResourcePolicy,
        { env: accountRegionEnv }
    );

    const appEnvPrefix = `${appEnvApiPrefix}-svc`;

    // each environment will have its own secrets retrieving stack
    const sharedSecretsStack = new EnvSecretsStack(app,
        `${appEnvPrefix}-sharedSecrets-stack`,
        targetEnv,
        { env: accountRegionEnv }
    );

    for (let microSvcName of allMicroSvsNames) {
        new MicroSvcStack(
            app,
            `${appEnvPrefix}-${microSvcName}-stack`,
            targetEnv,
            microSvcName,
            sharedInfraStack.ecsTaskRole,
            sharedSecretsStack.labsysSecrets,
            { env: accountRegionEnv }
        );

        new ApiMicroIntegrationStack(
            app,
                `${appEnvPrefix}-apiIntegration-${microSvcName}-stack`,
            targetEnv,
            microSvcName,
            sharedInfraStack.apiIntegrationType,
            sharedInfraStack.integrationOptions,
            { env: accountRegionEnv }
        );
    }
}


