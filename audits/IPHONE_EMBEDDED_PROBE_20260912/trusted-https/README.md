# Trusted local HTTPS setup — September12

Nick authorized establishing HTTPS trusted by the iPhone after native-02 proved certificate
rejection. Uses installed OpenSSL, a new two-day root and one one-day server certificate.
Root has pathLen0 and critical name constraints permitting192.168.1.62/32 and the reserved
cf-probe.invalid DNS name. Server SAN is only192.168.1.62, EKU serverAuth. Root signing key
removed after issuance and negative controls; only server key remains in private runtime
directory. No private key enters Git or any HTTP route. Public profile contains exactly one
root certificate; no MDM, VPN or other settings. Profile is removable. Expiration does not
remove the profile; Nick should remove it after testing.

Identity/fingerprints/expiry: certificate-receipt.json. Correct-IP strict verification
passes; wrong IP, untrusted root and outside-name-constraint leaf reject. Apple native
security verify-cert passes with explicit root, without changing Mac trust stores. The
older Apple CLI Python3.9/LibreSSL rejects the name-constraint type; approved Python3.12/
OpenSSL3.6.4 HTTPS check passes with unchanged certificate. No TLS verification bypass.

Certificate setup server (no models/inference):
- HTTP http://192.168.1.62:49764/ and /cf-local-probe.mobileconfig only.
- HTTPS https://192.168.1.62:49765/ verifies secureContext/isolation and reports presence
  of WebGPU API; it does not request an adapter or execute any model.
- Private-key and model routes return404. Exact profile bytes and headers verified.
- Live setup-server-status.json is transient, not committed while server writes it.
  Mac verifier requests are not proof of phone trust; require an iPhone secure-page report
  and then a physical Safari session with the same certificate before model load.

Phone manual steps (Apple requires these taps for manually installed profiles):
1. Open setup URL in Safari, Download certificate profile, Allow.
2. Settings -> General -> VPN & Device Management -> CF Local Probe20260912 -> Install.
3. Settings -> General -> About -> Certificate Trust Settings -> CF Local Probe20260912
   -> enable full trust.
4. Open HTTPS check URL; confirm Secure connection verified.
5. After probe remove CF Local Probe20260912 via VPN & Device Management -> Remove Profile.
Actual displayed name has spaces: **CF Local Probe 20260912**.
Apple: https://support.apple.com/en-gb/102390 and
https://support.apple.com/en-ie/102400.

No phone installation/trust claimed yet. Nick has the links and instructions; confirmation
pending. Bootstrap server shell session76799 stays running for these steps. Keys live only
in /private/tmp/cf-iphone-trusted-tls-20260912; future run-iphone-kit-probe uses server-key.pem
and server.pem from there, not the rejected self-signed leaf directory. Native probe remains
same accepted embedding/recipe/three sessions. No model run during setup. No kit/GitHub edits.

Update: after Nick initially saw connection-not-private, the setup server received a second
profile download (first was Mac verification), then an iPhone Safari report with
secureContext true, crossOriginIsolated true, WebGPU API available. Trust setup now works;
no model was run on the check page. Certificate bootstrap/check server closed and final
setup-server-status.json retained. Proceed to the physical three-session probe with the
new trusted server certificate and unchanged accepted embedding/recipe. Removal remains
required after probe completion.
