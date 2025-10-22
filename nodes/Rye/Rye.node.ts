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
					'Tip: When using "Get Status" with polling enabled, add a Switch or IF node after this node to route your workflow based on the final checkout status (completed, failed, cancelled).',
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
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['checkoutIntent'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new checkout intent',
						action: 'Create a checkout intent',
						routing: {
							request: {
								method: 'POST',
								url: '/checkout-intents',
							},
						},
					},
					{
						name: 'Get Status',
						value: 'getStatus',
						description: 'Get the status of a checkout intent',
						action: 'Get checkout intent status',
					},
					{
						name: 'Confirm',
						value: 'confirm',
						description: 'Confirm a checkout intent with payment',
						action: 'Confirm a checkout intent',
						routing: {
							request: {
								method: 'POST',
							},
						},
					},
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['brand'],
					},
				},
				options: [
					{
						name: 'Verify Support',
						value: 'verifyBrandSupport',
						description: 'Check if a brand/domain is supported',
						action: 'Verify brand support',
						routing: {
							request: {
								method: 'GET',
							},
						},
					},
				],
				default: 'verifyBrandSupport',
			},
			{
				displayName: 'Product URL',
				name: 'productUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['checkoutIntent'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The URL of the product to purchase from any supported merchant',
				placeholder: 'https://www.amazon.com/Apple-MX532LL-A-AirTag/dp/B0CWXNS552',
			},
			{
				displayName: 'Buyer Email',
				name: 'buyerEmail',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['checkoutIntent'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'Email address of the buyer',
			},
			{
				displayName: 'Shipping Address',
				name: 'shippingAddress',
				type: 'fixedCollection',
				required: true,
				displayOptions: {
					show: {
						resource: ['checkoutIntent'],
						operation: ['create'],
					},
				},
				default: {},
				description: 'Shipping address for the order (US only)',
				options: [
					{
						name: 'address',
						displayName: 'Address',
						values: [
							{
								displayName: 'First Name',
								name: 'firstName',
								type: 'string',
								required: true,
								default: '',
							},
							{
								displayName: 'Last Name',
								name: 'lastName',
								type: 'string',
								required: true,
								default: '',
							},
							{
								displayName: 'Address Line 1',
								name: 'address1',
								type: 'string',
								required: true,
								default: '',
							},
							{
								displayName: 'Address Line 2',
								name: 'address2',
								type: 'string',
								default: '',
							},
							{
								displayName: 'City',
								name: 'city',
								type: 'string',
								required: true,
								default: '',
							},
							{
								displayName: 'State',
								name: 'provinceCode',
								type: 'string',
								required: true,
								default: '',
								description: 'Two-letter state code (e.g., CA, NY)',
							},
							{
								displayName: 'ZIP Code',
								name: 'postalCode',
								type: 'string',
								required: true,
								default: '',
							},
							{
								displayName: 'Country Code',
								name: 'countryCode',
								type: 'string',
								required: true,
								default: 'US',
								description: 'Two-letter country code (currently only US supported)',
							},
							{
								displayName: 'Phone',
								name: 'phone',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Checkout Intent ID',
				name: 'checkoutIntentId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['checkoutIntent'],
						operation: ['getStatus', 'confirm'],
					},
				},
				default: '',
				description:
					'The ID of the checkout intent to check or confirm. Typically obtained from the "Create" operation output.',
				placeholder: 'e.g., ci_abc123xyz',
			},
			{
				displayName: 'Enable Polling',
				name: 'enablePolling',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['checkoutIntent'],
						operation: ['getStatus'],
					},
				},
				default: true,
				description:
					'Whether to automatically poll until the checkout reaches a terminal state (completed, failed, or cancelled). When enabled, the node will retry up to the maximum attempts specified below.',
			},
			{
				displayName: 'Max Attempts',
				name: 'maxAttempts',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['checkoutIntent'],
						operation: ['getStatus'],
						enablePolling: [true],
					},
				},
				default: 10,
				description:
					'Maximum number of times to check the status before returning the current state. If the terminal state is not reached within this limit, the last known status will be returned.',
			},
			{
				displayName: 'Interval (Seconds)',
				name: 'intervalSeconds',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['checkoutIntent'],
						operation: ['getStatus'],
						enablePolling: [true],
					},
				},
				default: 5,
				description:
					'Number of seconds to wait between each polling attempt. For example, with 10 max attempts and 5 second intervals, polling will occur for up to 50 seconds total.',
			},
			{
				displayName: 'Stripe Token',
				name: 'stripeToken',
				type: 'string',
				typeOptions: {
					password: true,
				},
				required: true,
				displayOptions: {
					show: {
						resource: ['checkoutIntent'],
						operation: ['confirm'],
					},
				},
				default: '',
				description: 'The Stripe token that will be used to process the checkout payment',
				placeholder: 'tok_visa',
			},
			{
				displayName: 'Brand Domain',
				name: 'domain',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['brand'],
						operation: ['verifyBrandSupport'],
					},
				},
				default: '',
				description:
					'The merchant domain to check for Rye API support. Use this before creating a checkout to verify the merchant is supported.',
				placeholder: 'amazon.com',
			},
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
						const buyerEmail = this.getNodeParameter('buyerEmail', i) as string;
						const shippingAddress = this.getNodeParameter('shippingAddress', i) as {
							address: {
								firstName: string;
								lastName: string;
								address1: string;
								address2?: string;
								city: string;
								provinceCode: string;
								postalCode: string;
								countryCode: string;
								phone?: string;
							};
						};

						if (shippingAddress.address.countryCode.toLowerCase() !== 'us') {
							throw new NodeOperationError(
								this.getNode(),
								'Only US addresses are currently supported. Please refer to the documentation: https://docs.rye.com/api-v2/example-flows/simple-checkout#step-3%3A-create-a-checkout-intent',
								{ itemIndex: i },
							);
						}

						const body = {
							productUrl,
							buyer: {
								email: buyerEmail,
							},
							shippingAddress: shippingAddress.address,
						};

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

						if (!enablePolling) {
							const responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'ryeApi',
								{
									method: 'GET',
									url: `/checkout-intents/${checkoutIntentId}`,
								},
							);

							returnData.push({ json: responseData });
						} else {
							const maxAttempts = this.getNodeParameter('maxAttempts', i) as number;
							const intervalSeconds = this.getNodeParameter('intervalSeconds', i) as number;

							let attempt = 0;
							let responseData;

							while (attempt < maxAttempts) {
								responseData = await this.helpers.httpRequestWithAuthentication.call(
									this,
									'ryeApi',
									{
										method: 'GET',
										url: `/checkout-intents/${checkoutIntentId}`,
									},
								);

								const status = (responseData as { status?: string }).status;
								if (status === 'completed' || status === 'failed' || status === 'cancelled') {
									break;
								}

								attempt++;
								if (attempt < maxAttempts) {
									await sleep(intervalSeconds * 1000);
								}
							}

							returnData.push({ json: responseData });
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
