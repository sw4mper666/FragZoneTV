# FZTV Anti-Cheat 1.0

**Windows 10/11 — Counter-Strike 2**

This is the first **client-presence monitor**, not a cheat-detection engine. It links the Windows client to an existing FragZoneTV Supabase Auth account, reports client status every 20 seconds, and reports whether the CS2 process is running. An administrator can view the last heartbeat in the FragZoneTV admin panel. The client is marked offline if the last heartbeat is older than 90 seconds.

## Build and download

The GitHub Actions workflow `Build FZTV Anti-Cheat 1.0 for Windows` builds `FZTV-AntiCheat-1.0.exe`. Download it from the workflow run's **Artifacts** section. This is currently an unsigned developer build; Windows SmartScreen may warn.

To run from source on Windows:

```powershell
py -m pip install psutil==6.1.1
py anticheat/client.py
```

## Use

Open the application, sign in with the same email and password as on fztv.fun, then click **Запустить клиент**. The client does not save the password to a file; tokens are kept in process memory only. Press **Остановить клиент** to stop reporting. Closing the app also stops the client; the admin panel marks it offline once heartbeat expires.

## Security and privacy

- The app enumerates process names to check for `cs2.exe`. It does not read personal files, capture screenshots or inject into CS2.
- Auth uses existing Supabase Auth tokens and per-user row-level security.
- Status reports can be emulated by modified clients; they are **not tamper-proof**.
- This is not suitable as proof of fair play or grounds for automatic bans.
- Do not distribute as a fully functional cheat detection tool until additional engine, signed builds and security review are complete.
