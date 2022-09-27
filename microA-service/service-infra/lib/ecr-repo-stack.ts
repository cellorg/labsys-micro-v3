import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdkUtil from './cdkUtil';

export class EcrRepoStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new cdk.aws_ecr.Repository(this, cdkUtil.dockerRepoName);

    }
}