import * as cdkUtil from './cdkUtil'
import * as cdk from 'aws-cdk-lib';
import {aws_ec2, aws_ecs, aws_logs, Duration} from "aws-cdk-lib";
import {DnsRecordType, PrivateDnsNamespace} from "aws-cdk-lib/aws-servicediscovery";
import * as apigatewayv2_integrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import {HttpMethod, HttpRoute, HttpRouteKey, HttpRouteProps} from "@aws-cdk/aws-apigatewayv2-alpha";

export interface ServiceInfraStackProps extends cdk.StackProps {
  vpcLink: apigatewayv2.VpcLink,
  dnsNamespace: PrivateDnsNamespace,
  securityGroup: aws_ec2.SecurityGroup
}

export class MicroSvcStack extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props: ServiceInfraStackProps, microSvcName: string) {
    super(scope, id, props);

    // const vpc = aws_ec2.Vpc.fromLookup(this, cdkUtil.vpcId, { vpcId: cdk.Fn.importValue(cdkUtil.exportedVpcId) });
    const vpc = aws_ec2.Vpc.fromLookup(this, cdkUtil.vpcId, { vpcName: cdkUtil.vpcId });

    const vpcLink = props.vpcLink;
    const dnsNamespace = props.dnsNamespace;
    const securityGroup = props.securityGroup;
    const microSvcNameResourcePrefix = cdkUtil.applicationName + '-' + microSvcName;
    const apiGateway = apigatewayv2.HttpApi.fromHttpApiAttributes(this, cdkUtil.exportedApiGatewayId, {
      httpApiId: cdk.Fn.importValue(cdkUtil.exportedApiGatewayId)
    }) as apigatewayv2.HttpApi;

    const clusterId = microSvcNameResourcePrefix + '-ecsCluster';
    const cluster = new aws_ecs.Cluster(this, clusterId, {
      clusterName: clusterId,
      vpc: vpc,
    });
    cdkUtil.tagItem(cluster, clusterId);

    const taskDefinitionId = microSvcNameResourcePrefix + '-taskDefinition'
    const taskDefinition = new aws_ecs.FargateTaskDefinition(this, taskDefinitionId, {
      cpu: 256,
      memoryLimitMiB: 512,
    });
    cdkUtil.tagItem(taskDefinition, taskDefinitionId);

    const containerId = microSvcNameResourcePrefix + '-container';
    const svcLogGroup = new aws_logs.LogGroup(
        this,
        microSvcName + '-ServiceLogGroup',
        {
          logGroupName: '/ecs/' + microSvcName,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          retention: cdkUtil.awsSvcLogRetentionDays,
        }
    );
    const svcLogDriver = new aws_ecs.AwsLogDriver({
      logGroup: svcLogGroup,
      streamPrefix: microSvcName + 'Service',
    });
    const container = taskDefinition.addContainer(
        containerId,
        {
          containerName: containerId,
          image: aws_ecs.ContainerImage.fromAsset('../microservices/' + microSvcName),
          environment: {
            PDP_OWNER_JDBC_URL: cdkUtil.PDP_OWNER_JDBC_URL,
          },
          logging: svcLogDriver,
          portMappings: [{ containerPort: 8080 }],
        }
    );
    cdkUtil.tagItem(container, containerId);

    const fargateServiceId = microSvcNameResourcePrefix + '-fargateService';
    //@ts-ignore
    const fargateService = new aws_ecs.FargateService(this, fargateServiceId, {
      cluster: cluster,
      securityGroups: [securityGroup],
      taskDefinition: taskDefinition,
      circuitBreaker: {
        rollback: true,
      },
      assignPublicIp: false,
      desiredCount: cdkUtil.fargateSvcDesiredCount,
      cloudMapOptions: {
        name: microSvcNameResourcePrefix,
        cloudMapNamespace: dnsNamespace,
        dnsRecordType: DnsRecordType.SRV,
      },
    });
    cdkUtil.tagItem(fargateService, fargateServiceId);

    const scaling = fargateService.autoScaleTaskCount({
      maxCapacity: 6,
      minCapacity: cdkUtil.fargateSvcDesiredCount
    });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60)
    });

    // Open issues: https://github.com/aws/aws-cdk/issues/12337
    // const apiGatewayId = cdkUtil.applicationName + '-apiGateway';
    // apiGateway.addRoutes({
    //   integration: new apigatewayv2_integrations.HttpServiceDiscoveryIntegration(
    //       microSvcName + '-ServiceDiscoveryIntegration',
    //       this.cloudMapSvc,
    //       {
    //         vpcLink: vpcLink,
    //       },
    //   ),
    //   path: '/' + microSvcName + '/{proxy+}',
    //   methods: [HttpMethod.ANY],
    // });
    // cdkUtil.tagItem(apiGateway, apiGatewayId);
    // NOTE: following is the workaround for now 2022-10-07
    try {
      const integration = new apigatewayv2_integrations.HttpServiceDiscoveryIntegration(
          microSvcName + '-ServiceDiscoveryIntegration',
          //@ts-ignore
          fargateService.cloudMapService,
          {
            vpcLink: vpcLink,
          },
      );

      const httpRouteKey = HttpRouteKey.with(
          '/' + microSvcName + '/{proxy+}',
          HttpMethod.ANY
      );

      const httpRouteProps: HttpRouteProps = {
        httpApi: apiGateway,
        integration: integration,
        routeKey: httpRouteKey
      };

      new HttpRoute(this, id, httpRouteProps);
    } catch (e) {
      console.log(e);
    }
  }
}

