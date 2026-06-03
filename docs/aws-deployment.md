# AWS Deployment Guide

This app is prepared for self-hosted Next.js deployment as a Node server or Docker container.

## Required Runtime

- Node.js 22 for direct server deployment, or Docker on EC2/ECS.
- HTTPS should terminate at an AWS Application Load Balancer, CloudFront, or nginx reverse proxy.
- Set the application health check path to `/api/health`.

## Environment Variables

Create these values in your AWS environment, ECS task definition, EC2 `.env`, or secrets manager:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
SUPABASE_SECRET_KEY=sb_secret_your_key_here
RESEND_API_KEY=re_your_api_key_here
ADMIN_EMAIL=admin@example.com
FROM_EMAIL="CampusCoder <noreply@your-domain.com>"
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=3000
```

Keep `SUPABASE_SECRET_KEY` and `RESEND_API_KEY` server-only. Do not expose them in browser code, screenshots, or GitHub.

## Docker Build

```bash
docker build -t campuscoder:latest .
```

## Docker Run On EC2

```bash
docker run -d \
  --name campuscoder \
  --restart unless-stopped \
  --env-file .env.production \
  -p 3000:3000 \
  campuscoder:latest
```

Point nginx, an ALB target group, or CloudFront origin to port `3000`.

## Push To ECR

```bash
aws ecr create-repository --repository-name campuscoder
aws ecr get-login-password --region ap-south-1 \
  | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com
docker tag campuscoder:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/campuscoder:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/campuscoder:latest
```

Use the pushed image in ECS, Elastic Beanstalk Docker, or your EC2 pull/deploy flow.

## Direct Node Deployment

```bash
npm ci
npm run production-check
HOSTNAME=0.0.0.0 PORT=3000 npm run start:standalone
```

For a long-running EC2 process, run the standalone command under systemd or your process manager.

## Pre-Deploy Checklist

- Apply Supabase migrations in `supabase/migrations/` in filename order.
- Configure Supabase Auth redirect URLs for your production domain.
- Verify the Resend sender domain used by `FROM_EMAIL`.
- Restrict inbound AWS security group rules to `80/443` publicly and keep app port `3000` private behind the proxy/load balancer.
- Confirm `/api/health` returns `{"ok":true,...}` after deployment.
