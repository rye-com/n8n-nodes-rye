import { type INodeProperties, type NodeHint } from 'n8n-workflow';

export const checkoutIntentOperations: INodeProperties[] = [
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
];

export const checkoutIntentHints: NodeHint[] = [
	{
		message:
			'Tip: When using this node with polling enabled, add a Switch or IF node after this node to route your workflow based on the final checkout status (retrieving_offer, awaiting_confirmation, completed, failed).',
		whenToDisplay: 'always',
		location: 'outputPane',
		displayCondition:
			'={{ $parameter["operation"] === "getStatus" && $parameter["enablePolling"] === true }}',
	},
];

export const checkoutIntentFields: INodeProperties[] = [
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
		displayName: 'Item Quantity',
		name: 'itemQuantity',
		type: 'number',
		default: 1,
		displayOptions: {
			show: {
				resource: ['checkoutIntent'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Buyer Details',
		name: 'buyer',
		type: 'fixedCollection',
		required: true,
		displayOptions: {
			show: {
				resource: ['checkoutIntent'],
				operation: ['create'],
			},
		},
		default: {},
		description: 'Buyer details for the order (US only)',
		options: [
			{
				name: 'details',
				displayName: 'Details',
				values: [
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
						displayName: 'Country Code',
						name: 'country',
						type: 'string',
						required: true,
						default: 'US',
						description: 'Two-letter country code (currently only US supported)',
					},
					{
						displayName: 'Email Address',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						required: true,
						default: '',
					},
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
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Postal Code',
						name: 'postalCode',
						type: 'string',
						required: true,
						default: '',
					},
					{
						displayName: 'Province',
						name: 'province',
						type: 'string',
						required: true,
						default: '',
						description: 'Two-letter state code (e.g., CA, NY)',
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
			'Whether to automatically poll until the checkout reaches a terminal state (awaiting_confirmation, completed, or failed). When enabled, the node will retry up to the maximum attempts specified below.',
	},
	{
		displayName: 'Backoff Strategy',
		name: 'backoffStrategy',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['checkoutIntent'],
				operation: ['getStatus'],
				enablePolling: [true],
			},
		},
		options: [
			{
				name: 'Fixed Interval',
				value: 'fixed',
				description: 'Wait the same amount of time between each attempt',
			},
			{
				name: 'Exponential Backoff',
				value: 'exponential',
				description:
					'Gradually increase wait time between attempts (recommended for rate-limited APIs)',
			},
		],
		default: 'exponential',
		description: 'Strategy for spacing out polling attempts',
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
				backoffStrategy: ['fixed'],
			},
		},
		default: 5,
		description:
			'Number of seconds to wait between each polling attempt. For example, with 10 max attempts and 5 second intervals, polling will occur for up to 50 seconds total.',
	},
	{
		displayName: 'Initial Interval (Seconds)',
		name: 'initialIntervalSeconds',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['checkoutIntent'],
				operation: ['getStatus'],
				enablePolling: [true],
				backoffStrategy: ['exponential'],
			},
		},
		default: 5,
		description: 'Starting wait time in seconds. This will double with each subsequent attempt.',
	},
	{
		displayName: 'Max Interval (Seconds)',
		name: 'maxIntervalSeconds',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['checkoutIntent'],
				operation: ['getStatus'],
				enablePolling: [true],
				backoffStrategy: ['exponential'],
			},
		},
		default: 60,
		description:
			'Maximum wait time in seconds between attempts. The interval will not exceed this value.',
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
];
