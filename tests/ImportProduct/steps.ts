import { ServiceCatalog, ResourceGroups, S3, config } from "aws-sdk";
import { ImportProduct } from "../../src/ImportProduct/lib";

export async function GivenAnOrphanedProductAndAPortfolio(
  catalog: ServiceCatalog,
  s3: S3,
  rg: ResourceGroups,
  id: string
) {
  const { region } = config;

  await CreateTagResourceGroup(rg, id);

  await CreateTaggedBucket(s3, id);

  const key = `${id}/v1.json`;

  await UploadTaggedTemplate(s3, id, key, DUMMY);

  await catalog
    .createProduct({
      Name: id,
      IdempotencyToken: id,
      Owner: id,
      ProductType: "CLOUD_FORMATION_TEMPLATE",
      Tags: [{ Key: "ExecutionId", Value: id }],
      ProvisioningArtifactParameters: {
        Name: id,
        Type: "CLOUD_FORMATION_TEMPLATE",
        Info: {
          LoadTemplateFromURL: `https://${id}.s3-${region}.amazonaws.com/${key}`
        }
      }
    })
    .promise();

  await catalog
    .createPortfolio({
      DisplayName: id,
      IdempotencyToken: id,
      ProviderName: id,
      Tags: [{ Key: "ExecutionId", Value: id }]
    })
    .promise();
}

export async function WhenIAssociateAProductWithThePortfolio(
  catalog: ServiceCatalog,
  id: string
) {
  const { products, count } = await FindProducts(catalog, id);
  expect(count).toBe(1);

  for await (const portfolio of ListPortfolios(catalog)) {
      if (portfolio.DisplayName === id) {
          await ImportProduct(catalog, portfolio.Id, products[0]);
          return;
      }
  }

  throw new Error("Could not find portfolio");
}

export async function ThenThePortfolioShouldContainTheProduct(
  result: Promise<void>
) {
  await expect(result).resolves.toBeUndefined();
}

async function FindProducts(sc: ServiceCatalog, name: string) {
  const products: string[] = [];
  for await (const p of SearchProducts(sc, name)) {
    const { ProductId, Name } = p.ProductViewSummary;
    if (name === Name) {
      products.push(ProductId);
    }
  }
  return { products, count: products.length };
}

async function* ListPortfolios(catalog: ServiceCatalog) {
  let morePages;
  do {
    const { PortfolioDetails, NextPageToken } = await catalog
      .listPortfolios({ PageToken: morePages })
      .promise();

    for (const detail of PortfolioDetails) {
        yield detail;
    }
  } while (morePages);
}

async function* SearchProducts(sc: ServiceCatalog, name: string) {
  let morePages;
  do {
    const { ProductViewDetails, NextPageToken } = await sc
      .searchProductsAsAdmin({
        Filters: {
          FullTextSearch: [name]
        },
        PageToken: morePages
      })
      .promise();

    for (const p of ProductViewDetails) {
      yield p;
    }

    morePages = NextPageToken;
  } while (morePages);
}

const DUMMY = `
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Resources": {
        "Bucket": {
            "Type": "AWS::S3::Bucket"
        }
    }
}`;

async function UploadTaggedTemplate(
  s3: S3,
  bucket: string,
  key: string,
  template: string
) {
  await s3
    .putObject({
      Bucket: bucket,
      Body: template,
      Key: key
    })
    .promise();
}

async function CreateTaggedBucket(s3: S3, id: string) {
  await s3.createBucket({ Bucket: id }).promise();
  await s3
    .putBucketTagging({
      Bucket: id,
      Tagging: {
        TagSet: [{ Key: "ExecutionId", Value: id }]
      }
    })
    .promise();
}

async function CreateTagResourceGroup(rg: ResourceGroups, executionId: string) {
  await rg
    .createGroup({
      Name: executionId,
      ResourceQuery: {
        Type: "TAG_FILTERS_1_0",
        Query: JSON.stringify({
          ResourceTypeFilters: ["AWS::AllSupported"],
          TagFilters: [
            {
              Key: "ExecutionId",
              Values: [executionId]
            }
          ]
        })
      }
    })
    .promise();
}
