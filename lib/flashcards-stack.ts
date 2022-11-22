import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { AmplifyExportedBackend } from '@aws-amplify/cdk-exported-backend';

export class FlashcardsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const amplifyBackend = new AmplifyExportedBackend(this, 'AmplifyBackend', {
      amplifyEnvironment: 'dev',
      path: path.resolve(__dirname, 'amplify-export-flashcards'),
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'FlashcardsQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
