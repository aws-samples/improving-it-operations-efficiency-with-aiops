import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";

export interface CustomResourceProps extends cdk.StackProps {
  readonly s3BucketArn: string;
  readonly s3BucketName: string;
  readonly s3BucketAlertKey: string;
  readonly s3BucketRemediationKey: string;
  readonly collectionId: string;
  readonly bedrockAgentRoleArn: string;
  readonly alertlambdaArn: string;
  readonly remediationlambdaArn: string;
  readonly agentName: string;
  readonly bedrockAgentRoleName: string;
  readonly instanceId: string;
  readonly instruction:string;
}

const defaultProps: Partial<CustomResourceProps> = {};

export class CustomBedrockAgentConstruct extends Construct {

  constructor(scope: Construct, name: string, props: CustomResourceProps) {
    super(scope, name);

    props = { ...defaultProps, ...props };

    const awsAccountId = cdk.Stack.of(this).account;

    const bedrockAgentCustomResourceRole = new cdk.aws_iam.Role(this, 'bedrockAgentCustomResourceRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    bedrockAgentCustomResourceRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      actions: [          
        
      'iam:PassRole'

      ],
      resources: 
        [`arn:aws:iam::${awsAccountId}:role/${props.bedrockAgentRoleName}`
        ]
    }));


    bedrockAgentCustomResourceRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      actions: [          
        'lambda:InvokeFunction'

      ],
      resources: 
        [`arn:aws:iam::${awsAccountId}:role/${props.bedrockAgentRoleName}`]
        
    }));    

    bedrockAgentCustomResourceRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      actions:[  
      
      'cloudwatch:PutMetricAlarm',
      'cloudwatch:DeleteAlarms', // Add CloudWatch permissions


      ],
      resources: 
        [`arn:aws:cloudwatch:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}:${awsAccountId}:alarm:Web_Server_CPU_Utilization`,
        ]
    }));

    bedrockAgentCustomResourceRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      actions: [          
      
      'bedrock:InvokeModel',
      'bedrock:CreateAgent',
      'bedrock:CreateAgentActionGroup',
      'bedrock:ListAgents',
      'bedrock:DeleteAgent',
      
      

      ],
      resources: 
        [`arn:aws:bedrock:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}::foundation-model/anthropic.claude-*`,
          `arn:aws:bedrock:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}:${awsAccountId}:agent/*`,
           `arn:aws:bedrock:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}:${awsAccountId}:agent-alias/*`,
           `arn:aws:bedrock:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}:${awsAccountId}:agent/*`
        ]
    }));

    bedrockAgentCustomResourceRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      actions: [          
      
      's3:GetObject'

      ],
      resources: 
        [ props.s3BucketArn
        ]
    }));

    const onEvent = new cdk.aws_lambda.Function(this, 'BedrockAgentCustomResourceFunction', {
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_10,
      handler: 'cdk-resource-bedrock-agent.on_event',
      code: cdk.aws_lambda.Code.fromAsset("lib/assets/lambdas"),
      architecture: cdk.aws_lambda.Architecture.X86_64,
      timeout: cdk.Duration.seconds(300),
      environment: {
        COLLECTION_ID: props.collectionId,
        S3_BUCKET: props.s3BucketName,
        AGENT_NAME: props.agentName,
        BEDROCK_AGENT_ROLE_ARN: props.bedrockAgentRoleArn,
        BEDROCK_AGENT_ALERT_LAMBDA_ARN: props.alertlambdaArn,
        BEDROCK_AGENT_REMEDIATION_LAMBDA_ARN: props.remediationlambdaArn,
        S3_BUCKET_ALERT_KEY: `api-schema/${props.s3BucketAlertKey}`,
        S3_BUCKET_REMEDIATION_KEY: `api-schema/${props.s3BucketRemediationKey}`,
        InstanceId: props.instanceId,
        BEDROCK_AGENT_INSTRUCTION: props.instruction
      },
      role: bedrockAgentCustomResourceRole
    });

    const bedrockAgentCustomResourceProvider = new cdk.custom_resources.Provider(this, 'BedrockCustomResourceProvider', {
      onEventHandler: onEvent,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY
    });

    new cdk.CustomResource(this, 'BedrockCustomResource', {
      serviceToken: bedrockAgentCustomResourceProvider.serviceToken
    });
    
    new cdk.CfnOutput(this, "BedrockAgentFunctionArn", {
      value: onEvent.functionArn,
    });
  }
}