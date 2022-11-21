import * as cdkUtil from '../common/cdkUtil';
import * as cdk from 'aws-cdk-lib';
import {aws_ec2, aws_ecs, aws_iam, aws_logs, Duration} from 'aws-cdk-lib';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {NetworkLoadBalancer, Protocol} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {allEnvConfig, vpcName} from '../common/allEnvConfig';
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";

export class MicroSvcStack extends cdk.Stack {

  constructor(scope: cdk.App, id: string,
              targetEnv: string,
              microSvcName: string,
              ecsTaskRole: aws_iam.Role,
              sharedSecrets: Record<string, ISecret>,
              props?: cdk.StackProps) {
    super(scope, id, props);

    const envConfig = allEnvConfig[`${targetEnv}`];
    const appEnvMicroPrefix = `${cdkUtil.appPrefix}-${targetEnv}-${microSvcName}`;
    const containerPort = envConfig.NLB_ECS_PORTS[`${microSvcName}`];

    //const vpc = aws_ec2.Vpc.fromLookup(this, cdkUtil.vpcId, {vpcId: cdkUtil.vpcId});
    const vpc = aws_ec2.Vpc.fromLookup(this, vpcName, {vpcName: vpcName});

    const nlb = NetworkLoadBalancer.fromNetworkLoadBalancerAttributes(this, 'lookupNLB', {
      loadBalancerArn: cdk.Fn.importValue(cdkUtil.exportedNlbArn),
      vpc: vpc
    });

    const pdpOwnerPassword = sharedSecrets.PDP_OWNER_PASSWORD;
    pdpOwnerPassword.grantRead(ecsTaskRole);

    const clusterName = appEnvMicroPrefix + '-ecsCluster';
    const cluster = new aws_ecs.Cluster(this, clusterName, {
      clusterName: clusterName,
      vpc: vpc,
    });
    cdkUtil.tagItem(cluster, clusterName);

    const taskDefinitionName = `${appEnvMicroPrefix}-taskDefinition`;
    //@ts-ignore
    const taskDefinition = new aws_ecs.FargateTaskDefinition(this, taskDefinitionName, {
      cpu: 256,
      memoryLimitMiB: 512,
      taskRole: ecsTaskRole,
    });
    cdkUtil.tagItem(taskDefinition, taskDefinitionName);

    // Note: keep the logGroupName unique
    // If we want to keep the log after destroy, then it needs to be unique.
    // Otherwise, re-deploy will fail with "already exist" error
    const logGroupName = `/ecs/${microSvcName}/${cdkUtil.timeStampStr()}`;
    const svcLogGroup = new aws_logs.LogGroup(
        this,
        `${microSvcName}-ServiceLogGroup`,
        {
          logGroupName: logGroupName,
          retention: envConfig.MICROSVC_LOG_RETENTION_DAYS as RetentionDays,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }
    );
    const svcLogDriver = new aws_ecs.AwsLogDriver({
      logGroup: svcLogGroup,
      streamPrefix: microSvcName,
    });
    const containerName = `${appEnvMicroPrefix}-container`;

    //@ts-ignore
    const container = taskDefinition.addContainer(
        containerName,
        {
          containerName: containerName,
          // In the future, we may be able to set the specific ECR repo for the images once the cdk open issue is completed.
          // cdk open issue: https://github.com/aws/aws-cdk/issues/12597
          image: aws_ecs.ContainerImage.fromAsset(`../../../microservices/${microSvcName}`, {
            buildArgs: {
              PORT: containerPort.toString()
            }
          }),
          environment: {
            PORT: containerPort.toString(),
            PDP_OWNER_USERNAME: envConfig.PDP_OWNER_USERNAME,
            PDP_OWNER_JDBC_URL: envConfig.PDP_OWNER_JDBC_URL,
          },
          secrets: {
            PDP_OWNER_PASSWORD: aws_ecs.Secret.fromSecretsManager(sharedSecrets.PDP_OWNER_PASSWORD),
          },
          logging: svcLogDriver,
          portMappings: [{
            containerPort: containerPort,
            hostPort: containerPort,
            protocol: aws_ecs.Protocol.TCP
          }],
        }
    );
    cdkUtil.tagItem(container, containerName);

    //@ts-ignore
    const securityGroupName = `${appEnvMicroPrefix}-securityGroup`;
    const securityGroup = new aws_ec2.SecurityGroup(this, securityGroupName, {
      securityGroupName: securityGroupName,
      vpc: vpc,
      allowAllOutbound: true,
    });
    cdkUtil.tagItem(securityGroup, securityGroupName);

    securityGroup.addIngressRule(aws_ec2.Peer.anyIpv4(), aws_ec2.Port.tcp(containerPort), securityGroupName);

    const fargateServiceName = `${appEnvMicroPrefix}-fargateService`;
    //@ts-ignore
    const fargateService = new aws_ecs.FargateService(this, fargateServiceName, {
      cluster: cluster,
      securityGroups: [securityGroup],
      taskDefinition: taskDefinition,
      assignPublicIp: false,
      desiredCount: cdkUtil.fargateSvcDesiredCount,
    });
    cdkUtil.tagItem(fargateService, fargateServiceName);

    const scaling = fargateService.autoScaleTaskCount({
      maxCapacity: 6,
      minCapacity: cdkUtil.fargateSvcDesiredCount
    });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60)
    });

    const nlbListenerName = `${appEnvMicroPrefix}-nlbListener`;
    const nlbListener = nlb.addListener(nlbListenerName, {
      port: containerPort
    });

    // add fargate service to the nlb listener
    const targetGroupName = `${appEnvMicroPrefix}-targetGroup`;
    nlbListener.addTargets(targetGroupName, {
      targetGroupName: targetGroupName,
      port: containerPort,
      targets: [fargateService],
      healthCheck: {
        port: containerPort.toString(),
        path: `/${microSvcName}/health`,
        protocol: Protocol.HTTP,
        healthyHttpCodes: '200'
      }
    });

  }
}

