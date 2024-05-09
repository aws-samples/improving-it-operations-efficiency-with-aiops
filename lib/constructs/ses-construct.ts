
import * as ses from 'aws-cdk-lib/aws-ses';
import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";

export class SESConstruct extends  Construct {
    constructor(scope: Construct, id: string, emailAddress:string,props?: cdk.StackProps) {
        super(scope, id);

   
        // Create an email identity for a specific email address
        const emailIdentity = new ses.CfnEmailIdentity(scope, 'EmailAddress', {
            emailIdentity: emailAddress, // Replace with your email address
        });
    }
}
