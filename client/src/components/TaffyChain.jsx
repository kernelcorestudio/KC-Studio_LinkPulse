"use client";
import { useEffect, useRef } from "react";
const R1 = 1;
const MAX_LINKS = 40;
const MIN_LINKS = 12;
const GROUP_SIZE = 4;
const MAX_GROUPS = MAX_LINKS / GROUP_SIZE;
const MAX_PAL = 16;
const LENS = 2.35;
const WARP_AMOUNT = 1.05;
const SUB_DT = 1 / 90;
const MAX_SUBSTEPS = 3;
const RELAX_PASSES = 14;
const CLAMP_PASSES = 8;
const CLAMP_MARGIN = 0.2;
const BEND_SAFETY = 0.6;
const THREAD_PASSES = 6;
const THREAD_FLOOR = 0.05;
const THREAD_GAIN = 1;
const THREAD_STEP = 0.15;
const DAMPING = 0.985;
const GRAVITY = -26;
const WARMUP_STEPS = 120;
const TOUCH_PX = 22;
const DEFAULT_PALETTE = [
  "#F0521E",
  "#EFE2C3",
  "#1B4BE0",
  "#0E6B22",
  "#B9BEF2",
  "#E8A317",
  "#2A0B33",
  "#F03CB4",
  "#FF7A70",
  "#A9AEC0",
  "#9E1226"
];
const SWAY_RATE = 0.39;
const SWAY_AMP = 0.04;
const DRIFT_RATE = 1.65;
const MORPH_RATE = 0.9;
const COL_SCALE = 0.14;
const SMEAR = 0.22;
const FILL = 0.85;
const ROLL = {
  down: [1, 0, 0, 1],
  up: [-1, 0, 0, -1],
  right: [0, -1, 1, 0],
  left: [0, 1, -1, 0]
};
const DEFAULT_CHAIN = { spread: 100, linkLength: 58, linkThickness: 36 };
const DEFAULT_GRADIENT = { scale: 100, drift: 50, morph: 50 };
const VERT = `#version 300 es
void main() {
    vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

#define MAXL ${MAX_LINKS}
#define MAXG ${MAX_GROUPS}
#define MAXP ${MAX_PAL}
#define GSIZE ${GROUP_SIZE}
#define LENS ${LENS.toFixed(4)}
#define WARP ${WARP_AMOUNT.toFixed(4)}

uniform vec2  uRes;
uniform vec4  uA[MAXL];      // xyz link centre, w arc length
uniform vec4  uB[MAXL];      // xyz tangent, w roll flag (0 | 1)
uniform vec4  uC[MAXL];      // xyz parallel-transported normal
uniform vec4  uG[MAXG];      // xyz group centre, w group radius
uniform int   uLinkCount;
uniform int   uGroupCount;
uniform float uLe;
uniform float uR1;
uniform float uR2;
uniform float uBound;        // per-link bounding radius, le + r1 + r2
uniform vec4  uHull;         // whole-chain bounding sphere
uniform vec3  uCamPos;
uniform vec3  uCamTarget;
uniform vec3  uPal[MAXP];
uniform int   uPalCount;
uniform float uColScale;
uniform float uColDrift;     // accumulated slide along the chain
uniform float uColMorph;     // accumulated warp clock
uniform float uMetal;        // 0 matte, 1 metallic
uniform float uMix;         // temporal blend weight, 1 = no smear
uniform mat2  uRoll;        // screen -> canonical hang-down frame, 90-degree steps
uniform sampler2D uHist;

// iq, https://iquilezles.org/articles/distfunctions/ \u2014 kept under his names.
// Long axis y, ring plane xy, tube thickness along z.
float sdLink(vec3 p, float le, float r1, float r2) {
    vec3 q = vec3(p.x, max(abs(p.y) - le, 0.0), p.z);
    return length(vec2(length(q.xy) - r1, q.z)) - r2;
}

vec2 sphIntersect(vec3 ro, vec3 rd, vec4 sph) {
    vec3 oc = ro - sph.xyz;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - sph.w * sph.w;
    float h = b * b - c;
    if (h < 0.0) return vec2(-1.0, -1.0);
    h = sqrt(h);
    return vec2(-b - h, -b + h);
}

// The rope and camera live in a canonical hang-down frame; uRoll carries a
// screen-space direction into it, and being a 90-degree-step rotation its
// transpose carries one back. Lighting is authored in screen space and
// converted, which keeps the key light top-left of the screen whichever way
// the chain hangs. At Down both are the identity.
vec3 toWorld(vec3 v)  { return vec3(uRoll * v.xy, v.z); }
vec3 toScreen(vec3 v) { return vec3(transpose(uRoll) * v.xy, v.z); }

// Returns (distance, arc length, local x, local z). The local coords are in the
// *unrolled* parallel-transported frame, so the colour field stays continuous
// across the 90-degree roll between neighbouring links.
vec4 map(vec3 p) {
    float d = 1e9;
    float s = 0.0;
    vec2  lxz = vec2(0.0);

    for (int g = 0; g < MAXG; g++) {
        if (g >= uGroupCount) break;
        vec4 G = uG[g];
        if (length(p - G.xyz) - G.w > d) continue;

        for (int k = 0; k < GSIZE; k++) {
            int i = g * GSIZE + k;
            if (i >= uLinkCount) break;

            vec3 c = uA[i].xyz;
            // A sphere bound is a lower bound on the true distance, so rejecting
            // on it leaves the field exact rather than merely safe to march.
            if (length(p - c) - uBound > d) continue;

            vec3 T = uB[i].xyz;
            vec3 N = uC[i].xyz;
            vec3 B = cross(T, N);
            vec3 dp = p - c;
            vec3 lp = vec3(dot(dp, N), dot(dp, T), dot(dp, B));
            vec3 sp = uB[i].w > 0.5 ? vec3(lp.z, lp.y, -lp.x) : lp;

            float e = sdLink(sp, uLe, uR1, uR2);
            if (e < d) {
                d = e;
                s = uA[i].w;
                lxz = lp.xz;
            }
        }
    }
    return vec4(d, s, lxz);
}

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(1.0, -1.0) * 0.0030;
    return normalize(
        e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x +
        e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}

float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash13(i + vec3(0.0, 0.0, 0.0)), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
        mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}

float fbm(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 3; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
    return s / 0.875;
}

// The palette is a ring: the last swatch blends back into the first, so wrapping
// the noise with fract() leaves no seam and every swatch keeps the same
// neighbours wherever on the chain it happens to land.
vec3 paletteAt(float t) {
    float f = fract(t) * float(uPalCount);
    int i = int(floor(f));
    float k = smoothstep(0.20, 0.80, fract(f));
    return mix(uPal[i % uPalCount], uPal[(i + 1) % uPalCount], k);
}

vec3 albedoAt(float s, vec2 lxz) {
    // Cross-section coords are exaggerated so one link shows banding across its
    // own tube the way the frames do, without shrinking the blobs along the
    // chain down to noise. Drift slides the whole field toward the bight.
    vec3 q = vec3(lxz.x * 1.2, s - uColDrift, lxz.y * 1.2) * uColScale;

    // Domain warp (iq, https://iquilezles.org/articles/warp/) on its own clock.
    // Sliding the field only carries hues along the chain; warping it makes the
    // bands bulge, split and re-form where they are, which is what reads as the
    // gradient morphing. Each axis gets a different clock rate so the warp never
    // resolves into a single travelling direction.
    vec3 wt = vec3(uColMorph * 0.21, uColMorph * -0.17, uColMorph * 0.13);
    vec3 w = vec3(
        fbm(q * 0.55 + wt),
        fbm(q * 0.55 + wt.yzx + 5.2),
        fbm(q * 0.55 + wt.zxy + 9.1));
    q += (w - 0.5) * WARP;

    float t = fbm(q) * 1.6 + 0.35 * fbm(q * 0.41 + 19.7);
    return paletteAt(t);
}

// Wrapped azimuth distance, so a light centred near +/-pi does not tear in two
// where atan flips sign.
float azDist(float a, float c) {
    float d = a - c;
    d = mod(d + 3.14159265, 6.28318531) - 3.14159265;
    return abs(d);
}

// A studio for the metallic finish to reflect. There is no env map here, and
// what a metal reflects is the only thing you actually see of it, so this has
// to be built out of *edges* \u2014 bands and rectangles, not one ramp. A smooth
// dome-to-floor gradient reflected off a curved tube varies exactly as slowly
// as a diffuse term does, and the finish comes out looking like glossy plastic.
// The hard horizon and the hard-edged softbox are what put a straight chrome
// line down each link.
vec3 envColor(vec3 r) {
    // The studio is screen-fixed, like the key light (see toScreen).
    r = toScreen(r);
    float y = r.y;
    float a = atan(r.z, r.x);

    // Floor, hard horizon, lit ceiling. A near-mirror inherits its whole tonal
    // range from what it reflects, so this stays mostly midtones: an
    // environment that is only sky-white over floor-black posterises the chain
    // into a two-tone cartoon however much structure it has.
    float flr = 0.19 + 0.21 * smoothstep(-1.00, -0.04, y);
    float ceilV = 0.44 + 0.26 * smoothstep(0.04, 0.80, y);
    float v = mix(flr, ceilV, smoothstep(-0.055, 0.055, y));

    // Key softbox, centred on the same direction as the analytic key in shade()
    // so the two agree about where the light is. Its edge is sharp enough to
    // draw a straight bright line down the length of a tube, and that line
    // sliding as the chain turns is the whole read of "polished".
    v += 1.35 * smoothstep(0.30, 0.44, y) * smoothstep(1.25, 0.95, azDist(a, 2.10));
    // Weaker fill opposite it, so a tube has shape all the way round instead of
    // one hot ring against dead black.
    v += 0.34 * smoothstep(0.02, 0.28, y) * smoothstep(1.05, 0.70, azDist(a, 0.90));
    // Tight bright line right on the horizon, with the dark band under it that
    // makes the line read as an edge rather than as a glow.
    v += 0.34 * exp(-abs(y) * 26.0);
    v -= 0.10 * exp(-abs(y + 0.16) * 16.0);

    // A hair cool, like polished steel rather than a perfect mirror.
    return max(vec3(v * 0.985, v, v * 1.03), 0.0);
}

// iq's five-tap occlusion, https://iquilezles.org/articles/. Only the metallic
// path evaluates it: the reference's matte frames deliberately have none \u2014 its
// links overlap with nothing darkening between them \u2014 so turning Metallic off
// still restores that flat port exactly.
float calcAO(vec3 p, vec3 n) {
    float occ = 0.0;
    float sca = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.015 + 0.16 * float(i) / 4.0;
        occ += (h - map(p + h * n).x) * sca;
        sca *= 0.80;
    }
    return clamp(1.0 - 1.7 * occ, 0.0, 1.0);
}

// One reflection bounce, bounded by the chain's own hull so a ray that leaves
// the chain costs a single sphere test rather than twenty marching steps.
// A polished chain is largely a picture of itself: the dark bands where one
// link looks into another are what separate interlocked links from each other.
// A metal lit only by the studio has none of those bands, and that is most of
// why an env-only finish reads as one smooth gradient poured over the whole
// chain rather than as a stack of separate solid objects.
vec3 reflSample(vec3 p, vec3 n, vec3 rd) {
    vec3 r = reflect(rd, n);
    vec3 env = envColor(r);
    vec3 o = p + n * 0.015;
    vec2 hs = sphIntersect(o, r, uHull);
    if (hs.y <= 0.0) return env;
    float t = max(hs.x, 0.02);
    // Past a few link radii the fade below has handed the ray back to the
    // open environment anyway, so marching further is spent for nothing.
    float tMax = min(hs.y, 5.5);
    for (int i = 0; i < 16; i++) {
        if (t > tMax) break;
        float d = map(o + r * t).x;
        if (d < 0.005) {
            // Second bounce is the studio again, dimmed by the metal it came
            // off. Two bounces is where a chain stops looking hollow.
            vec3 e2 = envColor(reflect(r, calcNormal(o + r * t))) * 0.55;
            // Fade back to the open environment with distance: a link seen from
            // far enough away covers very little of that ray's cone.
            return mix(e2, env, smoothstep(1.2, 5.0, t));
        }
        t += max(d, 0.008);
    }
    return env;
}

// Soft-knee highlight roll-off. Reflections and speculars on a polished surface
// run well over 1.0, and hard clipping flattens them into flat white blobs with
// a hard edge around them; this rolls everything above the knee asymptotically
// into 1.0 so the softbox keeps a centre. Below the knee it is exactly the
// identity \u2014 a global curve (Reinhard, ACES) would pull the midtones down with
// the highlights, and the midtones are where a metal's shape is legible.
vec3 tonemap(vec3 c) {
    const float K = 0.80;
    vec3 hi = max(c - K, 0.0);
    return min(c, vec3(K)) + (1.0 - K) * (1.0 - exp(-hi / (1.0 - K)));
}

vec3 shade(vec3 p, vec3 rd, float s, vec2 lxz) {
    vec3 n = calcNormal(p);
    vec3 L = toWorld(normalize(vec3(-0.34, 0.76, 0.55)));

    if (uMetal > 0.5) {
        // A metal has no diffuse term at all: everything visible is a
        // reflection. The palette goes off with the finish, so F0 is neutral
        // polished chrome and albedoAt is never evaluated here \u2014 five fbm calls
        // a pixel that the metal path does not pay for.
        // Polished steel, not perfect chrome. At F0 ~0.95 the reflection is
        // the environment verbatim and every surface clips to black or white;
        // pulling it down keeps the midtones the shape is legible in.
        const vec3 F0 = vec3(0.78, 0.79, 0.82);
        float f = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 5.0);
        vec3 F = F0 + (1.0 - F0) * f;

        float ao = calcAO(p, n);
        // Reflection occlusion, squared for contrast and then floored: the
        // crevice where two links interlock cannot see the studio, and leaving
        // it as bright as the outside of the tube is what welds the whole chain
        // into one soft mass. Occlusion with no floor goes to dead black
        // instead, and loses the very shape it is meant to be separating.
        float rocc = mix(ao * ao, 1.0, 0.22);

        // Two analytic keys layered on the environment: one tight enough to
        // stay a line along the tube, one broad enough to give it a body. The
        // tight one sits on the same direction as envColor's key softbox, so
        // the specular lands inside the reflected box rather than beside it.
        vec3 L2 = toWorld(normalize(vec3(0.58, 0.32, 0.74)));
        vec3 h1 = normalize(L - rd);
        vec3 h2 = normalize(L2 - rd);
        float s1 = pow(clamp(dot(n, h1), 0.0, 1.0), 220.0);
        float s2 = pow(clamp(dot(n, h2), 0.0, 1.0), 42.0);

        // Highlights are deliberately allowed over 1.0 \u2014 a specular that peaks
        // at white is the whole reason the finish reads as polished \u2014 and the
        // tonemap rolls them off instead of clipping them into a flat blob.
        vec3 col = F * reflSample(p, n, rd) * rocc
                 + F0 * (s1 * 2.2 + s2 * 0.22) * ao
                 + F0 * 0.045 * ao;
        return tonemap(col);
    }

    vec3 albedo = albedoAt(s, lxz);

    // Wrapped diffuse: the frames have no terminator anywhere, the ramp simply
    // runs off into a dark but still saturated version of the same hue.
    const float wrap = 0.55;
    float dif = clamp((dot(n, L) + wrap) / (1.0 + wrap), 0.0, 1.0);
    float amb = 0.5 + 0.5 * toScreen(n).y;
    // Faint transmission on faces turned away from the key. This, not subsurface
    // scattering, is what reads as the frosted-resin quality once the specular
    // is gone \u2014 and the reference has no specular anywhere.
    float back = pow(clamp(dot(-n, L) * 0.5 + 0.5, 0.0, 1.0), 3.0);

    // Weights sum to exactly 1.0 at the brightest point, so a saturated hue
    // lands on itself rather than washing to white, and the darkest a link goes
    // is 0.30 of its own colour. The frames are matte and very flat: nearly all
    // of their contrast is the palette, not the light.
    float lin = 0.30 + 0.30 * amb + 0.34 * dif + 0.06 * back;
    return albedo * lin;
}

void main() {
    vec3 ro = uCamPos;
    vec3 ww = normalize(uCamTarget - ro);
    vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
    vec3 vv = cross(uu, ww);
    // Into the canonical hang-down frame: the screen's own size with its axes
    // swapped for Left/Right. At Down uRoll is the identity and this is the
    // plain (2 * frag - res) / res.y, bit for bit.
    vec2 cRes = abs(uRoll * uRes);
    vec2 q = 2.0 * (uRoll * (gl_FragCoord.xy - 0.5 * uRes)) / cRes.y;
    vec3 rd = normalize(q.x * uu + q.y * vv + LENS * ww);

    // Premultiplied chain over nothing. The background is the root's CSS, so
    // coverage goes into the output exactly once and the compositor does the
    // rest, whatever alpha that background carries.
    vec4 scene = vec4(0.0);

    vec2 hull = sphIntersect(ro, rd, uHull);
    if (hull.y > 0.0) {
        float t = max(hull.x, 0.001);
        float tMax = hull.y;
        // One pixel's worth of cone radius at distance t. It doubles as the soft
        // silhouette: a ray that only grazes the surface is partly covered.
        float cone = (2.0 / cRes.y) / LENS;
        float cover = 1.0;
        float tNear = t;
        bool hit = false;
        vec4 res = vec4(0.0);

        for (int i = 0; i < 96; i++) {
            vec4 m = map(ro + rd * t);
            float w = m.x / (cone * t * 2.4);
            if (w < cover) { cover = w; tNear = t; res = m; }
            if (m.x < cone * t * 0.35) { hit = true; res = m; tNear = t; break; }
            t += m.x;
            if (t > tMax) break;
        }

        float cov = hit ? 1.0 : 1.0 - smoothstep(0.0, 1.0, max(cover, 0.0));
        if (cov > 0.001) {
            vec3 sc = shade(ro + rd * tNear, rd, res.y, res.zw);
            scene = vec4(sc * cov, cov);
        }
    }

    // Premultiplied, so the temporal blend below stays linear.
    vec4 hist = texture(uHist, gl_FragCoord.xy / uRes);
    fragColor = mix(hist, scene, uMix);
}`;
const PRESENT_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
out vec4 fragColor;
void main() { fragColor = texture(uTex, gl_FragCoord.xy / uRes); }`;
function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("TaffyChain shader:", gl.getShaderInfoLog(sh));
  }
  return sh;
}
function buildProgram(gl, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("TaffyChain link:", gl.getProgramInfoLog(p));
  }
  return p;
}
function makeColourReader() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  const cache = /* @__PURE__ */ new Map();
  return (str) => {
    const hit = cache.get(str);
    if (hit) return hit;
    let css = str;
    for (let m; m = /^\s*var\(\s*--[^,)]+,\s*([\s\S]+)\)\s*$/.exec(css); ) css = m[1];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const a = d[3] / 255;
    const out = a > 0 ? [d[0] / 255, d[1] / 255, d[2] / 255, a] : [0, 0, 0, 0];
    if (cache.size < 256) cache.set(str, out);
    return out;
  };
}
const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
function articulationLimit(le, r2, seg) {
  const L = le + R1;
  const hole = R1 - r2;
  const clearance = (th) => {
    const x = seg * Math.sin(th * 0.5) - L * Math.sin(th);
    const y = seg * Math.cos(th * 0.5) - L * Math.cos(th);
    const v = Math.max(Math.abs(y) - le, 0);
    return hole - Math.sqrt(x * x + v * v);
  };
  if (clearance(0) <= 0) return 0;
  let lo = 0;
  let hi = Math.PI;
  for (let k = 0; k < 24; k++) {
    const m = (lo + hi) * 0.5;
    if (clearance(m) > 0) lo = m;
    else hi = m;
  }
  return lo;
}
export default function TaffyChain({
  background = "transparent",
  metallic = false,
  colors = ["#EA6113", "#F88F22", "#FBB931", "#FFE3B3"],
  density = 28,
  speed = 50,
  sway = 100,
  distance = 100,
  direction = "down",
  drag = 60,
  chain = { spread: 100, linkLength: 58, linkThickness: 36 },
  gradient = { scale: 100, drift: 50, morph: 50 },
  style
}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const ch = { ...DEFAULT_CHAIN, ...chain };
  const gr = { ...DEFAULT_GRADIENT, ...gradient };
  const live = {
    colors,
    density,
    spread: ch.spread,
    linkLength: ch.linkLength,
    linkThickness: ch.linkThickness,
    scale: gr.scale,
    drift: gr.drift,
    morph: gr.morph,
    metallic,
    drag,
    sway,
    speed,
    distance,
    direction
  };
  const propsRef = useRef(live);
  propsRef.current = live;
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: "high-performance"
    });
    if (!ctx) return;
    const gl = ctx;
    const readColour = makeColourReader();
    const sceneProg = buildProgram(gl, FRAG);
    const presentProg = buildProgram(gl, PRESENT_FRAG);
    const vao = gl.createVertexArray();
    const U = (p, n) => gl.getUniformLocation(p, n);
    const u = {
      res: U(sceneProg, "uRes"),
      A: U(sceneProg, "uA"),
      B: U(sceneProg, "uB"),
      C: U(sceneProg, "uC"),
      G: U(sceneProg, "uG"),
      linkCount: U(sceneProg, "uLinkCount"),
      groupCount: U(sceneProg, "uGroupCount"),
      le: U(sceneProg, "uLe"),
      r1: U(sceneProg, "uR1"),
      r2: U(sceneProg, "uR2"),
      bound: U(sceneProg, "uBound"),
      hull: U(sceneProg, "uHull"),
      camPos: U(sceneProg, "uCamPos"),
      camTarget: U(sceneProg, "uCamTarget"),
      pal: U(sceneProg, "uPal"),
      palCount: U(sceneProg, "uPalCount"),
      colScale: U(sceneProg, "uColScale"),
      colDrift: U(sceneProg, "uColDrift"),
      colMorph: U(sceneProg, "uColMorph"),
      metal: U(sceneProg, "uMetal"),
      mix: U(sceneProg, "uMix"),
      roll: U(sceneProg, "uRoll"),
      hist: U(sceneProg, "uHist")
    };
    const pu = { tex: U(presentProg, "uTex"), res: U(presentProg, "uRes") };
    let W = 0;
    let H = 0;
    const tex = [null, null];
    const fbo = [null, null];
    let readIdx = 0;
    function allocTargets(w, h) {
      for (let i = 0; i < 2; i++) {
        if (tex[i]) gl.deleteTexture(tex[i]);
        if (fbo[i]) gl.deleteFramebuffer(fbo[i]);
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const f = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        tex[i] = t;
        fbo[i] = f;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    let firstFrame = true;
    let cssPxW = 1;
    let cssPxH = 1;
    let roll = ROLL.down;
    let lastDir = "";
    function resize() {
      const cssW = Math.max(1, host.clientWidth);
      const cssH = Math.max(1, host.clientHeight);
      cssPxW = cssW;
      cssPxH = cssH;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);
      const budget = 23e5;
      if (cssW * cssH * dpr * dpr > budget) {
        dpr = Math.max(0.75, Math.sqrt(budget / (cssW * cssH)));
      }
      const w = Math.max(1, Math.round(cssW * dpr));
      const h = Math.max(1, Math.round(cssH * dpr));
      if (w === W && h === H) return;
      W = w;
      H = h;
      canvas.width = w;
      canvas.height = h;
      allocTargets(w, h);
      firstFrame = true;
      fitSnap = true;
    }
    let nodeCount = 0;
    let pitch = 0;
    let maxPitch = 0;
    let cosMaxBend = 1;
    let linkLe = 0;
    let linkR2 = 0;
    let ropeLen = 0;
    let anchorGap = 0;
    let hangDepth = 0;
    let sepMin = 0;
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let pz = new Float32Array(0);
    let ox = new Float32Array(0);
    let oy = new Float32Array(0);
    let oz = new Float32Array(0);
    const bufA = new Float32Array(MAX_LINKS * 4);
    const bufB = new Float32Array(MAX_LINKS * 4);
    const bufC = new Float32Array(MAX_LINKS * 4);
    const bufG = new Float32Array(MAX_GROUPS * 4);
    const bufPal = new Float32Array(MAX_PAL * 3);
    let camZ = 0;
    let camY = 0;
    let camX = 0;
    let pickRadius = 0;
    let fitMidX = 0;
    let fitSnap = true;
    let grabIndex = -1;
    let grabPointer = -1;
    let grabDepth = 0;
    let grabX = 0;
    let grabY = 0;
    let grabZ = 0;
    let grabPull = 0;
    let geomKey = "";
    function buildRope(n, le, r2) {
      nodeCount = n;
      pitch = 2 * (le + R1 - r2) - 0.25 * R1;
      maxPitch = 2 * (le + R1 - r2) - CLAMP_MARGIN * R1;
      cosMaxBend = Math.cos(articulationLimit(le, r2, maxPitch) * BEND_SAFETY);
      linkLe = le;
      linkR2 = r2;
      ropeLen = pitch * (n - 1);
      sepMin = (R1 + r2) * 1.35;
      px = new Float32Array(n);
      py = new Float32Array(n);
      pz = new Float32Array(n);
      ox = new Float32Array(n);
      oy = new Float32Array(n);
      oz = new Float32Array(n);
      const half = (n - 1) / 2;
      for (let i = 0; i < n; i++) {
        const k = i <= half ? i / half : (n - 1 - i) / half;
        const side = i <= half ? -1 : 1;
        px[i] = side * (anchorGap / 2) * (1 - k);
        py[i] = -hangDepth * k;
        pz[i] = 0;
        ox[i] = px[i];
        oy[i] = py[i];
        oz[i] = pz[i];
      }
      grabIndex = -1;
    }
    function setAnchorGeometry(spreadPct) {
      const spreadVal = clamp01(spreadPct / 100);
      const densityFactor = Math.max(0.65, Math.min(0.88, 1.05 - (nodeCount * 0.0088)));
      const ratio = (0.2 + spreadVal * 0.8) * densityFactor;
      anchorGap = ropeLen * ratio;
      hangDepth = Math.sqrt(Math.max(ropeLen * ropeLen - anchorGap * anchorGap, 0.01)) / 2;
    }
    let snapX = new Float32Array(0);
    let snapY = new Float32Array(0);
    let snapZ = new Float32Array(0);
    let tanX = new Float32Array(0);
    let tanY = new Float32Array(0);
    let tanZ = new Float32Array(0);
    function tangents() {
      const n = nodeCount;
      if (tanX.length < n) {
        tanX = new Float32Array(n);
        tanY = new Float32Array(n);
        tanZ = new Float32Array(n);
      }
      for (let i = 0; i < n; i++) {
        const a = i > 0 ? i - 1 : 0;
        const b = i < n - 1 ? i + 1 : n - 1;
        const x = px[b] - px[a];
        const y = py[b] - py[a];
        const z = pz[b] - pz[a];
        const l = Math.sqrt(x * x + y * y + z * z) || 1e-6;
        tanX[i] = x / l;
        tanY[i] = y / l;
        tanZ[i] = z / l;
      }
    }
    function clearance(i, j) {
      const L = linkLe + R1;
      const vx = px[i] - px[j];
      const vy = py[i] - py[j];
      const vz = pz[i] - pz[j];
      const sg = tanX[j] * vx + tanY[j] * vy + tanZ[j] * vz >= 0 ? 1 : -1;
      const dx = px[j] + sg * L * tanX[j] - px[i];
      const dy = py[j] + sg * L * tanY[j] - py[i];
      const dz = pz[j] + sg * L * tanZ[j] - pz[i];
      const par = dx * tanX[i] + dy * tanY[i] + dz * tanZ[i];
      const ex = dx - tanX[i] * par;
      const ey = dy - tanY[i] * par;
      const ez = dz - tanZ[i] * par;
      const perp = Math.sqrt(ex * ex + ey * ey + ez * ez);
      const run = Math.abs(par) - linkLe;
      const v = run > 0 ? run : 0;
      return R1 - linkR2 - Math.sqrt(perp * perp + v * v);
    }
    function straighten(m, amount) {
      const n = nodeCount;
      const i = m - 1;
      const j = m + 1;
      if (i < 0 || j > n - 1) return;
      const pinI = i === 0 || i === grabIndex;
      const pinJ = j === n - 1 || j === grabIndex;
      if (pinI && pinJ) return;
      let dx = px[j] - px[i];
      let dy = py[j] - py[i];
      let dz = pz[j] - pz[i];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      const k = amount / d * (pinI || pinJ ? 1 : 0.5);
      dx *= k;
      dy *= k;
      dz *= k;
      if (!pinI) {
        px[i] -= dx;
        py[i] -= dy;
        pz[i] -= dz;
      }
      if (!pinJ) {
        px[j] += dx;
        py[j] += dy;
        pz[j] += dz;
      }
    }
    function step(dt, tt, swayPct) {
      const n = nodeCount;
      if (n < 2) return;
      const amp = ropeLen * SWAY_AMP * (swayPct / 100);
      const ax0 = -anchorGap / 2 + amp * Math.sin(tt * 0.9);
      const az0 = amp * 0.85 * Math.sin(tt * 0.61 + 1.1);
      const ax1 = anchorGap / 2 + amp * Math.sin(tt * 0.77 + 2);
      const az1 = amp * 0.95 * Math.sin(tt * 1.3 + 0.4);
      const g = GRAVITY * dt * dt;
      for (let i = 0; i < n; i++) {
        const cx = px[i];
        const cy = py[i];
        const cz = pz[i];
        px[i] = cx + (cx - ox[i]) * DAMPING;
        py[i] = cy + (cy - oy[i]) * DAMPING + g;
        pz[i] = cz + (cz - oz[i]) * DAMPING;
        ox[i] = cx;
        oy[i] = cy;
        oz[i] = cz;
      }
      const g0 = grabIndex;
      let tgX = grabX;
      let tgY = grabY;
      let tgZ = grabZ;
      if (g0 > 0 && g0 < n - 1) {
        for (let rep = 0; rep < 4; rep++) {
          for (let e = 0; e < 2; e++) {
            const ax = e === 0 ? ax0 : ax1;
            const az = e === 0 ? az0 : az1;
            const reach = maxPitch * (e === 0 ? g0 : n - 1 - g0) * 0.99;
            const dx = tgX - ax;
            const dy = tgY;
            const dz = tgZ - az;
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
            if (d <= reach) continue;
            const sc = reach / d;
            tgX = ax + dx * sc;
            tgY = dy * sc;
            tgZ = az + dz * sc;
          }
        }
        px[g0] += (tgX - px[g0]) * grabPull;
        py[g0] += (tgY - py[g0]) * grabPull;
        pz[g0] += (tgZ - pz[g0]) * grabPull;
      }
      for (let pass = 0; pass < RELAX_PASSES; pass++) {
        px[0] = ax0;
        py[0] = 0;
        pz[0] = az0;
        px[n - 1] = ax1;
        py[n - 1] = 0;
        pz[n - 1] = az1;
        if (g0 > 0 && g0 < n - 1) {
          px[g0] = tgX;
          py[g0] = tgY;
          pz[g0] = tgZ;
        }
        for (let i = 0; i < n - 1; i++) {
          const j = i + 1;
          const pinI = i === 0 || i === g0;
          const pinJ = j === n - 1 || j === g0;
          if (pinI && pinJ) continue;
          let dx = px[j] - px[i];
          let dy = py[j] - py[i];
          let dz = pz[j] - pz[i];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
          const k = (d - pitch) / d * (pinI || pinJ ? 1 : 0.5);
          dx *= k;
          dy *= k;
          dz *= k;
          if (!pinI) {
            px[i] += dx;
            py[i] += dy;
            pz[i] += dz;
          }
          if (!pinJ) {
            px[j] -= dx;
            py[j] -= dy;
            pz[j] -= dz;
          }
        }
        if (pass % 3 === 0) {
          for (let i = 0; i < n; i++) {
            for (let j = i + 2; j < n; j++) {
              let dx = px[j] - px[i];
              let dy = py[j] - py[i];
              let dz = pz[j] - pz[i];
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 > sepMin * sepMin || d2 < 1e-9) continue;
              const d = Math.sqrt(d2);
              const k = (sepMin - d) / d * 0.28;
              dx *= k;
              dy *= k;
              dz *= k;
              if (i !== 0 && i !== n - 1 && i !== g0) {
                px[i] -= dx;
                py[i] -= dy;
                pz[i] -= dz;
              }
              if (j !== 0 && j !== n - 1 && j !== g0) {
                px[j] += dx;
                py[j] += dy;
                pz[j] += dz;
              }
            }
          }
        }
      }
      const place = (i, k, useCone) => {
        let ex = px[k] - px[i];
        let ey = py[k] - py[i];
        let ez = pz[k] - pz[i];
        const el = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1e-6;
        const len = el > maxPitch ? maxPitch : el;
        ex /= el;
        ey /= el;
        ez /= el;
        const h = i + (i - k);
        if (useCone && h >= 0 && h < nodeCount) {
          let dx = px[i] - px[h];
          let dy = py[i] - py[h];
          let dz = pz[i] - pz[h];
          const dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
          dx /= dl;
          dy /= dl;
          dz /= dl;
          const ca = dx * ex + dy * ey + dz * ez;
          if (ca < cosMaxBend) {
            let wx = ex - dx * ca;
            let wy = ey - dy * ca;
            let wz = ez - dz * ca;
            let wl = Math.sqrt(wx * wx + wy * wy + wz * wz);
            if (wl < 1e-6) {
              wx = Math.abs(dx) < 0.9 ? 1 : 0;
              wy = Math.abs(dx) < 0.9 ? 0 : 1;
              wz = 0;
              const dp = wx * dx + wy * dy + wz * dz;
              wx -= dx * dp;
              wy -= dy * dp;
              wz -= dz * dp;
              wl = Math.sqrt(wx * wx + wy * wy + wz * wz) || 1e-6;
            }
            wx /= wl;
            wy /= wl;
            wz /= wl;
            const sn = Math.sqrt(Math.max(1 - cosMaxBend * cosMaxBend, 0));
            ex = dx * cosMaxBend + wx * sn;
            ey = dy * cosMaxBend + wy * sn;
            ez = dz * cosMaxBend + wz * sn;
          }
        }
        px[k] = px[i] + ex * len;
        py[k] = py[i] + ey * len;
        pz[k] = pz[i] + ez * len;
      };
      const walk = (useCone) => {
        px[0] = ax0;
        py[0] = 0;
        pz[0] = az0;
        if (g0 > 0 && g0 < n - 1) {
          for (let i = 1; i <= g0; i++) place(i - 1, i, useCone);
          px[g0] = tgX;
          py[g0] = tgY;
          pz[g0] = tgZ;
          for (let i = g0 - 1; i >= 0; i--) place(i + 1, i, useCone);

          px[g0] = tgX;
          py[g0] = tgY;
          pz[g0] = tgZ;
          for (let i = g0 + 1; i < n; i++) place(i - 1, i, useCone);
          px[n - 1] = ax1;
          py[n - 1] = 0;
          pz[n - 1] = az1;
          for (let i = n - 2; i >= g0; i--) place(i + 1, i, useCone);
          px[g0] = tgX;
          py[g0] = tgY;
          pz[g0] = tgZ;
        } else {
          for (let i = 1; i < n; i++) place(i - 1, i, useCone);
          px[n - 1] = ax1;
          py[n - 1] = 0;
          pz[n - 1] = az1;
          for (let i = n - 2; i >= 0; i--) place(i + 1, i, useCone);
        }
      };
      if (snapX.length < n) {
        snapX = new Float32Array(n);
        snapY = new Float32Array(n);
        snapZ = new Float32Array(n);
      }
      for (let i = 0; i < n; i++) {
        snapX[i] = px[i];
        snapY[i] = py[i];
        snapZ[i] = pz[i];
      }
      for (let rep = 0; rep < CLAMP_PASSES; rep++) walk(true);
      for (let rep = 0; rep < THREAD_PASSES; rep++) {
        px[0] = ax0;
        py[0] = 0;
        pz[0] = az0;
        px[n - 1] = ax1;
        py[n - 1] = 0;
        pz[n - 1] = az1;
        if (g0 > 0 && g0 < n - 1) {
          px[g0] = tgX;
          py[g0] = tgY;
          pz[g0] = tgZ;
        }
        tangents();
        let touched = false;
        for (let i = 0; i < n - 1; i++) {
          const deficit = THREAD_FLOOR - clearance(i, i + 1);
          if (deficit <= 0) continue;
          touched = true;
          let push = deficit * THREAD_GAIN;
          if (push > THREAD_STEP * maxPitch) push = THREAD_STEP * maxPitch;
          if (i !== g0) straighten(i, push);
          if (i + 1 !== g0) straighten(i + 1, push);
        }
        if (!touched) break;
        walk(false);
      }
      walk(false);
      px[0] = ax0;
      py[0] = 0;
      pz[0] = az0;
      px[n - 1] = ax1;
      py[n - 1] = 0;
      pz[n - 1] = az1;
      if (g0 > 0 && g0 < n - 1) {
        px[g0] = tgX;
        py[g0] = tgY;
        pz[g0] = tgZ;
      }
      for (let i = 0; i < n - 1; i++) {
        const j = i + 1;
        const pinI = i === 0 || i === g0;
        const pinJ = j === n - 1 || j === g0;
        if (pinI && pinJ) continue;
        let dx = px[j] - px[i];
        let dy = py[j] - py[i];
        let dz = pz[j] - pz[i];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        if (d <= maxPitch) continue;
        const k = (d - maxPitch) / d * (pinI || pinJ ? 1 : 0.5);
        dx *= k;
        dy *= k;
        dz *= k;
        if (!pinI) {
          px[i] += dx;
          py[i] += dy;
          pz[i] += dz;
        }
        if (!pinJ) {
          px[j] -= dx;
          py[j] -= dy;
          pz[j] -= dz;
        }
      }
      for (let i = 0; i < n; i++) {
        ox[i] += px[i] - snapX[i];
        oy[i] += py[i] - snapY[i];
        oz[i] += pz[i] - snapZ[i];
      }
    }
    function pack(bound) {
      const n = nodeCount;
      let rx = 0;
      let ry = 0;
      let rz = 1;
      let hx = 0;
      let hy = 0;
      let hz = 0;
      let xMin = 1e9;
      let xMax = -1e9;
      for (let i = 0; i < n; i++) {
        const ip = Math.max(i - 1, 0);
        const iq = Math.min(i + 1, n - 1);
        let tx = px[iq] - px[ip];
        let ty = py[iq] - py[ip];
        let tz = pz[iq] - pz[ip];
        const tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1e-6;
        tx /= tl;
        ty /= tl;
        tz /= tl;
        const dp = rx * tx + ry * ty + rz * tz;
        rx -= tx * dp;
        ry -= ty * dp;
        rz -= tz * dp;
        let rl = Math.sqrt(rx * rx + ry * ry + rz * rz);
        if (rl < 1e-4) {
          rx = Math.abs(tx) < 0.9 ? 1 : 0;
          ry = Math.abs(tx) < 0.9 ? 0 : 1;
          rz = 0;
          const d2 = rx * tx + ry * ty + rz * tz;
          rx -= tx * d2;
          ry -= ty * d2;
          rz -= tz * d2;
          rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1e-6;
        }
        rx /= rl;
        ry /= rl;
        rz /= rl;
        const o = i * 4;
        bufA[o] = px[i];
        bufA[o + 1] = py[i];
        bufA[o + 2] = pz[i];
        bufA[o + 3] = i * pitch;
        bufB[o] = tx;
        bufB[o + 1] = ty;
        bufB[o + 2] = tz;
        bufB[o + 3] = i % 2;
        bufC[o] = rx;
        bufC[o + 1] = ry;
        bufC[o + 2] = rz;
        bufC[o + 3] = 0;
        hx += px[i];
        hy += py[i];
        hz += pz[i];
        if (px[i] < xMin) xMin = px[i];
        if (px[i] > xMax) xMax = px[i];
      }
      hx /= n;
      hy /= n;
      hz /= n;
      let hr = 0;
      for (let i = 0; i < n; i++) {
        const dx = px[i] - hx;
        const dy = py[i] - hy;
        const dz = pz[i] - hz;
        hr = Math.max(hr, Math.sqrt(dx * dx + dy * dy + dz * dz));
      }
      const groups = Math.ceil(n / GROUP_SIZE);
      for (let g = 0; g < groups; g++) {
        const i0 = g * GROUP_SIZE;
        const i1 = Math.min(i0 + GROUP_SIZE, n);
        let cx = 0;
        let cy = 0;
        let cz = 0;
        for (let i = i0; i < i1; i++) {
          cx += px[i];
          cy += py[i];
          cz += pz[i];
        }
        const c = i1 - i0;
        cx /= c;
        cy /= c;
        cz /= c;
        let r = 0;
        for (let i = i0; i < i1; i++) {
          const dx = px[i] - cx;
          const dy = py[i] - cy;
          const dz = pz[i] - cz;
          r = Math.max(r, Math.sqrt(dx * dx + dy * dy + dz * dz));
        }
        const o = g * 4;
        bufG[o] = cx;
        bufG[o + 1] = cy;
        bufG[o + 2] = cz;
        bufG[o + 3] = r + bound;
      }
      return { groups, hull: [hx, hy, hz, hr + bound], xMin, xMax };
    }
    function rayFor(clientX, clientY) {
      const r = host.getBoundingClientRect();
      const sx = clientX - r.left - r.width / 2;
      const sy = r.top + r.height / 2 - clientY;
      const cx = roll[0] * sx + roll[2] * sy;
      const cy = roll[1] * sx + roll[3] * sy;
      const cH = Math.max(Math.abs(roll[1] * r.width + roll[3] * r.height), 1);
      const qx = 2 * cx / cH;
      const qy = 2 * cy / cH;
      const inv = 1 / Math.sqrt(qx * qx + qy * qy + LENS * LENS);
      return { dx: qx * inv, dy: qy * inv, dz: -LENS * inv };
    }
    function onPointerDown(e) {
      if (propsRef.current.drag <= 0 || nodeCount < 3 || grabIndex >= 0) return;
      // Never block clicks on real buttons, links, or form controls
      if (e.target && e.target.closest && e.target.closest("button, a, input, select, textarea, [role='button']")) {
        return;
      }
      const r = host.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        return;
      }
      const { dx, dy, dz } = rayFor(e.clientX, e.clientY);
      let best = -1;
      let bestD = pickRadius;
      let bestT = 0;
      for (let i = 1; i < nodeCount - 1; i++) {
        const vx = px[i] - camX;
        const vy = py[i] - camY;
        const vz = pz[i] - camZ;
        const t = vx * dx + vy * dy + vz * dz;
        if (t <= 0) continue;
        const ex = vx - dx * t;
        const ey = vy - dy * t;
        const ez = vz - dz * t;
        const d = Math.sqrt(ex * ex + ey * ey + ez * ez);
        if (d < bestD) {
          bestD = d;
          best = i;
          bestT = t;
        }
      }
      if (best < 0) return;
      grabIndex = best;
      grabDepth = bestT;
      grabX = camX + dx * bestT;
      grabY = camY + dy * bestT;
      grabZ = camZ + dz * bestT;
      grabPointer = e.pointerId;
      document.body.style.cursor = "grabbing";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      e.preventDefault();
    }
    function onPointerMove(e) {
      if (grabIndex < 0 || e.pointerId !== grabPointer) return;
      const { dx, dy, dz } = rayFor(e.clientX, e.clientY);
      grabX = camX + dx * grabDepth;
      grabY = camY + dy * grabDepth;
      grabZ = camZ + dz * grabDepth;
      e.preventDefault();
    }
    function release() {
      grabIndex = -1;
      grabPointer = -1;
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    }
    function onPointerUp(e) {
      if (e.pointerId === grabPointer) release();
    }
    function onPointerHover(e) {
      if (grabIndex >= 0 || propsRef.current.drag <= 0) return;
      if (e.target && e.target.closest && e.target.closest("button, a, input, select, textarea, [role='button']")) {
        if (document.body.style.cursor === "grab") document.body.style.cursor = "";
        return;
      }
      const r = host.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        if (document.body.style.cursor === "grab") document.body.style.cursor = "";
        return;
      }
      const { dx, dy, dz } = rayFor(e.clientX, e.clientY);
      let isNear = false;
      for (let i = 1; i < nodeCount - 1; i++) {
        const vx = px[i] - camX;
        const vy = py[i] - camY;
        const vz = pz[i] - camZ;
        const t = vx * dx + vy * dy + vz * dz;
        if (t <= 0) continue;
        const ex = vx - dx * t;
        const ey = vy - dy * t;
        const ez = vz - dz * t;
        const d = Math.sqrt(ex * ex + ey * ey + ez * ez);
        if (d < pickRadius) {
          isNear = true;
          break;
        }
      }
      if (isNear) {
        document.body.style.cursor = "grab";
      } else if (document.body.style.cursor === "grab") {
        document.body.style.cursor = "";
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerHover);
    let raf = 0;
    let last = 0;
    let swayPhase = 0;
    let driftClock = 0;
    let morphClock = 0;
    let acc = 0;
    let visible = true;
    let cursorState = "";
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 }
    );
    io.observe(host);
    const ro = new ResizeObserver(() => resize());
    ro.observe(host);
    resize();
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible || W === 0) {
        last = now;
        return;
      }
      const dt = last === 0 ? 1 / 60 : Math.min((now - last) / 1e3, 0.05);
      last = now;
      const p = propsRef.current;
      roll = ROLL[p.direction] ?? ROLL.down;
      if (p.direction !== lastDir) {
        lastDir = p.direction;
        fitSnap = true;
        firstFrame = true;
      }
      swayPhase += dt * SWAY_RATE * (Math.max(p.speed, 0) / 50);
      const n = Math.max(MIN_LINKS, Math.min(Math.round(p.density), MAX_LINKS));
      const le = (0.3 + clamp01(p.linkLength / 100) * 1.2) * R1;
      const r2 = (0.14 + clamp01(p.linkThickness / 100) * 0.34) * R1;
      const key = `${n}|${le.toFixed(4)}|${r2.toFixed(4)}`;
      if (key !== geomKey) {
        geomKey = key;
        pitch = 2 * (le + R1 - r2) - 0.25 * R1;
        maxPitch = 2 * (le + R1 - r2) - CLAMP_MARGIN * R1;
        cosMaxBend = Math.cos(articulationLimit(le, r2, maxPitch) * BEND_SAFETY);
        linkLe = le;
        linkR2 = r2;
        ropeLen = pitch * (n - 1);
        setAnchorGeometry(p.spread);
        buildRope(n, le, r2);
        for (let i = 0; i < WARMUP_STEPS; i++) step(SUB_DT, swayPhase, p.sway);
        firstFrame = true;
        fitSnap = true;
      } else {
        setAnchorGeometry(p.spread);
      }
      if (p.drag <= 0 && grabIndex >= 0) release();
      grabPull = 0.40 + clamp01(p.drag / 100) * 0.55;
      acc += dt;
      let steps = 0;
      while (acc >= SUB_DT && steps < MAX_SUBSTEPS) {
        step(SUB_DT, swayPhase, p.sway);
        acc -= SUB_DT;
        steps++;
      }
      if (acc > SUB_DT * MAX_SUBSTEPS) acc = 0;
      const bound = le + R1 + r2;
      const { groups, hull, xMin, xMax } = pack(bound);
      const aspect = Math.abs(roll[0] * W + roll[2] * H) / Math.max(Math.abs(roll[1] * W + roll[3] * H), 1);
      const fill = FILL / (Math.max(p.distance, 1) / 100);
      const kDn = 1 - Math.exp(-dt / 4);
      fitMidX = 0;

      // Anchors emerge gracefully from ~8% (left) and ~92% (right) across viewport
      const targetSpan = aspect < 1.0 ? 0.90 : 0.84;
      const b = (anchorGap / 2) + bound * 0.35;
      const dh = (LENS * b) / (targetSpan * aspect * (fill / FILL));
      let wantCamZ = dh;
      for (let i = 0; i < n; i++) {
        const c = pz[i] + bound;
        if (c + bound > wantCamZ) wantCamZ = c + bound;
      }
      if (fitSnap) {
        camZ = wantCamZ;
        fitSnap = false;
      } else {
        const kUp = 1 - Math.exp(-dt / 0.12);
        camZ += (wantCamZ - camZ) * (wantCamZ > camZ ? kUp : kDn);
      }
      camX = 0;
      camY = -camZ / LENS;
      const cssCanonH = Math.max(Math.abs(roll[1] * cssPxW + roll[3] * cssPxH), 1);
      const worldPerPx = 2 / cssCanonH * (camZ / LENS);
      pickRadius = Math.max(bound * 2.5, 75 * worldPerPx);
      const wantCursor = p.drag > 0 ? grabIndex >= 0 ? "grabbing" : "grab" : "default";
      if (wantCursor !== cursorState) {
        cursorState = wantCursor;
        host.style.cursor = wantCursor;
      }
      const list = p.colors && p.colors.length ? p.colors : DEFAULT_PALETTE;
      const pal = list.slice(0, MAX_PAL);
      for (let i = 0; i < pal.length; i++) {
        const c = readColour(pal[i]);
        bufPal[i * 3] = c[0];
        bufPal[i * 3 + 1] = c[1];
        bufPal[i * 3 + 2] = c[2];
      }
      driftClock += dt * DRIFT_RATE * (Math.max(p.drift, 0) / 50);
      morphClock += dt * MORPH_RATE * (Math.max(p.morph, 0) / 50);
      const base = 1 - SMEAR;
      let mixAmt = 1 - Math.pow(1 - base, dt * 60);
      if (firstFrame) {
        mixAmt = 1;
        firstFrame = false;
      }
      const write = 1 - readIdx;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[write]);
      gl.viewport(0, 0, W, H);
      gl.useProgram(sceneProg);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.res, W, H);
      gl.uniform4fv(u.A, bufA);
      gl.uniform4fv(u.B, bufB);
      gl.uniform4fv(u.C, bufC);
      gl.uniform4fv(u.G, bufG);
      gl.uniform1i(u.linkCount, n);
      gl.uniform1i(u.groupCount, groups);
      gl.uniform1f(u.le, le);
      gl.uniform1f(u.r1, R1);
      gl.uniform1f(u.r2, r2);
      gl.uniform1f(u.bound, bound);
      gl.uniform4f(u.hull, hull[0], hull[1], hull[2], hull[3]);
      gl.uniform3f(u.camPos, camX, camY, camZ);
      gl.uniform3f(u.camTarget, camX, camY, 0);
      gl.uniform3fv(u.pal, bufPal);
      gl.uniform1i(u.palCount, Math.max(pal.length, 1));
      gl.uniform1f(u.colScale, COL_SCALE / (Math.max(p.scale, 1) / 100));
      gl.uniform1f(u.colDrift, driftClock);
      gl.uniform1f(u.colMorph, morphClock);
      gl.uniform1f(u.metal, p.metallic ? 1 : 0);
      gl.uniform1f(u.mix, mixAmt);
      gl.uniformMatrix2fv(u.roll, false, roll);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex[readIdx]);
      gl.uniform1i(u.hist, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(presentProg);
      gl.uniform2f(pu.res, W, H);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex[write]);
      gl.uniform1i(pu.tex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      readIdx = write;
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerHover);
      release();
      for (let i = 0; i < 2; i++) {
        if (tex[i]) gl.deleteTexture(tex[i]);
        if (fbo[i]) gl.deleteFramebuffer(fbo[i]);
      }
      gl.deleteVertexArray(vao);
      gl.deleteProgram(sceneProg);
      gl.deleteProgram(presentProg);
    };
  }, []);
  return <div
    ref={hostRef}
    style={{
      // Floor BEFORE the spread: the canvas is absolutely positioned,
      // so the root has no in-flow content and would collapse under
      // Framer's Fit Content sizing.
      minWidth: 0,
      minHeight: 0,
      width: "100%",
      height: "100%",
      position: "relative",
      overflow: "hidden",
      background,
      // Without this a touch drag scrolls the page instead of pulling
      // the chain, and pointermove stops arriving mid-gesture.
      touchAction: drag > 0 ? "none" : "auto",
      ...style
    }}
  >
            <canvas
    ref={canvasRef}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
  />
        </div>;
}

export { TaffyChain };
