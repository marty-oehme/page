---
title: Practical integration of Dokku and Prefect
description: "Setting up the remaining bits: Credentials and workflow orchestration"
pubDate: 2026-08-14T21:17:46
tags:
  - hosting
  - python
weight: 10
---

# Where should the flows run?

As mentioned in the previous article:
Dokku is my PaaS, Prefect is my orchestrator;
Dokku is the execution plane, Prefect is the control plane, and they only ever talk over HTTP.
That much I covered last time.

The question that stays open is where the flow code lives and runs.
The flow repo can be a Dokku app, a docker image, or a git checkout on the prefect host, and each choice brings different consequences with it.
I worked through four options, and they line up on a spectrum from *mostly on Dokku* to *mostly on Prefect*.

This decision I made since I have predominantly cron-style flows in a homelab.
Sometimes they are dependent on each other, but they rarely crunch data and work for more than a few minutes.
I believe my option is *not* the best option for heavy, long-running workloads --
look at one of the alternatives below for that.

What we are weighing:
Once we have dokku set up and informed of the prefect location,
how can we get a flow's code to the worker?
Where will results land?
Do we need an additional registry?

## Option A: The worker as a Dokku app

This is my favorite way to orchestrate:
The flow repo *is* a Dokku app.
The Dockerfile is based on `prefecthq/prefect:3-latest` with the flow code baked in.
The `Procfile` runs the worker:

```procfile
worker: prefect worker start -p flows --type process
```

Scale it down to just that: `dokku ps:scale <app> worker=1 web=0`.
With this, Prefect knows about this app and has a pool from which it can pull to start workloads right here.

In addition, a release `Procfile` task runs e.g. `prefect deploy` on every push with a corresponding `prefect.yaml` file,
registering deployments against the pool, with a `local_file_system` pull step pointing at the baked-in `/app`.

```procfile title="Procfile"
worker: prefect worker start -p flowspool --type process
release: prefect deploy --all
```

```yaml title="prefect.yaml"
build: null
push: null

pull:
- prefect.deployments.steps.set_working_directory:
    directory: /app

deployments:
- name: my-script
  entrypoint: app.py:main
  parameters:
    sample_flow_parameter: 50
  schedule:
    cron: "0 5,17 * * *"
    timezone: UTC
  work_pool:
    name: flowspool
  tags:
  - myapp
```

Results then go to a dokku persistent-storage mount,
and the worker reaches the API at `<prefect-api>:4200` which has been provisioned into the app container in the last article's deployment.

Of course if you need more flexibility you can just as well run a python file instead which then programmatically calls the deploy:

```procfile title="Procfile"
worker: prefect worker start -p flowspool --type process
release: python deploy/release.py  <-- deploy running from within here
```

Push, auto-deploy, and Prefect takes care of running the flow.
The advantages:
No registry anywhere in the loop, and code versioning is *directly* tied to deploys.
You can also very easily integrate it with CI/CD due to its push-based nature.

The catch: process worker subprocesses live inside the app container, so a redeploy *kills* currently in-flight runs.
This is fine for cron-style flows but can be painful for long-running ones, so be aware of that.
And the result storage path is the container-internal mount path.

However, there is a second, sneakier problem if the worker runs continuously.
Dokku's default rolling deploy starts the new worker *first* and shuts the old one down about sixty seconds later (`wait-to-retire`).
In other words - first we start (new container), then we stop (old container).

Prefect, by default, comes with a safety feature for its flows:
whenever a flow (gracefully) exits, i.e. the app serving the flow shuts down,
it automatically gets set to `paused` in Prefect.
This helps avoid overruns of schedules, running too many schedules at once when the app comes back online,
and general improved orchestration maintenance.
But it's an issue for our Dokku restart logic.

There are two ways to solve this problem -- one on the Prefect side, the other on the Dokku side.

Let's start by looking at Prefect:
When serving a flow with `*.serve()` from python,
one of the variables you can provide is `pause_on_shutdown`, which defaults to `False` and sets up exactly this behavior of pausing your flows once they exit (gracefully).

