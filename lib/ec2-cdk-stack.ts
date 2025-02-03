import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";
import { S3Construct } from './constructs/s3-bucket-construct';
import { S3KBConstruct } from './constructs/s3-kb-bucket-construct';
import { BedrockIamConstruct } from './constructs/bedrock-agent-iam-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { CustomBedrockAgentConstruct } from './constructs/custom-bedrock-agent-construct';
import {EC2Construct} from './constructs/ec2-construct'



export class EC2CdkStack extends cdk.Stack {

  public readonly ec2;
  constructor(scope: Construct, id: string,props:cdk.StackProps) {
    super(scope, id,props);

    // Generate random number to avoid roles and lambda duplicates
    const randomPrefix = Math.floor(Math.random() * (10000 - 100) + 100);
    
    
     this.ec2 = new EC2Construct(this, `EC2Construct-${randomPrefix}`,props);
    

      }
}
