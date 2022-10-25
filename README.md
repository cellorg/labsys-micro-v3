# labsys

API Gateway -> VPC Link -> Cloud Map (i.e. Service Discovery) -> ECS -> fargate services 

## Initial manual steps that AWS administrator needs to take.
AWS administrator needs to clone this repo, and then set up the local environment
* Install NodeJS
* Install AWS CDK `npm install -g aws-cdk`
* Install Typescript `npm install -g typescript`
* aws config (use the profiles for different AWS accounts / environments)

Steps:
1. Set up different AWS account for each environment, i.e. d1, d2, t3, prod.
2. Create the secrets for each environment. You can either create these in the AWS console for each environment,
   or use the following aws-cli command.
    * aws secretsmanager create-secret --name PDP_OWNER_PASSWORD --secret-string `secretValue` --profile `awsEnv` <br>
      examples:
        * `aws secretsmanager create-secret --name PDP_OWNER_PASSWORD --secret-string "pdpOwnerPasswordFromSecret-d1" --profile d1`
        * `aws secretsmanager create-secret --name PDP_OWNER_PASSWORD --secret-string "pdpOwnerPasswordFromSecret-d2" --profile d2`
        * `aws secretsmanager create-secret --name PDP_OWNER_PASSWORD --secret-string "pdpOwnerPasswordFromSecret-t3" --profile t3`
        * `aws secretsmanager create-secret --name PDP_OWNER_PASSWORD --secret-string "pdpOwnerPasswordFromSecret-prod" --profile prod`
3. Create the OpenID Connect provider and role to integrate the github and AWS, so that github can deploy the stacks to the AWS.
   This can be done by running the cdk command in the cdk-init-oidc folder.
    * `cd cdk-infra/admin-init-infra/cdk-init-oidc`
    * `npm install`
    * `npm run build`
    * `cdk deploy --profile <env>` (run this for each environment)
4. Make sure the AWS account numbers are correct in the file cdk-infra/admin-init-infra/getGithubOidcRoleArn.js