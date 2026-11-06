# Isolated painted-support candidate follow-up

The two exact failing poses from `static-contact-diagnosis02.json` were each evaluated once with the existing two-bone kinematics primitive, treating the source painted support as a provisional rigid end solely to construct a candidate. Actual skeleton matrices then reconstructed the real bones and evaluated every original barycentric/skin contributor. Production eligibility, source inputs and gates were unchanged. This is not an all-contact result or a publication certificate.

| Candidate | Knee / Foot (degrees) | Actual full-LBS paint residual | Original limits |
| --- | --- | --- | --- |
| Hit356.25, leg13Far | 51.4980757000676 / -52.72145309608057 | 1.0441647546599597e-13 px | PASS |
| Dodge46.666666666666664, leg0Far | 43.74528040385587 / -47.26072324087063 | 2.0883295093199195e-13 px | PASS |

Both use zero compression. Maximum measured absolute anatomical bone-length error is `1.5959455978986625e-16` normalized source units. Complete candidate poses, original support models and unchanged-source receipts permit reconstruction; numerical pass here does not change `endpointOnly` (true for hit leg13Far, false for dodge leg0Far).

For a support whose nonzero contributors are exclusively hip, Knee and Foot, its position in the hip parent frame admits the exact mathematical form `C + Rk*A + Rk*Rf*B`: hip weights contribute their original points to C; Knee/Foot weights contribute their socket to C; Knee weights contribute `(p-socket)` to A; Foot weights contribute `(knee-socket)` to A and `(p-knee)` to B. Solving these two virtual vectors does not change actual bones or add joints, but the resulting actual skeleton and full LBS still require every original check.

That restricted exact reduction is **not eligible for the actual leg0Far support**. Its corner with barycentric `2.3934071099287585e-15` has nonzero contributions from root, head, leg0FarKnee, leg1FarFoot, leg0NearFoot, antennaFar and leg1NearFoot as well as leg0FarFoot. None may be rounded to zero. A provisional rigid candidate happens to satisfy its actual full-LBS measurement at this pose; admitting a general seeded fallback would be a separate model change requiring full-contact validation, including coupled contributors, original limits, endpoint reconstruction and failure-state restoration. No such production change or broader scan was performed here.
