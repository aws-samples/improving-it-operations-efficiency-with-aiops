import boto3
import json
ec2 = boto3.client('ec2')

def lambda_handler(event, context):
    response_body={}
    print(event)
    if (event['apiPath']=='/create_snapshot_of_EC2_volume'):
        print('inner')
        instanceid=event['requestBody']['content']['application/json']['properties'][0]['value'].split('/')[1]
        
        
        volume_id=ec2.describe_instances(InstanceIds=[instanceid])['Reservations'][0]['Instances'][0]['BlockDeviceMappings'][0]['Ebs']['VolumeId']
        response=ec2.create_snapshot(VolumeId=volume_id)
        response_body = {
            'application/json': {
                'body': response['SnapshotId']
            }
        }
    else:
        instanceid=event['requestBody']['content']['application/json']['properties'][0]['value'].split('/')[1]
        response=ec2.reboot_instances(InstanceIds=[instanceid])

        response_body = {
            'application/json': {
                'body': 'instance restarted'
            }
        }
    print(response_body)    
    action_response = {
        'actionGroup': event['actionGroup'],
        'apiPath': event['apiPath'],
        'httpMethod': event['httpMethod'],
        'httpStatusCode': 200,
        'responseBody': response_body
    }
    
    session_attributes = event['sessionAttributes']
    prompt_session_attributes = event['promptSessionAttributes']
    
    api_response = {
        'messageVersion': '1.0', 
        'response': action_response,
        'sessionAttributes': session_attributes,
        'promptSessionAttributes': prompt_session_attributes
    }
        
    return api_response