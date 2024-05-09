#!/usr/bin/env node
import 'source-map-support/register';
import * as path from 'path';
import * as glob from 'glob';
import * as cdk from "aws-cdk-lib";
import { BedrockAgentCdkStack } from '../lib/bedrock-agent-cdk-stack';
import { EC2CdkStack } from '../lib/ec2-cdk-stack';


const app = new cdk.App();

// Get the spec file found in lambda dir
const specAlertDir = 'lib/assets/api-schema'; 
const jsonOrYmlAlertFile = glob.sync('**/operations-api.json', { cwd: specAlertDir });
const specAlertFilePath = jsonOrYmlAlertFile[0];
const specAlertFile = path.basename(specAlertFilePath) 

const specRemediationDir = 'lib/assets/api-schema'; 
const jsonOrYmlRemediationFile = glob.sync('**/remediation-api.json', { cwd: specRemediationDir });
const specRemediationFilePath = jsonOrYmlRemediationFile[0];
const specRemediationFile = path.basename(specRemediationFilePath) 

// Get the .py file found in lambda dir
const alertslambdaDir = 'lib/assets/lambdas/agent/alerts'; 
const alertspyFile = glob.sync('**/get-all-alerts.py', { cwd: alertslambdaDir });
const alertslambdaFilePath = alertspyFile[0];
const alertslambdaFile = path.basename(alertslambdaFilePath.replace(/\.py$/, '')) 

const remediationlambdaDir = 'lib/assets/lambdas/agent/remediation'; 
const remediationpyFile = glob.sync('**/issue-remediation.py', { cwd: remediationlambdaDir });
const remediationlambdaFilePath = remediationpyFile[0];
const remediationlambdaFile = path.basename(remediationlambdaFilePath.replace(/\.py$/, '')) 


const ec2Stack = new EC2CdkStack(app, `EC2CDKStack`, {
    env: {
      account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION 
    },
  }
);



const appStack = new BedrockAgentCdkStack(app, `BedrockAgentCDKStack`, {
  specAlertFile: specAlertFile,
  specRemediationFile:specRemediationFile,
  alertslambdaFile: alertslambdaFile,
  remediationlambdaFile: remediationlambdaFile,
  instruction:"find if there is any operational issue and fix using runbooks. It is manadatory to strictly follow runbook and do not perform any step not mentioned in runbook.",
  ec2InstanceId: ec2Stack.ec2.instanceId, // Pass the instance ID
    env: {
      account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION 
    },
  }
);
appStack.addDependency(ec2Stack);
