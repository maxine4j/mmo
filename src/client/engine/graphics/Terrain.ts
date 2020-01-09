import * as THREE from 'three';
import Graphics from './Graphics';

const heightMapScale = 10;

export default class Terrain {
    public plane: THREE.Mesh;
    public wireframe: THREE.LineSegments;
    public heightData: Float32Array;
    public width: number;
    public height: number;

    private constructor(plane: THREE.Mesh, heights: Float32Array, width: number, height: number) {
        this.plane = plane;
        this.heightData = heights;
        this.width = width;
        this.height = height;
    }

    public showWireframe() {
        if (!this.wireframe) {
            const geo = new THREE.WireframeGeometry(this.plane.geometry); // or WireframeGeometry
            const mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
            this.wireframe = new THREE.LineSegments(geo, mat);
        }
        this.plane.add(this.wireframe);
    }

    public hideWireFrame() {
        if (this.wireframe) {
            this.plane.remove(this.wireframe);
        }
    }

    public static async load(heightMapSrc: string, groundTextureSrc: string): Promise<Terrain> {
        return new Promise((resolve) => {
            const heightmap = new Image();
            heightmap.src = heightMapSrc;
            heightmap.onload = () => {
                const data = this.getHeightData(heightmap, heightMapScale);
                const geometry = new THREE.PlaneGeometry(heightmap.width, heightmap.height, heightmap.width - 1, heightmap.height - 1);
                const loader = new THREE.TextureLoader();
                loader.load(groundTextureSrc, (texture) => {
                    const material = new THREE.MeshLambertMaterial({ map: texture });
                    const plane = new THREE.Mesh(geometry, material);
                    for (let i = 0; i < geometry.vertices.length; i++) {
                        geometry.vertices[i].z = data[i];
                    }
                    plane.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Graphics.toRadians(-90));
                    resolve(new Terrain(plane, data, heightmap.width, heightmap.height));
                });
            };
        });
    }

    private static getHeightData(img: HTMLImageElement, scale: number = 1): Float32Array {
        // render the image to a canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        // get image data
        const pixels = context.getImageData(0, 0, img.width, img.height).data;

        // initialise data array
        const size = img.width * img.height;
        const data = new Float32Array(size);
        for (let i = 0; i < size; i++) data[i] = 0;

        // populate data array
        let j = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            const all = pixels[i] + pixels[i + 1] + pixels[i + 2];
            data[j++] = all / (12 * scale);
        }

        return data;
    }

    public getElevation(tx: number, ty: number): number {
        return this.heightData[ty * this.width + tx];
    }
}
