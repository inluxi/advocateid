# Tier variants

## Feature matrix

| Feature | Basic (₹0) | Professional (₹999) | Premium (₹1,999) |
| --- | --- | --- | --- |
| Profile page, photo, bio | Yes | Yes | Yes |
| Posts / articles | Yes | Yes | Yes |
| Expertise tags | 5 | 10 | 10 |
| Courts of practice | 5 | 10 | 10 |
| Client reviews | Yes | Yes | Yes |
| Competing listings on your page | **Shown** | Hidden | Hidden |
| Career highlights / timeline | — | Yes | Yes |
| Case outcomes | — | Yes | Yes |
| Job posts | — | Yes | Yes |
| Multiple offices + maps | — | Yes | Yes |
| Profile analytics | — | Yes | Yes |
| Brand colour | — | Preset set | Preset set |
| Custom domain (CNAME) | — | — | Yes |
| White-label | — | — | Yes |
| Own header / footer | — | — | Yes |
| Email forwarding | — | Yes | Yes |

## Visual differences, at a glance

**Basic** — platform red throughout; FREE LISTING corner flag on the portrait; competitor
block above an accent upsell band; platform footer attribution; ruled hero treatment.

**Professional** — brand colour replaces red in nav, rules, tags and CTAs; masthead hero
with social row; credential strip; four-tab layout; analytics band (owner-only);
competitors and upsell gone; platform wordmark still in the header.

**Premium** — everything Professional has, plus tenant domain in the URL bar, tenant
wordmark and nav, tenant footer with link columns, and no platform attribution beyond a
canonical link in the legal line.

## Implementation notes

- Gate every one of these server-side. The competitor block and the analytics band must
  not be reachable by flipping a client flag.
- Enforce the 5/10 limits at write time, not just render time, so a downgrade doesn't
  silently truncate a profile — warn and let the tenant choose which items to keep.
- On downgrade from Premium, keep the canonical link and 301 the custom domain so
  accumulated ranking survives.
