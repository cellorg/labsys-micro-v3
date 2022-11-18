import * as cdkUtil from '../common/cdkUtil'
import * as cdk from 'aws-cdk-lib';
import { aws_ec2, aws_iam } from 'aws-cdk-lib';
import * as aws_apigateway from 'aws-cdk-lib/aws-apigateway';
import { NetworkLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { IntegrationOptions, IntegrationType } from 'aws-cdk-lib/aws-apigateway';
import { vpcName } from '../common/allEnvConfig';
import { InterfaceVpcEndpoint, InterfaceVpcEndpointAwsService, Peer, Port, SubnetType } from 'aws-cdk-lib/aws-ec2';

export class SharedInfraStack extends cdk.Stack {
  public readonly vpcEndpoint: InterfaceVpcEndpoint;
  public readonly apiResourcePolicy: aws_iam.PolicyDocument;
  public readonly ecsTaskRole: aws_iam.Role;
  public readonly apiIntegrationType: IntegrationType;
  public readonly integrationOptions: IntegrationOptions;

  constructor(scope: cdk.App, id: string,  props?: cdk.StackProps) {
    super(scope, id, props);

    // const vpc = aws_ec2.Vpc.fromLookup(this, cdkUtil.vpcId, { vpcId: cdkUtil.vpcId });
    const vpc = aws_ec2.Vpc.fromLookup(this, vpcName, { vpcName: vpcName });

    const apiVpcEndpointSecurityGroupName = `${cdkUtil.appPrefix}apiVpcEndpointSecurityGroup`;
    const vpcEndpointSG = new aws_ec2.SecurityGroup(this, apiVpcEndpointSecurityGroupName, {
      vpc,
      allowAllOutbound: true,
      securityGroupName: apiVpcEndpointSecurityGroupName
    });
    vpcEndpointSG.addIngressRule(Peer.anyIpv4(), Port.tcp(443));

    const apiVpcEndpointName = `${cdkUtil.appPrefix}-apiVpcEndpoint`;
    this.vpcEndpoint = new InterfaceVpcEndpoint(this, apiVpcEndpointName, {
      service: InterfaceVpcEndpointAwsService.APIGATEWAY,
      vpc,
      subnets: vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS
      }),
      privateDnsEnabled: true,
      securityGroups: [vpcEndpointSG]
    });
    cdkUtil.tagItem(this.vpcEndpoint, apiVpcEndpointName);

    const nlbName = `${cdkUtil.appPrefix}-networkLoadBalancer`;
    const nlb = new NetworkLoadBalancer(this, nlbName, {
      loadBalancerName: nlbName,
      vpc,
      internetFacing: false
    });
    cdkUtil.tagItem(nlb, nlbName);

    new cdk.CfnOutput(this, cdkUtil.exportedNlbArn, {
      value: nlb.loadBalancerArn,
      exportName: cdkUtil.exportedNlbArn,
    });
    new cdk.CfnOutput(this, cdkUtil.exportedNlbDnsName, {
      value: nlb.loadBalancerDnsName,
      exportName: cdkUtil.exportedNlbDnsName,
    });

    this.apiResourcePolicy = new aws_iam.PolicyDocument({
      statements: [
        new aws_iam.PolicyStatement({
          actions: ['execute-api:Invoke'],
          principals: [new aws_iam.AnyPrincipal()],
          resources: ['execute-api:/*/*/*'],
        })
      ]
    })

    const escTaskRoleName = `${cdkUtil.appPrefix}-backendECSTaskRole`;
    this.ecsTaskRole = new aws_iam.Role(this, escTaskRoleName, {
      roleName: escTaskRoleName,
      assumedBy: new aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    const vpcLinkName = `${cdkUtil.appPrefix}-vpclink`;
    const vpcLink = new aws_apigateway.VpcLink(this, vpcLinkName, {
      vpcLinkName: vpcLinkName,
      targets: [nlb]
    });
    cdkUtil.tagItem(vpcLink, vpcLinkName);

    this.apiIntegrationType = aws_apigateway.IntegrationType.HTTP_PROXY;
    this.integrationOptions = {
      connectionType: aws_apigateway.ConnectionType.VPC_LINK,
      vpcLink: vpcLink,
      requestParameters: {
        'integration.request.path.proxy': 'method.request.path.proxy'
      }
    };
  }
}


