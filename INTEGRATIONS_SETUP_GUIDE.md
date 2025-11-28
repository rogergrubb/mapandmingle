# MapMingle Third-Party Integrations Setup Guide

This guide will help you configure all third-party integrations for MapMingle.

## 📋 Table of Contents

1. [AWS S3 Setup](#aws-s3-setup)
2. [Resend Email Setup](#resend-email-setup)
3. [Stripe Payment Setup](#stripe-payment-setup)
4. [Anthropic AI Setup](#anthropic-ai-setup)
5. [Web Push Notifications Setup](#web-push-notifications-setup)
6. [Deployment](#deployment)

---

## 🪣 AWS S3 Setup

### 1. Create S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. Bucket name: `mapandmingle-uploads` (or your preferred name)
4. Region: `us-east-1` (or your preferred region)
5. **Uncheck** "Block all public access" (we need public read for uploaded images)
6. Click "Create bucket"

### 2. Configure Bucket Policy

1. Go to your bucket → Permissions → Bucket Policy
2. Add this policy (replace `mapandmingle-uploads` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mapandmingle-uploads/*"
    }
  ]
}
```

### 3. Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Users → Add users
3. User name: `mapandmingle-s3-user`
4. Access type: Programmatic access
5. Permissions: Attach existing policy → `AmazonS3FullAccess`
6. **Save the Access Key ID and Secret Access Key**

### 4. Add to Environment Variables

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET_NAME=mapandmingle-uploads
```

---

## 📧 Resend Email Setup

### 1. Create Resend Account

1. Go to [Resend.com](https://resend.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Add Domain

1. Go to Domains → Add Domain
2. Enter your domain: `mapandmingle.com`
3. Add the DNS records shown to your domain provider:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
4. Wait for verification (usually 5-10 minutes)

### 3. Create API Key

1. Go to API Keys → Create API Key
2. Name: `MapMingle Production`
3. Permission: Full Access
4. **Save the API key** (starts with `re_`)

### 4. Add to Environment Variables

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=MapMingle <noreply@mapandmingle.com>
```

---

## 💳 Stripe Payment Setup

### 1. Create Stripe Account

1. Go to [Stripe.com](https://stripe.com/)
2. Sign up for an account
3. Complete business verification

### 2. Get API Keys

1. Go to Developers → API keys
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)

### 3. Create Products and Prices

1. Go to Products → Add product

**Basic Plan:**
- Name: MapMingle Basic
- Description: Unlock unlimited pins and advanced features
- Monthly price: $4.99
- Yearly price: $47.90 (save 20%)

**Premium Plan:**
- Name: MapMingle Premium
- Description: Full access with verified badge and priority support
- Monthly price: $9.99
- Yearly price: $95.90 (save 20%)

2. Copy each **Price ID** (starts with `price_`)

### 4. Set Up Webhook

1. Go to Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://mapandmingle-production.up.railway.app/webhook/stripe`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Webhook signing secret** (starts with `whsec_`)

### 5. Add to Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx
STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx
```

---

## 🤖 Anthropic AI Setup

### 1. Create Anthropic Account

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up for an account
3. Add billing information (required for API access)

### 2. Create API Key

1. Go to API Keys → Create Key
2. Name: `MapMingle Production`
3. **Save the API key** (starts with `sk-ant-`)

### 3. Add to Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Features Enabled

- **Content Moderation**: Automatically detect inappropriate content
- **Event Recommendations**: Smart event suggestions based on user interests
- **User Matching**: AI-powered friend suggestions
- **Spam Detection**: Identify spam in pins and events
- **Sentiment Analysis**: Analyze message sentiment

---

## 🔔 Web Push Notifications Setup

### 1. Generate VAPID Keys

Run this command in your backend:

```bash
cd apps/backend
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Add to Environment Variables

```env
VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_SUBJECT=mailto:admin@mapandmingle.com
```

### 3. Update Frontend

The VAPID public key needs to be accessible in the frontend. Add to Vercel environment variables:

```env
REACT_APP_VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 Deployment

### Railway (Backend)

1. Go to your Railway project
2. Settings → Variables
3. Add all backend environment variables:
   - `DATABASE_URL`
   - `AWS_*` variables
   - `RESEND_API_KEY`
   - `STRIPE_*` variables
   - `ANTHROPIC_API_KEY`
   - `VAPID_*` variables
   - `JWT_SECRET`
   - `FRONTEND_URL`

4. Deploy:
```bash
git push origin main
```

Railway will automatically deploy the backend.

### Vercel (Frontend)

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add frontend environment variables:
   - `REACT_APP_API_URL=https://mapandmingle-production.up.railway.app`
   - `REACT_APP_VAPID_PUBLIC_KEY`

4. Deploy:
```bash
git push origin main
```

Vercel will automatically deploy the frontend.

---

## ✅ Testing Checklist

After setup, test each integration:

### S3 Upload
- [ ] Upload profile photo in Edit Profile
- [ ] Verify image appears in S3 bucket
- [ ] Verify image loads on profile page

### Resend Email
- [ ] Register new account
- [ ] Verify welcome email received
- [ ] Test password reset email

### Stripe Payment
- [ ] Click Subscribe on Premium plan
- [ ] Complete test payment (use card `4242 4242 4242 4242`)
- [ ] Verify subscription activated
- [ ] Check webhook events in Stripe dashboard

### Anthropic AI
- [ ] Create a pin with inappropriate content
- [ ] Verify content moderation works
- [ ] Check event recommendations on Events page
- [ ] Test user matching suggestions

### Web Push
- [ ] Allow notifications when prompted
- [ ] Send test message to yourself
- [ ] Verify push notification appears

---

## 🆘 Troubleshooting

### S3 Upload Fails
- Check IAM user has S3 permissions
- Verify bucket policy allows public read
- Check CORS configuration on bucket

### Emails Not Sending
- Verify domain DNS records are correct
- Check Resend dashboard for delivery logs
- Ensure FROM_EMAIL matches verified domain

### Stripe Webhook Not Working
- Verify webhook URL is correct
- Check webhook signing secret matches
- View webhook logs in Stripe dashboard

### AI Features Not Working
- Verify Anthropic API key is valid
- Check billing is set up in Anthropic console
- Review API usage limits

### Push Notifications Not Appearing
- Verify VAPID keys are correct
- Check browser notification permissions
- Ensure service worker is registered

---

## 📊 Cost Estimates

**AWS S3:**
- Free tier: 5GB storage, 20,000 GET requests/month
- After: ~$0.023/GB/month + $0.0004/1000 requests

**Resend:**
- Free tier: 3,000 emails/month
- After: $20/month for 50,000 emails

**Stripe:**
- 2.9% + $0.30 per successful transaction
- No monthly fees

**Anthropic:**
- Claude 3.5 Sonnet: $3/million input tokens, $15/million output tokens
- Estimated: $20-50/month for moderate usage

**Total estimated monthly cost:** $40-100 for moderate usage

---

## 🎉 You're All Set!

All integrations are now configured. Your users can:
- ✅ Upload photos to S3
- ✅ Receive beautiful transactional emails
- ✅ Subscribe to Premium with Stripe
- ✅ Get AI-powered recommendations
- ✅ Receive real-time push notifications

For support, contact the development team or check the documentation.
