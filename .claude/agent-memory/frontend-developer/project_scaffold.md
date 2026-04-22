---
name: Angular project scaffold quirk
description: npx @angular/cli new with absolute --directory path creates a nested mirrored directory; must move files after scaffold
type: feedback
---

When running `npx @angular/cli@19 new <name> --directory /absolute/path`, the CLI treats the path as relative to cwd and creates all files inside `<cwd>/absolute/path/...` (a mirrored nested structure). 

**Why:** The CLI interprets --directory as a relative path regardless of leading slash.

**How to apply:** After scaffold, move all generated files (src, node_modules, angular.json, package.json, tsconfig files, etc.) from the nested path up to the correct root using `mv`. Then remove the empty nested directory structure.
