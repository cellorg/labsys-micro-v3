import * as cdkUtil from './cdkUtil'
import * as cdk from 'aws-cdk-lib';
import { aws_ec2, aws_ecs } from "aws-cdk-lib";
import {Vpc} from "aws-cdk-lib/aws-ec2";
import {DnsRecordType, PrivateDnsNamespace} from "aws-cdk-lib/aws-servicediscovery";
import * as cloudmap from 'aws-cdk-lib/aws-servicediscovery';

export interface ServiceInfraStackProps extends cdk.StackProps {
  vpc: Vpc,
  dnsNamespace: PrivateDnsNamespace,
  securityGroup: aws_ec2.SecurityGroup
}

export class MicroSvcStack extends cdk.Stack {
  public readonly cloudMapSvc: cloudmap.IService;

  constructor(scope: cdk.App, id: string, props: ServiceInfraStackProps, microSvcName: string) {
    super(scope, id, props);

    const vpc: Vpc = props.vpc;
    const dnsNamespace: PrivateDnsNamespace = props.dnsNamespace;
    const securityGroup: aws_ec2.SecurityGroup = props.securityGroup;
    const microSvcNameResourcePrefix: string = cdkUtil.applicationName + '-' + microSvcName;

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
    const container = taskDefinition.addContainer(
        containerId,
        {
          containerName: containerId,
          image: aws_ecs.ContainerImage.fromAsset('../microservices/' + microSvcName),
          environment: {
            PDP_OWNER_JDBC_URL: cdkUtil.PDP_OWNER_JDBC_URL,
          }
          //logging: ,
        }
    );
    container.addPortMappings({ containerPort: 8080 });
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

    //@ts-ignore
    this.cloudMapSvc = fargateService.cloudMapService;
  }
}


// class MicroaStack extends MicroSvcBaseStack {
//   constructor(scope: cdk.App, id: string, props: ServiceInfraStackProps, microSvcName: string) {
//     super(scope, id, props, microSvcName);
//   }
// }
//
// class AnimalStack extends MicroSvcBaseStack {
//   constructor(scope: cdk.App, id: string, props: ServiceInfraStackProps, microSvcName: string) {
//     super(scope, id, props, microSvcName);
//   }
// }
//
// module.exports = {
//   AnimalStack: AnimalStack,
//   MicroaStack: MicroaStack,
// }