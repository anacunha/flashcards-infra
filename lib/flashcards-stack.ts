import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as amplify from '@aws-cdk/aws-amplify-alpha';

export class FlashcardsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const amplifyApp = new amplify.App(this, 'FlashcardsApp', {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'anacunha',
        repository: 'flashcards-app',
        oauthToken: cdk.SecretValue.secretsManager('github-token'),
      })
    });

    amplifyApp.addBranch('main');
  }
}
