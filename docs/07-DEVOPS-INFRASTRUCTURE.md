# DevOps & Infrastructure Guide

## Document Control
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2025-12-28 | DevOps Lead | Draft |

## Table of Contents
1. [Infrastructure Overview](#infrastructure-overview)
2. [AWS Architecture](#aws-architecture)
3. [Kubernetes Setup](#kubernetes-setup)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring & Observability](#monitoring--observability)
6. [Security & Compliance](#security--compliance)
7. [Disaster Recovery](#disaster-recovery)
8. [Runbooks](#runbooks)

---

## Infrastructure Overview

### Infrastructure Philosophy

**Principles**:
- **Infrastructure as Code**: All infrastructure defined in Terraform
- **Immutable Infrastructure**: No manual changes, always redeploy
- **GitOps**: Infrastructure changes via Git
- **Environment Parity**: Dev/Staging/Prod as similar as possible
- **Security First**: Security built-in at every layer
- **Cost Optimization**: Right-sizing resources, auto-scaling

### Environment Strategy

| Environment | Purpose | Infrastructure | Data |
|-------------|---------|----------------|------|
| **Development** | Feature development | Shared, smaller instances | Synthetic data |
| **Staging** | Pre-production testing | Production-like | Anonymized production data |
| **Production** | Live system | Full scale, HA | Real user data |

---

## AWS Architecture

### Account Structure

```
Root Account (billing, org management)
├── Development Account
├── Staging Account
└── Production Account
```

**Benefits**:
- Blast radius isolation
- Separate billing
- Clear environment boundaries
- IAM isolation

### Network Architecture

#### VPC Design (per environment)

**CIDR**: 10.X.0.0/16 (where X = 0 for dev, 1 for staging, 2 for prod)

```
VPC: 10.2.0.0/16 (Production Example)

├── Public Subnets (ALB, NAT Gateway, Bastion)
│   ├── us-east-1a: 10.2.1.0/24
│   ├── us-east-1b: 10.2.2.0/24
│   └── us-east-1c: 10.2.3.0/24
│
├── Private Subnets (EKS Nodes, Application)
│   ├── us-east-1a: 10.2.10.0/24
│   ├── us-east-1b: 10.2.11.0/24
│   └── us-east-1c: 10.2.12.0/24
│
└── Database Subnets (RDS, ElastiCache)
    ├── us-east-1a: 10.2.20.0/24
    ├── us-east-1b: 10.2.21.0/24
    └── us-east-1c: 10.2.22.0/24
```

**Internet Gateway**: For public subnet internet access
**NAT Gateways**: 3 (one per AZ) for private subnet outbound
**VPC Endpoints**: For S3, ECR, CloudWatch (cost savings, security)

### Compute: EKS (Elastic Kubernetes Service)

**Cluster Configuration**:
```yaml
Cluster Name: money-tracking-prod
Kubernetes Version: 1.28
Control Plane: Managed by AWS

Node Groups:
  - Name: general-purpose
    Instance Type: t3.xlarge (4 vCPU, 16 GB RAM)
    Min Size: 3
    Max Size: 10
    Desired: 3
    Subnets: Private subnets (all AZs)

  - Name: memory-optimized (for Analytics Service)
    Instance Type: r6g.large (2 vCPU, 16 GB RAM)
    Min Size: 1
    Max Size: 3
    Desired: 1
    Taints: workload=analytics:NoSchedule

Add-ons:
  - CoreDNS
  - kube-proxy
  - VPC CNI
  - EBS CSI Driver
  - AWS Load Balancer Controller
```

**Scaling Strategy**:
- **Cluster Autoscaler**: Scale nodes based on pod resource requests
- **HPA (Horizontal Pod Autoscaler)**: Scale pods based on CPU/memory
- **VPA (Vertical Pod Autoscaler)**: Right-size pod resource requests

### Databases

#### RDS PostgreSQL (Production)

```yaml
Engine: PostgreSQL 15
Instance Class: db.r6g.xlarge (4 vCPU, 32 GB RAM)
Storage: 500 GB GP3 SSD
  - IOPS: 12,000
  - Throughput: 500 MB/s
  - Autoscaling: Up to 2 TB

Multi-AZ: Yes (synchronous replication to standby)

Read Replicas:
  - Replica 1: db.r6g.large (us-east-1a)
  - Replica 2: db.r6g.large (us-east-1b)
  - Replication: Asynchronous, <1 second lag

Backup:
  - Automated backups: Daily at 3 AM UTC
  - Retention: 30 days
  - Manual snapshots: Before major changes
  - Point-in-Time Recovery: Enabled (5 min granularity)

Performance Insights: Enabled
Enhanced Monitoring: 60-second granularity

Parameter Group:
  - max_connections: 500
  - shared_buffers: 8 GB
  - effective_cache_size: 24 GB
  - work_mem: 64 MB
  - maintenance_work_mem: 2 GB
  - random_page_cost: 1.1 (SSD)

Extensions:
  - timescaledb
  - pgvector
  - pg_stat_statements
```

**Connection Pooling**: PgBouncer (running in K8s)
```yaml
poolSize: 20 per service
maxClientConn: 100
defaultPoolSize: 20
poolMode: transaction
```

#### ElastiCache Redis (Production)

```yaml
Engine: Redis 7.0
Node Type: cache.r6g.large (2 vCPU, 13.07 GB RAM)
Number of Shards: 3
Replicas per Shard: 1

Cluster Mode: Enabled
Multi-AZ: Yes
Automatic Failover: Enabled

Backup:
  - Daily automatic backup at 2 AM UTC
  - Retention: 7 days

Encryption:
  - At-rest: Yes (AWS KMS)
  - In-transit: Yes (TLS)

Maintenance Window: Sun 03:00-04:00 UTC
```

### Storage

#### S3 Buckets

| Bucket | Purpose | Lifecycle Policy | Versioning | Encryption |
|--------|---------|------------------|------------|------------|
| `money-tracking-prod-documents` | User documents | Archive to Glacier after 90 days | Enabled | SSE-S3 |
| `money-tracking-prod-reports` | Generated reports | Delete after 30 days | Disabled | SSE-S3 |
| `money-tracking-prod-backups` | Database backups | Archive to Glacier after 7 days | Enabled | SSE-KMS |
| `money-tracking-prod-logs` | Log archives | Delete after 365 days | Disabled | SSE-S3 |
| `money-tracking-terraform-state` | Terraform state | - | Enabled | SSE-KMS |

**CORS Configuration**: Frontend domain whitelisted

### Load Balancing

#### Application Load Balancer (ALB)

```yaml
Scheme: internet-facing
Subnets: Public subnets (all AZs)
Security Group: Allow 443 from 0.0.0.0/0

Listeners:
  - Port: 443 (HTTPS)
    Protocol: HTTPS
    Certificate: ACM (auto-renewed)
    Default Action: Forward to EKS Ingress

  - Port: 80 (HTTP)
    Protocol: HTTP
    Default Action: Redirect to 443

Target Type: IP (for EKS pods)

Health Check:
  - Path: /health
  - Interval: 30 seconds
  - Timeout: 5 seconds
  - Healthy Threshold: 2
  - Unhealthy Threshold: 3

Access Logs: Enabled (S3)
```

### Security Services

#### AWS WAF

```yaml
Web ACL: money-tracking-prod-waf

Rules:
  1. AWS Managed Rules - Core Rule Set
  2. AWS Managed Rules - Known Bad Inputs
  3. AWS Managed Rules - SQL Injection
  4. AWS Managed Rules - XSS
  5. Rate Limiting Rule:
     - 2000 requests per 5 minutes per IP
  6. Geo-blocking (optional):
     - Allow: US, CA, UK, EU
     - Block: Others

Logging: Enabled (CloudWatch Logs)
```

#### Secrets Manager

```yaml
Secrets:
  - prod/money-tracking/database/master-password
  - prod/money-tracking/database/app-password
  - prod/money-tracking/jwt-secret
  - prod/money-tracking/encryption-key
  - prod/money-tracking/plaid-secret
  - prod/money-tracking/openai-api-key
  - prod/money-tracking/telegram-bot-token

Rotation: Automatic (90 days for DB passwords)
Encryption: AWS KMS (custom CMK)
```

### Terraform Structure

```
infrastructure/
├── terraform/
│   ├── modules/
│   │   ├── vpc/
│   │   ├── eks/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   ├── s3/
│   │   └── security/
│   ├── environments/
│   │   ├── dev/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── terraform.tfvars
│   │   ├── staging/
│   │   └── prod/
│   └── backend.tf (S3 + DynamoDB for state locking)
```

**Example: VPC Module**

```hcl
# infrastructure/terraform/modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
    Project     = "money-tracking"
  }
}

resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 1)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name                     = "${var.environment}-public-${count.index + 1}"
    "kubernetes.io/role/elb" = "1"
  }
}

# ... (NAT Gateway, Route Tables, etc.)
```

**Example: Production Environment**

```hcl
# infrastructure/terraform/environments/prod/main.tf
module "vpc" {
  source = "../../modules/vpc"

  environment        = "prod"
  vpc_cidr          = "10.2.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

module "eks" {
  source = "../../modules/eks"

  environment        = "prod"
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_instance_type = "t3.xlarge"
  node_min_size     = 3
  node_max_size     = 10
}

module "rds" {
  source = "../../modules/rds"

  environment         = "prod"
  vpc_id             = module.vpc.vpc_id
  database_subnet_ids = module.vpc.database_subnet_ids
  instance_class      = "db.r6g.xlarge"
  allocated_storage   = 500
}
```

---

## Kubernetes Setup

### Namespace Strategy

```yaml
namespaces:
  - money-tracking-prod          # Application services
  - monitoring                   # Prometheus, Grafana
  - logging                      # ELK stack
  - ingress-nginx               # Ingress controller
  - cert-manager                # SSL certificate management
  - external-secrets            # Sync secrets from AWS Secrets Manager
```

### Service Deployment Example

```yaml
# k8s/base/user-service/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: money-tracking-prod
  labels:
    app: user-service
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: user-service-sa
      containers:
      - name: user-service
        image: ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/user-service:${IMAGE_TAG}
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: redis-url
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: money-tracking-prod
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: money-tracking-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
```

### Ingress Configuration

```yaml
# k8s/base/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: money-tracking-prod
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.money-tracking.com
    secretName: api-tls
  rules:
  - host: api.money-tracking.com
    http:
      paths:
      - path: /v1/users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80
      - path: /v1/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 80
      - path: /v1/banks
        pathType: Prefix
        backend:
          service:
            name: bank-service
            port:
              number: 80
      - path: /v1/transactions
        pathType: Prefix
        backend:
          service:
            name: transaction-service
            port:
              number: 80
      # ... (other services)
```

### ConfigMaps & Secrets

**ConfigMap Example**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: money-tracking-prod
data:
  LOG_LEVEL: "info"
  CORS_ORIGIN: "https://app.money-tracking.com"
  RATE_LIMIT_WINDOW: "60000"
  RATE_LIMIT_MAX: "100"
```

**External Secrets** (sync from AWS Secrets Manager):
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: user-service-secrets
  namespace: money-tracking-prod
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: user-service-secrets
  data:
  - secretKey: database-url
    remoteRef:
      key: prod/money-tracking/database/app-url
  - secretKey: redis-url
    remoteRef:
      key: prod/money-tracking/redis/url
  - secretKey: jwt-secret
    remoteRef:
      key: prod/money-tracking/jwt-secret
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-service.yml
name: Deploy Service

on:
  push:
    branches: [main]
    paths:
      - 'services/user-service/**'
      - '.github/workflows/deploy-service.yml'

env:
  AWS_REGION: us-east-1
  EKS_CLUSTER_NAME: money-tracking-prod
  SERVICE_NAME: user-service

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
        working-directory: services/user-service

      - name: Run linting
        run: npm run lint
        working-directory: services/user-service

      - name: Run unit tests
        run: npm run test
        working-directory: services/user-service

      - name: Run integration tests
        run: npm run test:integration
        working-directory: services/user-service

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./services/user-service/coverage/lcov.info

  build:
    name: Build and Push Docker Image
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ steps.login-ecr.outputs.registry }}/${{ env.SERVICE_NAME }}
          tags: |
            type=sha,prefix=,format=short
            type=raw,value=latest

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./services/user-service
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}

      - name: Scan image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.login-ecr.outputs.registry }}/${{ env.SERVICE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  deploy:
    name: Deploy to Kubernetes
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig \
            --name ${{ env.EKS_CLUSTER_NAME }} \
            --region ${{ env.AWS_REGION }}

      - name: Deploy with Helm
        run: |
          helm upgrade --install ${{ env.SERVICE_NAME }} \
            ./helm/${{ env.SERVICE_NAME }} \
            --namespace money-tracking-prod \
            --set image.tag=${{ github.sha }} \
            --set image.repository=${{ secrets.ECR_REGISTRY }}/${{ env.SERVICE_NAME }} \
            --wait \
            --timeout 5m

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/${{ env.SERVICE_NAME }} \
            -n money-tracking-prod \
            --timeout=5m

      - name: Run smoke tests
        run: |
          kubectl run smoke-test \
            --image=curlimages/curl:latest \
            --rm -i --restart=Never \
            -- curl -f http://${{ env.SERVICE_NAME }}/health

  notify:
    name: Notify Deployment
    needs: [deploy]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment of ${{ env.SERVICE_NAME }} to production ${{ job.status }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deployment Strategy

**Blue-Green Deployment**:
1. Deploy new version alongside old (green alongside blue)
2. Run smoke tests against new version
3. Switch traffic to new version (update service selector)
4. Monitor for 10 minutes
5. If issues, rollback by switching back
6. If stable, terminate old version

**Canary Deployment** (future enhancement):
1. Deploy new version with 10% traffic
2. Monitor metrics (error rate, latency)
3. Gradually increase to 50%, then 100%
4. Automatic rollback if metrics degrade

---

## Monitoring & Observability

### Metrics Stack

**Prometheus + Grafana**

**Prometheus Configuration**:
```yaml
# k8s/monitoring/prometheus-config.yaml
global:
  scrape_interval: 30s
  evaluation_interval: 30s

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
      action: replace
      regex: ([^:]+)(?::\d+)?;(\d+)
      replacement: $1:$2
      target_label: __address__

  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
    - role: node

  - job_name: 'rds'
    static_configs:
    - targets: ['cloudwatch-exporter:9106']

  - job_name: 'elasticache'
    static_configs:
    - targets: ['cloudwatch-exporter:9106']
```

**Grafana Dashboards**:
1. **System Overview**:
   - Cluster CPU/Memory/Disk
   - Node health
   - Pod status
   - Network traffic

2. **Service Metrics** (RED Method):
   - Request Rate
   - Error Rate
   - Duration (latency)
   - Per service, per endpoint

3. **Database Metrics**:
   - Connection count
   - Query latency (p50, p95, p99)
   - Slow queries
   - Replication lag
   - Cache hit ratio

4. **Business Metrics**:
   - Transactions processed/hour
   - Bank syncs completed/hour
   - Notifications sent/hour
   - Active users
   - LLM API calls and costs

5. **Cost Dashboard**:
   - EC2 instance costs
   - RDS costs
   - Data transfer costs
   - LLM API costs

### Logging Stack

**ELK (Elasticsearch, Logstash, Kibana)**

**Fluentd Configuration** (log collection):
```yaml
# k8s/logging/fluentd-config.yaml
<source>
  @type tail
  path /var/log/containers/*.log
  pos_file /var/log/fluentd-containers.log.pos
  tag kubernetes.*
  read_from_head true
  <parse>
    @type json
    time_format %Y-%m-%dT%H:%M:%S.%NZ
  </parse>
</source>

<filter kubernetes.**>
  @type kubernetes_metadata
</filter>

<filter kubernetes.**>
  @type parser
  key_name log
  <parse>
    @type json
  </parse>
</filter>

<match kubernetes.**>
  @type elasticsearch
  host elasticsearch.logging.svc.cluster.local
  port 9200
  logstash_format true
  logstash_prefix money-tracking
  <buffer>
    @type file
    path /var/log/fluentd-buffers/kubernetes.buffer
    flush_mode interval
    flush_interval 5s
  </buffer>
</match>
```

**Log Retention**:
- Hot: 7 days (Elasticsearch)
- Warm: 30 days (S3)
- Cold: 365 days (S3 Glacier)

### Distributed Tracing

**Jaeger Configuration**:
```yaml
# All services instrument with OpenTelemetry
# Traces exported to Jaeger Collector

Sampling Strategy:
  - Production: Probabilistic (10%)
  - Staging: Always
  - Development: Always

Trace Retention: 7 days
```

**Example Trace**:
```
POST /v1/transactions
├─ user-service: Validate JWT (5ms)
├─ transaction-service: Query transactions (45ms)
│  ├─ PostgreSQL: SELECT query (40ms)
│  └─ Redis: Cache check (2ms)
└─ Response sent (52ms total)
```

### Alerting

**AlertManager Rules**:
```yaml
groups:
- name: service_alerts
  rules:
  # High error rate
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
      /
      sum(rate(http_requests_total[5m])) by (service)
      > 0.05
    for: 5m
    labels:
      severity: critical
      team: backend
    annotations:
      summary: "High error rate on {{ $labels.service }}"
      description: "Error rate is {{ $value | humanizePercentage }}"

  # High latency
  - alert: HighLatency
    expr: |
      histogram_quantile(0.95,
        sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
      ) > 1
    for: 10m
    labels:
      severity: warning
      team: backend
    annotations:
      summary: "High latency on {{ $labels.service }}"
      description: "P95 latency is {{ $value }}s"

  # Service down
  - alert: ServiceDown
    expr: up{job="kubernetes-pods"} == 0
    for: 2m
    labels:
      severity: critical
      team: sre
    annotations:
      summary: "Service {{ $labels.pod }} is down"

  # High memory usage
  - alert: HighMemoryUsage
    expr: |
      container_memory_usage_bytes / container_memory_limit_bytes > 0.9
    for: 5m
    labels:
      severity: warning
      team: sre
    annotations:
      summary: "High memory usage on {{ $labels.pod }}"

  # Database connection pool exhausted
  - alert: DatabaseConnectionPoolExhausted
    expr: |
      database_connection_pool_active / database_connection_pool_max > 0.9
    for: 5m
    labels:
      severity: critical
      team: backend
    annotations:
      summary: "Database connection pool nearly exhausted"

  # High LLM API costs
  - alert: HighLLMCosts
    expr: |
      sum(increase(llm_api_cost_usd[1h])) > 100
    labels:
      severity: warning
      team: backend
    annotations:
      summary: "LLM API costs exceed $100/hour"
```

**Notification Channels**:
- **Critical**: PagerDuty → On-call engineer (immediate)
- **Warning**: Slack #alerts channel (within 5 minutes)
- **Info**: Email to team (daily digest)

**On-Call Rotation**:
- Primary: DevOps Engineer
- Secondary: Backend Lead
- Escalation: Technical Lead
- Rotation: Weekly

---

## Security & Compliance

### Network Security

**Security Groups**:
```yaml
# ALB Security Group
- Inbound: 443 from 0.0.0.0/0
- Outbound: All to EKS nodes

# EKS Node Security Group
- Inbound: All from ALB SG, EKS control plane
- Outbound: All

# RDS Security Group
- Inbound: 5432 from EKS node SG
- Outbound: None

# Redis Security Group
- Inbound: 6379 from EKS node SG
- Outbound: None
```

**Network Policies** (Kubernetes):
```yaml
# Only allow user-service to talk to PostgreSQL
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: user-service-db-access
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgresql
    ports:
    - protocol: TCP
      port: 5432
```

### IAM & RBAC

**EKS Service Accounts** (IRSA - IAM Roles for Service Accounts):
```yaml
# bank-service needs S3 access for document storage
apiVersion: v1
kind: ServiceAccount
metadata:
  name: bank-service-sa
  namespace: money-tracking-prod
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/BankServiceRole
```

**IAM Policy for Bank Service**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::money-tracking-prod-documents/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:prod/money-tracking/plaid-*"
    }
  ]
}
```

### Vulnerability Scanning

**Automated Scans**:
- Docker images: Trivy (in CI/CD)
- Dependencies: Dependabot (GitHub)
- Infrastructure: Terraform compliance checks
- Runtime: Falco (Kubernetes threat detection)

**Scan Schedule**:
- Every build: Image scanning
- Daily: Dependency scanning
- Weekly: Infrastructure audit
- Quarterly: Penetration testing

---

## Disaster Recovery

### Backup Strategy

**Database Backups**:
```yaml
Automated Backups:
  - Frequency: Daily at 3 AM UTC
  - Retention: 30 days
  - Type: Full snapshot + transaction logs

Point-in-Time Recovery:
  - Enabled: Yes
  - Granularity: 5 minutes
  - Retention: 30 days

Manual Snapshots:
  - Before major changes
  - Before version upgrades
  - Retention: 90 days

Testing:
  - Monthly: Restore backup to staging
  - Quarterly: Full DR drill
```

**Application State**:
- StatefulSet data: EBS snapshots (daily)
- Configuration: Stored in Git
- Secrets: AWS Secrets Manager (encrypted backups)

### Recovery Procedures

**RTO/RPO Targets**:
- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 5 minutes

**Disaster Scenarios**:

1. **Single Service Failure**:
   - Auto-recovery: Kubernetes restarts pod
   - RTO: <5 minutes
   - No data loss

2. **Database Failure**:
   - Auto-recovery: RDS Multi-AZ automatic failover
   - RTO: <2 minutes
   - No data loss (synchronous replication)

3. **Availability Zone Failure**:
   - Auto-recovery: Kubernetes reschedules pods, RDS fails over
   - RTO: <10 minutes
   - No data loss

4. **Region Failure**:
   - Manual recovery: Restore from backups in different region
   - RTO: <1 hour
   - RPO: <5 minutes (last backup)

**DR Drill Checklist**:
```markdown
- [ ] Notify team of drill
- [ ] Stop production traffic simulation
- [ ] Restore database from latest backup
- [ ] Deploy application to DR environment
- [ ] Verify data integrity
- [ ] Run smoke tests
- [ ] Measure recovery time
- [ ] Document lessons learned
- [ ] Clean up DR environment
```

---

## Runbooks

### Common Operations

#### 1. Deploy New Service Version

```bash
# 1. Build and push image
docker build -t $ECR_REGISTRY/user-service:v1.2.3 .
docker push $ECR_REGISTRY/user-service:v1.2.3

# 2. Update Helm values
helm upgrade user-service ./helm/user-service \
  --set image.tag=v1.2.3 \
  --namespace money-tracking-prod \
  --wait

# 3. Verify deployment
kubectl rollout status deployment/user-service -n money-tracking-prod

# 4. Check logs
kubectl logs -f deployment/user-service -n money-tracking-prod

# 5. Run smoke test
curl https://api.money-tracking.com/v1/users/health
```

#### 2. Scale Service

```bash
# Manual scaling
kubectl scale deployment user-service \
  --replicas=5 \
  -n money-tracking-prod

# Update HPA
kubectl patch hpa user-service-hpa \
  -n money-tracking-prod \
  --patch '{"spec":{"maxReplicas":15}}'
```

#### 3. Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/user-service -n money-tracking-prod

# Rollback to previous version
kubectl rollout undo deployment/user-service -n money-tracking-prod

# Rollback to specific revision
kubectl rollout undo deployment/user-service --to-revision=3 -n money-tracking-prod
```

#### 4. Database Maintenance

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier money-tracking-prod \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d-%H%M%S)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier money-tracking-restored \
  --db-snapshot-identifier manual-backup-20251228-100000

# Run vacuum analyze (maintenance)
kubectl run psql-temp --rm -i --restart=Never \
  --image=postgres:15 -- \
  psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

#### 5. Investigate High Error Rate

```bash
# 1. Check service logs
kubectl logs -f deployment/user-service \
  -n money-tracking-prod \
  --tail=100 | grep ERROR

# 2. Check metrics
# Open Grafana → Service Dashboard → Error Rate panel

# 3. Check recent deployments
kubectl rollout history deployment/user-service -n money-tracking-prod

# 4. Check database connections
kubectl exec -it deployment/user-service -n money-tracking-prod -- \
  curl http://localhost:3000/metrics | grep database_connections

# 5. If recent deployment, rollback
kubectl rollout undo deployment/user-service -n money-tracking-prod
```

---

## Cost Optimization

### Cost Breakdown (Estimated Monthly)

| Service | Cost/Month | Notes |
|---------|-----------|-------|
| EKS Control Plane | $72 | Flat rate |
| EC2 Nodes (3x t3.xlarge) | $450 | $0.2112/hr × 3 × 730hrs |
| RDS PostgreSQL | $1,100 | db.r6g.xlarge + storage + backups |
| ElastiCache Redis | $350 | cache.r6g.large × 6 nodes |
| ALB | $25 | + data transfer |
| NAT Gateway | $100 | $0.045/hr × 3 × 730hrs |
| S3 Storage | $50 | Various buckets |
| CloudWatch | $100 | Logs and metrics |
| Data Transfer | $200 | Outbound traffic |
| **Total** | **~$2,500/month** | |

### Optimization Strategies

1. **Right-Sizing**:
   - Use AWS Compute Optimizer recommendations
   - Start smaller, scale up based on metrics
   - Use Spot Instances for non-critical workloads (dev/staging)

2. **Reserved Instances**:
   - Purchase 1-year RIs for production RDS (save 30-40%)
   - Consider Savings Plans for EC2 (flexible)

3. **Auto-Scaling**:
   - Scale down during off-peak hours
   - Use HPA to match demand

4. **Data Transfer**:
   - Use VPC endpoints for S3, ECR (avoid NAT costs)
   - Enable CloudFront for frontend (reduce ALB costs)

5. **Monitoring Costs**:
   - Set up billing alerts ($2,000, $2,500, $3,000)
   - Review Cost Explorer weekly
   - Tag all resources for cost allocation

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| DevOps Lead | ___________ | ___________ | _____ |
| Technical Lead | ___________ | ___________ | _____ |
| Security Lead | ___________ | ___________ | _____ |
| CTO | ___________ | ___________ | _____ |

---

*This infrastructure guide is a living document and will be updated as infrastructure evolves.*
