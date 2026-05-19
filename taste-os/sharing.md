# Taste OS — The Identity Sharing System

> Sharing your inner world to one person who wanted to see it is the opposite of broadcasting to a feed that scrolls past it.

This document defines how Taste OS lets people share their Taste Genome, Mirror sentence, atmosphere, and aesthetic identity — without becoming social media in the process.

It builds on a tension the earlier documents have been honest about. In `system.md` and `mvp.md`, we permanently refused likes, followers, public feeds, share-to-social buttons. In `mvp.md` we wrote: *"Can I share my Genome on Instagram? — A screenshot is the right artifact. A share-button is not."* This document does not contradict that. It defines a different kind of sharing — the kind that happens between two people, slowly, with craft.

References: **Spotify Wrapped's annual ceremony, Apple keynotes' deliberate emotional pacing, cinematic moodboards, the tradition of correspondence — postcards, letters, leaving a note on someone's desk.**

Read alongside: `system.md`, `mvp.md`, `genome.md`, `field.md`.

---

## Table of Contents

0. [The Philosophy — Sharing Without Performance](#0-the-philosophy--sharing-without-performance)
1. [The Card System](#1-the-card-system)
2. [Shareable Identity Snapshots](#2-shareable-identity-snapshots)
3. [The Animated Export — Cinematic Films](#3-the-animated-export--cinematic-films)
4. [Profile Atmosphere Pages — The Room](#4-profile-atmosphere-pages--the-room)
5. [Visual Storytelling Layouts](#5-visual-storytelling-layouts)
6. [Emotional Copywriting System](#6-emotional-copywriting-system)
7. [Aesthetic Sharing UX — The Flow](#7-aesthetic-sharing-ux--the-flow)
8. [Private / Public Sharing Controls](#8-private--public-sharing-controls)
9. [Immersive Motion Design](#9-immersive-motion-design)
10. [What We Still Refuse](#10-what-we-still-refuse)
11. [Closing](#11-closing)

---

## 0. The Philosophy — Sharing Without Performance

Most "sharing" online is *broadcasting*: a low-effort transmission to a large, partly-imagined audience, with feedback metrics that train the sender to perform.

Taste OS's sharing is the opposite — **correspondence**: a high-effort transmission to a small, *named* audience, with no feedback metrics at all.

### Six principles

1. **You share to a person, not a platform.** Every share has a known recipient — a name, an email, a relationship — or it is a public letter at *your* address that anyone may read but no one may *react* to.
2. **The artifact, not the link.** What is shared is a self-contained card, exportable as an image or short film. There is no live URL that scrolls or refreshes. (Profile pages exist; they do not scroll.)
3. **No metrics on the shared object.** No view counts, no like buttons, no comments, no reply threads, no notifications about who saw what. The system genuinely does not know who has seen your card, because it does not track.
4. **Reciprocity, not response.** The only response to a Card is *another Card.* No emoji reacts, no "❤️", no "thanks for sharing." If someone wants to respond, they send their own piece of themselves back.
5. **Slowness is the medium.** A Card takes minutes to compose, opens like an envelope, breathes before revealing itself. We are deliberately closer to a letter than to a tweet.
6. **The card does not perform you; it represents you.** Cards do not optimize for shareability. They do not have "social-friendly" aspect ratios that promise engagement. They are first beautiful, then exportable.

### What this rules out, permanently

- A feed of any kind.
- A "for you" surface, ever.
- Trending Cards, Popular Cards, Featured Cards.
- Counts of anything (followers, views, sends, opens, anything).
- Re-share / forward buttons. (You can send your *own* card to another person, but you cannot forward someone else's.)
- Hashtags, mentions, threads, replies.
- Direct messages.
- Notifications about other users' activity.
- Algorithmic ranking of any kind.

---

## 1. The Card System

A **Card** is a beautifully composed, self-contained artifact derived from the user's Genome. There are seven Card types, each with its own composition rules.

### The seven Card types

| Card | Content | Tone | Recommended use |
|---|---|---|---|
| **Mirror Card** | The user's single italic Mirror line | Most intimate | Send to one person who matters |
| **Threshold Card** | A one-line message in the Mirror voice + the sender's atmosphere palette | Greeting | A hello, a birthday, a "thinking of you" |
| **Genome Card** | The full long-form Taste Report (9 sections) | Comprehensive | A close friend, a partner, a journal |
| **Atmosphere Card** | The 8 profilings (hour, climate, materials, light, sound floor, pace, scale, weather) | Curatorial | A new acquaintance who wants to *meet* you |
| **Current Card** | One named Current with its prose description + 3 representative pieces of evidence | Specific | Anchoring a current conversation |
| **Palette Card** | The 5 named swatches + a one-line description | Visual | A designer, an artist, a colleague |
| **Kin Card** | The 6 names of kin (artist, director, architect, composer, writer, wildcard) | Genealogical | A recommendation exchange |

### Card anatomy — universal

Every Card has the same five-part structure:

```
┌─────────────────────────────────────────────┐
│                                             │
│   [ MARK ]      ← the Sigil, ensō, top-left │
│                                             │
│                                             │
│   [ NAME ]      ← the sender's first name   │
│                   or chosen alias            │
│                                             │
│   ───────────                               │
│                                             │
│   [ CONTENT ]   ← the Card's body           │
│                   (one of the seven types)  │
│                                             │
│   ───────────                               │
│                                             │
│   [ DATE ]      ← when the Card was made    │
│   [ MOMENT ]    ← optional inscription      │
│                                             │
└─────────────────────────────────────────────┘
```

The dimensions are 5:7 portrait (the proportion of a paperback novel — never 4:5, never 9:16). Cards in landscape exist only for the Animated Export.

### Card examples — Mirror Card

```
┌─────────────────────────────────────────────┐
│  ◌                                          │
│                                             │
│  m.                                         │
│                                             │
│  ─────────                                  │
│                                             │
│                                             │
│       you don't collect beauty —            │
│       you collect evidence that the         │
│       world has been gentle to              │
│       someone, once.                        │
│                                             │
│                                             │
│  ─────────                                  │
│                                             │
│  february 14, 2026                          │
│  for j., on a tuesday                       │
│                                             │
└─────────────────────────────────────────────┘
```

The Mirror Card is the densest emotional payload in the system. It is *deliberately* the most-restricted Card to compose — no customization beyond the inscription. The Mirror line cannot be edited. (If it could be edited, it would stop being the Mirror.)

### Card examples — Palette Card

```
┌─────────────────────────────────────────────┐
│  ◌                                          │
│                                             │
│  m.                                         │
│                                             │
│  ─────────                                  │
│                                             │
│                                             │
│       ▮  ▮  ▮  ▮  ▮                         │
│                                             │
│       oak · ash · ember · fog · ink         │
│                                             │
│       the room she keeps coming back to     │
│                                             │
│                                             │
│  ─────────                                  │
│                                             │
│  february 14, 2026                          │
│                                             │
└─────────────────────────────────────────────┘
```

### Composition rules

1. **The Sigil is always present.** Top-left, in `mist` at 24% opacity. It is the only constant.
2. **The sender's name is always present.** First name only, or a chosen alias.
3. **Hairline dividers separate the regions.** No background panels, no rounded card-within-card.
4. **Maximum two accent colors per Card.** The Card pulls from the sender's palette but caps at two.
5. **No watermark.** Taste OS does not stamp the Card. The Sigil is the only signature.
6. **No "Made with Taste OS" footer.** If anything tells the recipient where this came from, it is the URL alone (when shared as a link), not the artwork.

---

## 2. Shareable Identity Snapshots

A Card lives in three formats. Each is the same content rendered for a different surface.

### Format 1 — The Live Card (web)

A web page at `taste.os/c/<token>`. The Card materializes with the Threshold beat from `system.md` §13 — black field, the Sigil breathes, then the Card writes itself onto the page over 2.4 seconds. Reduced-motion users see a 600ms fade.

The Live Card has *no* interactive chrome. No like button. No share button. The URL is the share. If the recipient wants to keep it, they bookmark or screenshot — both are equally honored.

### Format 2 — The Image (PNG)

A 2400×3360px PNG at 5:7. Rendered server-side from the same React tree as the Live Card. Optimized for sending via Messages / WhatsApp / Signal / email-attachment / printing on actual paper.

Filename convention: `m-mirror-2026-02-14.png` — the sender's name, the Card type, the date. No tracking parameters, no UTM-style identifiers.

### Format 3 — The Print Sheet (PDF)

A 4×6 inch portrait PDF, properly bled, with crop marks. The Card can be printed on a home printer or sent to a print service. The print sheet uses paper-friendly inks (no pure black; `void` becomes `ink`-equivalent) and renders text in display-optical sizes appropriate for paper.

The print sheet is a deliberate feature. People who *print* a Card and frame it or carry it in a wallet are the deepest expression of the product working.

### What's NOT a format

- A 9:16 vertical reel optimized for Stories.
- A 1:1 square optimized for Instagram grids.
- An animated GIF.
- A platform-specific embed.

We will be asked for all of these. We will continue to refuse. The Card's proportions are the Card's proportions.

---

## 3. The Animated Export — Cinematic Films

The closest thing in the system to Spotify Wrapped, but slower, smaller, and without the platform tail.

### The Film — what it is

A 24-second short film, exported as 1080×1920 MP4, that walks through the user's Genome as a cinematic sequence. Six scenes, each held for 4 seconds:

```
Scene 1 — TASTE NAME       (4s)
Scene 2 — THE MIRROR LINE  (4s)
Scene 3 — THREE CURRENTS   (4s)
Scene 4 — THE PALETTE      (4s)
Scene 5 — THE ATMOSPHERE   (4s)
Scene 6 — THE KIN          (4s)
```

Plus a 1-second opening (the Sigil) and 1-second closing (the user's first initial fading). Total: **26 seconds.**

Why 24 seconds for the body? Because that is the duration of the *Listening* gate in onboarding (`pipeline.ko.md` §5.1). The Film and the Onboarding share a temporal signature.

### The Film — what it isn't

- It is **not** a year-in-review. The user's Genome doesn't have annual cadence; it has constitutional cadence.
- It is **not** a slideshow of the user's uploaded images. We never display user-uploaded media in the export — that material is private. The Film uses only generated typography on the user's palette.
- It is **not** scored with stock royalty-free music. Three optional ambient stems exist, all commissioned (cello drone, felt piano, bowed glass). Default is **silent**.
- It is **not** branded. The Sigil opens it. Nothing else identifies Taste OS.

### Composition

```
SCENE 1 — TASTE NAME
  background: void
  text: display xl, the user's two-word Taste Name
  motion: reveal blur 1.6s; hold; exhale to next

SCENE 2 — THE MIRROR LINE
  background: void with a 2% vermilion tint
  text: display sm italic, full Mirror line
  motion: reveal blur 1.8s (slightly slower than others — this is the line)
  
SCENE 3 — THREE CURRENTS
  background: void
  text: each Current's name in display sm, stacked, slow vertical write-in
  
SCENE 4 — THE PALETTE
  background: void
  visual: 5 swatches expanding from left to right, named below in mono
  
SCENE 5 — THE ATMOSPHERE
  background: 2% sender-palette tint
  text: "16:00 · north-facing · oak, linen, brass · adagio"
  layout: text-md mono, single line, slow letter-writing animation
  
SCENE 6 — THE KIN
  background: void
  text: 6 names in display sm, appearing in pairs (3 reveals of 2)
```

### Export specifications

| Property | Value |
|---|---|
| Resolution | 1080 × 1920 (9:16) — the *only* 9:16 surface in the entire OS |
| Frame rate | 30fps |
| Duration | 26.0s |
| Codec | H.264, CRF 18 |
| File size | ~6–8 MB |
| Audio | None by default; cello drone or felt piano optional, -22 dB LUFS |
| Filename | `m-genome-film-2026-02.mp4` |

### Why 9:16, just this once

Because the Film is meant to be the artifact a user *shows* to a friend on their phone. A Card is held in correspondence; a Film is held in the hand. The vertical is for the human, not for the algorithm.

We do not optimize the Film for any platform's autoplay or for any platform's preview frame. The first frame is a black field with the Sigil. If a platform truncates the preview to that frame, the platform has chosen wrong.

---

## 4. Profile Atmosphere Pages — The Room

Every Taste OS user, by default, has **no** public page. Public pages are an explicit opt-in. When opted in, the user gets a URL: `taste.os/<handle>`.

What lives there is called **The Room.**

### The Room — what it is

A single, full-bleed page at the user's URL. Not a feed. Not a wall. Not a profile. A *room*. A visitor arrives, breathes, looks, leaves.

### Anatomy of the Room

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ◌                                                                           │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                           m.                                                 │
│                                                                              │
│                                                                              │
│                       lacquered dusk                                         │
│                                                                              │
│                                                                              │
│  ─────────────────────────────────────                                       │
│                                                                              │
│  the room she keeps coming back to:                                          │
│                                                                              │
│      16:00 · north-facing · oak, linen, brass · adagio                       │
│                                                                              │
│      ▮  ▮  ▮  ▮  ▮                                                           │
│                                                                              │
│                                                                              │
│  ─────────────────────────────────────                                       │
│                                                                              │
│                                                                              │
│         "you don't collect beauty — you collect evidence                     │
│          that the world has been gentle to someone, once."                   │
│                                                                              │
│                                                                              │
│  ─────────────────────────────────────                                       │
│                                                                              │
│                                                                              │
│  ─ leave a card ─                                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

The Room contains exactly four things:

1. The Sigil (top-left).
2. The user's first name or alias.
3. Their Taste Name in display serif.
4. A central composition: the Atmosphere line, the Palette, the Mirror line.
5. *(Optional)* A single Beacon: `─ leave a card ─`.

That is everything. There is no:

- Bio / about / description text beyond what the Genome contains.
- Activity feed.
- "Member since" date.
- Follower / following count.
- Recent saves.
- Photos of the user.
- Links to other social accounts.

### The Beacon — "leave a card"

When the visitor taps `─ leave a card ─`, they are taken to a composer where they can send a Card *to the Room's owner.* The composer requires them to either:

- Be a Taste OS user themselves (in which case they compose from their own Genome), or
- Compose a Threshold Card — a single line in their own words, plus a chosen palette from a curated set of 12 palettes.

A non-user can leave one Threshold Card per recipient, per month. This is the only way Taste OS allows a non-user to participate, and it is bounded *by design* so the Room does not become a guestbook.

### Privacy of the Room

The Room's URL is *unindexed* by default. Search engines do not crawl it. The user can:

- Keep the Room semi-private: only people they share the URL with can find it.
- Make the Room *listed* (a small directory exists, browseable only by city or by atmospheric tag like "Lacquered Dusk").
- Close the Room entirely (the URL returns a 404).

The directory is not a feed. It is a quiet index, sorted alphabetically by handle, paginated, never ranked. No search-by-popularity. No "discover" surface.

---

## 5. Visual Storytelling Layouts

The Card and Film systems share a layout grammar. Five canonical compositions, named.

### Composition I — *The Window*

A single content block, centered, with breath above and below. Used for: Mirror Card, the Mirror line in the Film.

```
        ┌───────────────────────────┐
        │                           │
        │                           │
        │    [ content centered ]   │
        │                           │
        │                           │
        └───────────────────────────┘
```

### Composition II — *The Plinth*

A heading at a 38% vertical anchor, with a hairline below and body content beneath. Used for: Genome Card, Atmosphere Card.

```
        ┌───────────────────────────┐
        │                           │
        │   [ heading at 38% ]      │
        │   ─────────               │
        │   [ body content ]        │
        │                           │
        │                           │
        └───────────────────────────┘
```

### Composition III — *The Catalog*

Stacked items, hairline-separated, each with title + sub-line. Used for: Currents listed, Kin Card.

```
        ┌───────────────────────────┐
        │                           │
        │   item · sub               │
        │   ─────                    │
        │   item · sub               │
        │   ─────                    │
        │   item · sub               │
        │                           │
        └───────────────────────────┘
```

### Composition IV — *The Specimen*

A single visual specimen (palette swatches, an axis ribbon) centered, with a caption. Used for: Palette Card, Current Card.

```
        ┌───────────────────────────┐
        │                           │
        │                           │
        │    [ specimen ]           │
        │    [ caption ]            │
        │                           │
        │                           │
        └───────────────────────────┘
```

### Composition V — *The Inscription*

Hand-written-feeling closing, italic serif, in the lower third. Used for: the dedication line on a sent Card.

```
        ┌───────────────────────────┐
        │   [ main body content ]   │
        │                           │
        │                           │
        │                           │
        │   ─────                   │
        │   for j., on a tuesday    │
        └───────────────────────────┘
```

---

## 6. Emotional Copywriting System

The voice of a Card is the voice of the Mirror — but turned slightly outward, because a Card is meant to be read by someone other than the sender.

### Voice principles

1. **Second person where possible; third person where necessary.** The Mirror Card is in second person (the Mirror line was written *to* the original user, who is now sending it). The Atmosphere Card is in third person (because someone else is reading about the sender).
2. **Lowercase, sentence-cased.** As everywhere in the OS.
3. **No emoji. No exclamation points. No urgency.**
4. **No "I" voice for the sender.** Cards are not letters from the sender saying "here is who I am." Cards are *evidence* the sender chose to share. The sender does not narrate themselves.
5. **The inscription is the only sender-authored text.** A dedication line, optional, ≤ 90 characters. *"for j., on a tuesday."* *"a year late."* *"because you asked."* *"you'd know."*

### Generated copy on Cards

When a Card includes generated prose (e.g., the Current Card includes a sentence describing the named Current), the prose is the same as appears in the user's Genome — never freshly generated for the share event. We never expose a "regenerate" button on Cards. The Card represents *what the Genome said*. If the user does not like what the Genome said about them, the answer is to live differently, not to ask for different copy.

### Sample inscriptions (sender-authored)

The composer offers a set of *suggested* inscriptions that the user can use, edit, or replace:

```
for ___, who would understand
on a quiet sunday
because you'd know what to do with it
the last room i was in
between us
no occasion
```

The user can also leave the inscription blank. A blank inscription is honored — it renders as silent space, not as a placeholder.

### Receiving copy

When someone receives a Card by email, the email is short:

```
Subject: a card from m.
Body:    you have a card from m.
         
         ─ open ─
         
         (it will arrive once; it will stay if you keep it.)
```

No marketing tail. No "click here to view in browser." No company name in the footer beyond the legal address.

When the recipient opens the Card, a single sentence precedes the reveal:

> *m. sent this for you.*

Then the Threshold beat (1.5s), then the Card materializes.

---

## 7. Aesthetic Sharing UX — The Flow

The flow from "I want to share something" to "the recipient sees it" is intentionally slower than any other share flow in software.

### The composer

```
[Step 1] Choose the Card type     (a quiet picker; 7 options, each previewed)
   ↓
[Step 2] Choose the recipient     (a single email, or a handle, or "public-link")
   ↓
[Step 3] Optional inscription      (one line, ≤ 90 chars; can be left blank)
   ↓
[Step 4] Threshold preview        (the Card renders for you, in its final state,
                                   for a minimum of 4 seconds — you must *sit with it*
                                   before sending)
   ↓
[Step 5] Send                     (─ send ─ Beacon; one tap)
   ↓
[Step 6] Confirmation              (a single sentence: "it has gone.")
```

### Why minimum 4 seconds at Step 4

To prevent reflexive sharing. The user must spend ≥ 4 seconds looking at the Card in its final form before the send button becomes available. The Beacon pulses faintly during these 4 seconds; it becomes tappable at second 5. This is not a friction tax — it is a meditative pause. If a user is uncomfortable looking at what they're about to send for 4 seconds, they should reconsider sending it.

### The recipient's experience

```
[Receive]     An email or, if both users are on Taste OS, a single dot
              on the Field that appears the next time they arrive
              (no badge counter; just a quiet dot).
   ↓
[Open]        Tap the link / the dot. Black field. The Sigil breathes.
   ↓
[Pre-roll]    "m. sent this for you." (held for 2s)
   ↓
[Reveal]      The Card materializes via the Threshold beat.
   ↓
[Sit]         The Card is on screen indefinitely. There is no "next"
              button. No carousel. No "see more from m." Nothing.
   ↓
[Close]       The recipient closes the tab, screenshots, or taps a small
              "thank m." link in mist, lower-right.
```

### "Thank m." — the only response affordance

There is no comment, no like, no emoji reaction. There is a single affordance: *thank m.* This sends a private acknowledgment back, in the form of a *quietly received Threshold Card* of the recipient's choosing. The recipient must compose their thanks; they cannot tap a heart.

This is intentionally costly. If the cost is too high for an acknowledgment to be worth sending, then the acknowledgment was not worth sending.

---

## 8. Private / Public Sharing Controls

Privacy in Taste OS is layered and explicit. The user is never confused about what is visible to whom.

### The four privacy tiers

| Tier | Visibility | Use |
|---|---|---|
| **Vault** | Private to the user | Default for every Genome and every Card |
| **Sealed** | One named recipient | Direct send via email or Taste OS handle |
| **Unlisted** | Anyone with the link | The Card URL, not indexed, no search |
| **Open** | At your Room URL | Public-facing; opt-in; can be closed anytime |

A new Genome is **Vault** by default. *Always.* No Card has been generated yet; nothing has been shared. The user must take a deliberate action to move anything out of the Vault.

### The four controls

1. **Per-Card visibility.** Every Card the user composes is assigned one of the four tiers at composition time. Once Sealed and sent, it cannot be retroactively made Open.
2. **Per-Room visibility.** The Room is closed by default. The user must explicitly *open* the Room. The user can close it again at any time, and the URL returns a 404.
3. **Per-Item revocation.** Any sent Card can be *revoked* after it has been sent. Revocation makes the URL return a "this card has been withdrawn" page. The recipient may have already screenshotted; we do not pretend otherwise. The system explicitly tells the user: *"This card stops being visible at this URL. It may still exist as a screenshot in the recipient's keep."*
4. **Per-recipient block.** A user can block a sender. Blocked senders cannot leave Cards on the user's Room. Block lists are private and never disclosed.

### What we never expose

- The user is **never** told who viewed their Card.
- The user is **never** told how many times their Card has been viewed.
- The user is **never** told who saved or screenshotted their Card.
- The user is **never** told who else viewed the Room.
- The Room is **never** ranked, sorted-by-popularity, or trending.

These are not "features we don't ship yet." These are constitutive refusals.

### The directory

A small directory exists at `taste.os/rooms`. It is the only "discoverable" surface in the system. Browsing rules:

- Sorted alphabetically by handle. Paginated 24 per page.
- Filterable by *atmospheric tag only* (e.g., *Lacquered Dusk*, *Northern Linen*, *Cedar Mathematician*) — never by popularity, never by recency.
- Listed only if the user has *opted in* by toggling their Room to **Open** AND **Listed**.
- A Room can be Open without being Listed.

There is no search box. If a visitor wants a specific person, they need to know that person's handle. The directory is for atmospheric browsing — *"who else lives in a Lacquered Dusk?"* — not for finding individuals.

---

## 9. Immersive Motion Design

The motion language extends the **Breath** system from `system.md` §6. Sharing motion is *slower* than internal-OS motion, because it is more ceremonial.

### Motion tokens for shared surfaces

```ts
export const sharingMotion = {
  // Multiplied by 1.2× compared to internal motion
  reveal:      { duration: 1.92, filter: ['blur(14px)', 'blur(0px)'] },
  threshold:   { duration: 2.4, sequence: ['sigil-breath', 'sender-line', 'card-reveal'] },
  inscription: { duration: 2.0, ease: 'linear', delay: 1.6 }, // typewrites at ~140ms/syllable
  sit:         { duration: Infinity }, // the card sits, no auto-advance
  exit:        { duration: 1.8, opacity: [1, 0] },
};
```

### Choreography of receiving a Card

```
t = 0.0s   black field, Sigil at center, opacity 0
t = 0.6s   Sigil fades in at mist 24%, begins breathing at 0.6Hz
t = 1.6s   "m. sent this for you." enters with reveal blur (1.6s)
t = 3.2s   sender line holds for 800ms
t = 4.0s   sender line exhales (1.4s)
t = 4.6s   Card content reveal begins (composition-dependent)
t = 6.2s   Card is fully composed; inscription typewrites
t = 8.0s   Card sits indefinitely; no further animation
```

Total time from tap to fully-revealed Card: **6.2 seconds**. This is twice as slow as the equivalent surface change inside the OS. The slowness is the message: *this is something someone gave you with care*.

### Choreography of sending a Card

The send beat is also deliberately slow:

```
t = 0.0s   User taps "─ send ─"
t = 0.4s   Card composer dims to 40% opacity, all other UI disappears
t = 1.0s   The composed Card lifts 12px and centers
t = 2.0s   The Card slowly fades to dark, like a curtain falling
t = 3.6s   A single sentence appears: "it has gone."
t = 5.0s   The sentence holds for 1.4s
t = 6.4s   Transition back to the user's Field
```

There is no animated paper-plane, no whoosh sound, no confetti. The Card *goes*. The user is told it has gone. That is all.

### Reduced motion

`prefers-reduced-motion: reduce` collapses every duration above to a 200–600ms opacity fade. The choreography is preserved in *sequence* but not in *length*. We do not pretend a reduced-motion experience is the full one; the user's setting is respected as an expression of their preference.

### The fade-out of the Card on send

This is the most important motion in the sharing system. When a user has spent time composing a Card and sending it, the Card is *no longer theirs*. The fade-out is the visual representation of *letting it go*. We do not show the user "sent! ✓"; we show them *the room becoming empty.* Their Card is now elsewhere, and they are not following it.

---

## 10. What We Still Refuse

This document permits sharing. The document also permanently refuses, in this context too:

### Refused — present-tense forever

| Capability | Why |
|---|---|
| View counts on any shared surface | The viewer-count metric is the engine of performance. |
| Like / heart / emoji reactions | The single-tap reaction is the calorie-empty version of an actual response. |
| Comment threads under Cards | Cards are not posts. |
| A "discover" tab of any kind | Discovery is for the user to choose, in their time. |
| Hashtags or tags as social objects | A Current is a tag *of the Genome*, not a social tag. |
| Stories / disappearing posts / ephemeral content | Cards are deliberate; they are not stories. |
| Direct messages | A Card *is* a message. There is no separate DM surface. |
| Notifications about other users | The only notifications are weekly emails about the user themselves. |
| "User suggested for you" of any kind | We do not match-make. |

### Refused — by judgment, revisitable in years

- Group Cards (a Card composed by multiple users): currently no, because identity is singular. Maybe one day a Card that depicts the *atmospheric intersection* of two Rooms, but only as a special object, not as a default.
- Embedding a Card in a third-party site: currently no. Cards live at Taste OS URLs.
- A native mobile app for Cards: currently no. The PWA is sufficient and the web is the right surface for correspondence.

### Refused — by request, regularly

- "Can users follow other users?" — No.
- "Can users see who looked at their Card?" — No.
- "Can Cards have music?" — No, beyond the optional commissioned stems on the Film.
- "Can users gift each other premium memberships?" — Possibly in v2, but not as a social mechanic, only as a quiet transaction.
- "Can users see how their atmosphere compares to others?" — No comparison surfaces exist or will exist. Comparison is the seed of all social hostility.

---

## 11. Closing

The hardest design problem in this document was not technical. It was *philosophical:* how to let a person share who they are without inviting the apparatus that turns sharing into performance.

The answer was this: keep the **artifact**, remove the **audience metrics**. Build the Card. Build the Room. Build the Film. Build the four privacy tiers. Build the four-second sit-with-it pause. Build the "thank you" that costs another card to send. Build the fade-out that lets the Card go.

Then refuse, with full philosophical clarity, the eight or nine refusals that would slowly turn this back into a feed.

If we get this right, a user will receive a Card from someone they love, and a week later they will look at it again — not because a notification surfaced it, not because it appeared in a feed, but because they remembered it on their own. That memory is the metric.

Build for the moment a person remembers.
