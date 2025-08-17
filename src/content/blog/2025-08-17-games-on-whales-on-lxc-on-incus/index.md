---
title: Games on Whales on LXC on Incus
description: Setting up virtualized graphical streaming in your homelab
pubDate: 2025-08-17T20:20:53
tags:
  - docker
  - hosting
weight: 10
---

The following article describes my way of setting up the games-on-whales (GOW) project (game streaming similar to sunshine, running on docker) within the context of running under a containerized Incus LXC infrastructure.

Recently, there is an [officially documented](https://games-on-whales.github.io/wolf/stable/user/quickstart.html#Proxmox-LXC) way of running GOW under an LXC host and this aims to remove the last stumbling blocks with Incus.

## Context

While I do not game too much anymore (who has the time), the underlying technology of low-latency game streaming over the network fascinates me to no end.[^gamesonly]
In that spirit I recently set up my own streaming provider on my homelab.

[^gamesonly]: And, for the record, this is of course not restricted to games only.
  You can run a fully streamed desktop environment on this service,
  creating your own remote productivity environments or anything that requires a graphical user interface.

Since my homelab runs entirely on Incus containers and VMs,
with the main OS just being a pretty locked-down Debian installation,
this throws an extra spanner into the works of running game streaming from there.

The usual way to use one of your own machines as a game stream host is [sunshine](https://app.lizardbyte.dev/Sunshine/).
Sunshine is a fantastic project and I have nothing but respect for the maintainer and developers,
but it is terribly difficult to get running in a virtualized environment,
being aimed mostly for bare-metal service.

Games-on-whales with its [wolf](https://games-on-whales.github.io/wolf/stable/) stream host,
on the other hand, is aimed _exclusively_ at running in virtualized environments,
as its whole premise is running your games on individual docker containers.[^containers]

[^containers]: At least, different containers for different client environments.
  You can set it up to [share environments](https://github.com/games-on-whales/wolf/issues/83) as well,
  but this breaks its intended [multi-client architecture](https://games-on-whales.github.io/wolf/stable/user/configuration.html#_share_home_folder_with_multiple_clients).

Both options use [moonlight](https://moonlight-stream.org/) as their streaming client.

The guide will (by necessity) be adapted to my personal hardware setup,
with Debian as the bare-metal OS and as the container OS,
running on btrfs as their filesystem of choice,
and passing through an (old) AMD GPU to the individual games.[^mygpu]

Naturally that means if your setup is different,
some setup steps will differ a little.
I still believe this guide will be useful to figure out potential stumbling blocs concerning containerization,
while the nice [quickstart guide](https://games-on-whales.github.io/wolf/stable/user/quickstart.html) of GOW details the steps for e.g. other GPU passthrough requirements.

[^mygpu]: I have a cobbled together old business desktop machine which currently functions as my homelab.
  Unfortunately, like a lot of premade business machines,
  it comes with a proprietary PSU connector design and does not accomodate modern GPU power requirements.
  Thus, the mighty machine is running with a dinky AMD Radeon RX460 at the moment --
  but even this has proven more than enough to play some test rounds on older or indie games.

Here's what we want to achieve by the end of the article:

- an Incus container running Docker (and Docker compose) on btrfs
- Docker compose running Games-on-Whales
- Direct host network bridging to the outside ports of the machine [^networking]
- GPU passthrough (for AMD GPU) to the games
- Gamepad input enabled for games

[^networking]: Other setups are of course possible, such as running GOW on a specific sub-domain using reverse proxying.
  But the focus of the article is not networking in virtual environments,
  so this will not be part of the setup.

And one final disclaimer:
This is the setup as I have it running currently,
having recently set it up in a couple afternoons.
This is _not_ thoroughly tested.
This is _presumably_ not the most elegant way of reaching such a setup.
And this is _definitely_ not a secure setup if you intend to open it up to any wider networks.

<Aside variant="tip">Skip to the end of the article to simply grab the incus configuration and docker compose files.</Aside>

## LXC on Incus

To begin with, we will set up a very basic LXC in incus.
For the purposes of this article I will call the container `whale` but it can of course have any name,
simply substitute the correct name for the commands below.

```yaml
architecture: x86_64
config:
  image.architecture: amd64
  image.description: Debian trixie amd64 (20250812_05:24)
  image.os: Debian
  image.release: trixie
  image.type: squashfs
  image.variant: default
devices:
  root:
    path: /
    pool: default
    type: disk
ephemeral: false
profiles:
- default
stateful: false
```

This runs a Debian 13 Trixie instance within Incus.
We get such a default configuration file by just running the Incus launch command,
which creates and starts an Incus guest LXC in one:

```sh
incus launch images:debian/13 whale
```

With the LXC running, we can start configuring it.

## Docker on LXC

<Aside variant="warning">
  If you think you might be creating more LXC containers for docker in the future,
  it might make sense to save the following setup as an [Incus profile](https://linuxcontainers.org/incus/docs/main/profiles/) or as an image snapshot to build from.
  Do so before setting further configuration and installing additional devices in the next section,
  so you have a flexible baseline to build on in the future.
  Such configuration goes beyond this article, however.
</Aside>

Let's start preparing it as a Docker host.
A concise and well-sourced article, most of the following setup comes from [this post](https://pieterhollander.nl/post/docker-incus-nested/) in combination with the official docker [documentation](https://docs.docker.com/).
I would always refer to their respective instructions to see if anything is updated or changed after this article is published.

To allow docker running on LXC in Incus we need to loosen some of the virtualization security.
Most importantly, we need to allow nested container creation for docker to work at all:

```sh
incus config set whale security.nesting=true
```

### Docker on btrfs

A quick detour, we also need to set some additional options to correctly run Docker with its own btrfs driver.
These options are well described on the linked article above, so I will only give you the necessary commands to achieve this here:

```sh
incus storage create docker_pool btrfs
incus storage volume create docker_pool docker_volume
incus config device add whale docker_disk disk pool=docker_pool source=docker_volume path=/var/lib/docker

incus config set whale security.syscalls.intercept.mknod=true
incus config set whale security.syscalls.intercept.setxatttr=true
incus restart whale
```

### Docker installation

The docker engine can be installed as normal on any system,
just follow the official [installation instructions](https://docs.docker.com/engine/install/).

Again, here are the commands to run in our case for installing.
They are tailored for Debian and should be run _in_ our Debian Trixie guest system
(i.e. through accessing it with `incus exec whale -- bash` first).

```bash
# Add Docker's official GPG key:
apt-get update
apt-get install ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update

apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

<Aside variant="warning">
  A note on root: the docker notes usually use the `sudo` command to install all the above.
  We are, by default, the `root` user in our Debian LXC.
  I have not personally changed the user the docker binary is running under, nor added any non-root user to the container.
  If you intend to be more security conscious, this may be an area of consideration.
</Aside>

If the docker installation is running on btrfs as described above,
there are two additional steps:

1. Update the docker storage driver to use the `btrfs` backend:

  ```sh
  echo '{\n\t"storage-driver": "btrfs"\n}' > /etc/docker/daemon.json
  ```

1. Restart the guest container.

  ```sh
  sudo reboot
  ```

We should now have a fully working docker-in-lxc setup with an Incus container called `whale`.

You can test if everything is working correctly directly from the Incus host by running the usual docker test:

```sh
incus exec whale -- docker run --rm hello-world
```

If it downloads, runs and prints the usual 'Hello from Docker!', you're set.
Any of the following commands that are run on the LXC guest can of course also be run in this fashion from the Incus host.

## Games on Whales

It is time to set up the Docker containers which will host the streams.
Games on whales is not dependent on Docker compose but it will make it easier for us to experiment and make permanent any changes.

Here is the basic docker compose file that will set up the 'wolf' image of GOW:

```yaml
services:
  wolf:
    image: ghcr.io/games-on-whales/wolf:stable
    environment:
      - XDG_RUNTIME_DIR=/tmp/sockets
      - HOST_APPS_STATE_FOLDER=/etc/wolf
    volumes:
      - /etc/wolf/:/etc/wolf
      - /tmp/sockets:/tmp/sockets:rw
      - /var/run/docker.sock:/var/run/docker.sock:rw
      - /dev/input:/dev/input:rw
      - /mnt/udev:/run/udev:rw
    devices:
      - /dev/uinput
      - /dev/uhid
    restart: unless-stopped
```

Put it into a `compose.yml` file on the incus guest.

As you can see, we pass in `/dev/uhid` and `/dev/uinput`, and mount `/dev/input` and `/run/udev`.
But before passing those through to the docker guest correctly,
we have to pass them form the main Incus host to the LXC guest.

From the main Incus host,
run the following commands to create the correct devices and mount the correct directories:

```sh
incus config device add whale uinput unix-char source=/dev/uinput path=/dev/uinput required=true
incus config device add whale uhid unix-char source=/dev/uhid path=/dev/uhid required=true
incus config device add whale input disk source=/dev/input path=/dev/input
incus config device add whale udev disk source=/run/udev path=/mnt/udev
```

Personally, I set the `char` devices to required as it is my understanding that the container will not start then if they can't be inserted.
I prefer this to the container 'half-working' at some point in the future and me being confused as to why.

Those devices should, if everything works well,
be correctly picked up by `wolf` and used to set up the basic keyboard and mouse input using its custom Wayland compositor.

Next up, we can test the docker container.
From the LXC guest, run `docker compose up` and watch the logs.
It will, in all likelihood, complain about missing GPUs and encoding options.
But as long as it runs, this part is done.

You could already try to play something now,
but it would a) not run anything graphical very well, if at all;
and b) not have the correct ports exposed for your client to find the wolf container.
Next up, some additional setup for GPU and gamepad controller passthrough,
and then we set the ports.

### GPU Passhtrough

We need to pass through the GPU into, not just one, but two virtualization layers.
However, the principle doesn't change in the pass through and it is actually not too bad to grasp it.

In essence, we ensure the correct drivers are loaded at the correct level of virtualization -- outermost --
and that the streaming virtualization layers -- innermost -- (the streaming containers in docker) have correct access to the device file.

Let's start with taking care of the drivers.

<Aside variant="tip">Remember that we are setting up the AMD version of GPU passthrough here. Other GPUs require other methods.
  There is very nice documentation on the [Debian Wiki](https://wiki.debian.org/AtiHowTo) and, of course, the [Arch Wiki](https://wiki.archlinux.org/title/AMDGPU) which I have based the following on.
</Aside>

We need to enable the `non-free-firmware` and `contrib` repositories for Debian as they contain e.g. some amd firmware,
and are disabled by default.
In your `/etc/apt/sources.list` file, find the following line and add `contrib non-free-firmware` to it:

```sh
deb http://deb.debian.org/debian bookworm main contrib non-free-firmware
```

I am still running Debian Bookworm, so change this accordingly if you are running the newer Trixie release.

Then, it becomes a simple act of updating the repositories and installing all the correct packages:

```sh
apt-get update
apt-get install firmware-amd-graphics libgl1-mesa-dri libglx-mesa0 mesa-vulkan-drivers xserver-xorg-video-all
```

I believe these packages need to _only_ be available on the outer Incus host,
not on the LXC guest.
This is where we need access to our drivers and the graphics package.
It is how I have it set up.
But if in doubt, you may as well install them in layers further inside the virtualization stack too.

Next, we need to pass through the `/dev/dri/renderD128` special file, first into the LXC guest and then the Docker guest.
On the Incus host, run the following:

```sh
incus config device add whale dri disk source=/dev/dri path=/dev/dri
```

Just like with the input devices earlier,
this makes the device path available to the LXC guest.

Then, we pass it on further to the 'wolf' docker container.
Add the following lines to your docker compose file:

```yaml
services:
  wolf:
    image: ghcr.io/games-on-whales/wolf:stable
    environment:
      - XDG_RUNTIME_DIR=/tmp/sockets
      - HOST_APPS_STATE_FOLDER=/etc/wolf
      - WOLF_RENDER_NODE=/dev/dri/renderD128 # [!code ++]
    volumes:
      - /etc/wolf/:/etc/wolf
      - /tmp/sockets:/tmp/sockets:rw
      - /var/run/docker.sock:/var/run/docker.sock:rw
      - /dev/input:/dev/input:rw
      - /mnt/udev:/run/udev:rw
    devices:
      - /dev/dri # [!code ++]
      - /dev/uinput
      - /dev/uhid
    restart: unless-stopped
```

As you can see, we pass in the additional `/dev/dri` device,
also just like we did earlier for the inputs.

One more thing I always do for my LXC containers,
though I am not sure if it is strictly necessary,
is to pass through the GPU as a `pci` type of device.
For this, on the Incus host, run the following command,
adapted for your GPU address:

```sh
incus config device add whale gpu pci address=0000:01:00.0
```

You can find out the `pci` address of your physical GPU by running, for example, `lspci` on the host.
The number next to your GPU device is the one you want to substitute above.
Again, it might not have an actual effect,
I have not yet actually tried to run the setup without this device passed through.

Now we should have graphics-card rendering enabled in our `wolf` container and are already pretty well set up to run graphical software.
Go ahead and try running the container again with `docker compose up`,
taking care to read the `docker logs` just like above and seeing if we have encoding errors or `vaapi` devices not recognized.

One big issue I have been facing when passing through GPUs like this are sometimes permissions.
If everything should be working but the docker container cannot seem to correctly access the `dri` device,
try changing its permissions to 'super permissive' (`chmod ugo+rwx`) along the virtualization layers.
If it starts to work, you know where the error lies and can start following the layers back to find the permission culprit.
Just don't forget to set the permissions back to a sane setup afterwards again.

If you came this far, take a seat and pat yourself on the back.
We almost made it.
Let's also allow correctly passing in gamepad controllers and, finally,
open our setup to the outside world so you can connect from another client.

### Controller passthrough

This is the section I am least confident about.
I struggled for quite a while with the gamepad setup --
it was detected and running well on the host,
but anything beyond would just not pick it up at all.

I considered not adding this section,
as I am not sure in my knowledge in this area,
and do not have time to delve deep into it again to fix any remaining mistakes.
However, I decided against it and present the setup with which I finally got it working,
even if some of it may be unnecessary,
or my reasoning about it is wrong.
Instead, let this be a huge disclaimer --
take the following with a grain of salt,
though it works for me.

I am working with a trusty old Xbox360 controller with a cable,
though I believe if the controller is picked up as such by the Incus host system it should not matter much which kind of controller it ultimately is.

We want to achieve three things to pass through the controller successfully.
First, we need to allow the LXC guest to intercept the corresponding syscalls for bpf, and bpf devices.
On the Incus host, run the following commands:

```sh
incus config set whale security.syscalls.intercept.bpf=true
incus config set whale security.syscalls.intercept.bpf.devices=true
```

With this, I believe, we can pick up events in the LXC guest that are necessary to pick up when the controller is connected,
and set up the correct kind of device for it.

Second, we need to allow cgroup2 devices for the actual LXC guest.
So, again on your Incus host, run the following command:

```sh
incus config set whale raw.lxc=lxc.cgroup2.devices.allow=a
```

This should allow all cgroup2 devices on the LXC guest.
You may get away with something like `c 13:* rmw` for the allow value here but I have not looked more deeply into than just allowing all.

Finally, we need to pass _those_ cgroup permissions on to the Docker container.
So, in your Docker compose file, add the following lines:

```yaml
services:
  wolf:
    image: ghcr.io/games-on-whales/wolf:stable
    environment:
      - XDG_RUNTIME_DIR=/tmp/sockets
      - HOST_APPS_STATE_FOLDER=/etc/wolf
      - WOLF_RENDER_NODE=/dev/dri/renderD128
    volumes:
      - /etc/wolf/:/etc/wolf
      - /tmp/sockets:/tmp/sockets:rw
      - /var/run/docker.sock:/var/run/docker.sock:rw
      - /dev/input:/dev/input:rw
      - /mnt/udev:/run/udev:rw
    device_cgroup_rules: # [!code ++]
      - 'c 13:* rmw' # [!code ++]
    devices:
      - /dev/dri
      - /dev/uinput
      - /dev/uhid
    restart: unless-stopped
```

We have thus taken the detected device on the main host and generated the correct permissions for the LXC guest to detect and use it,
which it then passes on to the docker container using it to apply to its streaming.

Again, some of those settings may be unnecessary or there are better ways to achieve this,
but this is the minimal version of the settings I had to undertake for my controller to be recognized when streaming.
Now, it works wonderfully, and is even detected if I only connect it mid-stream,
or have to reconnect it for any reason.

### Exposing the ports

While we have all the technical nitty-gritty of device input and graphical output worked out now,
we still can't connect to the actual streaming host.
That is because we haven't actually set up any access to the actual _streaming_ endpoints we need to provide.

Thankfully, this is pretty easy to accomplish in a basic way.
For our purposes we will simply expose the correct ports as directly as possible on the host.
If you then want to lock the ports down more afterwards,
or serve the streams through a reverse proxy or, for example, a specific domain or sub-domain,
that goes beyond this guide.

In contrast to setting up the devices where we worked our way inwards from the main Incus host to the streaming containers,
I think it makes more sense to think about the port setup the other way around.
Your streaming application (`wolf` and the individual streaming image) provide endpoints which you can connect to.
We need to get those endpoints out of their virtual isolation to the outside world beyond the main Incus host.

The first step is accomplished very easily within the docker compose file:

```yaml
services:
  wolf:
    image: ghcr.io/games-on-whales/wolf:stable
    environment:
      - XDG_RUNTIME_DIR=/tmp/sockets
      - HOST_APPS_STATE_FOLDER=/etc/wolf
      - WOLF_RENDER_NODE=/dev/dri/renderD128
    volumes:
      - /etc/wolf/:/etc/wolf
      - /tmp/sockets:/tmp/sockets:rw
      - /var/run/docker.sock:/var/run/docker.sock:rw
      - /dev/input:/dev/input:rw
      - /mnt/udev:/run/udev:rw
    device_cgroup_rules:
      - 'c 13:* rmw'
    devices:
      - /dev/dri
      - /dev/uinput
      - /dev/uhid
    network_mode: host # [!code ++]
    restart: unless-stopped
```

After setting the `network_mode` to host,
restart the containers if they are running.

With this change we tell the Docker daemon that the container should not be on its own private bridge network but instead set the ports which listen in the container to listen _directly_ on the LXC container itself.
Thus, anything that needs to connect to the outside world can do so as if it was directly running on the LXC guest,
not in another layer of virtualization.

This is a good setup to test with as it essentially _removes_ one possible point of failure when trying to connect,
though it should probably not be recommended for production setups.
There, you may want to manually open and expose ports on the container instead,
or even use a reverse proxy to be more flexible.
But, again, doing so goes beyond this guide --
we want to arrive at a _working_ setup before we attempt a _perfect_ setup.

As a quick sanity check, if you run `curl localhost:47989` from the LXC guest while the `wolf` container is running and you receive something like:

```sh
<?xml version="1.0" encoding="utf-8"?>
<root status_code="404"/>
```

This part of the port passthrough works well and you can move to the next layer.

For the next layer, between LXC guest and Incus host,
we will run a series of commands very similar to those adding devices for input and graphics earlier.
Instead of those we will add `proxy` devices.
On the Incus host, run the following set of commands:

```sh
incus config device add whale proxy_control proxy listen=udp:0.0.0.0:47999 connect=udp:0.0.0.0:47999 bind=host
incus config device add whale proxy_http proxy listen=tcp:0.0.0.0:47989 connect=tcp:0.0.0.0:47989 bind=host
incus config device add whale proxy_https proxy listen=tcp:0.0.0.0:47984 connect=tcp:0.0.0.0:47984 bind=host
incus config device add whale proxy_rtsp proxy listen=tcp:0.0.0.0:48010 connect=tcp:0.0.0.0:48010 bind=host
incus config device add whale proxy_video proxy listen=tcp:0.0.0.0:48100 connect=tcp:0.0.0.0:48100 bind=host
incus config device add whale proxy_audio proxy listen=udp:0.0.0.0:48200 connect=udp:0.0.0.0:48200 bind=host
```

These are all the proxies that are necessary for streaming to be picked up and function.
Once you have set them up, you can try the same curl command from another PC in your network (or the outermost Incus host),
substituting the `localhost` for the machine's IP address.
So, for example `curl 192.168.0.100:47989` should return the same 404 status code.
If it does, you are done.

You should now be able to connect to your `wolf` game stream from any client.
Set up the client with a software like [moonlight](https://moonlight-stream.org/) and enter the correct IP address into the server location field.
It should be picked up correctly and allow you to start streaming a variety of graphical applications.

One last thing of note is that,
for the first time that you connect with a new client,
you will need to manually enter the PIN to pair it with the streaming host.
To do so, from the Incus host you can run `incus exec whale -- docker compose logs`
(if the compose file is in your home directory, otherwise enter the LXC guest and change the working directory before running `docker compose logs`).
Now, when you try to connect with a new client a log message with a pairing link like the following will appear:

```txt
http://localhost:47989/pin/#337327E8A6FC0C66
```

Copy the link and paste it into a browser with the IP set to your `wolf` hosting machine,
like for the curl command above.
Then enter the PIN that is shown on your moonlight client,
as also explained [here](https://games-on-whales.github.io/wolf/stable/user/quickstart.html#_moonlight_pairing).

Any time afterwards you can connect simply and without doing this step.

That is all which has to be done and you should now be able to fully use the Games on Whales streaming possibilities.

Well done!

## The complete configuration

Below I have gathered the full configs that we just set up.
They are the complete configuration files for incus and docker.
If you followed the step-by-step procedure above,
you can see the LXC guest configuration you set up by running the following command on your Incus host:

```sh
incus config show whale --extended
```

The compose file is a file already anyway.

If anything is not working in your setup yet,
use the following configuration lists to compare for differences and maybe they can help you troubleshoot.

First, the incus container file:

```yaml
architecture: x86_64
config:
  image.architecture: amd64
  image.description: Debian trixie amd64 (20250812_05:24)
  image.os: Debian
  image.release: trixie
  image.serial: "20250812_05:24"
  image.type: squashfs
  image.variant: default
  raw.lxc: lxc.cgroup2.devices.allow = a
  security.nesting: "true"
  security.privileged: "true"
  security.syscalls.intercept.bpf: "true"
  security.syscalls.intercept.bpf.devices: "true"
  security.syscalls.intercept.mknod: "true"
  security.syscalls.intercept.setxattr: "true"
devices:
  audio:
    bind: host
    connect: udp:0.0.0.0:48200
    listen: udp:0.0.0.0:48200
    nat: "false"
    type: proxy
  control:
    bind: host
    connect: udp:0.0.0.0:47999
    listen: udp:0.0.0.0:47999
    nat: "false"
    type: proxy
  docker_disk:
    path: /var/lib/docker
    pool: docker_store
    source: whale_vol
    type: disk
  dri:
    path: /dev/dri
    source: /dev/dri
    type: disk
  eth0:
    name: eth0
    network: incusbr0
    type: nic
  gpu-1: # gotta be adapted to your physical setup
    gputype: physical
    pci: "0000:01:00.0"
    type: gpu
  http:
    bind: host
    connect: tcp:0.0.0.0:47989
    listen: tcp:0.0.0.0:47989
    nat: "false"
    type: proxy
  https:
    bind: host
    connect: tcp:0.0.0.0:47984
    listen: tcp:0.0.0.0:47984
    nat: "false"
    type: proxy
  input:
    path: /dev/input
    source: /dev/input
    type: disk
  root:
    path: /
    pool: default
    type: disk
  rtsp:
    bind: host
    connect: tcp:0.0.0.0:48010
    listen: tcp:0.0.0.0:48010
    nat: "false"
    type: proxy
  udev:
    path: /mnt/udev
    source: /run/udev
    type: disk
  uhid:
    path: /dev/uhid
    source: /dev/uhid
    type: unix-char
  uinput:
    path: /dev/uinput
    source: /dev/uinput
    type: unix-char
  video:
    bind: host
    connect: udp:0.0.0.0:48100
    listen: udp:0.0.0.0:48100
    nat: "false"
    type: proxy
  wolf-container-data: # only if you want the container data accessible directly from the Incus host
    path: /etc/wolf
    source: /srv/wolf # can be adapted for anything, this path works well for me
    type: disk
ephemeral: false
profiles:
- default
stateful: false
description: ""
```

Then, the docker compose file, running _on_ the incus LXC container we just set up:

```yaml
services:
  wolf:
    image: ghcr.io/games-on-whales/wolf:stable
    environment:
      - XDG_RUNTIME_DIR=/tmp/sockets
      - HOST_APPS_STATE_FOLDER=/etc/wolf
      - WOLF_RENDER_NODE=/dev/dri/renderD128
    volumes:
      - /etc/wolf/:/etc/wolf
      - /tmp/sockets:/tmp/sockets:rw
      - /var/run/docker.sock:/var/run/docker.sock:rw
      - /dev/input:/dev/input:rw
      - /mnt/udev:/run/udev:rw
    device_cgroup_rules:
      - 'c 13:* rmw'
    devices:
      - /dev/dri
      - /dev/uinput
      - /dev/uhid
    network_mode: host
    restart: unless-stopped
```

For those who skipped right to the complete configuration:
with those two files the setup is already complete.
_However_, there may be more stumbling blocks described above which may not be solved through the files alone
(mainly permission issues and driver setup).

This is one of the more involved virtualization scenarios I have set up in my homelab and,
while it _was_ surprisingly achievable over a weekend tinkering,
there are a lot of moving parts and possible points of failure --
especially as it involves bare-metal hardware setups which will differ slightly from machine to machine.

Nevertheless, I hope this post at least inspires you to try something similar,
and a huge amount of gratitude has to go to all the amazing open software that makes something like possible to achieve in our own homes.
