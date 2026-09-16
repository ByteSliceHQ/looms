# Looms illustration system

## Recommended approach

Treat illustration as a designed family with reusable geometry. Use AI to explore metaphors and compose new scenes; keep the production source as small, deterministic SVG components. This geometric, technical style benefits from exact line placement, consistent perspective, controlled occlusion, and a common optical weight.

Start with one carefully art-directed scene, establish a second structurally different scene, then use both as reference compositions. A saved prompt helps communicate taste, but shared primitives and visual review provide the repeatability. New concepts should change the composition, not the camera or rendering language.

Raster image generation can be useful for exploratory moodboards. For the finished work here, native vector construction avoids introducing tracing artifacts and keeps all paths editable. Figma or Inkscape can provide a final manual art-direction pass if needed. Bring lasting adjustments back into the source components so exports remain reproducible.

SVG is an open vector format ([Inkscape overview](https://inkscape.org/en/develop/about-svg/)); Figma also supports SVG export ([export documentation](https://help.figma.com/hc/en-us/articles/360040028114-Export-from-Figma)). The recommendation above is specific to this restrained geometric style, rather than a claim that every illustration should be generated with code.

## Art direction: recorded in layers, connected by threads

The reference supplied for this work uses precise isometric silhouettes, thin outlines, restrained contrast, repeated forms, and ample space. The Looms collection takes those general principles and introduces a woven mark and parallel connections tied to the product's thread model. The woven mark is an illustration motif, not a replacement logo.

- **Canvas:** 640 × 500 canvas (`viewBox="0 -40 640 500"`); transparent exterior. Keep meaningful geometry at least 32 units from the edges. Minimum recommended display width: 280 CSS pixels.
- **Camera:** orthographic isometric. Project `(x, y, z)` to `(320 + (x − y) × √3/2, 215 + (x + y)/2 − z)`. Never mix perspective angles within the family.
- **Line hierarchy:** 1 unit contours and connections; 1.4 units for the semantic accent; 0.7 unit ground grid. Scale together with the artwork. Small registration marks are texture, not required information.
- **Corners:** 4-unit rounding in projected screen space. Round joins and caps throughout.
- **Surfaces:** opaque top and side faces hide geometry behind them. Two quiet side tones imply volume; no glow, bitmap shadows, blur, or lighting engine.
- **Palette:** neutral surfaces, slate outlines, one muted blue accent. `artPalettes` is the shared source for both themes and exports.
- **Texture:** sparse registration dots, short rows, a faint ground grid. Avoid decorative detail that competes with the main relationship.
- **Composition:** one primary idea per scene, two or three depth levels, ample negative space. Align silhouettes optically when making a collection.
- **Meaning:** solid connections show relationships; dashed guides imply alignment or a pending transition. These are conceptual illustrations, not a full execution trace or sequence diagram.
- **Typography:** keep captions in HTML for readability and localization. The SVG carries an accessible title and description. Do not make an essential distinction depend on color alone.
- **Motion:** static by default. Add animation only when it explains a transition, with reduced-motion support.

## Initial collection

1. **Event log & replay** (`log`): a persistent stack and a lifted state layer connected by threads. Explain that replay reconstructs state without dispatching external effects. This does not promise exactly-once external IO.
2. **Thread hierarchy** (`threads`): different-height thread blocks share one run platform and branch from a parent. The platform means a shared run; it is not an additional storage system.
3. **Durable waits** (`wait`): the execution thread pauses over recorded layers, a matching signal arrives from above, and execution continues. A parked thread holds no worker.
4. **Runtime modules** (`modules`): distinct capability tiles align with a common base. The plus tile stands for the application's own module. Vertical placement is an exploded view, not execution order.
5. **Projections** (`projections`): the event history fans into conversation, ledger, and analytics surfaces. Views independently derive from history; they do not feed each other.
6. **Events & effects** (`effects`): a reducer plate reads events, requests effects, and appends only returned facts.
7. **Not found** (`not-found`): a durable thread reaches a ghost outline where a destination was never woven.
8. **Server error** (`error`): recorded layers remain while the active thread snaps mid-run.

## Source and use

- `apps/docs/src/illustrations/primitives.tsx`: camera, rounded plates, connections, surface details, anchors, grid.
- `apps/docs/src/illustrations/scenes.tsx`: compositions and their explanatory metadata.
- `apps/docs/src/illustrations/illustration.tsx`: theme palettes, accessible SVG wrapper, documentation figure.
- `/illustrations`: the live collection and SVG downloads.
- `apps/docs/public/illustrations/`: exported SVGs, one per gallery scene and theme.

Use `<Illustration name="log" />` for a standalone inline image and `<ConceptFigure name="log" />` for artwork with an explanatory caption. Set `decorative` only when adjacent content already conveys all the image's meaning. The in-app version follows the docs theme; an explicit `theme="light"` or `theme="dark"` overrides it.

Regenerate the portable files from the repository root:

```sh
bun run --cwd apps/docs illustrations:export
```

Exports resolve CSS colors into literal SVG attributes. They contain vector paths and shapes, no embedded raster images, external fonts, or external resources. Import the light version onto a light artboard and the dark version onto a dark artboard. The transparent exterior does not adapt the already-exported face colors.

## Repeatable process for a new illustration

1. Read the concept's documentation. Write one sentence stating what the reader should understand and list any relationships the image must not imply.
2. Sketch three different metaphors in words or small vector compositions. Choose the one whose silhouette and relationships communicate the idea with the least explanation.
3. Compose using the existing plates, threads, and surface marks. Add a new primitive only when an existing one cannot express the concept. Start with the contour, then add detail.
4. Add the scene and accurate title, description, and alt text to `scenes.tsx`. Add its name to the shared `illustrationNames` list used by the gallery and exporter. Place it beside the relevant explanation using `ConceptFigure`.
5. Compare it with the complete family at 280, 480, and 640 pixels in both themes. Check camera consistency, contour weight, drawing order, gaps, clipping, silhouette, and caption accuracy. Ground grids and texture may be subtle; the key relationship must remain legible.
6. Regenerate exports. Open at least one actual exported SVG as an image as well as viewing the inline version. Check that colors and geometry match and all downloads exist.
7. Run docs type checking, scoped formatting/lint checks, and the production build. Record any unresolved issue. Preserve the reviewed gallery as the visual reference for the next addition.

### Reusable brief

> Create a new Looms vector illustration for **[concept]** using `docs/illustrations.md` and `apps/docs/src/illustrations/`. The reader should understand **[one sentence]**. Preserve these relationships: **[facts]**. Avoid implying **[incorrect interpretation]**. Propose three compositions, choose the clearest, then implement it with the existing camera, palette, and primitives. Match the current collection's contour weight and negative space. Add its caption and accessible description, integrate it at **[location]**, regenerate both SVG exports, and visually inspect it beside the existing collection in both themes and at mobile size. Keep the output native vector and update the reusable system only when the new concept requires it.
