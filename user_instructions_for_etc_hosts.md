To update your `/etc/hosts` file, you should ensure that the following entries are present and point to `127.0.0.1`:

```
127.0.0.1 argocd.local trii-frontend.local trii-api.local
```

If you have older entries like `127.0.0.1 frontend.local` or `127.0.0.1 api.local`, you should **remove** them to avoid conflicts.

For the entry `127.0.0.1 trii-frontend.local`, if it already exists, please ensure it's updated to be part of the line above.

The entry `127.0.0.1 argocd-dev.trii-platform.com` refers to a different ArgoCD instance, so you should **keep** it if you still need to access that environment. The `argocd.local` entry is specifically for the ArgoCD instance running in your local `kind` cluster.

After editing your `/etc/hosts` file, your `Makefile`'s `local-up` command will be ready to use the new hostnames for accessing the applications.