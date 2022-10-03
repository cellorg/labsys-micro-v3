import * as cdkUtil from './cdkUtil'
import * as cdk from 'aws-cdk-lib';
import {aws_ec2, aws_servicediscovery} from 'aws-cdk-lib';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import {PrivateDnsNamespace} from "aws-cdk-lib/aws-servicediscovery";

export class SharedInfraStack extends cdk.Stack {
  public readonly vpc: aws_ec2.Vpc;
  public readonly vpcLink: apigatewayv2.VpcLink;
  public readonly dnsNamespace: PrivateDnsNamespace;
  public readonly securityGroup: aws_ec2.SecurityGroup;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new aws_ec2.Vpc(this, cdkUtil.vpcId, {
      vpcName: cdkUtil.vpcId
    });
    cdkUtil.tagItem(this.vpc, cdkUtil.vpcId);

    this.vpcLink = new apigatewayv2.VpcLink(this, cdkUtil.vpcLinkId, {
      vpc: this.vpc,
      vpcLinkName: cdkUtil.vpcLinkId,
    });
    cdkUtil.tagItem(this.vpcLink, cdkUtil.vpcLinkId);

    this.dnsNamespace = new aws_servicediscovery.PrivateDnsNamespace(this, cdkUtil.cloudMapDnsNamespaceId,{
      name: `${cdkUtil.applicationName}.local`,
      vpc: this.vpc as aws_ec2.IVpc,
      description: 'Private DnsNamespace for Microservices',
    });
    cdkUtil.tagItem(this.dnsNamespace, cdkUtil.cloudMapDnsNamespaceId);

  }
}
