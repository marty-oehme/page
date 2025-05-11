---
title: Ansible automatic secret injection
description: Let ansible look up its own passwords with unix pass
pubDate: "2025-11-18T16:10:04"
tags:
  - ansible
  - python
weight: 10
---

I love using Ansible for repeatable, safe system configuration. Its idempotent nature means I can just run my playbooks and be confident that the configurations I need are applied consistently.[^drift]

[^drift]: Yes, some configuration drift can happen with Ansible, especially if you manually modify configurations outside of Ansible. However, it's still a significant improvement over managing systems without configuration management.

One challenge I encountered was managing the sensitive information needed to actually _run_ playbooks, specifically the `become_pass` – essentially, the sudo password required on the target machine(s).

When targeting a single machine, you can enter the password at the beginning of the run using `--ask-become-pass` on the command line or within the ansible.cfg options.
However, the complexity increases when managing multiple machines, each with its own sudo password.

The way to remedy this is actually quite clever:
Just have ansible look up the password for you, using one of the many lookup plugins there are.

## Pass integration

In my case, I use `passwordstore` as a lookup plugin to grab the plugin from my local [pass](https://www.passwordstore.org/) directory.
And of course, being ansible managed,
you can assign different password lookups to each host or host group, aligning with your inventory setup to provide the appropriate credentials regardless of your server groupings.

To integrate this, add the following lines to your host definitions in your inventory:

```yaml
# file, e.g.: host_vars/myhostname.yaml
---
ansible_host: myhostname
ansible_ssh_user: myusername
ansible_ssh_private_key_file: ~/.ssh/a-secret-keyfile
ansible_become_pass: "{{ lookup('community.general.passwordstore', 'ansible/myhostname-become-pass') }}"
```

Now, when you access 'myhostname' from anywhere, whether through a group or by directly targeting plays or tasks, it will automatically resolve its `become_pass`.

The only requirement is a passwordstore with the directory structure `ansible/myhostname-become-pass` underneath.
Ensure the password stored there is appropriately protected within your pass setup.

In a way you can see it as dependency injection for ansible:
You don't have to provide it manually but ansible grabs it on its own whenever necessary.
Of course, ultimately it rather mirrors a simple global lookup table.

## Results

The results are a significant improvement.
If you're managing a single host, you no longer need to manually enter the password every time or store it as plaintext in the repository.
When targeting multiple hosts, it simplifies your workflow even more by allowing each host to dynamically retrieve its own password.

An alternative approach is setting the become_pass variable in an Ansible Vault file. You can then avoid committing it to a public repository or, at most, store it in a private repository. This works, but if you already use a secrets management tool, using a lookup plugin may be more streamlined.

Ansible offers integrations for various secret management tools:

- [passwordstore](https://docs.ansible.com/ansible/latest/plugins/lookup/passwordstore.html)
- [Bitwarden](https://docs.ansible.com/ansible/latest/collections/community/general/bitwarden_lookup.html#ansible-collections-community-general-bitwarden-lookup)
- [1Password](https://docs.ansible.com/ansible/latest/collections/community/general/onepassword_lookup.html#ansible-collections-community-general-onepassword-lookup)
- [LastPass](https://docs.ansible.com/ansible/latest/plugins/lookup/lastpass.html)
- [local keyring](https://docs.ansible.com/ansible/latest/collections/community/general/keyring_lookup.html#ansible-collections-community-general-keyring-lookup)

and many [others](https://docs.ansible.com/ansible/latest/collections/community/general/index.html#lookup-plugins).

But the usage pattern is always similar:
Define a host, define the `become_pass` with a dynamic lookup,
configure the lookup plugin and its options,
and Ansible will take care of the rest.

These integrations are fantastic, and I continue to discover new Ansible plugins and functionality even after years of use.
