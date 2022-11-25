import * as cdk from 'aws-cdk-lib';
// import * as path from 'path';
import { Construct } from 'constructs';
// import { AmplifyExportedBackend } from '@aws-amplify/cdk-exported-backend';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class FlashcardsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appAcountUserArn = new cdk.CfnParameter(this, 'AppAccountUserArn', {
      type: 'String',
      description: 'The ARN of the user in the App account that will upload the exported backend files to S3',
    });

    const exportedBackendBucket = new s3.Bucket(this, 'ExportedBackendBucket', {
      bucketName: 'amplify-backend-flashcards',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    exportedBackendBucket.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.ArnPrincipal(appAcountUserArn.valueAsString)],
      actions: ['s3:PutObject'],
      resources: [exportedBackendBucket.arnForObjects('export-amplify-stack.zip')],
    }));

    // const amplifyBackend = new AmplifyExportedBackend(this, 'AmplifyBackend', {
    //   // amplifyEnvironment: cdk.Stack.of(this).region + cdk.Stack.of(this).account,
    //   amplifyEnvironment: 'prod',
    //   path: path.resolve(__dirname, 'amplify-export-flashcards'),
    // });
  }
}
