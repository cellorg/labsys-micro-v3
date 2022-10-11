import * as cdk from 'aws-cdk-lib';

// input parameters
const targetEnv = process.env.targetEnv || 'd1';
export const maxAzs = Number(process.env.maxAzs || '1');
export const fargateSvcDesiredCount = Number(process.env.fargateSvcDesiredCount || '1');

export const applicationName = 'labsys';
export const sharedApiGatewayStackId =  applicationName + '-sharedApiGateway-stack';
export const apiGatewayId = applicationName + '-apiGateway';
export const exportedApiGatewayId = applicationName + '-apiGatewayId-export';
export const sharedInfraStackId = applicationName + '-sharedInfra-stack';
export const vpcId = applicationName + '-vpc';
export const vpcLinkId = applicationName + '-vpclink';
export const cloudMapDnsNamespaceId = applicationName + '-dnsNamespace';
export const securityGroupId = applicationName + '-securityGroup';

// tag AWS resources according to https://cellsignal.atlassian.net/wiki/spaces/EA/pages/1399128192/AWS+Use+Standard
const tagEnvironment = process.env.Environment || 'Dev';
export function tagItem(item: any, itemProgram: string) {
    cdk.Tags.of(item).add('program', itemProgram);
    cdk.Tags.of(item).add('role', 'labsys-microservices');
    cdk.Tags.of(item).add('owner', 'Lab Systems');
    cdk.Tags.of(item).add('creator', 'SignalSailer');
    cdk.Tags.of(item).add('environment', tagEnvironment);
    cdk.Tags.of(item).add('deptcode', '245');
}

export let PDP_OWNER_JDBC_URL = '';
switch (targetEnv) {
    case 'd1':
        PDP_OWNER_JDBC_URL = 'fake:jdbc:url:d1';
        break;
    case 'd2':
        PDP_OWNER_JDBC_URL = 'fake:jdbc:url:d2';
        break;
    case 't3':
        PDP_OWNER_JDBC_URL = 'fake:jdbc:url:t3';
        break;
    case 'prod':
        PDP_OWNER_JDBC_URL = 'fake:jdbc:url:prod';
        break;
}



