import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";
import * as iam from 'aws-cdk-lib/aws-iam';


export interface LambdaIamProps extends cdk.StackProps {
  readonly roleName: string;
  readonly email:string;
  readonly instanceId:string;
}

const defaultProps: Partial<LambdaIamProps> = {};

export class LambdaIamConstruct extends Construct {
  public lambdaRole: cdk.aws_iam.Role;

  constructor(scope: Construct, name: string, props: LambdaIamProps) {
    super(scope, name);

    props = { ...defaultProps, ...props };

 
    const lambdaRole = new cdk.aws_iam.Role(this, "LambdaRole", {
      roleName: props.roleName,
      assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com')
      
    });

    const awsAccountId = cdk.Stack.of(this).account;
    const stackName = cdk.Stack.of(this).stackName;


// 0
    

    lambdaRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [`arn:aws:cloudwatch:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}:${awsAccountId}:alarm:Web_Server_CPU_Utilization` ],
          actions: [            
          'cloudwatch:DescribeAlarms',
          ]
        })
      );
    

    // 1
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid:'ec2volume',
        effect: iam.Effect.ALLOW,
        resources: [`arn:aws:ec2:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}:${awsAccountId}:volume/vol-*`
        ],
        actions: [            
        'ec2:CreateSnapshot',
        'ec2:CreateTags'
        ],
        conditions: {
          StringLike: {
            'aws:ResourceTag/Name': '*/Loadtest-EC2Instance'
          }
        }
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid:'ec2snapshot',
        effect: iam.Effect.ALLOW,
        resources: [`arn:aws:ec2:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}::snapshot/*`,
        ],
        actions: [            
        'ec2:CreateSnapshot',
        ]
      })
    );

    // 2
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid:'cwlogs',
        effect: iam.Effect.ALLOW,
        resources: [
          `arn:aws:logs:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}:${awsAccountId}:log-group:/aws/lambda/${stackName}-*:*`
        ],
        actions: [            
        "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
        ]
      })
    );

    //3 
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid:'ses',
        effect: iam.Effect.ALLOW,
        resources: [
          `arn:aws:ses:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}:${awsAccountId}:identity/${props.email}`,
          `arn:aws:ses:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}:${awsAccountId}:configuration-set/MyDemoConfigurationSet`

        
        ],
        actions: [            
        "ses:SendEmail"
        ]
      })
    );

//4 issue
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid:'ec2',
        effect: iam.Effect.ALLOW,
        resources: [
          `arn:aws:ec2:${process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION}:${awsAccountId}:instance/${props.instanceId}`
        ],
        actions: [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances"
        ]
      })
    );

    // 5 ok
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid:'ec2describeInstance',
        effect: iam.Effect.ALLOW,
        resources: [`*`
        ],
        actions: [            
        'ec2:DescribeInstances'
        ]
      })
    );

      

    new cdk.CfnOutput(this, "LambdaRoleArn", {
      value: lambdaRole.roleArn,
    });

    this.lambdaRole = lambdaRole;
  }
}
