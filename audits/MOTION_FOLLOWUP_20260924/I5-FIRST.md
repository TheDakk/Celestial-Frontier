# I5 first — source gate checked before new implementation

PR43 read-only API observation: OPEN, anthropic/mac202191a1efe47ca173ce0bbd32809def910b7a45 → develop. Local openai/mac4c23bffcb6df6f2e79a6b70301a39538183235b3 is a different source. The PR commit object is present locally, but the standing no-sync/no-merge restriction does not authorize replacing/integrating it into this checkout. Claude’s lane remains read-only. No certificate attempt has been consumed in this follow-up.

Prior local I5 evidence remains historical, never bound to the PR producer. New service-worker changes also alter producer authority, so a certificate taken before those bytes join the integrated source would not certify the resulting worker. Do not rewrite budget/test producer fields or old measurements merely to make the authority test green.

Required next source step: Nick authorizes exact local integration of the chosen PR/Claude source into openai/mac, or the owning Claude lane measures the final clean committed integrated source itself using the exact Edge certificate chain. The budget and contract test must be reconciled together from that measurement, then the targeted authority/budget tests and develop profile run once. No hosted attempt/label is authorized here.

Sprint mode continues independent items4–7 while this source gate remains explicit. Item6 is already repaired in signedfb1922a0; adoption by Claude remains a separate integration action.
