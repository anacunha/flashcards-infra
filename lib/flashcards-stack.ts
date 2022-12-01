import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { AmplifyExportedBackend } from '@aws-amplify/cdk-exported-backend';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as customResource from 'aws-cdk-lib/custom-resources';
import { CfnIdentityPool } from 'aws-cdk-lib/aws-cognito';

export class FlashcardsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const amplifyBackend = new AmplifyExportedBackend(this, 'AmplifyBackend', {
      amplifyEnvironment: 'prod',
      path: path.resolve(__dirname, 'amplify-export-flashcards'),
    });

    const branch = 'main';
    const identityPool = amplifyBackend.authNestedStack().identityPool();
    const identityProviders = identityPool.cognitoIdentityProviders as CfnIdentityPool.CognitoIdentityProviderProperty[];

    const amplifyApp = new amplify.App(this, 'FlashcardsApp', {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'anacunha',
        repository: 'flashcards-app',
        oauthToken: cdk.SecretValue.secretsManager('github-token'),
      }),
      environmentVariables: {
        'REGION': amplifyBackend.rootStack.region,
        'IDENTITY_POOL_ID': identityPool.ref,
        'USER_POOL_ID': amplifyBackend.authNestedStack().userPool().ref,
        'USER_POOL_CLIENT_ID': identityProviders[0]?.clientId as string,
        'GRAPHQL_ENDPOINT': amplifyBackend.graphqlNestedStacks().graphQLAPI().attrGraphQlUrl,
      },
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
