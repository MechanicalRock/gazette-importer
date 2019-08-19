import { Handler } from "aws-lambda";
import { ServiceCatalog, EventBridge } from "aws-sdk";
import { captureAWSClient } from "aws-xray-sdk";
import { get } from "env-var";
import { ImportProduct } from "./lib";
import { ValidateInput, ValidateOutput } from "./schema";

export const handler: Handler = EventWrapper(
  async event => {
    const portfolioArn = get("PORTFOLIO_ARN")
      .required()
      .asString();

    const sourcePortfolioArn = process.env["SOURCE_PORTFOLIO_ARN"];

    const sourcePortfolioId = sourcePortfolioArn
      ? sourcePortfolioArn.split("/")[1]
      : undefined;

    const portfolioId = portfolioArn.split("/")[1];

    const { productId, name, version } = await ValidateInput(event);

    const catalog = captureAWSClient(new ServiceCatalog());

    await ImportProduct(catalog, {
      sourcePortfolioId,
      portfolioId,
      productId
    });

    return await ValidateOutput({
      portfolioArn,
      productId,
      name,
      version
    });
  },
  get("EVENT_BUS")
    .required()
    .asString()
);

interface Params {
  portfolioArn: string;
  productId: string;
  name: string;
  version: string;
}

function EventWrapper<TEvent = any>(
  handler: Handler<TEvent, Params>,
  eventBus: string
): Handler<TEvent> {
  return async (event, context, callback) => {
    const { portfolioArn, productId, name, version } = (await handler(
      event,
      context,
      callback
    )) as Params;

    await captureAWSClient(new EventBridge())
      .putEvents({
        Entries: [
          {
            EventBusName: eventBus,
            Source: "gazette",
            DetailType: "importer.Associated",
            Resources: [portfolioArn],
            Detail: JSON.stringify({
              productId,
              name,
              version
            })
          }
        ]
      })
      .promise();

    return null;
  };
}
