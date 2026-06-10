# Free-Tier AWS EC2 Deployment Guide For CampusCoder

This guide deploys CampusCoder on **one EC2 free-tier eligible instance** using Node.js, systemd, and nginx. It intentionally avoids ECS, Load Balancers, RDS, NAT Gateway, Route 53, Elastic IP, ECR, and CloudFront to reduce charge risk.

AWS does **not** guarantee that you will never be charged just because you select a Free Tier option. Check your account eligibility and current service limits before creating resources:

- [EC2 Free Tier usage](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html)
- [AWS Free Tier](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html)
- [Free Tier usage alerts](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/tracking-free-tier-usage.html)
- [Public IPv4 Free Tier note](https://aws.amazon.com/about-aws/whats-new/2024/02/aws-free-tier-750-hours-free-public-ipv4-addresses/)

Copy-pasteable templates live in `deploy/aws-free-tier/`.

## 1. Enable Billing Protection First

Before creating EC2:

1. Open AWS Console > Billing and Cost Management > Billing preferences.
2. Enable **Free Tier usage alerts**.
3. Open AWS Console > Budgets > Create budget.
4. Create a **Zero spend budget** if available.
5. Also create a monthly cost budget for `USD 1` with alerts for actual and forecasted spend.
6. Stop immediately if your AWS account is not Free Tier or Free Plan eligible.

## 2. Launch One EC2 Instance

In AWS Console > EC2 > Launch instance:

- Name: `campuscoder`
- Region: use one region only, for example `ap-south-1`
- AMI: **Amazon Linux 2023**, marked free-tier eligible
- Instance type: `t2.micro` if free-tier eligible in your account/region
- If using `t3.micro`, set CPU credit option to **Standard**, not Unlimited
- Key pair: create/download one `.pem` key
- Network:
  - Auto-assign public IPv4: enabled
  - Do **not** allocate Elastic IP
- Security group inbound:
  - SSH `22` from **My IP only**
  - HTTP `80` from `0.0.0.0/0`
  - HTTPS `443` only if you already have a domain and will use Let's Encrypt
- Storage: `20 GiB gp3`, delete on termination enabled

Do not create a Load Balancer, RDS database, NAT Gateway, Route 53 hosted zone, ECR repository, snapshots, or extra EBS volumes unless you accept possible charges.

## 3. SSH Into The Server

From your local machine:

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

## 4. Install Runtime Tools

On the EC2 instance:

```bash
sudo dnf update -y
sudo dnf install -y git nginx

curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs

node -v
npm -v
```

## 5. Add Swap For Safe Builds

The free-tier instance is small. Add swap before building:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 6. Clone The Project

Replace the GitHub URL with your real repository URL:

```bash
sudo mkdir -p /var/www
sudo chown ec2-user:ec2-user /var/www
cd /var/www

git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git campuscoder
cd campuscoder
```

## 7. Create The Production Environment File

Create `.env.local` on the server:

```bash
nano .env.local
```

Use this shape:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
SUPABASE_SECRET_KEY=sb_secret_your_key_here

RESEND_API_KEY=re_your_api_key_here
ADMIN_EMAIL=admin@example.com
FROM_EMAIL="CampusCoder <noreply@your-domain.com>"

NEXT_PUBLIC_SITE_URL=http://YOUR_EC2_PUBLIC_IP
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=3000
```

Protect the file:

```bash
chmod 600 .env.local
```

Never commit `.env.local`, `SUPABASE_SECRET_KEY`, or `RESEND_API_KEY`.

## 8. Install And Build

```bash
npm ci
npm run production-check
```

Expected result:

- ESLint may show warnings.
- TypeScript must pass.
- `next build` must pass.
- `.next/standalone/server.js` must exist.

## 9. Install The systemd Service

Use the included template:

```bash
sudo cp deploy/aws-free-tier/campuscoder.service /etc/systemd/system/campuscoder.service
sudo systemctl daemon-reload
sudo systemctl enable campuscoder
sudo systemctl start campuscoder
sudo systemctl status campuscoder
```

The service runs:

```bash
npm run start
```

from:

```text
/var/www/campuscoder
```

## 10. Configure nginx Reverse Proxy

Use the included template:

```bash
sudo cp deploy/aws-free-tier/nginx-campuscoder.conf /etc/nginx/conf.d/campuscoder.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

nginx listens on port `80` and proxies traffic to:

```text
http://127.0.0.1:3000
```

## 11. Verify Deployment

On the EC2 instance:

```bash
curl http://127.0.0.1:3000/api/health
```

From your local machine:

```bash
curl http://YOUR_EC2_PUBLIC_IP/api/health
```

Open:

```text
http://YOUR_EC2_PUBLIC_IP
```

Expected health response includes:

```json
{"ok":true}
```

## 12. Optional HTTPS Without Extra AWS Services

Only do this if you already own a domain. To avoid AWS DNS charges, point the domain to EC2 from your existing domain/DNS provider instead of creating Route 53 resources.

On EC2:

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Update `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Rebuild and restart:

```bash
npm run production-check
sudo systemctl restart campuscoder
sudo systemctl restart nginx
```

## Updating The App Later

On EC2:

```bash
cd /var/www/campuscoder
git pull
npm ci
npm run production-check
sudo systemctl restart campuscoder
```

If the app does not come back:

```bash
sudo journalctl -u campuscoder -n 100 --no-pager
sudo systemctl status campuscoder
```

## Cost-Safety Rules

- Run **only one** free-tier eligible EC2 instance.
- Do not allocate Elastic IP.
- Do not create ALB, ECS Fargate, RDS, NAT Gateway, CloudFront, Route 53, ECR, snapshots, or extra volumes unless you accept possible charges.
- Keep EBS storage at or below free-tier limits.
- Check Billing > Bills and Billing > Free Tier every day for the first week.
- When finished testing, terminate the EC2 instance and confirm the attached EBS volume is deleted.
- Delete any snapshots or Elastic IPs if accidentally created.

## App-Specific Post-Deploy Checklist

- Apply Supabase migrations in `supabase/migrations/` in filename order.
- In Supabase Auth settings, add your production URL:
  - `http://YOUR_EC2_PUBLIC_IP`
  - or `https://your-domain.com`
- In Resend, verify the sender domain if using a custom `FROM_EMAIL`.
- Confirm:
  - `/api/health` returns JSON with `"ok": true`
  - `/login` and `/signup` submit correctly
  - Home page 3D animation renders
  - Event dates show `TBC` / `Coming soon`
