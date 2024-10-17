import json
import boto3 
import os
def lambda_handler(event, context):
    response_body={}
    
    print(event)
    if (event['apiPath']=='/get_all_alerts'):
        cw_client = boto3.client('cloudwatch')
        response = cw_client.describe_alarms(AlarmNames=['Web_Server_CPU_Utilization'],StateValue='ALARM')
        if (len(response["MetricAlarms"])==0):
            response_body = {
                    'application/json': {
                        'body': 'There no no operational issue in AWS account, all alarms are in OK state'
                    }
                }
        else:
        
            response_body = {
                    'application/json': {
                        'body': json.dumps( [{'ID':response["MetricAlarms"][0]["Dimensions"][0]["Value"], 'ResourceType':'EC2', 'State': 'High CPU Utilization, instance in alert state'}] )
                    }
                }
    #EC2, Lambda Function, DynamoDB"    
    else:
        client = boto3.client('ses')
        
        response = client.send_email(
        Destination={
            'ToAddresses': [
                os.environ.get('EMAIL_ADDRESS')
            ],
        },
        Message={
            'Body': {
                
                'Text': {
                  
                    'Data': event['requestBody']['content']['application/json']['properties'][2]['value'],  
                    
                    
                },
            },
            'Subject': {
                
                'Data': event['requestBody']['content']['application/json']['properties'][0]['value'],
            },
        },
        Source= os.environ.get('EMAIL_ADDRESS'),
        
    )
        
        response_body = {
                'application/json': {
                    'body': "email notification sent"
                }
            }
        
        
    action_response = {
        'actionGroup': event['actionGroup'],
        'apiPath': event['apiPath'],
        'httpMethod': event['httpMethod'],
        'httpStatusCode': 200,
        'responseBody': response_body
    }
    
 #   session_attributes = event['sessionAttributes']
    prompt_session_attributes = event['promptSessionAttributes']
    
    api_response = {
        'messageVersion': '1.0', 
        'response': action_response,
 #      'sessionAttributes': session_attributes,
        'promptSessionAttributes': prompt_session_attributes
    }
        
    return api_response
