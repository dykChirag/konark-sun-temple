/**
 * Konark Sun Temple — digital prototype
 * Experiment 8, IKS Lab
 *
 * This file has four parts a student can demo one by one:
 *   1. Navigation, scroll progress, and reveal-on-scroll
 *   2. Three.js model of the chariot (wheels, horses, hall, tower)
 *   3. Canvas sundial — shadow angle at 15° per hour
 *   4. Five-question quiz
 *
 * Three.js is loaded from a CDN the first time the page is opened.
 * Everything else is in this folder.
 */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================
   1. Page chrome
   ============================================================ */

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("site-nav");
  const links = [...menu.querySelectorAll("a")];
  const progress = document.getElementById("scroll-progress");

  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";

    const mark = window.scrollY + 130;
    let current = "";
    sections.forEach((section) => {
      if (section.offsetTop <= mark) current = section.id;
    });
    links.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + current);
    });
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );
  nodes.forEach((node) => observer.observe(node));
}

/* ============================================================
   2. Hotspot copy
   Clicking the model and clicking the buttons share this text.
   ============================================================ */

const HOTSPOTS = {
  intro: {
    kicker: "How to look",
    title: "A chariot of stone",
    body: "Drag to turn the model, or use the buttons under it. Scroll to move closer. Gold markers sit on a wheel, the horses, the hall, and the tower — any of those parts can be clicked. On the real temple the horses face east, toward sunrise. The dance hall further east is left out so the chariot stays easy to read. This is a schematic for the lab, not a measured survey."
  },
  wheel: {
    kicker: "Plinth · about 3 metres across",
    title: "A wheel that keeps time",
    body: "Twenty-four wheels run along the plinth in twelve pairs. Eight thick spokes divide the day into eight praharas of three hours, with a thinner spoke between them. Read as a sundial, the shadow moves 15° each hour — a quarter of a degree each minute — which is the geometry behind the claim that a careful reading can reach the minute. One pair is also read as one month, and the full set of twenty-four as the hours of the day or the fortnights of the year."
  },
  horse: {
    kicker: "East front · stone team",
    title: "Seven horses, seven days",
    body: "Seven horses draw Surya’s chariot toward the sunrise. In the temple’s number code they are the seven days of the week. They are sculptures in the same stone as the walls, not a separate material, which is why this model keeps them in a darker stone colour. The count is part of the design: seven days, twenty-four wheels, twelve pairs."
  },
  hall: {
    kicker: "What still stands",
    title: "The jagamohana",
    body: "The audience hall is a pidha deul: a pyramid of flat stone tiers. It is the mass that still dominates the site. The sanctum sits on its west side; the dance hall, not modelled here, stands further east. In 1903–1905 the interior was filled with sand so the corbelled roof would not collapse. A stepped pyramid keeps each course shorter than the one below it, which is why this hall outlasted the slender tower."
  },
  tower: {
    kicker: "Reconstruction · the tower is gone",
    title: "The shikhara",
    body: "The sanctum once rose under a tall curvilinear tower, a rekha deul, crowned by a kalasha. That tower was already down by the nineteenth century. The gold finial here only marks the idea of the crown. A later legend says a lodestone at the summit disturbed ships’ compasses. Treat that as a story about a tower famous enough to be a sea-mark — the Black Pagoda — not as an object recovered from the site."
  }
};

let activeHotspot = "intro";

function showHotspot(id, fromModel) {
  const item = HOTSPOTS[id] || HOTSPOTS.intro;
  activeHotspot = HOTSPOTS[id] ? id : "intro";
  document.getElementById("info-kicker").textContent = item.kicker;
  document.getElementById("info-title").textContent = item.title;
  document.getElementById("info-body").textContent = item.body;
  document.querySelectorAll("[data-hotspot]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.hotspot === activeHotspot));
  });
  if (fromModel && window.matchMedia("(max-width: 900px)").matches) {
    document.getElementById("info-panel").scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest"
    });
  }
}

function initHotspots() {
  document.querySelectorAll("[data-hotspot]").forEach((button) => {
    button.addEventListener("click", () => showHotspot(button.dataset.hotspot, false));
  });
}

