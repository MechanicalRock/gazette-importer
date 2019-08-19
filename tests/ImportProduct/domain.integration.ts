import { S3, ServiceCatalog, ResourceGroups, config } from "aws-sdk";
import { v4 } from "uuid";
import { backOff } from "exponential-backoff";

import {
    GivenAnOrphanedProductAndAPortfolio,
    WhenIAssociateAProductWithThePortfolio,
    ThenThePortfolioShouldContainTheProduct
} from "./steps";

describe("Given a catalog of products", () => {
    config.region = "ap-southeast-2";

    let id;

    const catalog = new ServiceCatalog();
    const s3 = new S3();
    const rg = new ResourceGroups();

    beforeEach(async done => {
        id = v4();
        await GivenAnOrphanedProductAndAPortfolio(catalog, s3, rg, id);
        done();
    });

    describe("When I search for an existing product by name", () => {
        const result = async () =>
            await backOff(() => WhenIAssociateAProductWithThePortfolio(catalog, id), {
                numOfAttempts: 5,
                startingDelay: 1000,
                timeMultiple: 1.5
            });

        it(
            "Then it should return a valid ID for an existing product",
            () => ThenThePortfolioShouldContainTheProduct(result()),
            20000
        );
    });
});
