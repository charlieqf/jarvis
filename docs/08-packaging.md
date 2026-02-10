# Packaging (Windows)

## Goals

- One installer for Windows 10/11
- Desktop app auto-start optional
- Sidecars are bundled and launched automatically

## Components to ship

1. JARVIS Desktop (Tauri v2)
2. OpenCode binary (or packaged install) used as a sidecar server
3. General agent service (Python)

## OpenCode sidecar packaging

Options:

- Bundle a known OpenCode release binary and execute `opencode serve`
- Or vendor OpenCode as a build artifact (more complex)

MVP recommendation: bundle a pinned OpenCode release binary.

## Python service packaging

Options:

- Bundle embedded Python + wheels
- Package to an exe using PyInstaller/Nuitka

MVP recommendation: create a single exe for the general agent service to reduce "Python env" issues.

## Updates

MVP: manual update by installing a new version.
Future: auto-updater (Tauri supports update flows).
