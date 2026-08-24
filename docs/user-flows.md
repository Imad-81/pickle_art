# User Flows

Based on the IA: Home/Feed → Discover / Create / Project Card / Profile, with Crits, Feedback Notes, Channels, and Supporting Systems underneath.

---

## Flow 1 — Viewing Someone's Project (Discovery → Appreciation)

**Goal:** Let a visitor experience the *process*, not just the final shot, and give them a low-friction way to respond to it.

```
Home/Feed or Discover Page
        │
        ▼
Browse cards (cover + title + creator + tags + stats)
        │
        ▼
Tap into Project Card → Overview
   • Cover, description, goals
   • Tags / tools / discipline
   • Stats: views, likes, crits, bookmarks
   • Follow creator / Save / Share
        │
        ▼
Stage 1: Foundation (Board)
   • Scroll the research canvas — references, sketches,
     notes, sections/frames
   • This is the "why" before the "what"
        │
        ▼
Stage 2: Development (Sub-cards / Posts)
   • Step through experiments/iterations as posts
   • See media + process notes per experiment
   • Vote on an open Poll/Decision, if any
        │
        ▼
Output: Final
   • Final presentation (image/video/prototype/file)
   • Project summary + behind-the-scenes
        │
        ▼
Crits (Comments)
   • Add a crit, reply in-thread, react, pin
   • Save a crit to own Feedback Notes for later
        │
        ├──▶ Visit creator's Profile (portfolio, process highlights, growth trail) → Follow
        └──▶ Jump into related Channel to see more work in that discipline
        │
        ▼
Back to Discover / Feed (loop continues)
```

**Key UX decisions this flow depends on:**
- Overview is the "front door" — polish still gets a first look, but Stage 1/2 are one tap away, not buried.
- Crits are anchored to *stages*, not just the final output — so feedback can target the thinking, not only the result.
- "Save to Feedback Notes" lets a viewer learn from someone else's process, not just bookmark the project.

---

## Flow 2 — Creating / Editing Your Own Project

**Goal:** Make documenting process as easy as posting a final image, with structure that builds a portfolio automatically.

```
Home/Feed → tap Create
        │
        ▼
Start a New Project
   • Title & Description
   • Privacy: Public / Unlisted / Private
   • Tags / Interests / Tools / Discipline
        │
        ▼
Project Created → empty Project Card (lands on Overview)
   • Upload cover, confirm description/goals/tags
        │
        ▼
Stage 1: Foundation (Board)
   • Open infinite canvas
   • Drop in images, text, links, audio, video, PDFs, notes, sketches
   • Organize into Sections/Frames, annotate
   • Version history auto-tracked
        │
        ▼
Stage 2: Development (Board + Sub-cards)
   • Create a sub-card ("Post") per experiment/idea/mockup/test
   • Add media + process notes to each
   • Optionally open a Poll/Decision for community input
   • Link back to relevant Stage 1 items
        │
        ▼
Output: Final  ⚠ gated — unlocks once Stage 1 & 2 have content
   (exception: pure-photography projects can export directly)
   • Upload final presentation (image/video/prototype/file)
   • Write project summary + behind-the-scenes
   • Attach final files
        │
        ▼
Publish / Update → pushes to Feed, Discover, followers, relevant Channels
        │
        ▼
Post-publish loop:
   • Watch Crits roll in → reply, pin, save useful ones to Feedback Notes
   • Track Stats (views/likes/crits/bookmarks)
   • Re-open any stage anytime to keep building — Output stays re-publishable
```

**Key UX decisions this flow depends on:**
- The Output-gating rule (must populate Stage 1 & 2 first) is what actually enforces "process over polish" — it's a structural nudge, not just a guideline.
- Editing is non-linear: a creator can return to Stage 1 to add new research months later without disturbing Stage 2/Output.
- Publish ≠ done — Version History and "Update" keep the project alive as a living document rather than a one-time post.

---

### Where the two flows intersect
Both converge on the **Project Card** and **Crits** — the viewer's engagement (a crit, a save, a follow) is exactly what feeds the creator's post-publish loop. That shared surface is what makes the platform feel like a conversation about craft rather than a one-way gallery.
