---
id: integration-aws-lambda
title: Integrating Woovi with AWS Lambda
tags:
- integration
- lambda
---

### Configuring the AWS CLI

You also need the `aws` CLI configured. This is required because it handles all
access to your account and runs the script that _deploys_ your application via CDK.

This [link](https://aws.amazon.com/cli/) has the CLI installation instructions for your
operating system.

After that, configure the CLI with the command `aws configure`. It will
ask for a few values such as `AWS Access Key ID`, `AWS Secret Access Key`, etc. To learn how to
get these values, see the [AWS](https://docs.aws.amazon.com/pt_br/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-creds) documentation, which walks you through
the full process.

#### References

- [Quick setup for a new configuration](https://docs.aws.amazon.com/pt_br/cli/latest/userguide/getting-started-quickstart.html#getting-started-quickstart-new)

### Configuring CDK

First of all, you need to install CDK. As a prerequisite, you also need
[npm](https://www.npmjs.com/) installed on your machine (you can use Yarn if you prefer).

Once npm is installed, install the AWS CDK toolkit as follows:

```
npm install --global aws-cdk
```

When it finishes, check that everything worked with:

```
cdk --version
```

#### References

- [Getting started with CDK](https://docs.aws.amazon.com/pt_br/cdk/v2/guide/getting_started.html#getting_started_install)

### Boilerplate repository for CDK + AWS Lambda

For the next steps, we have a _boilerplate_ repository. If you
want to use it for the following steps, you can find it [here](https://github.com/Open-Pix/aws-cdk-rest-lambda-boilerplate).

### Bootstrapping CDK

Under the hood, CDK uses other resources such as S3 _buckets_. We need to create them
to make sure the whole flow works correctly. To do so, run:

```
cdk boostrap aws://ACCOUNT-NUMBER/REGION
```

To get both the `ACCOUNT-NUMBER` and the desired `REGION`, if you don't have them at hand,
run the following command with the AWS CLI you set up earlier:

```
aws sts get-caller identity
```

This shows some information about your account, including the `REGION`
and the `ACCOUNT-NUMBER`.

### Deploying my CDK stack

After configuring the CDK CLI correctly, two more steps are needed to finally have
our stack running on AWS:

First, we "synthesize" our application into the format expected by
CloudFormation, the service CDK uses under the hood to handle
all deployment responsibilities.

To synthesize, run this command:

```
cdk synth
```

This converts your entire application into a friendly YML format that
AWS CloudFormation reads.

---

Once synthesized, just _deploy_ our stack by running:

```
cdk deploy
```

You have now deployed your application successfully! You can access resources such as:

- API Gateway
- Lambda

And check that everything was deployed correctly.

#### References

- [Your first CDK application](https://docs.aws.amazon.com/pt_br/cdk/v2/guide/hello_world.html)

## How to use it?

To use it, we need three things configured correctly:

- API Gateway (you already configured it in the previous step);
- The webhook;

### Configuring the webhook

To create the webhook, see the [documentation](../webhook/platform/webhook-platform-api.mdx)
on creating a webhook in our platform and click the `Novo webhook` (New webhook) button.
You will see this form:

![Webhook](/img/integrations/new-webhook-form.png)

Fill it in as follows:

1. `Nome` (Name): enter any name you like for the webhook.
2. `Evento` (Event): the event that should trigger the webhook;
select **Transação Pix Recebida** (Pix transaction received).
3. `Url`: enter the API Gateway URL that will act as the trigger
for your Lambda function.

After filling in these three fields, click `Salvar` (Save). Congratulations, you've created your
new webhook!

For more information on configuring your webhook, see these other
docs:

- [Creating a webhook to intercept a Pix and call an API](../webhook/platform/webhook-platform-api.mdx)
- [Configuring my webhook's HTTP headers](../webhook/webhook-headers.mdx)
