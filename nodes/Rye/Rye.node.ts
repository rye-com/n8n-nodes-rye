import {
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionTypes,
	NodeApiError,
	NodeOperationError,
	sleep,
} from 'n8n-workflow';

import type { Buyer, CreateCheckoutIntentRequestBody, GetCheckoutIntentResponse } from './types';
import {
	checkoutIntentOperations,
	checkoutIntentFields,
	brandOperations,
	brandFields,
} from './descriptions';

export class Rye implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Rye',
		name: 'rye',
		icon: { light: 'file:../../icons/rye.svg', dark: 'file:../../icons/rye.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Rye Universal Checkout API',
		defaults: {
			name: 'Rye',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'ryeApi',
				required: true,
			},
		],
		hints: [
			{
				message:
					'Tip: When using "Get Status" with polling enabled, add a Switch or IF node after this node to route your workflow based on the final checkout status (awaiting_confirmation, completed, failed).',
				whenToDisplay: 'afterExecution',
				location: 'outputPane',
				displayCondition:
					'={{ $parameter["operation"] === "getStatus" && $parameter["enablePolling"] === true }}',
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.apiUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Checkout Intent',
						value: 'checkoutIntent',
					},
					{
						name: 'Brand',
						value: 'brand',
					},
				],
				default: 'checkoutIntent',
			},
			...checkoutIntentOperations,
			...checkoutIntentFields,
			...brandOperations,
			...brandFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'checkoutIntent') {
					if (operation === 'create') {
						const productUrl = this.getNodeParameter('productUrl', i) as string;
						const quantity = this.getNodeParameter('itemQuantity', i) as number;
						const buyer = this.getNodeParameter('buyer', i) as Buyer;

						if (buyer.country.toLowerCase() !== 'us') {
							throw new NodeOperationError(
								this.getNode(),
								'Only US addresses are currently supported. Please refer to the documentation: https://docs.rye.com/api-v2/example-flows/simple-checkout#step-3%3A-create-a-checkout-intent',
								{ itemIndex: i },
							);
						}

						const body = {
							productUrl,
							buyer,
							quantity,
						} satisfies CreateCheckoutIntentRequestBody;

						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'ryeApi',
							{
								method: 'POST',
								url: '/checkout-intents',
								body,
							},
						);

						returnData.push({ json: responseData });
					} else if (operation === 'getStatus') {
						const checkoutIntentId = this.getNodeParameter('checkoutIntentId', i) as string;
						const enablePolling = this.getNodeParameter('enablePolling', i) as boolean;

						const fetchCheckoutIntent = async (): Promise<GetCheckoutIntentResponse> =>
							await this.helpers.httpRequestWithAuthentication.call(this, 'ryeApi', {
								method: 'GET',
								url: `/checkout-intents/${checkoutIntentId}`,
							});

						if (!enablePolling) {
							const responseData = await fetchCheckoutIntent();

							returnData.push({ json: responseData });
						} else {
							const maxAttempts = this.getNodeParameter('maxAttempts', i) as number;
							const intervalSeconds = this.getNodeParameter('intervalSeconds', i) as number;

							let attempt = 0;
							let responseData;

							while (attempt < maxAttempts) {
								responseData = await fetchCheckoutIntent();

								const state = responseData.state;
								if (
									state === 'awaiting_confirmation' ||
									state === 'completed' ||
									state === 'failed'
								) {
									break;
								}

								attempt++;
								if (attempt < maxAttempts) {
									await sleep(intervalSeconds * 1000);
								}
							}

							returnData.push({ json: responseData ?? {} });
						}
					} else if (operation === 'confirm') {
						const checkoutIntentId = this.getNodeParameter('checkoutIntentId', i) as string;
						const stripeToken = this.getNodeParameter('stripeToken', i) as string;

						const body = {
							paymentMethod: {
								token: stripeToken,
							},
						};

						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'ryeApi',
							{
								method: 'POST',
								url: `/checkout-intents/${checkoutIntentId}/confirm`,
								body,
							},
						);

						returnData.push({ json: responseData });
					}
				} else if (resource === 'brand') {
					if (operation === 'verifyBrandSupport') {
						const domain = this.getNodeParameter('domain', i) as string;

						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'ryeApi',
							{
								method: 'GET',
								url: `/brands/domain/${domain}`,
							},
						);

						returnData.push({ json: responseData });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}

				if (error.response?.data) {
					throw new NodeApiError(this.getNode(), error.response.data, {
						itemIndex: i,
					});
				}

				throw error;
			}
		}

		return [returnData];
	}
}
