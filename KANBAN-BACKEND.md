# Branch Kanban Backend

The `/kanban` page is a UI surface. Its operational backend lives in the
`gcloud-office` repo as the branch delegate receiver:

```text
Browser -> openclaw-office /api/branch-kanban -> delegate_receiver /v1/kanban
Browser -> openclaw-office /api/branch-report -> delegate_receiver /v1/delegate
```

Canonical backend files:

- `gcloud-office/mcp-tools/branch_inbox/delegate_receiver.py`
- `gcloud-office/mcp-tools/branch_inbox/kanban.py`
- `gcloud-office/mcp-tools/branch_inbox/workboard/`
- `gcloud-office/docs/openclaw-branch-kanban.md`

## Required Branch Runtime

Each branch must run a delegate receiver service:

```bash
systemctl --user status openclaw-delegate-<branch>.service
```

The receiver env file must provide the base URL and token:

```bash
~/.config/<branch>-delegate-receiver.env
```

Expected keys:

```bash
DELEGATION_TOKEN=<secret>
DELEGATE_BIND=<tailscale-ip>
DELEGATE_PORT=8780
DELEGATE_BRANCH=<branch>
OPENCLAW_PROFILE=<branch>
```

The `openclaw-office` process discovers that file automatically when it runs as
the same user and branch profile. Otherwise set:

```bash
OPENCLAW_BRANCH_RECEIVER_ENV=/home/<user>/.config/<branch>-delegate-receiver.env
```

or provide equivalent values:

```bash
OPENCLAW_BRANCH_API_BASE_URL=http://100.x.y.z:8780
OPENCLAW_BRANCH_DELEGATE_TOKEN=<same-secret-as-DELEGATION_TOKEN>
```

## Validation

From the branch machine:

```bash
curl -fsS http://127.0.0.1:<office-port>/api/branch-kanban
curl -fsS http://127.0.0.1:<office-port>/api/branch-report
```

If the UI shows `Branch Kanban is not configured`, the frontend loaded but
`openclaw-office` did not find the branch receiver URL or token. Check:

```bash
systemctl --user cat openclaw-office-<branch>.service
journalctl --user -u openclaw-office-<branch>.service -n 80 --no-pager
systemctl --user status openclaw-delegate-<branch>.service
```
