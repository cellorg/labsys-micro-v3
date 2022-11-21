import * as cdk from 'aws-cdk-lib';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';

export class EnvSecretsStack extends cdk.Stack {
    readonly labsysSecrets: {
        PDP_OWNER_PASSWORD: ISecret
    };

    constructor(scope: cdk.App, id: string, targetEnv: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // AWS Secrets Manager - secrets Names
        // Note: secrets are set by an admin manually. The format needs to match <targetEnv>_<secretName>. e.g "d1_PDP_OWNER_PASSWORD"
        const pdpOwnerPasswordName = targetEnv + '_PDP_OWNER_PASSWORD';
        const pdpOwnerPassword = Secret.fromSecretNameV2(this, pdpOwnerPasswordName, pdpOwnerPasswordName);

        this.labsysSecrets = {
            PDP_OWNER_PASSWORD: pdpOwnerPassword,
        };
    }
}