# MSA Paper Animation Videos

Animated illustrations for the MSA (Multi-Scale Attention) paper, built with [Remotion](https://remotion.dev) — a React framework for creating videos programmatically.

## Prerequisites

- Node.js (v18+)
- Chrome/Chromium (used headlessly by Remotion for rendering)

## Setup

```bash
# Install dependencies
npm install

# Install Remotion agent skills for Claude Code
mkdir -p .claude/skills
git clone --depth 1 https://github.com/remotion-dev/skills.git /tmp/remotion-skills
cp -r /tmp/remotion-skills/skills/remotion .claude/skills/remotion
```

The `.mcp.json` in the project root configures the official Remotion MCP server for Claude Code. It will be loaded automatically when Claude Code starts in this directory.

## Claude Code Setup

This project is designed to be developed with [Claude Code](https://claude.ai/claude-code). The following tools enhance the workflow:

### Remotion MCP Server (`@remotion/mcp`)

Already configured in `.mcp.json`. Gives Claude Code access to up-to-date Remotion documentation and API references. No action needed — it loads automatically.

### Remotion Agent Skills

Best-practice guides installed at `.claude/skills/remotion/rules/`. These teach Claude Code Remotion conventions for animations, timing, transitions, audio, captions, and more. Already included in the repo.

### Context7 MCP (optional)

General-purpose library documentation lookup. If you have the Context7 plugin installed in Claude Code, it can fetch docs for any library on demand.

## Usage

### Preview in browser

```bash
npm run preview
```

Opens Remotion Studio at `http://localhost:3000` with a timeline, props editor, and composition selector.

### Render a specific composition to MP4

```bash
npx remotion render src/index.ts <CompositionId> out/<filename>.mp4
```

Example:
```bash
npx remotion render src/index.ts GlobalMemoryEncoding out/GlobalMemoryEncoding.mp4
```

### Render as GIF

```bash
npx remotion render src/index.ts <CompositionId> out/<filename>.gif --codec gif
```

## Compositions

All compositions are 1920x1080 at 30fps.

| ID | File | Duration | Description |
|---|---|---|---|
| `GlobalMemoryEncoding` | `GlobalMemoryEncoding.tsx` | 24s | Scene 1: Offline encoding pipeline — document representation, forward pass with backbone + Router K Projector, fixed-length chunking (L=64), mean pooling compression, memory footprint reduction, caching to memory bank |
| `TieredKVStore` | `TieredKVStore.tsx` | 18s | Scene 2: Hardware bottleneck (169GB vs 160GB), key insight (routing vs content separation), tiered GPU/CPU storage with animated matrix distribution |
| `SparseAttentionRouting` | `SparseAttentionRouting.tsx` | 27s | Scene 3: Routing query generation, Q^R broadcast to GPUs, hierarchical scoring pipeline (avg heads, max pool tokens, max chunks), global top-k selection, CPU context fetch |
| `ContextAssembly` | `ContextAssembly.tsx` | 22s | Scene 4: Async CPU→GPU fetch of top-k content KVs, concatenation into sparse context, autoregressive generation with attention visualization |
| `DocumentRoPE` | `DocumentRoPE.tsx` | 22s | Scene 5: Positional shift problem with standard RoPE, document-wise independent position IDs, global RoPE offset for active query |
| `ProductDemo` | `ProductDemo.tsx` | 10s | Sample product demo (template/reference) |

## Project Structure

```
video/
  src/
    index.ts                    # Entry point (registers root)
    Root.tsx                    # Composition registry
    GlobalMemoryEncoding.tsx    # Scene 1
    TieredKVStore.tsx           # Scene 2
    SparseAttentionRouting.tsx  # Scene 3
    ContextAssembly.tsx         # Scene 4
    DocumentRoPE.tsx            # Scene 5
    ProductDemo.tsx             # Sample template
  .claude/
    skills/remotion/            # Remotion best-practice skills for Claude Code
  .mcp.json                    # MCP server config (Remotion docs)
  REFERENCE.md                 # Remotion ecosystem reference catalog
  tsconfig.json
  package.json
```

## Design Conventions

- **Dark theme**: Background `#0f1117`, light text on dark
- **Color coding**: Keys (blue `#3b82f6`), Values (green `#10b981`), Routing (amber `#f59e0b`), Query (pink `#ec4899`), Accent (indigo `#6366f1`)
- **Math rendering**: CSS-based — `text-decoration: overline` for bar notation, `<Sup>`/`<Sub>` components, Times New Roman for math italic. No LaTeX/MathJax.
- **Animations**: All driven by `useCurrentFrame()` + `interpolate()` / `spring()`. CSS animations are forbidden in Remotion.
- **Layout**: Persistent title + step label that crossfades between phases. Content shifts vertically when more space is needed.

## Adding New Scenes

1. Create `src/YourScene.tsx` with a React component
2. Register it in `src/Root.tsx` as a `<Composition>`
3. Run `npm run preview` to see it in the studio
4. Render with `npx remotion render src/index.ts YourScene out/YourScene.mp4`

When working with Claude Code, describe the scene content and timeline. Claude will use the Remotion skills and MCP docs to generate the animation code following the project's conventions.
