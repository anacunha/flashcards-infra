import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { AmplifyExportedBackend } from '@aws-amplify/cdk-exported-backend';

export class FlashcardsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const amplifyBackend = new AmplifyExportedBackend(this, 'AmplifyBackend', {
      // amplifyEnvironment: cdk.Stack.of(this).region + cdk.Stack.of(this).account,
      amplifyEnvironment: 'prod',
      path: path.resolve(__dirname, 'export-amplify-stack'),
    });
  }
}
