# Verified local staging recovery

Before the new environment-cohesion steering, all 374 staged files were captured in
`port/v2/apps/game/smoke/civet-study-staged-20260908.patch.gz`; adjacent `.json` is its exact receipt.
Gzip readback matched the raw 88,899,315-byte binary patch, and reverse `git apply --check`
passed without warnings. Gzip SHA `4b52498c5f7196083863fb1ab9d55bd36fd2478fa008514a6a6d4d310498fd12`.
Raw SHA `cafc6162bae9a965fa0274287372e835a01b4733dbfccaecbb1fd53bf4ecbcac`.
This is local recovery, not an independent cloud backup or signed commit. Subsequent cohesion
work and this pointer are outside that historical snapshot. Original signing failure remains.
