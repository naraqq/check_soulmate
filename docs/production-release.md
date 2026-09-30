# Production release handoff

The repository is prepared for deployment; local builds and tests do not prove that live QPay, AI credentials, TLS or the server's workers work. No production server was changed during this pass.

## Release changes

- Mongolian questions, response choices and examples use consistent wording. Progress-tracking question definitions remain stable.
- Support links open the owner's Facebook page: https://www.facebook.com/profile.php?id=61594670202747. Links use `noreferrer` so report URLs are not sent with the link.
- Test payments work only with `PAYMENT_BYPASS=true` in `local` or `testing`. Legacy forced/production opt-in flags cannot unlock production reports. Do not use the production site for free test payments.
- Database queue retry defaults to 480 seconds, longer than the 420-second report worker timeout.
- Deployments propagate remote failures, fail when default backend tests cannot run, use the frontend lockfile for dependency installation, and retain older releases until the health check succeeds. Worker restart failure now fails the deployment. Health checks validate API JSON and verify HTTPS certificates once configured.
- Check-in/feedback changes require the additive `2026_09_30_000001_add_checkins_and_feedback_to_assessments` migration. Saved reports remain readable.

## On the deployment host

Use the existing `./deploy.sh` workflow. It exports the questions, runs tests, builds, uploads, runs migrations and caches config. Do not skip tests for launch. Production settings are in `shared/.env`, never in the frontend.

After secrets and HTTPS are configured, run from the active backend directory:

```sh
php artisan app:production-check
```

This read-only command checks production/debug settings, HTTPS URLs, presence of credentials, QPay production endpoint, queue configuration, pricing, questionnaire export and migration columns. It prints pass/fail labels without secret values and exits nonzero on missing configuration. It does not test a charge, contact providers, verify certificates or inspect worker processes.

Before opening to customers:

1. Verify the live domain and `/api/config` respond over HTTPS with the correct price.
2. Confirm Supervisor reports a running queue worker and the scheduler is active.
3. Complete an authorized live payment; verify the expected amount, provider callback and report completion. Keep the payment token private. Refund through the normal merchant process if appropriate.
4. Review newly generated Mongolian reports for early dating, committed relationships, uncertainty and a sensitive-boundary scenario using synthetic answers. Confirm each cited experience exists and the next step fits the situation.
5. Open an older report, start a same-person check-in, test feedback and deletion, and verify the Facebook support links.

Follow `docs/user-testing.md` for actual participant sessions.

## If a release fails

The deploy command now returns failure instead of swallowing it during cleanup. Check logs and worker status. Use `./deploy.sh rollback` to restore the previous code release if needed; migrations are not rolled back automatically. Back up the database and `APP_KEY` before production changes. Losing `APP_KEY` makes encrypted answers and reports unreadable.

### Partner result sharing

Run migrations before publishing the frontend (`2026_09_30_000003_create_partner_shares_table`). The paid, completed report offers a selectable preview and a separate `/shared/<64-character token>` read-only link. Only strengths, areas to discuss, and conversation starters can be shared; raw answers, evidence, and owner tokens are excluded. New links replace old links. Owners can revoke access; deleting the assessment cascades to its share. Stored snapshots and tokens are encrypted. Anyone with a share link can read its selected content until revoked.

Deploy the updated Nginx snippet for `noindex`/`no-store` headers on shared pages. Verify create, recipient view, replacement, and revocation on a completed paid report. Do not use an owner `/report/` link when testing partner sharing.
