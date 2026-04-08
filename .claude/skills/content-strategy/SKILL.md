# Content Strategy — Daily Ideation System

## Purpose
Generate daily content ideas based on YouTube trends, competitor analysis, and the creator's unique angle (building with Claude Code + AI tools for Latin American creators).

---

## ICP (Ideal Customer Profile)

- **Who:** Content creators in Latin America (primarily Spanish-speaking)
- **Pain:** Want to use AI for content creation but don't know where to start
- **Level:** Intermediate—they know YouTube, they know editing basics, but AI automation is new
- **Desire:** Produce more content, faster, with professional quality, without hiring a team
- **Language:** Bilingual content (Spanish primary, English secondary for reach)

---

## CONTENT PILLARS

### Pillar 1: BUILD IN PUBLIC
- Show what you're building with Claude Code
- Screen recordings of the actual development process
- "I built X in Y hours" format
- Composition: Skill Breakdown or Talking Head

### Pillar 2: TOOL REVIEWS & TUTORIALS
- Compare AI tools (Claude Code vs Cursor vs Copilot)
- Tutorial: "Como usar Remotion para crear videos"
- Workflow breakdowns with actual screenshots
- Composition: Talking Head + B-roll

### Pillar 3: INDUSTRY INSIGHTS
- What's changing in AI content creation
- Predictions and contrarian takes
- "The future of X" with data backing
- Composition: Hook Card → Talking Head

### Pillar 4: QUICK WINS
- 60-second tips that solve one problem
- "Did you know Claude Code can..." format
- Shorts-first, repurpose to long-form
- Composition: Hook Card or Skill Breakdown (short version)

---

## DAILY CONTENT RECOMMENDATION FORMULA

When asked for "daily content," follow this process:

### Step 1: RESEARCH (via YouTube MCP if available)
- Search transcripts from reference channels:
  - chase.h.ai (Claude Code + AI content creation)
  - Hormozi clips (business/value frameworks)
  - Matt Gray (content systems, one-person business)
- Search terms: "Claude Code tutorial 2026", "AI content creation", "Remotion video", "content automation"
- Identify: What topics are getting engagement THIS WEEK?

### Step 2: ANGLE ANALYSIS
For each trending topic, answer:
- What angle has NOBODY taken yet?
- What can I show that I actually BUILT (not just talked about)?
- What's the contrarian take?
- How does this connect to the Rentmies ContentOS narrative?

### Step 3: GENERATE 3 IDEAS
Each idea must include:
```json
{
  "hook": "The video hook text (max 12 words)",
  "hook_type": "stat|story|contrarian|list|question|transformation",
  "angle": "What makes this unique vs what's already out there",
  "composition": "skill-breakdown|talking-head|hook-card",
  "broll_needed": ["List of screenshots/assets needed"],
  "script_outline": [
    "Point 1: ...",
    "Point 2: ...",
    "Point 3: ..."
  ],
  "score": 8
}
```

### Step 4: RANK & RECOMMEND
- Score each idea 1-10 based on: uniqueness, timeliness, producibility, ICP relevance
- Present top 3 to user with reasoning
- User can: approve, reject, edit, or request more ideas

### Step 5: SAVE TO DATABASE
- Approved ideas → `content_ideas` table with status "approved"
- Rejected ideas → status "rejected" (kept for pattern analysis)
- Produced ideas → status "produced" (linked to video record)

---

## CONTENT CALENDAR RULES

- **Monday:** Build-in-public (show weekend progress)
- **Tuesday:** Tutorial/How-to
- **Wednesday:** Industry insight or contrarian take  
- **Thursday:** Quick win / Short
- **Friday:** Tool review or comparison
- **Weekend:** Film and batch produce

## SCRIPT STRUCTURE (for any format)

1. **Hook (0-3s):** The hook from hook-engineering skill
2. **Problem (3-15s):** "Here's what most people do wrong..."
3. **Solution (15s-80%):** The actual value/tutorial/insight
4. **Proof (80-90%):** Show the result, the data, the output
5. **CTA (90-100%):** Subscribe, comment with their use case, link in bio
