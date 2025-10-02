---
title: VPNs and block devices on incus system containers
description: Handling block device and tun device permissions
pubDate: "2025-02-16T17:37:25"
tags:
  - docker
  - hosting
weight: 10
---

## NAS on LXC/incus

Running Openmediavault (OMV) in a container on Linux is not officially supported.
The largest issue to confront is that any backing storage can a) not be on the same device as the system itself and b) needs to be an actual block storage for the NAS to recognize it as usable.

Additionally, OMV _itself_ needs to be the one doing the mounting (or filesystem creating) and as far as I could tell the storage could not be already mounted at a specific path (which would have been doable with a simple `incus config device add omv omv_hdd disk source=/mnt/host_mount_path/ path=/container/mount_path` bind mount).

So, we need to allow the OMV container itself to mount things.
Be careful here because allowing actual mounting seems to be a security issue in making container separation more porous.
I will assume we are setting these configuration options for an incus container named `omv`.

According to [stgraber](https://discuss.linuxcontainers.org/t/best-way-to-forward-block-devices-to-containers/22477), the most preferable way to allow such mounting is to let userspace take care of it:

```bash
incus config set omv security.syscalls.intercept.mount true
incus config set omv security.syscalls.intercept.mount.fuse=ext4=fuse2fs
```

This lets `fuse2fs` mount, in this case, ext4 file systems within the container and does not break separation.
For this to work `fuse2fs` must be installed in the container as well.

However, in my case this did not work in practice.
Mounting already took ages and the speeds were abysmal.
If it also does not work in your case,
and keeping the security warning above in mind,
one option is to allow actual mounting:

```bash
incus config set omv security.syscalls.intercept.mount true
incus config set omv security.syscalls.intercept.mount.allowed ext4
```

This allows programs within the container to actually mount drives through kernel space system calls.
More dangerous, but faster.

Lastly, we need to add the actual block device as a device into the container as well.
This can be easily accomplished:

```bash
incus config device add omv omv_hdd unix-block source=/dev/sdb1
```

`omv_hdd` can be any arbitrary name which just helps you ID the device and the source, of course, should be the actual path to your device.

Having done both of this,
OMV could finally recognize and mount my drive as a block device.
There were some issues with mounting, unmounting and re-mounting the device and I have not tried much further than this so the road ahead may still not be quite straight.

That said, while it is probably still not advisable to host production-load OMV within a container and instead just use a VM,
it _does_ seem possible under some circumstances.

## VPNs and TUN devices on docker (on LXC/incus)

Similarly, hosting a VPN or tunneling applications through a VPN within docker running within an incus system container also provides a few hurdles to overcome --
as would to be assumed with such virtualization indirections.

As for hosting docker itself on an incus container,
there is a really good write-up [here](https://pieterhollander.nl/post/docker-incus-nested/),
specifically dealing with the incus and docker combination and adding btrfs integration on top.

There are several issues to overcome: a) We need to allow the application within the docker container to make networking syscalls, and in turn allow docker to make this decision, and b) We need to handle access to the `tun` device.

So, let's start by tackling the first issue from the bottom up.
The application wants to bind some traffic to a VPN,
so in the docker container we need to give it that permission.
Assuming we want to start e.g. a `wireguard` container,
that is done as follows:

```yaml
vpn-service:
  image: linuxserver/wireguard
  cap_add:
    - NET_ADMIN
```

This gives applications in the container the ability to handle networking administration.
It represents a decrease in container security at the same time.

If we now try to run this in an incus system container,
the container creation will still time out.
To fix that we need to also allow _docker_ the same capabilities:

```bash
incus config set dockerbob security.syscalls.allow net_admin
```

Now, both containers allow their guests to handle the same syscalls and creation should work.

In some cases,
such as when traffic should be bound to a VPN and tunneled through it,
we also need to give the application access to the `/dev/net/tun` device.
In incus this is linked into containers by default, so nothing much to do here.

However, some docker containers will still fail and complain about no device reachable because it is reachable for the _incus_ container guests but not the _docker_ container guests yet.
To fix that we need to adjust our docker compose (or equivalent docker run command) again:

```yaml
vpn-service:
  image: linuxserver/wireguard
  cap_add:
    - NET_ADMIN
  volumes:
    - "/dev/net/tun:/dev/net/tun"
```

Now we also pass through the standard `tun` device.

And that should about cover it!
