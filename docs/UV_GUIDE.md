# uv: Install and usage guide

[uv](https://docs.astral.sh/uv/) is a fast Python package and project manager from Astral (Rust). It replaces pip, virtualenv, and pipx for many workflows. This guide covers installation and daily use, including the tech-advisor backend.

**Official docs:** [Installation](https://docs.astral.sh/uv/getting-started/installation/) · [First steps](https://docs.astral.sh/uv/getting-started/first-steps/) · [Projects](https://docs.astral.sh/uv/guides/projects/)

---

## 1. Installation

### Option A: Standalone installer (recommended)

**macOS / Linux:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

If you don’t have `curl`:

```bash
wget -qO- https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

After install, restart your terminal or run `source ~/.bashrc` (or your shell’s config). The binary is usually at `~/.local/bin/uv`.

### Option B: Package managers

| Platform   | Command              |
|-----------|------------------------|
| Homebrew  | `brew install uv`      |
| PyPI      | `pipx install uv` or `pip install uv` |
| WinGet    | `winget install --id=astral-sh.uv -e` |
| Scoop     | `scoop install main/uv` |

### Verify

```bash
uv --version
```

---

## 2. Upgrading uv

If you used the standalone installer:

```bash
uv self update
```

With pip: `pip install --upgrade uv` (or pipx).

---

## 3. Daily usage

### Project with `pyproject.toml`

If your project (or a subfolder like `server/`) has a `pyproject.toml`:

| Task | Command | Notes |
|------|--------|--------|
| Install deps (and create/update lockfile) | `uv sync` | From project root. For a subfolder: `uv sync --project server` |
| Run a command in project env | `uv run python script.py` | Syncs if needed, then runs. For subfolder: `uv run --project server ...` |
| Run a module | `uv run -m uvicorn server.main:app` | Same as above; use `--project server` if `server` has the `pyproject.toml` |
| Update lockfile only | `uv lock` | Resolve deps and write `uv.lock` |
| Add a dependency | `uv add <package>` | Adds to `pyproject.toml` and lockfile |

### Create a new project

```bash
mkdir myapp && cd myapp
uv init
uv add fastapi uvicorn
uv run python -c "import fastapi; print('ok')"
```

### Run tools without a project (like pipx)

```bash
uv tool install ruff
uvx ruff check .
```

`uvx` runs a tool in an ephemeral env; `uv tool install` installs it globally.

### Python version

```bash
uv python list
uv python install 3.12
```

uv can install and use specific Python versions on demand.

---

## 4. Using uv with the tech-advisor backend

From the **repo root** (e.g. `tech-advisor/`):

1. **One-time setup**

   ```bash
   cp server/.env.example server/.env
   # Edit server/.env and set ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Install dependencies**

   If `server/pyproject.toml` exists:

   ```bash
   uv sync --project server
   ```

   This creates/updates `server/uv.lock` and installs into the project environment.

3. **Run the FastAPI app**

   ```bash
   uv run --project server uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
   ```

   uv uses the `server` project’s env; no need to activate a venv or use `pip install -r requirements.txt`.

**If you only have `server/requirements.txt`** (no `pyproject.toml`), you can still use pip:

```bash
pip install -r server/requirements.txt
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

To adopt uv fully, add a `server/pyproject.toml` and then use `uv sync --project server` and `uv run --project server ...` as above.

---

## 5. Useful options

- **Strict lockfile:** `uv sync --locked` — fail if lockfile is out of date.
- **No sync before run:** `uv run --no-sync ...` — run without ensuring env is synced.
- **Include extras:** `uv sync --all-extras` — install optional dependency groups.

---

## 6. Shell completion (optional)

**Bash:** `echo 'eval "$(uv generate-shell-completion bash)"' >> ~/.bashrc`  
**Zsh:**  `echo 'eval "$(uv generate-shell-completion zsh)"' >> ~/.zshrc`

Then restart the shell or `source` your config.

---

## Quick reference

| Goal | Command |
|------|--------|
| Install uv | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Upgrade uv | `uv self update` |
| Sync project deps | `uv sync` or `uv sync --project server` |
| Run in project | `uv run python app.py` or `uv run --project server uvicorn server.main:app ...` |
| Add package | `uv add <pkg>` |
| Lock only | `uv lock` |
| Run CLI tool once | `uvx <tool>` |
