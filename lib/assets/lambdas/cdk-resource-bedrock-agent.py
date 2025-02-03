import boto3
import os
import time
import json
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import botocore.session

agent_client = boto3.client("bedrock-agent")

def on_event(event, context):
  agent_name = os.environ['AGENT_NAME']
  s3_bucket = os.environ['S3_BUCKET']
  s3_bucket_alert_key = os.environ['S3_BUCKET_ALERT_KEY']
  s3_bucket_remediation_key = os.environ['S3_BUCKET_REMEDIATION_KEY']
  bedrock_agent_role_arn = os.environ['BEDROCK_AGENT_ROLE_ARN']
  bedrock_agent_alert_lambda_arn = os.environ['BEDROCK_AGENT_ALERT_LAMBDA_ARN']
  bedrock_agent_remediation_lambda_arn = os.environ['BEDROCK_AGENT_REMEDIATION_LAMBDA_ARN']
  instanceId = os.environ['InstanceId']
  instruction=os.environ['BEDROCK_AGENT_INSTRUCTION']
  physical_id = "PhysicalId"

  print(json.dumps(event))
  request_type = event['RequestType']
  if request_type == 'Create': return on_create(event, agent_name=agent_name, s3_bucket=s3_bucket, 
                                                bedrock_agent_role_arn=bedrock_agent_role_arn,
                                                bedrock_agent_alert_lambda_arn=bedrock_agent_alert_lambda_arn,
                                                bedrock_agent_remediation_lambda_arn=bedrock_agent_remediation_lambda_arn,
                                                s3_bucket_alert_key=s3_bucket_alert_key,
                                                 s3_bucket_remediation_key=s3_bucket_remediation_key,instanceId=instanceId,instruction=instruction, physical_id=physical_id)
  if request_type == 'Update': return on_update(event, physical_id=physical_id)
  if request_type == 'Delete': return on_delete(event, physical_id=physical_id, agent_name=agent_name)
  raise Exception("Invalid request type: %s" % request_type)


def on_create(event, agent_name, s3_bucket, bedrock_agent_role_arn, 
              bedrock_agent_alert_lambda_arn, bedrock_agent_remediation_lambda_arn,s3_bucket_alert_key,s3_bucket_remediation_key,instanceId,instruction, physical_id):
  props = event["ResourceProperties"]
  print("create new resource with props %s" % props)

  agent_id = create_agent(agent_resource_role_arn=bedrock_agent_role_arn, agent_name=agent_name,instruction=instruction)
  # Pause to make sure agents has been created                           
  time.sleep(15)
  create_agent_action_group(bucket=s3_bucket, agent_id=agent_id,
                            lambda_arn=bedrock_agent_alert_lambda_arn,
                            key=s3_bucket_alert_key, group_name= "GetAlertsActionGroup",group_description= "Get a list of all resources in AWS account in alert state and send email notificaitons with details after fixing issues	")
  create_agent_action_group(bucket=s3_bucket, agent_id=agent_id,
                            lambda_arn=bedrock_agent_remediation_lambda_arn,
                            key=s3_bucket_remediation_key,group_name= "RemediationActionGroup",group_description="APIs for managing EC2 and take remediation steps to fix operational issues	")
  
  create_cloudwatch_alarm(instanceId)
  return { 'PhysicalResourceId': physical_id } 


def on_update(event, physical_id):
  # physical_id = event["PhysicalResourceId"]
  props = event["ResourceProperties"]
  print("update resource %s with props %s" % (physical_id, props))

  return { 'PhysicalResourceId': physical_id } 


def on_delete(event, agent_name, physical_id):
  # physical_id = event["PhysicalResourceId"]
  print("delete resource %s" % physical_id)
  delete_agent(agent_name)

  

  # Create CloudWatch client
  cloudwatch = boto3.client('cloudwatch')

  # Delete alarm
  cloudwatch.delete_alarms(
  AlarmNames=['Web_Server_CPU_Utilization'],
)

  return { 'PhysicalResourceId': physical_id } 


def create_agent(agent_resource_role_arn, agent_name,instruction):
  
  response = agent_client.create_agent(
    agentName=agent_name,
    agentResourceRoleArn=agent_resource_role_arn,
    foundationModel="anthropic.claude-3-haiku-20240307-v1:0",
    description="Agent created by CDK.",
    idleSessionTTLInSeconds=1800,
    instruction=instruction,
  )

  return response['agent']['agentId']



def create_agent_action_group(agent_id, lambda_arn, bucket, key,group_name,group_description):
    agent_client.create_agent_action_group(
    agentId=agent_id,
    agentVersion='DRAFT',
    actionGroupExecutor={
        'lambda': lambda_arn
    },
    actionGroupName=group_name,
    apiSchema={
        's3': {
            's3BucketName': bucket,
            's3ObjectKey': key
        }
    },
    description=group_description
    )
    
    return

def create_cloudwatch_alarm(instanceId):
   
# Create CloudWatch client
 cloudwatch = boto3.client('cloudwatch')

# Create alarm
 cloudwatch.put_metric_alarm(
    AlarmName='Web_Server_CPU_Utilization',
    ComparisonOperator='GreaterThanThreshold',
    EvaluationPeriods=2,
    DatapointsToAlarm=1,
    MetricName='CPUUtilization',
    Namespace='AWS/EC2',
    Period=60,
    Statistic='Maximum',
    Threshold=90.0,
    ActionsEnabled=False,
    AlarmDescription='Alarm when server CPU exceeds 90%',
    Dimensions=[
        {
          'Name': 'InstanceId',
          'Value': instanceId
        },
    ] )

def delete_agent(agent_name):
    # Get list of all agents
    response = agent_client.list_agents(maxResults=100)
    print('This is agent name from delete: ', agent_name)
    # Find agent with the given name
    for agent in response["agentSummaries"]:
        if agent["agentName"] == agent_name:
            agent_id = agent["agentId"]
            return agent_client.delete_agent(agentId=agent_id)
    
    return None