/* ============================================================
   3. Three.js chariot
   Geometry is cylinders, boxes, and cones-style stacks.
   No external model file. East is +Z, so the horses sit at +Z.
   ============================================================ */

function initViewer() {
  const container = document.getElementById("viewer");
  const status = document.getElementById("viewer-status");

  import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js")
    .then((THREE) => {
      startScene(THREE, container);
      status.hidden = true;
    })
    .catch(() => {
      status.hidden = false;
      status.textContent =
        "The 3D library did not load. Open this page once with a network connection so Three.js can be fetched, then refresh. The history, sundial, and quiz work without it.";
    });
}

function startScene(THREE, container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0xc4a574, 0.85));
  scene.add(new THREE.AmbientLight(0xffe6c4, 0.28));

  const sun = new THREE.DirectionalLight(0xfff1d4, 2.15);
  sun.position.set(8, 18, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const extent = 28;
  sun.shadow.camera.left = -extent;
  sun.shadow.camera.right = extent;
  sun.shadow.camera.top = extent;
  sun.shadow.camera.bottom = -extent;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xd9c2a0, 0.45);
  fill.position.set(-12, 8, -10);
  scene.add(fill);

  const mats = {
    stone: new THREE.MeshStandardMaterial({ color: 0xd2b07a, roughness: 0.82, metalness: 0.02 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: 0xb8895a, roughness: 0.88, metalness: 0.02 }),
    stoneDeep: new THREE.MeshStandardMaterial({ color: 0x8d6244, roughness: 0.9, metalness: 0.03 }),
    horse: new THREE.MeshStandardMaterial({ color: 0x7b5138, roughness: 0.78 }),
    horseDark: new THREE.MeshStandardMaterial({ color: 0x5c3a28, roughness: 0.8 }),
    gold: new THREE.MeshStandardMaterial({
      color: 0xe1b34a,
      roughness: 0.32,
      metalness: 0.62,
      emissive: 0x6a4a10,
      emissiveIntensity: 0.35
    })
  };

  const built = buildTemple(THREE, mats);
  scene.add(built.root);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(built.groundRadius, 64),
    new THREE.MeshStandardMaterial({ color: 0xe4d0ad, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(built.groundRadius - 0.35, built.groundRadius - 0.12, 80),
    new THREE.MeshBasicMaterial({ color: 0xc8962e, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);

  /* Camera orbits the chariot. Yaw swings around Y; pitch lifts the view. */
  let targetYaw = 0.72;
  let targetPitch = 0.42;
  let targetDist = built.cameraDist;
  let yaw = targetYaw;
  let pitch = targetPitch;
  let dist = targetDist;
  const home = { yaw, pitch, dist };
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;
  let quietUntil = performance.now() + 2200;
  const look = new THREE.Vector3(0, 3.1, built.lookZ);

  function nudge() {
    quietUntil = performance.now() + 7000;
  }

  function clampTargets() {
    targetPitch = Math.min(1.05, Math.max(0.18, targetPitch));
    targetDist = Math.min(built.cameraDist + 18, Math.max(14, targetDist));
  }

  function updateCamera() {
    clampTargets();
    if (dragging) {
      yaw = targetYaw;
      pitch = targetPitch;
    } else {
      yaw += (targetYaw - yaw) * 0.12;
      pitch += (targetPitch - pitch) * 0.12;
    }
    dist += (targetDist - dist) * 0.12;
    const cp = Math.cos(pitch);
    camera.position.set(
      look.x + Math.sin(yaw) * cp * dist,
      look.y + Math.sin(pitch) * dist,
      look.z + Math.cos(yaw) * cp * dist
    );
    camera.lookAt(look);
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resize();
  new ResizeObserver(resize).observe(container);

  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    container.classList.add("is-dragging");
    container.focus();
    nudge();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    lastX = event.clientX;
    lastY = event.clientY;
    targetYaw -= dx * 0.005;
    targetPitch += dy * 0.0035;
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    container.classList.remove("is-dragging");
    if (!moved) pickPart(event);
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      targetDist *= event.deltaY > 0 ? 1.08 : 0.92;
      nudge();
    },
    { passive: false }
  );

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pickPart(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(built.root, true);
    for (const hit of hits) {
      let node = hit.object;
      while (node) {
        if (node.userData && node.userData.hotspot) {
          showHotspot(node.userData.hotspot, true);
          return;
        }
        node = node.parent;
      }
    }
  }

  /* Keyboard fallback so the model is not mouse-only. */
  container.addEventListener("keydown", (event) => {
    const step = 0.28;
    if (event.key === "ArrowLeft") targetYaw += step;
    else if (event.key === "ArrowRight") targetYaw -= step;
    else if (event.key === "ArrowUp") targetPitch += 0.08;
    else if (event.key === "ArrowDown") targetPitch -= 0.08;
    else if (event.key === "+" || event.key === "=") targetDist /= 1.12;
    else if (event.key === "-" || event.key === "_") targetDist *= 1.12;
    else if (event.key === "r" || event.key === "R") {
      targetYaw = home.yaw;
      targetPitch = home.pitch;
      targetDist = home.dist;
    } else return;
    event.preventDefault();
    nudge();
  });

  document.getElementById("cam-left").addEventListener("click", () => { targetYaw += 0.35; nudge(); });
  document.getElementById("cam-right").addEventListener("click", () => { targetYaw -= 0.35; nudge(); });
  document.getElementById("cam-up").addEventListener("click", () => { targetPitch += 0.1; nudge(); });
  document.getElementById("cam-down").addEventListener("click", () => { targetPitch -= 0.1; nudge(); });
  document.getElementById("cam-in").addEventListener("click", () => { targetDist /= 1.15; nudge(); });
  document.getElementById("cam-out").addEventListener("click", () => { targetDist *= 1.15; nudge(); });
  document.getElementById("cam-reset").addEventListener("click", () => {
    targetYaw = home.yaw;
    targetPitch = home.pitch;
    targetDist = home.dist;
    nudge();
  });

  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    if (!reducedMotion && !dragging && now > quietUntil) targetYaw += 0.0015;
    updateCamera();
    const t = now / 1000;
    built.markers.forEach((marker, index) => {
      const active = marker.userData.hotspot === activeHotspot;
      const scale = (active ? 1.5 : 1) + Math.sin(t * 3 + index) * 0.1;
      marker.scale.setScalar(scale);
      marker.quaternion.copy(camera.quaternion);
    });
    renderer.render(scene, camera);
  }

  animate();
}

