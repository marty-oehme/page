---
title: Flexible PaaS with simple orchestration
description: How I run Prefect v3 next to Dokku in my homelab
pubDate: 2026-08-13T16:11:42
tags:
  - ansible
  - hosting
weight: 10
---

[Dokku](https://dokku.com/) is my PaaS. When writing small scripts to improve my day-to-day workflow, I git push an app and everything else just happens.
[Prefect v3](https://prefect.io/) is my orchestrator: it decides what runs, when it runs, and in what order. If anything
requires input from another script, needs to wait for it, or requires specific scheduling, prefect
takes care of it.
But important for my setup is that the two never share a runtime:
Dokku is the execution plane, Prefect is the control plane, and they only ever talk over HTTP.

Every Dokku app on my box automatically has the Prefect API URL and an auth string injected into its environment,
so any of them can become a flow, a task, or a deployment almost for free.
As always, all my infrastructure is running on various isolated incus containers,
so the baremetal concerns can be isolated from working with the individual applications.
This is some of how I set that up, and various traps I hit along the way.

Let me get some disclaimers out of the way up front:
this is the setup as I have it running currently, assembled over a couple of afternoons.
It is *not* thoroughly tested against heavy, big-data workloads.
It is *definitely* not a hardened setup if you intend to open it up to any network beyond your
own.[^prefect-oss-limitations]

[^prefect-oss-limitations]: One major limitation you will hit very soon when deploying prefect is
    that the self-hosted version can *only* provide a single API authentication key and has no
    concept of multi-tenancy or RBAC. In other words: every user could start/stop/create any of
    the flows on your system. This is a real weakness and may be a reason to look for a different
    orchestration solution. For the moment I am happy with prefect, but this is a real pain point.

Here's what we want to achieve by the end of the article:

- a Dokku PaaS running in its own incus container
- a Prefect v3 stack in a second, dedicated incus container
- every Dokku app wired to Prefect automatically, with zero per-app configuration
- TLS termination in front of both, courtesy of Caddy

I have isolated the roles from my main infrastructure repository and built a little [example repo](https://git.martyoeh.me/Marty/example-prefect-dokku).
It contains all of the ideas below.

## Two containers, not one

The baremetal box runs three incus containers:

```ascii
baremetal host
|-- incus container "docker-dokku"    (Debian 13, 3 GiB)  - Dokku PaaS
|-- incus container "docker-prefect"  (Debian 13, 3 GiB)  - Prefect v3 stack
`-- incus container "ingress"         (Caddy)             - TLS termination
```

I could have run Prefect on the same box as Dokku.
I didn't, on purpose:
Prefect is stateful, long-running, and hungry, and owns its own Postgres.
Sticking it on a dedicated Docker host means that a crash of prefect, or an OOM kill, or even a full disk can never take down my dokku apps in a crash cascade.

It also lets me give every service its own memory limit.
Since incus containers are relatively cheap on your resources, that isolation is worth the extra container to me.

You can get away with less than 3GiB memory, but since my serve has the headroom this allows me to
run workers on dokku, on the prefect instance itself, and not need to worry about memory thrashing
due to tight constraints.

## Installing Dokku the unattended way

Dokku ships as a Debian package, and the installer prompts you interactively unless you pre-seed a debconf.
Since I provision everything in my homelab with Ansible and want a run to finish without a human watching,
I pre-seed it up front:

1. Install Docker first.
2. Add the Dokku packagecloud repo and key.
3. Pre-seed debconf: vhost hostname, SSH key file, nginx on, default site on.
4. `apt-get install dokku`, then `dokku plugin:install-dependencies --core`.

The default site is worth a mention.
It returns `return 444`, which drops requests with an unknown Host header instead of leaking them onto a page.
That means if somebody tries to reach the page for an app which has not deployed they cannot
accidentally end up on another app's location.

A trap here: inside an incus container,
In my tests `policy-rc.d` stopped sshd from starting during the package install.
If you don't explicitly enable and start `ssh`, your git push deploys will fail later (no ssh server available),
and the failure is silent enough to cost you an afternoon.[^container-ssh]

[^container-ssh]: A non-container install probably never hits this, since a normal init will start
    the daemon during package installation. Containers can be special that way.

## The Prefect stack

The minimal working stack is just a prefect server, with one `prefect server start` process.
For a more stable (and scalable) setup, three parts are important:

- Postgres (>= 14.9) as your database: It's the metadata store for flows, runs, and deployments.
- Redis as your message queue: Technically only "required" for non-trivial v3 deployments, it nevertheless backs so many event queues that you will see real performance hits if you do without for larger deployments. It's cheap, use it if you can.
- A one-shot `migrate` container: Runs `prefect server database upgrade` before the API starts, since prefect refuses to start against an unmigrated database.

The migrate-first pattern guarantees the schema is current before any process writes to it,
and it gives you one ordered migration step in the compose dependency graph (`api depends_on migrate completed successfully`).

Once you outgrow the single process, or if you wish to be future-proof, split it:
Run the API as `prefect server start --no-services` and put the background work, the scheduler, automation triggers, and the event persister into a separate `prefect services start` container.
That's the official scaled-deployment guidance given in order to keep the API responsive.
A one-process version is of course fine to start with.

## Wiring every app to Prefect with two variables

This is the magic step connecting both deployments.
Each Dokku app needs two env vars, and you want them set once, not per app.
Dokku global config is inherited by every app, and app-level vars override it.
So one `config:set --global` wires the whole PaaS to the orchestrator:

```sh
PREFECT_API_URL          http://<prefect-host>:4200/api
PREFECT_API_AUTH_STRING  <user>:<pass>   (same as PREFECT_SERVER_API_AUTH_STRING)
```

Two habits can keep this simple:

If you are using Ansible to set up these deployments as IaC, derive the URL from your inventory instead of hardcoding the IP.
My Dokku role reads the Prefect host's address and port from the incus inventory (`ansible_incus_ipv4` plus `stack_prefect_host_port: 4200` variable).
When a playbook deploment moves a container, the URL fixes itself on the same run.

And use the same auth string on both sides.
Set it server-side as `PREFECT_SERVER_API_AUTH_STRING` and client-side as `PREFECT_API_AUTH_STRING`.
Self-hosted Prefect has exactly one shared credential.
There is no multi-user, and there are no API keys; those are unfortunately only Prefect Cloud features.

The one thing that can bite you is `PREFECT_API_KEY`:
Don't set it against a self-hosted server. It takes precedence in your apps and you get 401s since
they will ignore the `PREFECT_API_AUTH_STRING` they actually need to talk to your server.

## One wildcard to rule them all

The ingress container runs Caddy.
It is not strictly necessary since you can wire everything up via IP,
but Caddy makes apps on subdomains and behind TLS easy:

- `prefect.{{domain}}` reverse proxies to the Prefect host's published port.
- `*.apps.{{domain}}` reverse proxies to the Dokku host's nginx on port 80, so a git push deploy is instantly reachable with zero per-app config.

The DNS gotcha that breaks this most often: wildcards match only one label 'depth'.
`*.apps.{{domain}}` needs its own DNS record pointing at the ingress.
A bare `*.{{domain}}` record does not cover the deeper `apps.` label.
That is the single most common way "push and it's live" stops working.

## Secrets

You require secrets for the above setup to work, at minimum the `PREFECT_SERVER_API_AUTH_STRING`,
presumably also a Postgress db password and a redis password.

What I have settled on for my Ansible deployments are two sources, in precedence order:
the Ansible vault first, the password store (`pass`) as fallback.

Ideally your role fails loudly if a credential is missing from both so no accidental exposures occur.
The Prefect auth string is the same value on the server and the clients,
so it lives once in the store and both roles reference it.

## Back it up

Prefect side: a cron `pg_dump` container dumps the logical database shortly before a restic container runs (once a night in my case).
Restic always picks up a fresh, consistent dump, never live database files.
Ideally back up the Redis RDB files too.

Dokku side: restic backs up `/var/lib/dokku/data/storage`, which holds every `dokku storage:create` volume, including the Prefect result-storage volume mounted at `/storage`.

I use logical dumps because backing up live Postgres data files while the server is running *can* work but is not always safe.
A `pg_dump` at a known point in time is.

## What I learned the hard way

Global env changes do not reach running containers in dokku until they restart.
To converge idempotently, compare each running container's baked-in env against the merged config and restart only the stale apps. Don't trust `dokku config:show --merged` for this.
It always shows the merged, new value, so it can't tell you a container is stale.
This took a quite a while to figure out.

Self-hosted Prefect has no multi-user.
One shared auth string protects the whole API.
If you want more isolation, you'll have to use your reverse proxy in front.

Container IPs are brittle, try to move beyond them as soon as possible.
Derive them from inventory, and remember that internal bridge traffic bypasses TLS.
The auth string is the only protection on the wire.

The memory budget calculation on a 3 GiB Prefect host:
postgres 384M, redis 128M, API 768M, services 512M, migrate takes 256M on startup, about 1.8 GiB steady state.

Ensure you pre-own the postgres and redis bind-mount data directories with uid 999 so the containers can write regardless of entrypoint chown behavior. It avoids `MISCONF` for redis and read errors for postgres down the road.

If install-time traps are debconf and sshd in containers.
And keep `restart: unless-stopped` on the containers; treat the compose stack as the unit of state.

That's it for the main setup.
Again, you can find the [example setup](https://git.martyoeh.me/Marty/example-prefect-dokku) discussed above.

I have this configuration running for a few months now.
It is quite stable and allows for quick explorations of your concepts via dokku while easily
monitoring and orchestrating your results through prefect, giving the best of both worlds between
flexibility and stable observability to me.

Thank you for reading.
