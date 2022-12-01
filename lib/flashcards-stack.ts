import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { AmplifyExportedBackend } from '@aws-amplify/cdk-exported-backend';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as customResource from 'aws-cdk-lib/custom-resources';

export class FlashcardsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const amplifyBackend = new AmplifyExportedBackend(this, 'AmplifyBackend', {
      // amplifyEnvironment: cdk.Stack.of(this).region + cdk.Stack.of(this).account,
      amplifyEnvironment: 'prod',
      path: path.resolve(__dirname, 'amplify-export-flashcards'),
    });

    const branch = 'main';

    const amplifyApp = new amplify.App(this, 'FlashcardsApp', {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'anacunha',
        repository: 'flashcards-app',
        oauthToken: cdk.SecretValue.secretsManager('github-token'),
      }),
    });

    amplifyApp.addBranch(branch);

    const buildTrigger = new customResource.AwsCustomResource(this, 'BuildAmplifyAppTrigger', {
      onCreate: {
        service: 'Amplify',
        action: 'startJob', // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Amplify.html#startJob-property
        parameters: {
          appId: amplifyApp.appId,
          branchName: branch,
          jobType: 'RELEASE',
        },
        physicalResourceId: customResource.PhysicalResourceId.of('BuildAmplifyAppTrigger'),
      },
      policy: customResource.AwsCustomResourcePolicy.fromSdkCalls({
        resources: customResource.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
  }
}
