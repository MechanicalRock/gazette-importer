import joi from "@hapi/joi";

interface Input {
    productId: string
    name: string
    version: string
}

interface Output extends Input {
    portfolioArn: string
}

const inputSchema = joi.object({
    productId: joi.string().required(),
    name: joi.string().required(),
    version: joi.string().required()
});

const outputSchema = joi.object({
    portfolioArn: joi.string().required()
}).concat(inputSchema);

export const ValidateInput =
    async (input) => await inputSchema.validate<Input>(input)

export const ValidateOutput =
    async (output) => await outputSchema.validate<Output>(output)

