import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export const allTargetEnvs = ['d1', 'd2', 't3', 'prod'];
export const allMicroSvsNames = [
    'animal',
    'microa'
];

// It is preferred that we deploy all non-prod environments, such as d1, d2, t3, etc., in the same AWS account.
//   By sharing the vpc, nat gateways, transit gateway, etc. among non-prod environments, we can reduce the cost.
// Infrastructure team is responsible for creating the vpc. It is outside our github actions deployment.
//   We will need to manually set the vpcName here once we get it from the infrastructure team.
//export let vpcId = 'vpc-0bfaec228f1b7436c'; // this should match to the existing vpc that the infrastructure team created.
export const vpcName = 'labsys-vpc';

export const allEnvConfig: Record<string, Record<string, any>> = {
    d1 : {
        NLB_ECS_PORTS: {
            microa: 9101,
            animal: 9102
        },
        PDP_OWNER_USERNAME: 'PDP_OWNER',
        PDP_OWNER_JDBC_URL: 'fake:jdbc:url:d1',
        MICROSVC_LOG_RETENTION_DAYS: RetentionDays.ONE_DAY,
    },
    d2: {
        NLB_ECS_PORTS: {
            microa: 9201,
            animal: 9202
        },
        PDP_OWNER_USERNAME: 'PDP_OWNER',
        PDP_OWNER_JDBC_URL: 'fake:jdbc:url:d2',
        MICROSVC_LOG_RETENTION_DAYS: RetentionDays.ONE_DAY,
    },
    t3: {
        NLB_ECS_PORTS: {
            microa: 9301,
            animal: 9302
        },
        PDP_OWNER_USERNAME: 'PDP_OWNER',
        PDP_OWNER_JDBC_URL: 'fake:jdbc:url:t3',
        MICROSVC_LOG_RETENTION_DAYS: RetentionDays.THREE_DAYS,
    },
    prod: {
        NLB_ECS_PORTS: {
            microa: 8101,
            animal: 8102
        },
        PDP_OWNER_USERNAME: 'PDP_OWNER',
        PDP_OWNER_JDBC_URL: 'fake:jdbc:url:prod',
        MICROSVC_LOG_RETENTION_DAYS: RetentionDays.THREE_MONTHS,
    }
}