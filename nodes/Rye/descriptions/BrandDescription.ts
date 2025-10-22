import { type INodeProperties } from 'n8n-workflow';

export const brandOperations: INodeProperties[] = [
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
];

export const brandFields: INodeProperties[] = [
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
];
