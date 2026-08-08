import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

type Props = { open: boolean };

export function DiscoBall({ open }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);

    camera.position.set(0, 0, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.appendChild(renderer.domElement);

    // Invisible HDRI environment used only for reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const rgbeLoader = new RGBELoader();

    let envMap: THREE.Texture | null = null;

    rgbeLoader.load("/studio-lights.hdr", (hdrTexture) => {
      envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;

      scene.environment = envMap;
      console.log("HDRI loaded:", envMap);

      hdrTexture.dispose();
      pmremGenerator.dispose();
    });

    // Orange light
    const warmLight = new THREE.PointLight(0xfbb46c, 5.0, 8);

    warmLight.position.set(2.2, 1.8, 3);

    scene.add(warmLight);

    // Pink light
    const pinkLight = new THREE.PointLight(0xff4f9a, 5.0, 8);

    pinkLight.position.set(-2.2, -1.8, 3);

    scene.add(pinkLight);

    // Load disco ball
    const loader = new GLTFLoader();

    loader.load(
      "/Disco_ball_animated.glb",

      (gltf) => {
        const root = gltf.scene;

        let discoBallNode: THREE.Object3D | null = null;

        root.traverse((child) => {
          // Find the rotating disco ball node
          if (child.name === "disco_ball" && !discoBallNode) {
            discoBallNode = child;
          }

          // Find meshes
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

            materials.forEach((material) => {
              const mat = material as THREE.MeshStandardMaterial;

              // Diagnostic information
              console.log("Material:", mat.name);
              console.log("Metalness:", mat.metalness);
              console.log("Roughness:", mat.roughness);
              console.log("Emissive:", mat.emissive);
              console.log("Emissive intensity:", mat.emissiveIntensity);

              // Very weak environment reflection
              mat.envMapIntensity = 1.0;

              mat.metalness = 1.0;
              mat.roughness = 0.025;
              // Make sure the material isn't emitting light
              if (mat.emissive) {
                mat.emissive.set(0x000000);
              }

              mat.emissiveIntensity = 0;

              mat.needsUpdate = true;
            });
          }
        });

        // Center and scale model
        const box = new THREE.Box3().setFromObject(root);

        const center = box.getCenter(new THREE.Vector3());

        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);

        if (maxDim > 0) {
          const scale = 3.4 / maxDim;

          root.scale.set(scale, scale, scale);

          root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        }

        scene.add(root);

        // Rotate only the disco ball node
        modelRef.current = discoBallNode || root;
      },

      undefined,

      (error) => {
        console.error("Error loading GLTF model:", error);
      },
    );

    // Resize
    const handleResize = () => {
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;

      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Animation
    let reqId: number;

    const rotationAxis = new THREE.Vector3(0, 0, 1);

    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (modelRef.current) {
        modelRef.current.rotateOnAxis(rotationAxis, openRef.current ? 0.009 : 0.002);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(reqId);

      window.removeEventListener("resize", handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      envMap?.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="
        pointer-events-none
        fixed
        right-0
        top-[-4vh]
        z-[1]
        h-[56vw]
        max-h-[300px]
        w-[56vw]
        max-w-[300px]
        select-none

        sm:right-[-4vw]
        sm:top-[-8vh]
        sm:h-[min(46vw,540px)]
        sm:max-h-none
        sm:w-[min(46vw,540px)]
        sm:max-w-none
      "
      style={{
        opacity: open ? 1 : 0.5,
        transition: "opacity 2s ease",
      }}
    >
      {/* Hanging wire */}
      <div
        className="
          absolute
          left-1/2
          top-0
          h-[16vh]
          w-px
          -translate-x-1/2
        "
        style={{
          background: "linear-gradient(to bottom, transparent, var(--club-line))",
        }}
      />
      {/* Soft colored haze around the disco ball */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(251,180,108,0.30) 0%, rgba(255,79,154,0.18) 38%, transparent 70%)",
          filter: "blur(45px)",
          opacity: open ? 1.5 : 0.4,
          transition: "opacity 2s ease",
        }}
      />
      {/* Three.js canvas */}
      <div ref={containerRef} className="relative z-10 h-full w-full" />{" "}
    </div>
  );
}
