# Deviations from the original brief

The handoff brief specified a token set that conflicts with the bound Modernist design
system. The approved mockups follow Modernist. Each divergence, and why:

| Brief asked for | Built | Why |
| --- | --- | --- |
| Inter / Segoe UI | Archivo (400–800) | Modernist sets the entire system in Archivo; Inter is also the most over-used interface face of the last decade. |
| Radius 4 / 8 / 12 / 16px, pills | `0` everywhere | Zero radius is a binding rule of the system. The pill token is deliberately 0 so no component can quietly reintroduce rounding. |
| Star colour `#FFB400` | `var(--brand)` | Stars read as part of the tenant's identity, and amber on the light ground fails 4.5:1 at 13px. |
| Body `#222222` on `#FFFFFF` | `#201E1D` on `#F3F2F2` | The system's ground is warm off-white; cards are pure white, so the two surfaces separate without shadows. |
| Four shadow steps used freely | Three steps, used sparingly | Nothing floats in this system. `shadow-sm` on cards, `lg` on device frames only. |
| Free HTML5 colour picker | Curated preset swatches | A free picker admits colours that fail contrast; see `color-customization.md`. |
| "How it works" in 4 steps | 3 steps | Search → compare → contact. A fourth step was padding. |
| Trust-signal testimonial section | Counts strip | Aggregate counts are the honest trust signal; invented testimonials are not. |
| Hero image 200–500px fixed heights | 4:5 aspect at every breakpoint | You asked for a single portrait ratio across mobile and desktop; fixed heights break it. |

## Kept from the brief

Per-vertical accents (`#0066CC`, `#2D7C4A`, `#E67E22`) as the customization layer, the
375 / 768 / 1200 / 1600 breakpoints, the 4/8/16/24/32/48 spacing scale, the semantic
colours, 44px mobile touch targets, WebP + JPEG imagery, mobile-first scaling, and the
whole package structure.
