# Test whether people feel understood

This is a testing protocol, not a record of completed research. No participants have been recruited or contacted by this change.

Run a first round with 5–8 consenting adults across talking, dating, committed and married stages. Let people choose a fictional situation; do not require them to disclose intimate experiences. Use a development environment and test payments. Ask separately before recording, and avoid recording private answers or report URLs. Allow stopping or skipping the session at any point.

## A 20-minute session

1. Ask the participant to describe what they hope the app will help them understand, without disclosing relationship details.
2. Have them complete a check on their phone. Ask them to say when a question feels repetitive, assumes something that has not happened, lacks a fitting answer, or uses unnatural Mongolian. Do not explain the intended meaning until after they respond.
3. Let them read the report. Ask: “Which sentence fits your experience? Which feels like a guess? What remains uncertain?”
4. Ask them to explain the next step in their own words. Ask whether it feels practical, safe and within their control. Do not equate wanting to stay together with a successful report.
5. Using a fictional repeat check, change the stage and one anchor answer. Ask them to find what changed, explain the comparison, and start a separate relationship without linking it. Check that they understand a new report has a separate payment.
6. Ask verbally: “Did you feel understood? Do you know what to do next? What would you remove or rewrite?”

## Scenarios to include

- Talking for under a month, no meeting and unclear intentions: uncertainty must not become rejection or incompatibility.
- Mutual effort with a temporary period of outside stress: avoid declaring one-sidedness from response speed.
- Repeated unmet needs after several conversations: do not prescribe endless extra effort from the user.
- Fear of a reaction or pressure around boundaries: advice must not make direct confrontation the required next step.
- Dating becomes exclusive: compare identical anchor questions, not unlike category scores.
- A previous check lacks anchors, is deleted, or was taken today: show missing/overlapping evidence honestly.

## Record outcomes, not personal disclosures

Record a participant code, stage/scenario, confusing question IDs, repeated concepts, whether they can explain the uncertainty and next step, and whether they accidentally linked different relationships. Keep research notes separately from production data; agree a deletion date with participants. Do not paste personal stories or report tokens into issue trackers.

The in-app report feedback form, submission endpoint, dashboard summaries and aggregate command have been retired. Gather research feedback separately during consenting test sessions. Historical encrypted feedback columns remain for migration compatibility and are deleted with the parent assessment.

## Release review

Aim for participants to independently understand the main conclusion, identify at least one uncertainty, and name a realistic next step. Investigate every invented experience, unsafe recommendation, or mistaken relationship link. Revise confusing questions, repeat the relevant scenarios with new people, and document what changed. Do not treat a small sample or questionnaire completion rate as proof that the advice is accurate.

## Deployment

Deploy the frontend questionnaire and backend JSON together. Run `php artisan migrate --force` through the normal deployment process for the check-in link. Existing saved reports remain readable; older checks without the three anchors show unavailable comparisons instead of inferred trends. New reports require grounded evidence and uncertainty; API tests use fake provider responses, so review fresh live-provider reports in staging before release.
