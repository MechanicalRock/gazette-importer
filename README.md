
# Gazette - Importer

## Description

A serverless application for importing products into a portfolio

## Requirements

- The gazette publisher should be used to publish products to the portfolio.
- The bucket name that holds the templates must be known; the importer uses the bucket name to determine what events to listen for.
- The name of the event bridge that the publisher is using must be known.
- You will need a target portfolio to add products to. `setup.yaml` is provided at the project root to do this.

## Build, Test, Deploy

- Run `npm run build` to build the project. This will create the `.aws-sam` directory.

- Tests can be run via `npm run test -- --cover`.

To deploy, change in to the `.aws-sam/build` directory and run the following script with the appropriate values substituted.

NB: Remember that the `TEMPLATE_BUCKET` must have a trail enabled this logging write events to the bucket.

```bash
ARTIFACT_BUCKET=
STACK_NAME=
BUCKET=
EVENT_BUS=
PORTFOLIO_ID=

sam package --template-file template.yaml --s3-bucket $ARTIFACT_BUCKET \
    --output-template-file packaged.yaml

sam deploy --template-file packaged.yaml --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM --parameter-overrides \
    PortfolioId=$PORTFOLIO_ID Bucket=$BUCKET EventBus=$EVENT_BUS
```

## Todo

- Not all failure modes are currently tested
- Lambda's require 'right-sizing' via [power-tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning)
- No E2E tests
- CI/CD and publishing to SAR needs setting up

