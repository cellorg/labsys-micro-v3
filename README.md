# labsys


NOTE:
microservice name should be lower case, because AWS ECR image repo does not allow uppercase.
We are using microservice name for the directory structure, image repo name, url prefix, etc.

API Gateway -> VPC Link -> Cloud Map (i.e. Service Discovery) -> ECS -> fargate services