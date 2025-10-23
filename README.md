# n8n-nodes-rye

This is an n8n community node that lets you use the Rye Universal Checkout API in your n8n workflows.

The Rye Universal Checkout API turns any product URL into a completed checkout. Instantly retrieve price, tax, and shipping for any product, and let users buy without ever leaving your native AI experience.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

**Table of Contents**

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Example Workflows](#example-workflows)
- [Resources](#resources)
- [Support](#support)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node provides the following operations:

### Checkout Intent

- **Create**: Submit a new checkout with a product URL and buyer information
- **Get Status**: Check the status of a checkout intent (with optional automatic polling)
- **Confirm**: Confirm a checkout intent with a payment method

### Brand

- **Verify Support**: Check if a merchant domain is supported by the Rye API

## Credentials

To use this node, you need a Rye API account and access token.

### Prerequisites

1. Sign up for a Rye API account at [rye.com](https://rye.com)
2. Generate an API access token from your Rye dashboard

### Setting up credentials in n8n

1. In n8n, go to **Credentials** → **New**
2. Search for "Rye API"
3. Enter your **API URL**:
   - Staging: `https://staging.api.rye.com/api/v1`
   - Production: `https://api.rye.com/api/v1`
4. Enter your **Access Token**
5. Click **Save**

## Compatibility

- **Minimum n8n version**: 1.0.0
- **Tested against**: n8n 1.115.3

## Usage

### Basic Checkout Flow

The typical checkout flow involves these steps:

1. **Create a Checkout Intent** with a product URL and buyer details
2. **Poll for Status** until the checkout reaches `awaiting_confirmation` state
3. **Confirm the Checkout** with a payment token
4. **Poll for Status** again until the checkout reaches `completed` state

### Using the Get Status Operation with Polling

The "Get Status" operation includes automatic polling functionality to wait for the checkout to reach a terminal state.

#### Polling Parameters

- **Enable Polling**: When enabled, the node automatically retries checking the status
- **Backoff Strategy**: Choose between fixed interval or exponential backoff (default: exponential)
- **Max Attempts**: Number of times to check (default: 10)

**For Fixed Interval Strategy:**

- **Interval (Seconds)**: Time between checks (default: 5 seconds)

**For Exponential Backoff Strategy (Recommended):**

- **Initial Interval (Seconds)**: Starting wait time (default: 5 seconds)
- **Max Interval (Seconds)**: Maximum wait time cap (default: 60 seconds)

#### Checkout States

**Terminal States** (polling stops automatically):

- `awaiting_confirmation` - Checkout is ready and awaiting payment confirmation
- `completed` - Checkout successfully completed
- `failed` - Checkout failed

**Processing States** (polling continues):

- `retrieving_offer` - Initial state after creating a checkout intent; Rye is retrieving the offer from the merchant

> **💡 Tip**: If polling times out in the `retrieving_offer` state, increase the **Max Attempts** value or handle this state explicitly in your workflow.

#### Backoff Strategy

Choose how the node spaces out polling attempts:

**Exponential Backoff** (default, recommended):

- Gradually increases wait time between attempts, starting at `initialIntervalSeconds` and doubling up to a maximum of `maxIntervalSeconds` 
- Example timing: Wait 5s → 10s → 20s → 40s → 60s → 60s...

**Fixed Interval**:

- Waits the same amount of time between each attempt
- Example timing: Wait 5s → 5s → 5s → 5s...

**Why use exponential backoff?**

- ✅ Automatically adapts to longer processing times
- ✅ Minimizes risk of hitting rate limits
- ✅ More efficient for workflows with varying processing times

#### Best Practice

After polling completes, use a **Switch** or **IF** node to route your workflow based on the final status.

### Address Validation

> **⚠️ Important**: The Rye API currently only supports US addresses. The node will validate this and throw an error if a non-US country code is provided.

## Example Workflows

### Complete Checkout with Status Routing

```
Manual Trigger
  ↓
Verify Brand Support (Rye)
  ↓
Create Checkout Intent (Rye)
  ↓
Get Status with Polling (Rye)
  ↓
Switch (based on status)
  ├─ awaiting_confirmation → Confirm Checkout (Rye)
  │                            ↓
  │                         Get Status with Polling (Rye)
  │                            ↓
  │                         Switch (based on final status)
  │                            ├─ completed → Success notification
  │                            └─ failed → Error notification
  │
  └─ failed → Error notification
```

### Step-by-Step Configuration

#### 1. Verify Brand Support

- **Resource**: Brand
- **Operation**: Verify Support
- **Domain**: `amazon.com` (or your target merchant domain)

#### 2. Create Checkout Intent

- **Resource**: Checkout Intent
- **Operation**: Create
- **Product URL**: Full URL of the product to purchase
- **Buyer Email**: Customer's email address
- **Shipping Address**: Complete US address details

#### 3. Get Status (with Polling) - First Check

- **Resource**: Checkout Intent
- **Operation**: Get Status
- **Checkout Intent ID**: `{{ $json.id }}` (from Create step)
- **Enable Polling**: `true`
- **Max Attempts**: `10`
- **Interval (Seconds)**: `5`

#### 4. Switch Node - Route Based on Initial Status

Configure switch rules:

- **Rule 1**: `{{ $json.status === "awaiting_confirmation" }}` → Continue to Confirm
- **Rule 2**: `{{ $json.status === "failed" }}` → Error handling

#### 5. Confirm Checkout (if awaiting_confirmation)

- **Resource**: Checkout Intent
- **Operation**: Confirm
- **Checkout Intent ID**: `{{ $('Get Status').item.json.id }}`
- **Payment Token**: Payment method token from your payment processor (e.g., Stripe)

#### 6. Get Status (with Polling) - Final Check

- **Resource**: Checkout Intent
- **Operation**: Get Status
- **Checkout Intent ID**: `{{ $('Confirm Checkout').item.json.id }}`
- **Enable Polling**: `true`
- **Max Attempts**: `10`
- **Interval (Seconds)**: `5`

#### 7. Switch Node - Route Based on Final Status

Configure switch rules:

- **Rule 1**: `{{ $json.status === "completed" }}` → Success handling
- **Rule 2**: `{{ $json.status === "failed" }}` → Error handling

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Rye API Documentation](https://docs.rye.com)
- [Rye Universal Checkout Guide](https://docs.rye.com/api-v2/introduction)

## Support

For issues or questions:

- **Node Issues**: [GitHub Issues](https://github.com/rye-com/n8n-nodes-rye/issues)
- **Rye API Support**: [Rye Support](https://rye.com/support)
- **n8n Community**: [n8n Forum](https://community.n8n.io/)

## License

[MIT](LICENSE.md)
