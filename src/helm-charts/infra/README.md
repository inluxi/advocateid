# Cluster setup (one time)

Run these once on the k3s cluster (see MVP1-INSTRUCTIONS.md sections 1.0 to 1.5):

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace --set controller.service.type=LoadBalancer

helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager -n cert-manager --create-namespace --set installCRDs=true

helm repo add argo https://argoproj.github.io/argo-helm
helm install argocd argo/argo-cd -n argocd --create-namespace

# ClusterIssuer and the ArgoCD applications (production and staging) from this chart
helm install advocateid-infra ./src/helm-charts/infra --set acmeEmail=you@example.com
```

Create the secrets by hand (never commit them), see the comments in `../app/values.yaml`.

## Custom domains

The app routes any other Host header to the matching Premium page. Certificates for customer domains need one of:
1. Cloudflare for SaaS custom hostnames (set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`; the app creates the hostname when DNS verifies), or
2. an Ingress per customer host with a cert-manager Certificate (HTTP-01), created by a small controller or by hand.
This is experiment T7 in PROJECT_REQUIREMENTS_v6.md.
