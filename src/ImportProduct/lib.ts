import { ServiceCatalog } from "aws-sdk";

interface Params {
  sourcePortfolioId?: string
  portfolioId: string
  productId: string
}

export async function ImportProduct(
  catalog: ServiceCatalog,
  {
    sourcePortfolioId,
    portfolioId,
    productId
  }: Params
) {
  await catalog
    .associateProductWithPortfolio({
      SourcePortfolioId: sourcePortfolioId,
      PortfolioId: portfolioId,
      ProductId: productId
    })
    .promise();

  return portfolioId;
}
