import { ValidateInput, ValidateOutput } from "../../src/ImportProduct/schema";

interface InputSchemaTestCase {
    description: string
    shouldThrow: boolean
    input: {
        productId?: string
        name?: string
        version?: string
    }
}

interface OutputSchemaTestCase {
    description: string
    shouldThrow: boolean
    input: {
        portfolioArn?: string
        productId?: string
        name?: string
        version?: string
    }
}

const outputCases: OutputSchemaTestCase[] = [
    {
        description: "success",
        shouldThrow: false,
        input: {
            portfolioArn: "port-xzy",
            productId: "prod-xyz",
            name: "product",
            version: "v1"
        }
    },
    {
        description: "portfolioArn must be supplied",
        shouldThrow: true,
        input: {
            productId: "prod-xyz",
            name: "product",
            version: "v1"
        }
    },
    {
        description: "productId must be supplied",
        shouldThrow: true,
        input: {
            portfolioArn: "port-xzy",
            name: "product",
            version: "v1"
        }
    },
    {
        description: "version must be supplied",
        shouldThrow: true,
        input: {
            portfolioArn: "port-xzy",
            productId: "prod-xyz",
            name: "product",
        }
    },
    {
        description: "name must be supplied",
        shouldThrow: true,
        input: {
            portfolioArn: "port-xzy",
            productId: "prod-xyz",
            version: "v1"
        }
    }
];

const inputCases: InputSchemaTestCase[] = [
    {
        description: "productId must be supplied",
        shouldThrow: true,
        input: {
            name: "product",
            version: "v1"
        }
    },
    {
        description: "Success",
        shouldThrow: false,
        input: {
            productId: "prod-xyz",
            name: "product",
            version: "v1"
        }
    },
    {
        description: "name must be supplied",
        shouldThrow: true,
        input: {
            productId: "prod-xyz",
            version: "v1"
        }
    },
    {
        description: "version must be supplied",
        shouldThrow: true,
        input: {
            productId: "prod-xyz",
            name: "product",
        }
    },
];

describe("ImportProduct:", () => {
    describe("Schema:", () => {
        inputCases.forEach(c => {
            it(c.description, async (done) => {
                try {
                    await ValidateInput(c.input);
                    if (c.shouldThrow) {
                        done.fail(`Validation should have thrown an error`)
                    }
                } catch (err) {
                    if (!c.shouldThrow) {
                        done.fail(`Validation should not have thrown an error`)
                    }
                }
                done()
            })
        })

        outputCases.forEach(c => {
            it(c.description, async (done) => {
                try {
                    await ValidateOutput(c.input);
                    if (c.shouldThrow) {
                        done.fail(`Validation should have thrown an error`)
                    }
                } catch (err) {
                    if (!c.shouldThrow) {
                        done.fail(`Validation should not have thrown an error: ${err}`)
                    }
                }
                done()
            })
        })
    })
});