```python
if __name__ == "__main__":
    hello_world.serve(
        name="my-first-deployment",
        pause_on_shutdown=False,
        interval=60
    )
```

Turning it off will stop the problem of flows automatically pausing when you deploy a new Dokku app version.
But of course you also lose the advantages this option gives you in Prefect:
you lose the guard against schedule overflows and you cannot tell if a flow is *actually* active or the app container is down or restarting.

So instead let's turn to the Dokku side:
The old worker's graceful shutdown re-pauses the deployment schedule after the new worker already unpaused it on start, so the schedule ends up stuck paused with no upcoming runs.
Force a stop-before-start deploy by disabling the worker's checks once per app.
The setting lives server-side, so redeploys keep it:

```sh
ssh dokku@bob:3022 checks:disable <app> worker
ssh dokku@bob:3022 checks:report <app>
```

With checks disabled the old worker is now stopped before the new one starts, so the pause always precedes the unpause.
The web process keeps zero-downtime deploys.
If the schedule does get stuck anyway, `ssh dokku@bob:3022 ps:restart <app>` re-activates it.

## Blocks without the UI

Prefect Secret blocks are usually created by hand in the Prefect UI.
But: they do not have to be.
Your app can (idempotently) save a Prefect Block on 'release' or on startup.

Define the block as a `Block` subclass in the flow code, then call `save()` at worker startup.
`save()` registers the block type in the process, so the block shows up without any manual steps --
you just select it and fill it out in the Prefect UI.

I have a reading digest flow, and it seeds each block from env vars when they are present on first creation,
or creates an empty block otherwise so that it can be filled in later from the UI:

```python
try:
    MinifluxCredentials.load("miniflux")
except Exception:
    MinifluxCredentials(
        url=os.environ.get("MINIFLUX_URL", ""),
        api_key=os.environ.get("MINIFLUX_KEY", ""),
    ).save("miniflux")
```

The one trap: the ensure runs at worker startup, so a newly added block only appears after the worker has been deployed or restarted with the new code.
You can instead add it as part of a `release` task in your `Procfile` and it will be run directly on deploy.

Truth be told, I am not yet sure which version I prefer or if a hybrid might be even more suitable.
Saving on worker startup is easy to implement with the above try and catch,
but it means your flow will definitely try to run without the credentials set at some point on first startup;
Saving on release ensures that the block is there for you to fill before any worker starts up but requires a little more
setup to fill all the correct conditions to push to Prefect and feels a little more brittle.
Doing both might be the best of both worlds but complicates what are supposed to be relatively easy flows.

## The other three options

Of course this is not the only way of integrating the two tools, not by a long-shot.

I thought of 3 other ways, in descending order of 'running on Dokku' versus 'running on Prefect':

Option B: Dokku builds the images, and a *docker* worker spawns isolated flow-run containers per run.
Best isolation you will get -- and the largest blast radius if you get it wrong.
The worker has to sit on the same daemon as the images, or you need a local registry to hand them over.
It also means extra infrastructure for isolation you may not need.

Option C keeps Dokku out of the loop entirely:
A process worker on the prefect host clones the flow git repo at run time via a `git_clone` pull step and a `GitCredentials` block in prefect.
Clearly the "cleanest" IaC of the four, but it abandons the "push to Dokku" mental model for flows that I am striving for.

Option D splits the difference somewhat:
the Dokku app becomes your source of truth for the code and its release step runs `prefect deploy`,
while the worker stays a prefect-host container that pulls the code with `git_clone`.
You keep the push-to-Dokku trigger, and the worker never touches the container.

None of these map as cleanly for my needs *but* they are technically superior ways of achieving stable isolation, IaC, and orchestration, respectively.

## Reiterating what I learned the hard way

Redeploys kill process-worker runs!
If your flows take minutes or hours instead of seconds,
keep the worker out of the app container (e.g. sidecar or one of the alternative deploy options) or accept the interruption.

I run option A for my cron-style flows today.
It has been quiet and boring ever since, which is exactly what I want from an orchestrator.

Thank you for reading.
