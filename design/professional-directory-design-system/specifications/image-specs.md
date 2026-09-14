# Image specifications

## Professional portraits

| | Value |
| --- | --- |
| Aspect ratio | **4:5, at every breakpoint** |
| Background | White (`#FFFFFF`) — tenants are asked to upload on white so the photo sits flush against coloured fields |
| Widths | 375 (mobile), 400 (tablet), 500 (desktop), 1000 (2×) |
| Format | WebP primary, JPEG fallback |
| Quality | 85% mobile, 90% desktop |
| Crop | Head and shoulders, eyes on the upper third, head not cropped |
| Fallback | Surface-ground square with the initial in 800 weight |

```html
<div style="aspect-ratio:4/5;background:#fff">
  <picture>
    <source type="image/webp" srcset="p-375.webp 375w, p-500.webp 500w, p-1000.webp 1000w"
            sizes="(max-width:767px) 100vw, 420px">
    <img src="p-500.jpg" alt="J. Gupta, IP law specialist, New Delhi"
         width="500" height="625" style="width:100%;height:100%;object-fit:cover">
  </picture>
</div>
```

## Thumbnails

Row cards 64–76px wide, result cards 132px, all at 4:5 with a 1px `#D7D3D3` border.

## Logos and crests

Square, 200×200 max, PNG with transparency, no compression. Rendered
`object-fit: contain` on the surface ground — never cropped, tinted or on a brand field.

## Icons

Lucide, 24×24 standard (16–17px inside buttons), stroke 2, `currentColor` so they
inherit the brand. SVG inline; no icon fonts.

## Maps

Static map image at 2×, or an embedded interactive map, in a 16:9 to 2:1 block with a
"MAP" corner label. The mockups use labelled placeholders — swap in real tiles at build.

## Not available

No AI-generated photography. Portraits, office photos and crests are tenant uploads or
licensed assets. The mockups ship drag-and-drop placeholders in every image position.