/**
 * Sizes live in one place so the plinth, wheels, and horses stay in proportion.
 * Twelve wheels on a side need a long base: spacing is the diameter plus a gap.
 */
function buildTemple(THREE, mats) {
  const wheelCount = 12;
  const R = 0.95;
  const spacing = R * 2 + 0.28;
  const plinthW = 8.6;
  const plinthH = 2.55;
  const plinthD = (wheelCount - 1) * spacing + R * 2 + 2.2;
  const plinthBase = 0.22;
  const plinthTop = plinthBase + plinthH;
  const zStart = -((wheelCount - 1) * spacing) / 2;

  const root = new THREE.Group();
  const markers = [];

  const footing = new THREE.Mesh(
    new THREE.BoxGeometry(plinthW + 1.4, plinthBase, plinthD + 1.1),
    mats.stoneDeep
  );
  footing.position.y = plinthBase / 2;
  footing.receiveShadow = true;
  root.add(footing);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(plinthW, plinthH, plinthD), mats.stone);
  plinth.position.y = plinthBase + plinthH / 2;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  root.add(plinth);

  /* Jagamohana: a pidha pyramid of horizontal courses. */
  const hall = new THREE.Group();
  hall.userData.hotspot = "hall";
  const tiers = [
    [5.15, 0.52],
    [4.55, 0.44],
    [3.95, 0.38],
    [3.35, 0.34],
    [2.75, 0.3],
    [2.15, 0.26],
    [1.6, 0.24],
    [1.05, 0.22]
  ];
  let hy = plinthTop;
  tiers.forEach((tier, index) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(tier[0], tier[1], tier[0] * 0.92),
      index % 2 ? mats.stoneDark : mats.stone
    );
    hy += tier[1] / 2;
    mesh.position.y = hy;
    hy += tier[1] / 2 + 0.02;
    mesh.castShadow = true;
    hall.add(mesh);
  });
  const hallFinial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mats.gold);
  hallFinial.position.y = hy + 0.12;
  hall.add(hallFinial);
  const hallZ = 1.2;
  hall.position.z = hallZ;
  root.add(hall);

  /* Shikhara: width follows a cosine so the tower curves inward near the crown. */
  const tower = new THREE.Group();
  tower.userData.hotspot = "tower";
  const levels = 15;
  const towerBase = 3.25;
  let ty = plinthTop;
  for (let i = 0; i < levels; i++) {
    const t = i / (levels - 1);
    const w = 0.28 + towerBase * Math.cos((t * Math.PI) / 2);
    const h = 0.34;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, w),
      i % 2 ? mats.stoneDark : mats.stone
    );
    ty += h / 2;
    mesh.position.y = ty;
    ty += h / 2 + 0.012;
    mesh.castShadow = true;
    tower.add(mesh);
  }
  const amalaka = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 12), mats.stoneDeep);
  amalaka.position.y = ty + 0.08;
  tower.add(amalaka);
  const kalasha = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mats.gold);
  kalasha.position.y = ty + 0.36;
  tower.add(kalasha);
  const towerZ = hallZ - (5.15 * 0.92) / 2 - towerBase / 2 + 0.2;
  tower.position.z = towerZ;
  root.add(tower);

  addMarker(THREE, markers, mats.gold, hallZ, hy + 0.7, 0, "hall", root);
  addMarker(THREE, markers, mats.gold, towerZ, ty + 0.85, 0, "tower", root);

  /* One wheel geometry, reused. Eight thick spokes and eight thin ones. */
  const createWheel = makeWheelFactory(THREE, mats, R);
  const wheelY = plinthBase + plinthH * 0.52;
  for (let i = 0; i < wheelCount; i++) {
    const z = zStart + i * spacing;
    [1, -1].forEach((side) => {
      const wheel = createWheel();
      wheel.userData.hotspot = "wheel";
      wheel.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      wheel.position.set(side * (plinthW / 2 + 0.18), wheelY, z);
      root.add(wheel);
      if (side === 1 && i === 6) {
        addMarker(
          THREE,
          markers,
          mats.gold,
          z,
          wheelY + R + 0.55,
          side * (plinthW / 2 + 0.18),
          "wheel",
          root
        );
      }
    });
  }

  /* Steps climb to the plinth. The lowest step is the eastern one. */
  const front = plinthD / 2;
  const stepCount = 5;
  const rise = (plinthTop - 0.04) / stepCount;
  for (let i = 0; i < stepCount; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(3.15, rise * 0.9, 0.5),
      i % 2 ? mats.stoneDark : mats.stone
    );
    step.position.set(0, rise * i + rise / 2, front + 0.28 + (stepCount - 1 - i) * 0.55);
    step.castShadow = true;
    step.receiveShadow = true;
    root.add(step);
  }

  const eastEdge = front + 0.28 + (stepCount - 1) * 0.55;
  const yokeZ = eastEdge + 1.35;
  const poleLen = yokeZ - (front - 0.1);
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, poleLen), mats.stoneDeep);
  pole.position.set(0, 0.72, (front - 0.1 + yokeZ) / 2);
  root.add(pole);
  const yoke = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.14, 0.16), mats.stoneDeep);
  yoke.position.set(0, 0.9, yokeZ);
  root.add(yoke);

  for (let i = 0; i < 7; i++) {
    const horse = createHorse(THREE, mats);
    const t = i - 3;
    horse.position.set(t * 0.78, 0, yokeZ + 1.05 + Math.abs(t) * 0.22);
    horse.rotation.y = -t * 0.05;
    root.add(horse);
    if (i === 3) {
      addMarker(THREE, markers, mats.gold, horse.position.z + 0.4, 2.5, 0, "horse", root);
    }
  }

  const groundRadius = yokeZ + 6;
  return {
    root,
    markers,
    groundRadius,
    lookZ: 2.5,
    cameraDist: 46
  };
}

