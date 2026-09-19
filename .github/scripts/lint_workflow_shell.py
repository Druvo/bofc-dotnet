#!/usr/bin/env python3
"""Syntax-check the shell in every workflow `run:` block.

deploy.yml only ever runs on master, so a shell mistake in it stays invisible until it is already
merged and a production deploy is failing. Twice that mistake has been the same one: a double
quote inside a comment on the *remote* side of `ssh vps "..."`. Everything between those quotes is
one argument assembled by the local shell first, so a bare quote closes it early and bash reports

    syntax error: unexpected end of file

with no filename and no useful line number. Parsing each block here moves that discovery onto the
pull request, which is the last point at which it is cheap.

This is a parse, not an execution: `bash -n` reads the script and checks its grammar without
running a single command, so it is safe to point at deploy steps that would otherwise touch
production.
"""

import glob
import os
import re
import subprocess
import sys
import tempfile

RUN_BLOCK = re.compile(r"^(\s*)run: \|\s*$")
STEP_NAME = re.compile(r"\s*- name: (.+)")
# ${{ ... }} is substituted by the runner before bash ever sees it. Standing in a literal keeps
# the parse honest - left as-is, the braces are themselves a syntax error and every block "fails".
GHA_EXPRESSION = re.compile(r"\$\{\{[^}]*\}\}")


def iter_run_blocks(path):
    """Yield (step name, script) for each `run: |` block in a workflow file."""
    lines = open(path, encoding="utf-8").read().splitlines()
    i = 0
    while i < len(lines):
        match = RUN_BLOCK.match(lines[i])
        if not match:
            i += 1
            continue

        indent = len(match.group(1)) + 2
        name = "unnamed step"
        for j in range(i, max(-1, i - 6), -1):
            named = STEP_NAME.match(lines[j])
            if named:
                name = named.group(1)
                break

        body = []
        i += 1
        while i < len(lines) and (
            not lines[i].strip() or len(lines[i]) - len(lines[i].lstrip()) >= indent
        ):
            body.append(lines[i][indent:] if lines[i].strip() else "")
            i += 1

        yield name, GHA_EXPRESSION.sub("X", "\n".join(body))


def check(script):
    """Return bash's complaint, or None if the script parses."""
    handle, tmp = tempfile.mkstemp(suffix=".sh")
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as f:
            f.write(script + "\n")
        result = subprocess.run(["bash", "-n", tmp], capture_output=True, text=True)
        return None if result.returncode == 0 else result.stderr.replace(tmp, "<step>").strip()
    finally:
        os.unlink(tmp)


def main():
    failures = 0
    checked = 0
    for path in sorted(glob.glob(".github/workflows/*.yml")):
        for name, script in iter_run_blocks(path):
            checked += 1
            complaint = check(script)
            if complaint:
                failures += 1
                print(f"FAIL  {path}  ::  {name}")
                print("      " + complaint.replace("\n", "\n      "))

    print(f"{checked} run block(s) checked, {failures} with shell syntax errors")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
