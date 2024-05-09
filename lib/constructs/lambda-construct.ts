import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";

export interface LambdaProps extends cdk.StackProps {
  readonly lambdaRoleName: string;
  readonly lambdaFile: string;
  readonly lambdaName: string;
  readonly iamRole: cdk.aws_iam.Role;
  readonly assetFilePath:string
  readonly opsEmailAddress:string
}

const defaultProps: Partial<LambdaProps> = {};

export class LambdaConstruct extends Construct {
  public lambdaArn: string;

  constructor(scope: Construct, name: string, props: LambdaProps) {
    super(scope, name);

    props = { ...defaultProps, ...props };

    const bedrockAgentLambda = new cdk.aws_lambda.Function(this, "BedrockAgentLambda", {
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_10,
      handler: `${props.lambdaFile}.lambda_handler`,
      code: cdk.aws_lambda.Code.fromAsset(props.assetFilePath),
      timeout: cdk.Duration.seconds(300),
      role: props.iamRole,
      environment: {
        EMAIL_ADDRESS: props.opsEmailAddress, // Add the environment variable
      },
    });

    bedrockAgentLambda.grantInvoke(new cdk.aws_iam.ServicePrincipal("bedrock.amazonaws.com"));

    new cdk.CfnOutput(this, "BedrockAgentLambdaArn", {
      value: bedrockAgentLambda.functionArn,
    });

    this.lambdaArn = bedrockAgentLambda.functionArn;
  }
}