function addMarker(THREE, markers, material, z, y, x, id, root) {
  const marker = new THREE.Group();
  marker.userData.hotspot = id;
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), material);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 24), material);
  marker.add(sphere, halo);
  marker.position.set(x, y, z);
  markers.push(marker);
  root.add(marker);
}

function makeWheelFactory(THREE, mats, R) {
  const rimGeo = new THREE.TorusGeometry(R, R * 0.075, 8, 28);
  const innerGeo = new THREE.TorusGeometry(R * 0.46, 0.025, 6, 24);
  const hubGeo = new THREE.CylinderGeometry(R * 0.13, R * 0.15, 0.2, 12);
  const axleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.42, 8);
  const majorGeo = new THREE.BoxGeometry(0.06, R * 1.78, 0.09);
  const minorGeo = new THREE.BoxGeometry(0.028, R * 1.7, 0.045);

  return function createWheel() {
    const wheel = new THREE.Group();
    const rim = new THREE.Mesh(rimGeo, mats.stone);
    rim.castShadow = true;
    wheel.add(rim);
    wheel.add(new THREE.Mesh(innerGeo, mats.stoneDark));

    const hub = new THREE.Mesh(hubGeo, mats.stoneDeep);
    hub.rotation.x = Math.PI / 2;
    wheel.add(hub);

    const axle = new THREE.Mesh(axleGeo, mats.stoneDeep);
    axle.rotation.x = Math.PI / 2;
    axle.position.z = -0.26;
    wheel.add(axle);

    for (let i = 0; i < 8; i++) {
      const major = new THREE.Mesh(majorGeo, mats.stone);
      major.rotation.z = (i * Math.PI) / 4;
      wheel.add(major);
      const minor = new THREE.Mesh(minorGeo, mats.stoneDark);
      minor.rotation.z = (i * Math.PI) / 4 + Math.PI / 8;
      wheel.add(minor);
    }
    return wheel;
  };
}

