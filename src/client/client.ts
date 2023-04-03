import "./styles.css"

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module.js';

//DEFINITION
class Render {
    renderer: any
    controls: OrbitControls
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    stats: Stats
    constructor() {
        this.camera = new THREE.PerspectiveCamera();
        this.camera.position.set(0, 0.5, 1);
        this.camera.fov = 65;

        this.stats = Stats();
        this.stats.setMode(0); // 0: fps, 1: ms
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.left = '0px';
        this.stats.domElement.style.top = '0px';
        document.body.appendChild(this.stats.domElement);

        this.init();

        window.addEventListener('resize', this.resize.bind(this));
    }
    async init() {
        const envMapLDR = await new THREE.TextureLoader().loadAsync('envmaps/envmap.jpg');
        const gltf = await new GLTFLoader().loadAsync('scene.gltf');

        this.scene = new THREE.Scene();

        const model = gltf.scene;

        model.scale.set(0.005, 0.005, 0.005);
        //model.rotateY(Math.PI / 2);

        model.traverse(child => {
            if (child instanceof THREE.Mesh) {
                // only necessary for WebGLRenderer
                child.castShadow = true;
                child.receiveShadow = true;
            }
            if (child instanceof THREE.Mesh && child.material && child.material.name == 'LensesMat') {
                console.log("LenseMat found");
                child.material.transparent = true;
            }
        });

        this.initWebGL(envMapLDR, model)

        this.resize();
        this.tick(undefined);

    }

    resize() {
        if (this.renderer.domElement.parentElement) {
            const width = this.renderer.domElement.parentElement.clientWidth;
            const height = this.renderer.domElement.parentElement.clientHeight;
            this.renderer.setSize(width, height);

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    }

    tick(time: any) {
        this.controls.update();
        this.camera.focus = this.controls.target.distanceTo(this.camera.position);
        this.stats.begin();

        if (this.renderer.sync) {
            this.renderer.sync(time);
        }

        this.renderer.render(this.scene, this.camera);
        this.stats.end();

        requestAnimationFrame(this.tick.bind(this));
    }

    initWebGL(envMapLDR: THREE.Texture, model: THREE.Group) {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.initRenderer(this.renderer);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.scene = new THREE.Scene();
        this.scene.add(model);

        const dirLight = new THREE.DirectionalLight(0xff3300, 0.3);
        dirLight.target.position.copy(this.controls.target);
        this.scene.add(dirLight.target);
        dirLight.target.position.set(0, 0, 0);
        dirLight.castShadow = true;
        dirLight.position.setFromSphericalCoords(100, -1.31, 4.08);
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        this.scene.add(dirLight);

        const ambLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambLight);

        // const helper = new THREE.CameraHelper(dirLight.shadow.camera);
        // scene.add(helper);

        const equiToCube = new THREE.WebGLCubeRenderTarget(envMapLDR.image.height).fromEquirectangularTexture(this.renderer, envMapLDR);

        this.scene.traverse(child => {
            if (child instanceof THREE.Mesh && child.material) {
                child.material.envMap = equiToCube.texture;
            }
        });

        this.scene.background = equiToCube.texture;
    }

    initRenderer(renderer: any) {
        document.body.appendChild(renderer.domElement);
        this.resize();

        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.controls.screenSpacePanning = true;
        this.controls.target.set(0, 0, 0);

        renderer.gammaOutput = true;
        renderer.gammaFactor = 2.2;
        renderer.setPixelRatio(1.0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5;
        renderer.renderWhenOffFocus = true;
        renderer.bounces = 3;
    }
}
//

//START
new Render();
//
