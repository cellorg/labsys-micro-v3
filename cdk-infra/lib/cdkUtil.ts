import * as cdk from 'aws-cdk-lib';

// input parameters
const targetEnv = process.env.targetEnv || 'd1';
const microSvcName = process.env.microSvcName || 'microa';
export const fargateSvcDesiredCount = Number(process.env.fargateSvcDesiredCount || '1') ;
//export const imageTag = process.env.imageTag || 'dev'; // image tag as branch

// The microservice image will be built from the microservices' source directory
export const microSvcSrcDir = '../microservices/' + microSvcName || '../microservices/microa';

// We will use one API Gateway, VPC, VPC LInk, Cloud Map for all microservcies in each env.
// shared infra resources are prefixed as <env>-labsys, e.g. d1-labsys
export const applicationName = targetEnv + '-labsys';
export const SharedApiGatewayStackId = applicationName + '-SharedApiGatewayStack';
export const SharedInfraStackId = applicationName + '-SharedInfraStack';
export const ServiceInfraStackId = applicationName + '-ServiceInfraStack';
export const vpcId = applicationName + '-vpc';
export const vpcLinkId = applicationName + '-vpclink';
export const cloudMapDnsNamespaceId = applicationName + '-dnsNamespace';

// each microservice resource is prefixed as <env>-<microSvcName>, e.g. d1-animal
export const microSvcNameResourcePrefix = targetEnv + '-' + microSvcName;

export let PDP_OWNER_JDBC_URL = '';
switch (targetEnv) {
    case 'd1':
        PDP_OWNER_JDBC_URL = 'fake:jdbc:url:d1';
        break;
    case 'd2':
        PDP_OWNER_JDBC_URL = 'fake:jdbc:url:d2';
        break;
}

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