function createHorse(THREE, mats) {
  const horse = new THREE.Group();
  horse.userData.hotspot = "horse";

  const legGeo = new THREE.CylinderGeometry(0.045, 0.034, 0.46, 6);
  [
    [-0.1, 0.23, 0.28],
    [0.1, 0.23, 0.28],
    [-0.1, 0.23, -0.28],
    [0.1, 0.23, -0.28]
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, mats.horse);
    leg.position.set(x, y, z);
    horse.add(leg);
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.92), mats.horse);
  body.position.set(0, 0.58, 0);
  body.castShadow = true;
  horse.add(body);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.16), mats.horse);
  neck.position.set(0, 0.86, 0.32);
  neck.rotation.x = -0.65;
  neck.castShadow = true;
  horse.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.36), mats.horse);
  head.position.set(0, 1.05, 0.52);
  head.castShadow = true;
  horse.add(head);

  [-0.05, 0.05].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), mats.horseDark);
    ear.position.set(x, 1.16, 0.46);
    horse.add(ear);
  });

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), mats.horseDark);
  tail.position.set(0, 0.64, -0.5);
  tail.rotation.x = 0.45;
  horse.add(tail);

  horse.scale.setScalar(1.6);
  return horse;
}

/* ============================================================
   4. Sundial
   Minutes are counted from 6:00 am (0) to 6:00 pm (720).
   Shadow angle from noon = (hours − 12) × 15°.
   A neighbouring major spoke is 45°, which is 3 hours: one prahara.
   ============================================================ */

