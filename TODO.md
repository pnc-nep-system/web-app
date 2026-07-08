# TODO

## Plan approved/working on: Activity step validation + prevent navigation

- [x] Add validation gating for step 2 so Continue does not navigate when ActivitiesForm is incomplete; show existing inline error.
- [ ] Add a toast/message “Imcomplete is not yet” when user tries to continue without completing required inputs.
- [ ] Ensure once completed, navigation to next activity is allowed (no false blocking).
- [ ] Update routing/navigation in the step flow page (NewEntry/NewProgramme multi-step view) to actually push to step 2/next activity.
- [ ] Run lint/build (npm run build) to ensure no TypeScript/template errors.

