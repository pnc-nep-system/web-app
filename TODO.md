# TODO

## Programme wizard lock after completing Activity 1
- [x] Identify where step navigation/validation happens (in `src/views/programme/NewProgrammeView.vue`).
- [ ] Update `src/views/programme/NewProgrammeView.vue` to introduce an `isLocked` flag.
- [ ] Treat “Activity 1” as the first activity section the user completes (likely step 2: Activities B1–B9). Once locked: disable step navigation + prevent router navigation away.
- [ ] Block leaving the wizard (route leave / back) once locked.
- [ ] Verify behavior end-to-end.