function initSundial() {
  const canvas = document.getElementById("sundial-canvas");
  const wrap = document.querySelector(".sundial-canvas-wrap");
  const slider = document.getElementById("sd-slider");
  const playBtn = document.getElementById("sd-play");
  const timeEl = document.getElementById("sd-time");
  const angleEl = document.getElementById("sd-angle");
  const spokeEl = document.getElementById("sd-spoke");
  let minutes = 360;
  let playing = false;
  let last = performance.now();

  function size() {
    const width = wrap.clientWidth;
    if (!width) return;
    const height = Math.max(280, Math.round(width * 0.72));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  function draw() {
    const ctx = canvas.getContext("2d");
    const dpr = canvas.width / canvas.clientWidth;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (!W || !H) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5;
    const cy = H * 0.5;
    const radius = Math.min(W * 0.3, H * 0.32);
    const hours = 6 + minutes / 60;
    const t = minutes / 720;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#edd9b4";
    ctx.fill();
    ctx.lineWidth = Math.max(6, radius * 0.045);
    ctx.strokeStyle = "#6e2433";
    ctx.stroke();

    ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      spoke(ctx, cx, cy, angle, radius - 8, Math.max(3, radius * 0.03), "#4a1522");
    }
    for (let i = 0; i < 8; i++) {
      spoke(ctx, cx, cy, (i * Math.PI) / 4 + Math.PI / 8, radius - 12, radius * 0.012, "#8a4b32");
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = "#6e2433";
    ctx.fill();

    /* Sun travels the upper arc: left at sunrise, top at noon, right at sunset. */
    const orbit = radius * 1.28;
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = Math.PI + (i / 48) * Math.PI;
      const x = cx + Math.cos(a) * orbit;
      const y = cy + Math.sin(a) * orbit;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(168, 98, 32, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const sunAngle = Math.PI + t * Math.PI;
    const sx = cx + Math.cos(sunAngle) * orbit;
    const sy = cy + Math.sin(sunAngle) * orbit;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(10, radius * 0.09), 0, Math.PI * 2);
    ctx.fillStyle = "#f0c14e";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#a97820";
    ctx.stroke();

    /* Shadow is opposite the sun, so it stays on the lower half of the wheel. */
    const shadowAngle = t * Math.PI;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(shadowAngle);
    ctx.fillStyle = "rgba(74, 21, 34, 0.28)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius - 14, radius * 0.07);
    ctx.lineTo(radius - 14, -radius * 0.07);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#4a1522";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius - 16, 0);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#4a1522";
    ctx.font = "600 13px Outfit, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    [
      [6, "6 am"],
      [9, "9"],
      [12, "12"],
      [15, "3"],
      [18, "6 pm"]
    ].forEach(([hour, label]) => {
      const a = ((hour - 6) / 12) * Math.PI;
      ctx.fillText(label, cx + Math.cos(a) * (radius + 22), cy + Math.sin(a) * (radius + 22));
    });

    timeEl.textContent = formatClock(hours);
    const degrees = (hours - 12) * 15;
    const side = degrees === 0 ? "on the noon spoke" : degrees < 0 ? "morning side" : "evening side";
    angleEl.textContent = Math.abs(degrees).toFixed(1) + "°";
    document.getElementById("sd-side").textContent = side;
    spokeEl.textContent = nearestSpoke(hours);
  }

  function frame(now) {
    const dt = Math.min(40, now - last);
    last = now;
    if (playing) {
      minutes += (dt / 1000) * 36;
      if (minutes > 720) minutes = 0;
      slider.value = String(minutes);
    }
    draw();
    requestAnimationFrame(frame);
  }

  slider.addEventListener("input", () => {
    minutes = Number(slider.value);
  });

  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "Pause" : "Play the day";
    playBtn.setAttribute("aria-pressed", String(playing));
  });

  document.querySelectorAll("[data-time]").forEach((button) => {
    button.addEventListener("click", () => {
      minutes = Number(button.dataset.time);
      slider.value = String(minutes);
    });
  });

  size();
  new ResizeObserver(size).observe(wrap);
  requestAnimationFrame(frame);
}

