import * as ses from 'aws-cdk-lib/aws-ses';
import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";

export class SESConstruct extends Construct {
    constructor(scope: Construct, id: string, emailAddress: string, props?: cdk.StackProps) {
        super(scope, id);

        // Create a configuration set
        const configurationSet = new ses.CfnConfigurationSet(this, 'ConfigurationSet', {
            name: 'MyDemoConfigurationSet', // Name of the configuration set
        });

        // Create an email identity for a specific email address
        const emailIdentity = new ses.CfnEmailIdentity(this, 'EmailAddress', {
            emailIdentity: emailAddress, // Replace with your email address
        });



        // Apply removal policy
        emailIdentity.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        configurationSet.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }
}