import { ResourceGroups, config, ServiceCatalog, S3 } from "aws-sdk";
import { ResourceIdentifier } from "aws-sdk/clients/resourcegroups";

type DeleteFunc = (arn: string) => Promise<void>;

async function DeleteS3Bucket(arn: string) {
  const s3 = new S3();
  const bucket = arn.split(":::")[1];
  for await (const objects of ListObjects(s3, bucket)) {
    await s3
      .deleteObjects({
        Bucket: bucket,
        Delete: {
          Objects: objects.map(Key => ({ Key })),
          Quiet: true
        }
      })
      .promise();
  }

  await s3.deleteBucket({ Bucket: bucket }).promise();
}

async function DeleteServiceCatalogCloudFormationProduct(arn: string) {
  const productId = arn.split("/")[1];

  const catalog = new ServiceCatalog();

  let morePages;
  do {
    const {
      PortfolioDetails,
      NextPageToken
    } = await catalog
      .listPortfoliosForProduct({ ProductId: productId, PageToken: morePages })
      .promise();
    morePages = NextPageToken;

    for (const { Id } of PortfolioDetails) {
        await catalog.disassociateProductFromPortfolio({
            PortfolioId: Id,
            ProductId: productId
        }).promise();
    }
  } while (morePages);

  await new ServiceCatalog()
    .deleteProduct({
      Id: productId
    })
    .promise();
}

async function DeleteServiceCatalogPortfolio(arn: string) {
  const portfolioId = arn.split("/")[1];

  await new ServiceCatalog()
    .deletePortfolio({
      Id: portfolioId
    })
    .promise();
}

const Delete: Map<string, DeleteFunc> = new Map<string, DeleteFunc>([
  ["AWS::S3::Bucket", DeleteS3Bucket],
  [
    "AWS::ServiceCatalog::CloudFormationProduct",
    DeleteServiceCatalogCloudFormationProduct
  ],
  ["AWS::ServiceCatalog::Portfolio", DeleteServiceCatalogPortfolio]
]);

async function* ListObjects(s3: S3, bucket: string) {
  let moreObjects;
  do {
    const { Contents, ContinuationToken } = await s3
      .listObjectsV2({
        Bucket: bucket,
        ContinuationToken: moreObjects
      })
      .promise();

    yield Contents.map(c => c.Key);

    moreObjects = ContinuationToken;
  } while (moreObjects);
}

async function DoesResourceQueryContainKeys(
  rg: ResourceGroups,
  name: string,
  tagKeys: string[]
) {
  const {
    GroupQuery: { ResourceQuery }
  } = await rg
    .getGroupQuery({
      GroupName: name
    })
    .promise();

  if (ResourceQuery.Type !== "TAG_FILTERS_1_0") {
    return false;
  }

  const keySet = new Set<string>(
    JSON.parse(ResourceQuery.Query).TagFilters.map(tag => tag.Key)
  );

  for (const tag of tagKeys) {
    if (!keySet.has(tag)) {
      return false;
    }
  }

  return true;
}

async function* ListGroups(rg: ResourceGroups, tagKeys?: string[]) {
  let moreGroups;
  do {
    const { GroupIdentifiers, NextToken } = await rg
      .listGroups({
        NextToken: moreGroups
      })
      .promise();

    for (const group of GroupIdentifiers) {
      if (
        !tagKeys ||
        (await DoesResourceQueryContainKeys(rg, group.GroupArn, tagKeys))
      ) {
        yield group;
      }
    }
    moreGroups = NextToken;
  } while (moreGroups);
}

async function* ListGroupResources(rg: ResourceGroups, name: string) {
  let moreResources;
  do {
    const { ResourceIdentifiers, NextToken } = await rg
      .listGroupResources({ GroupName: name, NextToken: moreResources })
      .promise();
    for (const resource of ResourceIdentifiers) {
      yield resource;
    }
    moreResources = NextToken;
  } while (moreResources);
}

async function ListAllGroupResources(rg: ResourceGroups, name: string) {
    const resources: ResourceIdentifier[]  = []
    for await (const resource of ListGroupResources(rg, name)) {
        resources.push(resource);
    }
    return resources;
}

async function DeleteGroup(rg: ResourceGroups, name: string) {
  let error = false;
  const resources = (await ListAllGroupResources(rg, name))
    .sort((a, b) => a.ResourceType.localeCompare(b.ResourceType))
    .map(r => ({
        resource: r, attempts: 0
    }));

  do {
    const { resource, attempts } = resources.shift();
    if (attempts > 2) {
        error = true;
        console.error(`Could not delete ${resource}`);
        continue;
    }
    try {
        await DeleteResource(resource.ResourceType, resource.ResourceArn);
    } catch (err) {
        resources.push({ resource, attempts: attempts + 1 })
    }
  } while(resources.length !== 0)

  if (error) {
    throw new Error(`Failed to delete all resources in group: ${name}`);
  }

  await rg.deleteGroup({ GroupName: name }).promise();
}

async function DeleteResource(type: string, arn: string) {
  console.log(type, arn);
  await Delete.get(type)(arn);
}

async function main(region: string) {
  config.region = region;
  const rg = new ResourceGroups();
  for await (const group of ListGroups(rg)) {
    try {
      await DeleteGroup(rg, group.GroupName);
    } catch (err) {
      console.error(err);
    }
  }
}

main("ap-southeast-2");
