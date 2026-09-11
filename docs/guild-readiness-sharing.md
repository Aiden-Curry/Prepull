# Guild readiness sharing

Phase 6.4A keeps the personal and guild character domains separate. `user_characters` and its private sync history remain personal records. `guild_members` remains the guild roster. An approved `guild_member_links` row is the existing PrePull relationship used to establish eligibility; it is not described as Battle.net ownership verification.

`guild_readiness_shares` stores only explicit consent and the relationship between a guild roster character and an owner-controlled saved character. It does not persist PlayerAdvice, equipment, recommendation counts, rankings, scores, or percentages.

The database enforces same-guild member and membership references, the existing user/claim pair, saved-character ownership, one saved-character relationship per guild/member/character tuple, and at most one enabled relationship per roster character. Cascades handle physical removal. Triggers disable consent when a claim stops being approved, membership or roster character becomes inactive, or the saved character is archived. Re-approval or reactivation never enables an old share.

The service rechecks current active membership, approved claim, active roster character, saved-character ownership, archive state, and canonical identity on every enable or read. Identity includes region, normalized realm, normalized character name, `CharacterRealmType`, and `ContentVersion`; those last two concepts are never inferred from each other.

Raid access reuses `canManageRaid`: owners and appropriately capable officers are allowed, while a raid leader must also be assigned to that raid. The service batch-loads roster/share/latest-successful-sync rows and then sync items. It computes high-level summaries through the existing PlayerAdvice registry and never calls a character provider. Officer DTOs omit share IDs, saved-character IDs, account data, raw equipment history, and Session Planner state.

Unsupported specializations and never-refreshed characters are neutral data-availability states. Selected roster totals are separate from bench rows. No readiness score or automated roster judgment is produced.
