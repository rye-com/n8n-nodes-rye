import type { components, paths } from './rye-api';

export type Buyer = components['schemas']['Buyer'];

export type CreateCheckoutIntentRequestBody =
	paths['/api/v1/checkout-intents']['post']['requestBody']['content']['application/json'];

export type GetCheckoutIntentResponse =
	paths['/api/v1/checkout-intents/{id}']['get']['responses'][200]['content']['application/json'];
