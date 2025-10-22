import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

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
				displayOptions: {
					show: {
						authentication: ['accessToken'],
					},
				},
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
				],
				default: 'checkoutIntent',
			},
			// @todo: define node operations or execute function
		],
	};
}
