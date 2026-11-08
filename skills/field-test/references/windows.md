# Windows builds

## Windows build under Wine

Wine (`/usr/bin/wine`, 11.20 Staging on 2026-10-19; there is no `wine64` binary) runs a Windows Go build on this machine. Reach for it only when the diff touches Windows behaviour: code behind `runtime.GOOS == "windows"`, a `_windows.go` file or `//go:build windows` tag, or path handling with drive letters and backslashes. Any other change runs on the plain Linux rig, where the result is the same and the setup is cheaper.

```bash
GOOS=windows GOARCH=amd64 go build -o qui.exe ./cmd/qui
WINEDEBUG=-all WINEPREFIX=<scratchpad>/wineprefix wine qui.exe serve --config-dir 'Z:\<scratchpad>\cfg' ...
```

To run the unit tests of one package under Wine, build the test binary with `GOOS=windows CGO_ENABLED=0 go test -c -o pkg.test.exe ./internal/<pkg>`. Run it from the package directory, so that `testdata/` resolves: `cd internal/<pkg> && wine ../../pkg.test.exe -test.v`. The binary accepts only the `-test.*` form of the flags. This finds tests that break only on Windows, for example `filepath.Join(string(filepath.Separator), ...)`, which is not an absolute path on Windows.

- Give each run its own `WINEPREFIX` in the scratchpad. The first run creates it, which takes a few seconds. Delete the directory at cleanup.
- `WINEDEBUG=-all` removes the `fixme:` noise, so the log shows only the program output.
- Inside Wine, the Linux root is drive `Z:`. `%APPDATA%` is `C:\users\<user>\AppData\Roaming` under the prefix, so a default config dir lands in the prefix, not in `~/.config`.
- Wine uses the host network stack, so `127.0.0.1` inside Wine is the Linux loopback. On 2026-10-07 only an in-process round trip was proven (the Windows binary served and fetched its own listener). Before a test relies on Linux curl reaching the binary, or the binary reaching a Linux stub, send one request each way.
- Kill with `pkill -f "[q]ui.exe serve"`, then `wineserver -k` with the same `WINEPREFIX`, so no `wineserver` stays behind.

Wine is not Windows. File locking, sharing modes, case-insensitive paths on a Linux file system, services, and installers behave differently. A green run under Wine proves the Windows code path compiles, starts, and does the right thing for the observable; it does not prove one of those behaviours. Report the mode as "Wine", and name what needs a real Windows host.

## Windows 11 VM

Use the VM when Wine is not enough, for example for self-update or file locks. The user starts it with `omarchy-windows-vm launch`. The container is `omarchy-windows`, the compose file is `/var/lib/omarchy/windows/docker-compose.yml`, and the Windows password is in `~/.config/windows/credentials`. Do not print it.

- Cross-build into `~/Windows/qui-test/`. Inside the VM this is `\\host.lan\Data`. The user copies the files to `C:\qui` and runs qui from there. Delete `~/Windows/qui-test` afterwards.
- qui in the VM binds `127.0.0.1:7476`. Only the VM browser and PowerShell scripts in the VM reach it, so the user drives the UI.
- A fake release version in `-ldflags "-X github.com/autobrr/qui/internal/buildinfo.Version=<old version>"` makes the real signed release the update target.
- CI has a Windows compile gate (`lint.yml`, on windows-2025): `go vet ./...` on every PR, and `go test ./...` when the PR touches `cmd`, `internal`, `pkg`, or `go.mod`. To run a test in the VM, `GOOS=windows go test -c` builds a test exe. In PowerShell, quote the flags: `"-test.run=Name" "-test.v"`.
- In PowerShell, use `cmd /c move /Y`, because `Move-Item` rejects `/Y`. Use `[IO.File]::ReadAllText`, because `ConvertTo-Json` hangs on a `Get-Content -Raw` string in PowerShell 5.1.
- In Task Scheduler, "Run only when user is logged on" skips the password prompt and keeps the processes visible in `tasklist`.
- To block writes for an error-path test, run `icacls C:\qui /deny "${env:USERNAME}:(W)"` after qui starts. Undo it with `icacls C:\qui /remove:d $env:USERNAME`.
- On 2026-10-01 the share once served old files. If that happens again, serve the files over HTTP from a container on the docker network of the VM, and download with `$ProgressPreference='SilentlyContinue'`.
