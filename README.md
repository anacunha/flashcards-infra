```shell
npm install @aws-amplify/cdk-exported-backend

npm install @aws-cdk/aws-amplify-alpha
```

```shell
aws secretsmanager create-secret \
  --name github-token \
  --description "Access Token for GitHub" \
  --secret-string "<YOUR-GITHUB-TOKEN-HERE>"
```
