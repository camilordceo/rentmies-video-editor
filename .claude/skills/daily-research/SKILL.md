# Daily Research — YouTube Content Brain

## Purpose
Automate daily content research using YouTube transcript analysis, trend detection, and AI-powered ideation. This is the "Content Brain" of ContentOS.

---

## SETUP

### YouTube Transcript MCP
Install (if not already):
```bash
claude mcp add --scope user youtube-transcript \
  npx @fabriqa.ai/youtube-transcript-mcp@latest
```

This enables fetching transcripts from YouTube videos for analysis.

---

## DAILY WORKFLOW

When the user says "daily content", "content ideas", "what should I film", or similar:

### 1. SEARCH PHASE

Search YouTube for transcripts from these sources:

**Primary Channels (competitors/inspiration):**
- chase.h.ai — Claude Code content, AI workflows
- Alex Hormozi clips — Business frameworks, value propositions
- Matt Gray — Content systems, one-person business
- Fireship — Tech tutorials, fast-paced format

**Search Queries (rotate daily):**
- "Claude Code tutorial 2026"
- "AI content creation workflow"
- "Remotion video editing"
- "content automation AI"
- "one person content team AI"
- "Samsung video quality improve"

### 2. ANALYSIS PHASE

From the transcripts and search results, extract:

**Trending Topics:**
- What subjects appear in 3+ recent videos?
- What keywords are being repeated?
- What problems are creators talking about?

**Gap Analysis:**
- What questions appear in comments that nobody answered well?
- What angle is everyone missing?
- What can we show BUILT (not just discussed)?

**Hook Mining:**
- What opening lines got the most engagement?
- What thumbnail patterns are working?
- What contrarian takes are generating discussion?

### 3. IDEATION PHASE

Generate exactly 3 content ideas. Each must include:

```json
{
  "hook": "Max 12-word hook text",
  "hook_type": "stat|story|contrarian|list|question|transformation",
  "angle": "What makes this different from existing content",
  "composition": "skill-breakdown|talking-head|hook-card",
  "format": "short|long",
  "broll_needed": [
    "Screenshot of Claude Code doing X",
    "Screen recording of the workflow",
    "Result dashboard screenshot"
  ],
  "script_outline": [
    "Hook: [the hook]",
    "Problem: [what most people get wrong]",
    "Solution: [the actual value/tutorial]",
    "Proof: [show the result]",
    "CTA: [what to do next]"
  ],
  "estimated_duration_seconds": 180,
  "score": 8,
  "reasoning": "Why this will perform well right now"
}
```

### 4. PRESENTATION PHASE

Show the ideas to the user in a clear format:

```
=== IDEA 1 (Score: 9/10) ===
Hook: "Samsung → iPhone quality con 1 linea de CSS"
Type: Transformation | Composition: Skill Breakdown
Angle: Nobody has shown the CSS filter trick for video grading

Script Outline:
1. Hook: Show before/after of Samsung vs graded footage
2. Problem: "Everyone thinks you need an iPhone for good video"
3. Solution: Walk through the CSS filters + Remotion integration
4. Proof: Side-by-side comparison render
5. CTA: "Comment your Samsung model, I'll show the settings"

B-Roll Needed:
- Before/after comparison screenshot
- CSS code in editor
- Final rendered video clip

[APPROVE] [REJECT] [EDIT]
```

### 5. SAVE PHASE

After user review:
- **Approved ideas** → Save to `content_ideas` table with status "approved"
- **Rejected ideas** → Save with status "rejected"  
- **Edited ideas** → Apply edits, save with status "approved"

API call to save:
```
POST /api/ideas
{
  "hook_text": "...",
  "hook_type": "...",
  "angle": "...",
  "composition_suggestion": "skill-breakdown",
  "youtube_references": ["https://youtube.com/..."],
  "score": 8,
  "notes": "Script outline and b-roll list here"
}
```

---

## REFERENCE CHANNELS DATABASE

| Channel | Focus | What to Learn |
|---------|-------|---------------|
| chase.h.ai | Claude Code, AI dev | Format, composition style, hooks |
| Hormozi | Business, value | Hook frameworks, value stacking |
| Matt Gray | Content systems | Systems thinking, batch production |
| Fireship | Tech tutorials | Pacing, information density |
| Ali Abdaal | Productivity | Thumbnail strategy, retention |

---

## CONTENT SCORING RUBRIC

Score each idea 1-10 using these weights:

| Factor | Weight | Description |
|--------|--------|-------------|
| Uniqueness | 25% | Has anyone done this exact angle? |
| Timeliness | 20% | Is this relevant RIGHT NOW? |
| Producibility | 20% | Can I film this today with available tools? |
| ICP Relevance | 20% | Does our target audience (LatAm creators) care? |
| Virality Potential | 15% | Does the hook create a strong curiosity gap? |

**Score 8+:** Film immediately
**Score 6-7:** Add to backlog, produce this week
**Score 4-5:** Save for later, needs better angle
**Score 1-3:** Reject, not worth producing
