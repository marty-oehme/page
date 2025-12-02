---
title: Ansible vault password automation
description: Passing a vault password programmatically
pubDate: 2025-12-02T20:34:40
tags:
  - ansible
  - python
weight: 10
---

This should function as a small addition to the ideas in the earlier [automatic secret
injection](2025-03-20-ansible-passwordstore-lookup)
post for Ansible.

Here, I want to also show how we can add not just the `become_pass` (i.e. `sudo` password on most
systems) from a secure password store, but additionally any vault password for Ansible.

## Ansible-vault

Ansible vaults are encrypted files in the Ansible project directory which contain variables.
Usually they are used to keep secrets and credentials required for the platform configuration,
and set in `host_variables` or `group_variables` for multiple hosts.

Let's say we have an Ansible vault in the variables targeting the `webserver` group of servers:

```sh
project
└── group_vars
    └── webservers
        ├── vars.yaml
        └── vault.yaml
```

In this setup, we have 'safe' variables which are fine to expose in the openly readable `vars.yaml`
file, while our secrets reside in `vault.yaml`.

To create and populate it we make use of `ansible-vault`:

```sh
ansible-vault create group_vars/webservers/vault.yaml
ansible-vault edit group_vars/webservers/vault.yaml
ansible-vault view group_vars/webservers/vault.yaml
```

Now, when instantiating a new vault with the `create` command,
it will ask you to supply and confirm a passphrase.

In the future, any time you wish to `edit` or `view` the vault you will have to supply this
passphrase.

## Playbook use

This becomes a little cumbersome if we have to supply the passphrase manually each time
we just want to run a playbook.

Of course, since the variables are needed to correctly configure the environment, we _will_ need
access to them every time.

Here is where the `vault-pass` mechanism of Ansible comes into play.

We can provide the playbook command with an option called `--vault-password-file=<file>`.
However, we can _only_ provide a file here and not directly add the pass as a command line option.

Ideally, I avoid populating a repository with secrets in plaintext format --
even if the `.gitignore` file is correctly set up to avoid adding the files to the remote
repository, I always get a bit anxious in these situations (especially when working on an open
source repository).

To circumvent this we have two nice options:

1. Add the password on the command line after all with a little `stdin` trick
2. Use a script in the repository which provides the password without exposing it

I will be using the [pass](https://www.passwordstore.org/) unix password manager for the following examples,
but any password manager / pass provider works as long as you can access the vault password through
the command line.

## Stdin trickery

Both options make use of Ansible _executing_ the vault pass file given, if it has its executable bit
set.

The first option is relatively simple in concept:
Instead of providing the password as an option _directly_ we make use of the way we can pipe data
with our shell to pretend it resides in a file:

```sh
pass show path/to/my/password | ansible-playbook --vault-pass-file=/bin/cat playbook.yaml
```

The above line uses `pass` to print the password to `stdout`, which we then pass to the next command.
However, we invoke the `cat` command without providing any options so this is the program that reads
from the pipeline's `stdin` thus receiving the password.
`cat` then gets executed and duly prints out the password, so that ultimately Ansible receives the
correct password, just as if it had read it directly from a file.

Nothing gets exposed and you can directly run the playbook without having to provide anything
manually.

This way has the advantage that no extra files pollute the repository,
though it has the disadvantage that the command line run is a little more convoluted and not just a
clean `ansible-playbook` invocation.
This can be mitigated by using a `Makefile` or `justfile` for the command invocation instead, for
example.

## Script file

Instead of pretending `cat` is a file containing a script we can actually provide one.

In this option we simply create an _actual_ script which, in turn, calls `pass` to provide us the
password (or any other password manager). This gets then executed by `--vault-pass-file`, and
Ansible receives the password automatically again:

```sh
# vaultpass.sh

#!/usr/bin/env sh

pass show path/to/my/password
```

Save this file as `vaultpass.sh` in your Ansible directory and mark it as executable.
Then, when you provide it to Ansible it will fulfill the same purpose as the `stdout` redirection
above:

```sh
ansible-playbook --vault-pass-file=vaultpass.sh playbook.yaml
```

Ansible executes it and receives the correct passphrase to unlock the vault.

You can also set Ansible to always look for this file and execute it in the `ansible.cfg`
configuration:

```conf
# ansible.cfg
[defaults]
vault_password_file=vaultpass.sh
```

With this set in the repository or global Ansible configuration file,
it will always look for just such a script file and execute it to grab the correct vault passphrase.

The downside here is of course an additional file residing in the repository.
You can decide if you want to commit it or keep it away from any remotes,
and for example make it a hidden file (e.g. `.vaultpass.sh`) to make it a little less immediately
present.

On the other hand, it keeps the actual command you run each time clean and does not add any piping
tricks to each invocation.

Those are the two tricks I like to employ to repeatedly and easily provide Ansible with a password
for any local vault files, without exposing the passphrase itself to the repository and without
having to provide it manually for each run.

Most of the information in here is taken from
[these](https://stackoverflow.com/questions/62690097/how-to-pass-ansible-vault-password-as-an-extra-var)
[two](https://stackoverflow.com/questions/48514072/how-to-automatically-pass-vault-password-when-running-ansible-playbook) excellent stackoverflow questions,
and the general [Ansible documentation](https://docs.ansible.com/projects/ansible/latest/vault_guide/vault_managing_passwords.html#storing-and-accessing-vault-passwords).
