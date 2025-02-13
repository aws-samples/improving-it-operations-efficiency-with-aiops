
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from 'cdk-nag'


export class EC2Construct extends Construct {

  public readonly instanceId: string;  

  constructor(scope: Construct, id: string,props: cdk.StackProps ) {
    super(scope, id);

        

    // Get the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true });

    // Get the public subnet from the default VPC
    const publicSubnet = vpc.publicSubnets[0];

    // Create an EC2 instance in the public subnet
    const ec2Instance = new ec2.Instance(this, `Loadtest-EC2Instance`, {
      vpc,
      vpcSubnets: { subnets: [publicSubnet] },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      propagateTagsToVolumeOnCreation:true
    });

    this.instanceId = ec2Instance.instanceId;

    NagSuppressions.addResourceSuppressions(ec2Instance, [
      {
        id: 'AwsSolutions-EC26',
        reason: 'Demo EC2 instance to show loadtesting, EBS volume contains no data'
      },
      {
        id: 'AwsSolutions-EC28',
        reason: 'Demo EC2 instance to show loadtesting, no need to have ASG'
      },
      {
        id: 'AwsSolutions-EC29',
        reason: 'Demo EC2 instance to show loadtesting, not part of ASG so termination protection not required'
      },
    ])

  }
}