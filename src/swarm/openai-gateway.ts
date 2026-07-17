import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import type { McpServerConfig } from "./mcp-tools";
import { toOpenAiTools } from "./mcp-tools";
import type { ModelGateway, ModelRunRequest } from "./ports";

type ResponsesClient = {
  responses: {
    parse(request: unknown): Promise<{ output_parsed: unknown }>;
  };
};

type ClientFactory = (apiKey: string) => ResponsesClient;

export type OpenAIModelGatewayOptions = {
  apiKey: string;
  model: string;
  mcpServers?: readonly McpServerConfig[];
};

export class OpenAIModelGateway implements ModelGateway {
  private client?: ResponsesClient;

  constructor(
    private readonly options: OpenAIModelGatewayOptions,
    private readonly clientFactory: ClientFactory = (apiKey) =>
      new OpenAI({ apiKey }) as unknown as ResponsesClient,
  ) {}

  private getClient(): ResponsesClient {
    if (!this.options.apiKey)
      throw new Error("OPENAI_API_KEY is required for live model execution");
    this.client ??= this.clientFactory(this.options.apiKey);
    return this.client;
  }

  async run<T>(request: ModelRunRequest<T>): Promise<T> {
    const response = await this.getClient().responses.parse({
      model: this.options.model,
      instructions: request.systemPrompt,
      input: JSON.stringify(request.input),
      text: {
        format: zodTextFormat(request.outputSchema, `${request.role}_output`),
      },
      tools: toOpenAiTools(this.options.mcpServers ?? []),
      store: false,
    });
    if (
      response.output_parsed === null ||
      response.output_parsed === undefined
    ) {
      throw new Error(
        `Model did not return structured output for ${request.role}`,
      );
    }
    return request.outputSchema.parse(response.output_parsed);
  }
}
