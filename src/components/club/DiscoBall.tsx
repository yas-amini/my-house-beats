import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type Props = { open: boolean };

/**
 * Native Three.js 3D Disco Ball Component
 * Loads /Disco_ball_animated.glb directly from the public folder into a WebGL canvas.
 * Zero external iframes, zero Sketchfab watermarks/hints, full 60fps local rendering.
 */
export function DiscoBall({ open }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // 4. Lighting setup (Ambient + Directional + Colored Point Lights for facet glints)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLightA = new THREE.PointLight(0xa855f7, 3, 10);
    pointLightA.position.set(-3, 2, 3);
    scene.add(pointLightA);

    const pointLightB = new THREE.PointLight(0x3b82f6, 3, 10);
    pointLightB.position.set(3, -2, 3);
    scene.add(pointLightB);

    // 5. Load GLTF Model
    const loader = new GLTFLoader();
    loader.load(
      "/Disco_ball_animated.glb",
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        // Auto-center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        if (maxDim > 0) {
          const scale = 2.4 / maxDim;
          model.scale.set(scale, scale, scale);
        }
        model.position.sub(center.multiplyScalar(model.scale.x));

        scene.add(model);

        // Process animations if included in GLB
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.play();
          });
          mixerRef.current = mixer;
        }
      },
      undefined,
      (error) => console.error("Error loading GLTF model:", error)
    );

    // 6. Responsive resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 7. Animation Loop
    const clock = new THREE.Clock();
    let reqId: number;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      if (modelRef.current) {
        // Continuous smooth Y rotation
        modelRef.current.rotation.y += open ? 0.008 : 0.002;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [open]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-0 top-[-4vh] z-[1] h-[56vw] max-h-[300px] w-[56vw] max-w-[300px] select-none sm:right-[-4vw] sm:top-[-8vh] sm:h-[min(46vw,540px)] sm:max-h-none sm:w-[min(46vw,540px)] sm:max-w-none"
      style={{
        opacity: open ? 0.95 : 0.4,
        filter: open ? "saturate(1.05)" : "saturate(0.5) blur(1px)",
        transition: "opacity 2s ease, filter 2s ease",
      }}
    >
      {/* rig: hanging wire */}
      <div
        className="absolute left-1/2 top-0 h-[16vh] w-px -translate-x-1/2"
        style={{ background: "linear-gradient(to bottom, transparent, var(--club-line))" }}
      />
      {/* ambient light glow behind ball */}
      <div
        className={`absolute inset-[6%] rounded-full ${open ? "club-ball-glow" : ""}`}
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--club-light-c) 55%, transparent) 0%, transparent 62%)",
          filter: "blur(70px)",
          opacity: open ? 0.75 : 0.25,
          transition: "opacity 2s ease",
        }}
      />
      {/* Native WebGL Canvas */}
      <div
        ref={containerRef}
        className="relative h-full w-full"
        style={{
          mixBlendMode: "screen",
          maskImage: "radial-gradient(circle at 50% 46%, #000 40%, transparent 62%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 46%, #000 40%, transparent 62%)",
        }}
      />
    </div>
  );
}

