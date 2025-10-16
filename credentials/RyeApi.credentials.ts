import type {
	Icon,
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class RyeApi implements ICredentialType {
	name = 'ryeApi';

	displayName = 'Rye API';

	icon: Icon = { light: 'file:../icons/rye.svg', dark: 'file:../icons/rye.dark.svg' };

	documentationUrl = 'https://docs.rye.com/api-v2/introduction';

	properties: INodeProperties[] = [
		{
			displayName: 'Api URL',
			name: 'apiUrl',
			type: 'string',
			default: 'https://staging.api.rye.com/api/v1',
			required: true,
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '{{$credentials.apiUrl}}',
			/**
			 * n8n uses this to test the provided credentials
			 * @see: https://docs.n8n.io/integrations/creating-nodes/build/reference/credentials-files/#test
			 *
			 * @todo: update this to a suitable auth protected endpoint
			 */
			url: '/health',
		},
	};
}
