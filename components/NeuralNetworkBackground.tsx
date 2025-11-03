import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// 定義 linesData 中每個物件的型別
interface LineData {
    lineObject: THREE.LineSegments;
    endpoints: { index1: number; index2: number };
    currentOpacity: number;
    state: 'FADE_IN' | 'FADE_OUT';
    fadeRate: number;
    maxOpacity: number;
}

// 定義 THREE.js 物件的型別
interface ThreeState {
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    particles: THREE.Points | null;
    linesData: LineData[];
    animationFrameId?: number;
}

// 神經網路背景動畫元件
const NeuralNetworkBackground = ({ children }: { children?: React.ReactNode }) => {
    // 使用 useRef 來存取 DOM 元素和 THREE.js 物件
    const mountRef = useRef<HTMLDivElement>(null);
    const threeRef = useRef<ThreeState>({
        scene: null,
        camera: null,
        renderer: null,
        particles: null,
        linesData: [],
    });

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const { scene, camera, renderer, particles, linesData } = threeRef.current;
        const particleCount = 10000;
        const lineCount = 10;
        let mouseX = 0;
        let mouseY = 0;

        // 攝影機自動移動變數
        const cameraAutoTarget = new THREE.Vector3();
        let lastAutoMoveTime = 0;
        const autoMoveInterval = 7000;

        // 初始化場景
        const init = (): void => {
            threeRef.current.scene = new THREE.Scene();
            threeRef.current.scene.fog = new THREE.FogExp2(0x000000, 0.0005);

            const containerWidth = currentMount.clientWidth;
            const containerHeight = currentMount.clientHeight;

            threeRef.current.camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 1, 1000);
            threeRef.current.camera.position.z = 250;

            threeRef.current.renderer = new THREE.WebGLRenderer({ antialias: true });
            threeRef.current.renderer.setPixelRatio(window.devicePixelRatio);
            threeRef.current.renderer.setSize(containerWidth, containerHeight);
            currentMount.appendChild(threeRef.current.renderer.domElement);

            // 創建粒子
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const color = new THREE.Color();

            for (let i = 0; i < particleCount; i++) {
                const x = (Math.random() - 0.5) * 2000;
                const y = (Math.random() - 0.5) * 2000;
                const z = (Math.random() - 0.5) * 2000;
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;

                color.setHSL(0.6, 1.0, 0.5 + Math.random() * 0.5);
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size: 3,
                vertexColors: true,
                transparent: true,
                opacity: 0.8
            });

            threeRef.current.particles = new THREE.Points(geometry, material);
            threeRef.current.scene.add(threeRef.current.particles);

            // 創建動態連線
            for (let i = 0; i < lineCount; i++) {
                const lineGeometry = new THREE.BufferGeometry();
                lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));

                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0xa0d9f9,
                    transparent: true,
                    opacity: 0
                });

                const line = new THREE.LineSegments(lineGeometry, lineMaterial);
                threeRef.current.scene.add(line);

                threeRef.current.linesData.push({
                    lineObject: line,
                    endpoints: { index1: 0, index2: 0 },
                    currentOpacity: Math.random() * 0.5,
                    state: 'FADE_IN',
                    fadeRate: 0.005 + Math.random() * 0.01,
                    maxOpacity: 0.3 + Math.random() * 0.4
                });

                generateNewLine(i);
            }

            setNewCameraAutoTarget();
        };

        const generateNewLine = (lineIndex: number): void => {
            const currentParticles = threeRef.current.particles;
            const currentLinesData = threeRef.current.linesData;
            if (!currentParticles) return;

            const index1 = Math.floor(Math.random() * particleCount);
            let index2 = Math.floor(Math.random() * particleCount);
            while (index2 === index1) {
                index2 = Math.floor(Math.random() * particleCount);
            }

            const lineData = currentLinesData[lineIndex];
            lineData.endpoints.index1 = index1;
            lineData.endpoints.index2 = index2;

            const particlePositions = currentParticles.geometry.attributes.position.array;
            const linePositions = lineData.lineObject.geometry.attributes.position.array;

            const pos1 = new THREE.Vector3(particlePositions[index1 * 3], particlePositions[index1 * 3 + 1], particlePositions[index1 * 3 + 2]);
            const pos2 = new THREE.Vector3(particlePositions[index2 * 3], particlePositions[index2 * 3 + 1], particlePositions[index2 * 3 + 2]);

            linePositions[0] = pos1.x;
            linePositions[1] = pos1.y;
            linePositions[2] = pos1.z;
            linePositions[3] = pos2.x;
            linePositions[4] = pos2.y;
            linePositions[5] = pos2.z;

            lineData.lineObject.geometry.attributes.position.needsUpdate = true;

            lineData.currentOpacity = 0;
            lineData.state = 'FADE_IN';
            lineData.fadeRate = 0.005 + Math.random() * 0.01;
            lineData.maxOpacity = 0.3 + Math.random() * 0.4;
        };

        const setNewCameraAutoTarget = (): void => {
            cameraAutoTarget.set(
                (Math.random() - 0.5) * 400,
                (Math.random() - 0.5) * 400,
                (Math.random() - 0.5) * 400
            );
            lastAutoMoveTime = Date.now();
        };

        // 主要動畫迴圈
        const animate = (): void => {
            const { scene, camera, renderer, particles, linesData } = threeRef.current;
            if (!scene || !camera || !renderer || !particles) return;

            const now = Date.now();
            if (now - lastAutoMoveTime > autoMoveInterval) {
                setNewCameraAutoTarget();
            }

            const combinedTargetX = cameraAutoTarget.x + mouseX;
            const combinedTargetY = cameraAutoTarget.y + (-mouseY);

            camera.position.x += (combinedTargetX - camera.position.x) * 0.02;
            camera.position.y += (combinedTargetY - camera.position.y) * 0.02;
            camera.lookAt(scene.position);

            const particlePositions = particles.geometry.attributes.position.array;
            const particleColors = particles.geometry.attributes.color.array;

            const baseColor = new THREE.Color(0xcccccc);
            const waveColor = new THREE.Color(0x4a90e2);

            for (let i = 0; i < particleCount; i++) {
                const z = particlePositions[i * 3 + 2];
                const waveIntensity = (Math.sin(z * 0.005 + now * 0.002) + 1) / 2;

                const finalColor = new THREE.Color();
                finalColor.lerpColors(baseColor, waveColor, waveIntensity);

                particleColors[i * 3] = finalColor.r;
                particleColors[i * 3 + 1] = finalColor.g;
                particleColors[i * 3 + 2] = finalColor.b;
            }
            particles.geometry.attributes.color.needsUpdate = true;

            for (let i = 0; i < lineCount; i++) {
                const lineData = linesData[i];

                if (lineData.state === 'FADE_IN') {
                    lineData.currentOpacity += lineData.fadeRate;
                    if (lineData.currentOpacity >= lineData.maxOpacity) {
                        lineData.state = 'FADE_OUT';
                    }
                } else if (lineData.state === 'FADE_OUT') {
                    lineData.currentOpacity -= lineData.fadeRate;
                    if (lineData.currentOpacity <= 0) {
                        generateNewLine(i);
                    }
                }
                (lineData.lineObject.material as THREE.Material).opacity = lineData.currentOpacity;
            }

            renderer.render(scene, camera);
            threeRef.current.animationFrameId = requestAnimationFrame(animate);
        };

        const onWindowResize = (): void => {
            const { camera, renderer } = threeRef.current;
            const currentMount = mountRef.current;
            if (!camera || !renderer || !currentMount) return;

            // 調整為根據父容器的實際尺寸來設定 Canvas 大小
            const width = currentMount.clientWidth;
            const height = currentMount.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        const onDocumentMouseMove = (event: MouseEvent): void => {
            const currentMount = mountRef.current;
            if (!currentMount) return;
            const containerWidth = currentMount.clientWidth;
            const containerHeight = currentMount.clientHeight;
            mouseX = (event.clientX - containerWidth / 2) * 0.5;
            mouseY = (event.clientY - containerHeight / 2) * 0.5;
        };

        init();
        animate();

        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onDocumentMouseMove);

        // 清理函式
        return () => {
            const { renderer } = threeRef.current;
            if (threeRef.current.animationFrameId) {
                cancelAnimationFrame(threeRef.current.animationFrameId);
            }
            document.removeEventListener('mousemove', onDocumentMouseMove);
            window.removeEventListener('resize', onWindowResize);
            if (currentMount && renderer) {
                currentMount.removeChild(renderer.domElement);
                renderer.dispose();
            }
        };
    }, []);

    return (
        <div className='w-full h-full z-0 fixed top-0 left-0'>
            <div ref={mountRef} className="absolute inset-0 z-0" />
            {/* <div className='absolute inset-0 w-full h-full backdrop-blur-xs ' /> */}
            {children}
        </div>
    );
};

export default NeuralNetworkBackground;
