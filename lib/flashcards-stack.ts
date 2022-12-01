import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { AmplifyExportedBackend } from '@aws-amplify/cdk-exported-backend';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
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
        'SPEECH_GENERATOR_VOICE_ID': amplifyBackend.nestedStackByCategortService('predictions', 'Polly')[0].includedTemplate.getOutput('language').value,
        'SPEECH_GENERATOR_LANGUAGE_CODE': amplifyBackend.nestedStackByCategortService('predictions', 'Polly')[0].includedTemplate.getOutput('voice').value,
      },
      buildSpec: codebuild.BuildSpec.fromObjectToYaml({
        version: '1.0',
        frontend: {
          phases: {
            preBuild: {
              commands: [
                'npm ci',
              ]
            },
            build: {
              commands: [
                'echo "REACT_APP_REGION"="$REGION" >> .env',
                'echo "REACT_APP_IDENTITY_POOL_ID"="$IDENTITY_POOL_ID" >> .env',
                'echo "REACT_APP_USER_POOL_ID"="$USER_POOL_ID" >> .env',
                'echo "REACT_APP_USER_POOL_CLIENT_ID"="$USER_POOL_CLIENT_ID" >> .env',
                'echo "REACT_APP_GRAPHQL_ENDPOINT"="$GRAPHQL_ENDPOINT" >> .env',
                'echo "REACT_APP_SPEECH_GENERATOR_VOICE_ID"="$SPEECH_GENERATOR_VOICE_ID" >> .env',
                'echo "REACT_APP_SPEECH_GENERATOR_LANGUAGE_CODE"="$SPEECH_GENERATOR_LANGUAGE_CODE" >> .env',
                'npm run build',
              ]
            }
          },
          artifacts: {
            baseDirectory: 'build',
            files: [
              '**/*'
            ],
          },
        },
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
