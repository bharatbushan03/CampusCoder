# CampusCoder Free-Tier EC2 Templates

These files support the low-cost EC2 deployment guide in `docs/aws-deployment.md`.

Use on the EC2 instance after cloning the repository to `/var/www/campuscoder`:

```bash
sudo cp deploy/aws-free-tier/campuscoder.service /etc/systemd/system/campuscoder.service
sudo cp deploy/aws-free-tier/nginx-campuscoder.conf /etc/nginx/conf.d/campuscoder.conf
```

Create `/var/www/campuscoder/.env.local` using `env.local.example` as the shape. Do not commit real secrets.
