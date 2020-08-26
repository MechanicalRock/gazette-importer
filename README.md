
# Gazette - Importer

## Description

A serverless application for importing products into a portfolio.

It can also be used to import products from a shared portfolio into a local portfolio

## Requirements

- You should be using an upstream gazette publisher and/or importer where the shared portfolio is hosted.
- You should be receiving events from gazette system via event forwarding.
- You will need the name of the event bus that you are using to receive events from the upstream gazette components. This must be passed into the template.
- You will need a target portfolio to add products to. `setup.yaml` is provided at the project root to do this.

Additionally:

If using to import orphaned products into a portfolio:

- The bucket name that holds the templates must be known; the importer uses the bucket name to determine what events to listen for.

if using to import products from a shared portfolio into a local portfolio:

- You must specify the SourcePortfolioId of the shared portfolio

## Build, Test, Deploy

- Run `npm run build` to build the project. This will create the `.aws-sam` directory.

- Tests can be run via `npm run test -- --cover`.

To deploy, change in to the `.aws-sam/build` directory and run the following script with the appropriate values substituted.

NB: 
* Remember that the `TEMPLATE_BUCKET` must have a trail enabled this logging write events to the bucket.
* `SOURCE_PORTFOLIO_ID` is an optional parameter if you wish to import portfolios shared from a master account

```bash
ARTIFACT_BUCKET=
STACK_NAME=
TEMPLATE_BUCKET=
EVENT_BUS=
PORTFOLIO_ID=
SOURCE_PORTFOLIO_ID=

sam package --template-file template.yaml --s3-bucket $ARTIFACT_BUCKET \
    --output-template-file packaged.yaml

sam deploy --template-file packaged.yaml --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM --parameter-overrides \
    PortfolioId=$PORTFOLIO_ID Bucket=$TEMPLATE_BUCKET EventBus=$EVENT_BUS SourcePortfolioId=$SOURCE_PORTFOLIO_ID
```

## Todo

- Not all failure modes are currently tested
- Lambda's require 'right-sizing' via [power-tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning)
- No E2E tests
- CI/CD and publishing to SAR needs setting up