function spoke(ctx, cx, cy, angle, length, width, color) {
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function formatClock(hours) {
  const total = Math.round(hours * 60);
  let hh = Math.floor(total / 60);
  const mm = total % 60;
  const ap = hh >= 12 ? "pm" : "am";
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  return h12 + ":" + String(mm).padStart(2, "0") + " " + ap;
}

function nearestSpoke(hours) {
  const marks = [6, 9, 12, 15, 18];
  let best = 12;
  let gap = 99;
  marks.forEach((mark) => {
    const d = Math.abs(hours - mark);
    if (d < gap) {
      gap = d;
      best = mark;
    }
  });
  const label = best === 12 ? "12:00 noon" : formatClock(best);
  if (gap < 0.18) return "On the " + label + " spoke";
  return "Nearest major spoke: " + label;
}

/* ============================================================
   5. Quiz
   The answer key is the `answer` index on each question.
   ============================================================ */

const QUESTIONS = [
  {
    q: "Who had the Konark Sun Temple built?",
    options: [
      "Ashoka of the Maurya dynasty",
      "Narasimhadeva I of the Eastern Ganga dynasty",
      "Krishnadevaraya of Vijayanagara",
      "Raja Raja Chola I"
    ],
    answer: 1,
    why: "It was raised in the 13th century under Narasimhadeva I, who ruled from 1238 to 1264."
  },
  {
    q: "When was the temple inscribed as a UNESCO World Heritage Site?",
    options: ["1947", "1863", "1984", "2010"],
    answer: 2,
    why: "UNESCO inscribed the Sun Temple at Konark in 1984."
  },
  {
    q: "In the chariot’s number code, the seven horses stand for",
    options: [
      "The seven days of the week",
      "Seven rivers of Odisha",
      "The seven storeys of the tower",
      "Seven gates in the compound wall"
    ],
    answer: 0,
    why: "The team is read as the seven days. The twenty-four wheels are read as the hours."
  },
  {
    q: "In the sundial model, how fast does the shadow move?",
    options: ["8° each hour", "45° each minute", "1° each hour", "15° each hour"],
    answer: 3,
    why: "The Earth turns 360° in 24 hours, so the rate is 15° an hour, or 0.25° a minute. A major spoke is 45° away, which is three hours — one prahara."
  },
  {
    q: "Twelve pairs of wheels are taken to mean",
    options: [
      "Twelve kings of the Eastern Ganga line",
      "The twelve months",
      "Twelve gates",
      "Only the twelve hours of daylight"
    ],
    answer: 1,
    why: "Each pair is read as one month, alongside the reading of twenty-four wheels as twenty-four hours."
  }
];

function initQuiz() {
  const progress = document.getElementById("quiz-progress");
  const questionEl = document.getElementById("quiz-question");
  const optionsEl = document.getElementById("quiz-options");
  const feedback = document.getElementById("quiz-feedback");
  const nextBtn = document.getElementById("quiz-next");
  const play = document.getElementById("quiz-play");
  const scoreView = document.getElementById("quiz-score");
  const scoreNum = document.getElementById("score-num");
  const scoreMsg = document.getElementById("score-msg");
  let index = 0;
  let score = 0;
  let locked = false;

  questionEl.tabIndex = -1;

  function render() {
    const item = QUESTIONS[index];
    locked = false;
    progress.textContent = "Question " + (index + 1) + " of " + QUESTIONS.length;
    questionEl.textContent = item.q;
    feedback.textContent = "";
    nextBtn.hidden = true;
    optionsEl.innerHTML = "";
    item.options.forEach((text, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option";
      button.innerHTML = "<span>" + text + "</span><span class='tag'></span>";
      button.addEventListener("click", () => choose(optionIndex, button));
      optionsEl.appendChild(button);
    });
  }

  function choose(optionIndex, button) {
    if (locked) return;
    locked = true;
    const item = QUESTIONS[index];
    const correct = optionIndex === item.answer;
    if (correct) score += 1;
    [...optionsEl.children].forEach((option, i) => {
      option.disabled = true;
      if (i === item.answer) {
        option.classList.add("is-correct");
        option.querySelector(".tag").textContent = "Answer";
      }
    });
    if (!correct) {
      button.classList.add("is-wrong");
      button.querySelector(".tag").textContent = "Your choice";
    }
    feedback.textContent = (correct ? "Correct. " : "Not quite. ") + item.why;
    nextBtn.hidden = false;
    nextBtn.textContent = index === QUESTIONS.length - 1 ? "See score" : "Next question";
    nextBtn.focus();
  }

  nextBtn.addEventListener("click", () => {
    if (index === QUESTIONS.length - 1) {
      play.hidden = true;
      scoreView.hidden = false;
      scoreNum.textContent = score + " / " + QUESTIONS.length;
      scoreMsg.textContent =
        score === 5
          ? "You can walk a visitor through the chariot, the sundial rate, and the UNESCO date."
          : score >= 3
            ? "Solid. Revisit the sundial or the number code, then try once more."
            : "Scroll back through the wheels and the architecture section, then retry.";
      return;
    }
    index += 1;
    render();
    questionEl.focus();
  });

  document.getElementById("quiz-retry").addEventListener("click", () => {
    index = 0;
    score = 0;
    scoreView.hidden = true;
    play.hidden = false;
    render();
    questionEl.focus();
  });

  render();
}

initNav();
initReveal();
initHotspots();
initSundial();
initQuiz();
initViewer();
