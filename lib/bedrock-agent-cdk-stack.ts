
import { S3Construct } from './constructs/s3-bucket-construct';
import { S3KBConstruct } from './constructs/s3-kb-bucket-construct';
import { BedrockIamConstruct } from './constructs/bedrock-agent-iam-construct';
import { LambdaIamConstruct } from './constructs/lambda-iam-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { CustomBedrockAgentConstruct } from './constructs/custom-bedrock-agent-construct';
import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";
import {SESConstruct} from './constructs/ses-construct'
import { NagSuppressions } from 'cdk-nag'



export interface BedrockAgentCdkProps extends cdk.StackProps {
  readonly specAlertFile: string;
  readonly specRemediationFile: string;
  readonly alertslambdaFile: string;
  readonly remediationlambdaFile: string;
  readonly ec2InstanceId:string;
  readonly instruction:string;
  
}

export class BedrockAgentCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BedrockAgentCdkProps) {
    super(scope, id, props);

    const emailAddressParam = new cdk.CfnParameter(this,  'EmailAddressParam', {
      type: 'String',
      default: 'sender@example.com', // Replace with your default email address
      description: 'The email address to use as the sender identity',
      
      
    });
  
    emailAddressParam.overrideLogicalId('EmailAddressParam');
  

    // Generate random number to avoid roles and lambda duplicates
    const randomPrefix = Math.floor(Math.random() * (10000 - 100) + 100);
    const collectionId = "BEDROCK_AGENT_CUSTOM_RESOURCE";
    const lambdaName = `bedrock-agent-lambda-${randomPrefix}`;
    const lambdaRoleName = `bedrock-agent-lambda-role-${randomPrefix}`;
    const agentResourceRoleName = `AmazonBedrockExecutionRoleForAgents_${randomPrefix}`; 
    const agentName = this.node.tryGetContext("agentName") || `cdk-agent-${randomPrefix}`;

    const ses = new SESConstruct(this, `SESConstruct-${randomPrefix}`,emailAddressParam.valueAsString, props);
   
    

    const lambdaRole = new LambdaIamConstruct(this, `LambdaIamConstruct-${randomPrefix}`, { roleName: lambdaRoleName, email:emailAddressParam.valueAsString, instanceId: props. ec2InstanceId  });
  
    NagSuppressions.addStackSuppressions(this, [
             {
               id: 'AwsSolutions-IAM5',
               reason: 'In order to take EC2 snapshot permissons on all volumes and snapshots needed'
             },
             
           ])
    NagSuppressions.addStackSuppressions(this, [
            {
              id: 'AwsSolutions-S1',
              reason: 'Demonstrate a stack level suppression.'
            },
          ])

    NagSuppressions.addStackSuppressions(this, [
            {
              id: 'AwsSolutions-IAM4',
              reason: 'Custom CDK Resource need Admin permission for stack deployment'
            },
          ])


    const s3Construct = new S3Construct(this, `agent-assets-${randomPrefix}`, {});
    const s3kbConstruct = new S3KBConstruct(this, `agent-kb-${randomPrefix}`, {});
    const bedrockAgentRole = new BedrockIamConstruct(this, `BedrockIamConstruct-${randomPrefix}`, { 
      roleName: agentResourceRoleName,
      lambdaRoleArn: lambdaRole.lambdaRole.roleArn,
      s3BucketArn: s3Construct.bucket.bucketArn,
    });
    bedrockAgentRole.node.addDependency(lambdaRole);
    bedrockAgentRole.node.addDependency(s3Construct);
    const agentAlertLambdaConstruct = new LambdaConstruct(this, `AlertLambdaConstruct-${randomPrefix}`, {
      lambdaName: lambdaName,
      lambdaFile: props.alertslambdaFile,
      lambdaRoleName: lambdaRoleName,
      iamRole: lambdaRole.lambdaRole,
      assetFilePath: "lib/assets/lambdas/agent/alerts",
      opsEmailAddress:emailAddressParam.valueAsString
    });
    agentAlertLambdaConstruct.node.addDependency(lambdaRole);

    const agentRemediationLambdaConstruct = new LambdaConstruct(this, `RemediationLambdaConstruct-${randomPrefix}`, {
      lambdaName: lambdaName,
      lambdaFile: props.remediationlambdaFile,
      lambdaRoleName: lambdaRoleName,
      iamRole: lambdaRole.lambdaRole,
      assetFilePath: "lib/assets/lambdas/agent/remediation",
      opsEmailAddress:emailAddressParam.valueAsString
    });
    agentRemediationLambdaConstruct.node.addDependency(lambdaRole);

    const customBedrockAgentConstruct = new CustomBedrockAgentConstruct(this, `custom-bedrock-agent-construct-${randomPrefix}`, {
      collectionId: collectionId,
      agentName: agentName,
      s3BucketName: s3Construct.bucketName,
      s3BucketArn: s3Construct.bucket.bucketArn,
      bedrockAgentRoleArn: bedrockAgentRole.roleArn,
      alertlambdaArn: agentAlertLambdaConstruct.lambdaArn,
      remediationlambdaArn: agentRemediationLambdaConstruct.lambdaArn,
      s3BucketAlertKey: props.specAlertFile,
      s3BucketRemediationKey: props.specRemediationFile,
      bedrockAgentRoleName: agentResourceRoleName,
      instanceId:props.ec2InstanceId,
      instruction:props.instruction
    });
    customBedrockAgentConstruct.node.addDependency(bedrockAgentRole);
    customBedrockAgentConstruct.node.addDependency(agentAlertLambdaConstruct);
    customBedrockAgentConstruct.node.addDependency(agentRemediationLambdaConstruct);
    
    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-L1',
        reason: 'Custom CDK Resource required to just deployment of stack'
      },
    ])
    
  }
}
