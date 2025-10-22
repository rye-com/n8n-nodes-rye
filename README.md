# n8n-nodes-rye

This is an n8n community node. It lets you use the Rye Universal Checkout API in your n8n workflows.

The Rye Universal Checkout API turns any product URL into a completed checkout. Instantly retrieve price, tax, and shipping for any product, and let users buy without ever leaving your native AI experience.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Example Workflows](#example-workflows)  
[Resources](#resources)

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

1. In n8n, go to **Credentials** > **New**
2. Search for "Rye API"
3. Enter your **API URL** (staging: `https://staging.api.rye.com/api/v1` or production: `https://api.rye.com/api/v1`)
4. Enter your **Access Token**
5. Click **Save**

## Compatibility

- Minimum n8n version: 1.0.0
- Tested against: n8n 1.x

## Usage

### Basic Checkout Flow

The typical checkout flow involves three steps:

1. **Create a Checkout Intent** with a product URL and shipping address
2. **Poll for Status** until the checkout is ready (status: `awaiting_confirmation`)
3. **Confirm the Checkout** with a payment token

### Using the Get Status Operation with Polling

The "Get Status" operation includes automatic polling functionality to wait for the checkout to reach a terminal state:

**Polling Parameters:**

- **Enable Polling**: When enabled, the node will automatically retry checking the status
- **Max Attempts**: Number of times to check (default: 10)
- **Interval (Seconds)**: Time between checks (default: 5 seconds)

**Terminal States:**

- `completed` - Checkout successfully completed
- `failed` - Checkout failed
- `cancelled` - Checkout was cancelled

**Best Practice**: After polling completes, use a **Switch** or **IF** node to route your workflow based on the final status.

### Address Validation

⚠️ **Important**: The Rye API currently only supports US addresses. The node will validate this and throw an error if a non-US country code is provided.

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
  ├─ awaiting_confirmation → Confirm Checkout (Rye) → Success notification
  ├─ failed → Error notification
  └─ cancelled → Cancelled notification
```

### Step-by-Step Configuration

#### 1. Verify Brand Support

- **Resource**: Brand
- **Operation**: Verify Support
- **Domain**: `amazon.com` (or your target merchant)

#### 2. Create Checkout Intent

- **Resource**: Checkout Intent
- **Operation**: Create
- **Product URL**: The product you want to purchase
- **Buyer Email**: Customer's email
- **Shipping Address**: Complete US address

#### 3. Get Status (with Polling)

- **Resource**: Checkout Intent
- **Operation**: Get Status
- **Checkout Intent ID**: `{{ $json.id }}` (from Create step)
- **Enable Polling**: `true`
- **Max Attempts**: `10`
- **Interval**: `5` seconds

#### 4. Switch Node (Route Based on Status)

Configure switch rules:

- **Rule 1**: `{{ $json.status === "awaiting_confirmation" }}` → Confirm branch
- **Rule 2**: `{{ $json.status === "failed" }}` → Error handling
- **Rule 3**: `{{ $json.status === "cancelled" }}` → Cancelled handling

#### 5. Confirm Checkout (if awaiting_confirmation)

- **Resource**: Checkout Intent
- **Operation**: Confirm
- **Checkout Intent ID**: `{{ $('Get Status').item.json.id }}`
- **Payment Token**: Your payment method token (e.g., from Stripe)

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Rye API Documentation](https://docs.rye.com)
- [Rye Universal Checkout Guide](https://docs.rye.com/api-v2/introduction)

## Support

For issues or questions:

- **Node Issues**: [GitHub Issues](https://github.com/rye-com/n8n-nodes-rye/issues)
- **Rye API Support**: [Rye Support](https://rye.com/support)
- **n8n Community**: [n8n Forum](https://community.n8n.io/)
