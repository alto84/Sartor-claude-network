# Install Guide

Step-by-step setup for the Safety Research Wiki bundle. Assumes you have Python 3.10+ and basic shell access.

## 1. Unpack

Copy the bundle to a writable directory. Recommended locations:

- Windows: `C:\wiki\` or `%USERPROFILE%\Documents\wiki\`
- Linux/Mac: `~/wiki/` or `~/research/wiki/`

Avoid OneDrive-synced or Dropbox-synced paths for the primary working directory — the wiki generates index files that change frequently, and cloud sync will thrash. If you want backup, point git at the folder instead.

## 2. Verify Python

```bash
python --version
```

Need 3.10 or higher. If you see 3.9 or earlier, upgrade before continuing. On locked-down enterprise machines where you can't install Python system-wide, use a portable Python or a conda environment.

## 3. Run the install script

### Windows (PowerShell)

```powershell
cd C:\wiki
.\scripts\install.ps1
```

### Linux/Mac (bash)

```bash
cd ~/wiki
bash scripts/install.sh
```

The script creates the `state/` directory, runs `wiki.py --selftest`, and prints what's working.

## 4. Selftest

Run by hand if the script didn't:

```bash
python wiki.py --selftest
```

Expected output:

```
== wiki.py selftest ==
  [PASS] parse_all returned a list -- N files
  [PASS] backlinks() handles missing file -- []
  [PASS] tags() returns dict -- N tags
  [PASS] article_view has all keys
  [PASS] broken_links returns list
  [PASS] orphans returns list
  [PASS] health_summary has total_files

7 passed, 0 failed
```

If any check fails, the script will tell you which one. Most failures are path issues (run from the bundle root, not a subdirectory).

## 5. Create your first real page

Copy a template:

```bash
cp templates/mechanism.md.tmpl hepatotoxicity-DILI.md
```

Open it in your editor, replace all `<FILL>` placeholders with real content about a mechanism you know cold. Include at least one `[[wikilink]]` to a drug or AE you plan to document later (the wikilink can target a file that doesn't exist yet — that's a "forward reference" and will show up in broken-links.json until you create the target).

Then reindex:

```bash
python wiki.py --reindex
```

You should see the file counted in `files_indexed`, and if you added wikilinks, they'll show up in `backlinks_total`.

## 6. Create a drug page that references the mechanism

```bash
cp templates/drug.md.tmpl tisagenlecleucel.md
```

Fill in the placeholders. In the Mechanism section, add `[[hepatotoxicity-DILI]]`. Reindex again. Now check the backlinks:

```bash
python wiki.py --backlinks hepatotoxicity-DILI
```

You should see `tisagenlecleucel.md` listed. Your wiki has its first real cross-reference.

## 7. (Optional) Open in Obsidian

Obsidian reads the same folder without modification. Point Obsidian at the wiki directory as a vault and:

- Graph view renders your wikilinks
- Backlinks panel matches what `wiki.py --backlinks` returns
- Tags panel shows hierarchical tags
- YAML frontmatter shows in Properties sidebar

Nothing Obsidian does will break the wiki.py workflow. They coexist.

## 8. (Optional) Wire up git for provenance

```bash
cd <wiki-dir>
git init
git add .
git commit -m "Initial wiki seed"
```

`wiki.py --article <file>` will then show recent git activity and the last commit in the article view.

## 9. (Optional) Set up nightly reindex

If your environment allows scheduled tasks, add a daily cron/scheduled task entry that runs:

```bash
cd /path/to/wiki && python wiki.py --reindex
```

See `scheduled-tasks/wiki-reindex/SKILL.md` for the full Hermes-pattern scheduled task definition if you're running in an agent-orchestrated setup.

## 10. (Optional) Add semantic similarity

If you want "related articles" based on embeddings (not just wikilinks), you need an embeddings module. The wiki layer calls `SemanticSearch` from a module named `embeddings.py` if it exists. Write that yourself using whatever embedding provider you have access to (sentence-transformers offline, a corporate embedding API, etc.). See `docs/ARCHITECTURE.md` § Extension points.

**Without this step, everything still works except the `similar()` query.**

## Ingesting content from Gmail and Google Drive

The wiki works on markdown files in a folder. To bring in content from Gmail, Google Drive, or other sources, see `docs/INGEST.md` for the documented ingest workflows. Short version:

- **Gmail**: use the Gmail MCP in your agent environment (claude.ai has one built-in; alternatively install a self-hosted MCP server). The agent reads the thread, extracts the relevant facts, writes a new page or updates an existing one, and appends a log entry.
- **Google Drive**: as of 2026-04, the Anthropic-official `@modelcontextprotocol/server-gdrive` is archived. The actively maintained successor is `@isaacphi/mcp-gdrive` — supports Drive readonly + Sheets read/write + Docs. Set up an OAuth desktop app in Google Cloud Console, add the MCP server to your client config, then use the same ingest workflow: agent reads the doc, extracts facts, updates wiki pages.

Neither requires modifying `wiki.py`. The ingest is an LLM agent behavior, not a code change.

## Troubleshooting

**`python wiki.py --selftest` says "No files found"**: you're running from the wrong directory. `cd` into the bundle root.

**Unicode errors on Windows console**: the script tries to wrap stdout/stderr in UTF-8, but some Windows terminals fight it. Try `chcp 65001` before running.

**"rank_bm25 module not found"**: only needed if you want BM25 search. The core wiki layer doesn't need it. Ignore the warning or `pip install rank-bm25`.

**Reindex is slow**: are you indexing a folder with thousands of files? Add the noisy subdirectories to the skip list: `python wiki.py --reindex --skip-dir archives --skip-dir build`.

**Obsidian graph view doesn't show a link I just added**: Obsidian caches. Reload the vault (Ctrl+P → "Reload app without saving").

**`git` provenance shows empty**: the wiki folder isn't a git repo, or git isn't in PATH. Run `git init` and try again.

## Uninstall

```bash
rm -rf wiki/
```

There's no registry, no daemon, no services. The entire system is a folder of markdown files and one Python script.

## Support

Read the skill files. Everything is documented inline. If something isn't covered, the pattern is deliberately simple — read `wiki.py`, it's one file.
