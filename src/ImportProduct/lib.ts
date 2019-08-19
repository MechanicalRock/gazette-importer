import { ServiceCatalog } from "aws-sdk";

export async function ImportProduct(
  catalog: ServiceCatalog,
  portfolioId: string,
  productId: string
) {
  await catalog
    .associateProductWithPortfolio({
      PortfolioId: portfolioId,
      ProductId: productId
    })
    .promise();

  return portfolioId;
}
