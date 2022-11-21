import * as cdk from 'aws-cdk-lib';

// github actions input parameters
export const targetEnv = process.env.targetEnv || 'd1';
export const fargateSvcDesiredCount = Number(process.env.fargateSvcDesiredCount || '1');

export const appPrefix = 'labsys';
export const exportedApiGatewayIdSuffix = '-apiGatewayId-export';
export const exportedApiRootIdSuffix = '-apiRootId-export';
export const exportedNlbArn = appPrefix + '-nlbArn-export';
export const exportedNlbDnsName = appPrefix + '-nlbDnsName-export';

// tag AWS resources according to CST https://cellsignal.atlassian.net/wiki/spaces/EA/pages/1399128192/AWS+Use+Standard
const tagEnvironment = (targetEnv === 'prod') ? 'prod' : 'nonprod';
export function tagItem(item: any, itemProgram: string) {
    cdk.Tags.of(item).add('program', itemProgram);
    cdk.Tags.of(item).add('role', 'labsys-microservices');
    cdk.Tags.of(item).add('owner', 'Lab Systems');
    cdk.Tags.of(item).add('creator', 'SignalSailer');
    cdk.Tags.of(item).add('environment', tagEnvironment);
    cdk.Tags.of(item).add('deptcode', '245');
}

export function timeStampStr() {
    // format: 2022-10-19T17-35-33-887Z
    return (new Date()).toISOString().split(':').join('-').replace('.', '-');
}