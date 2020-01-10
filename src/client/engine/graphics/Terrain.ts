import * as THREE from 'three';

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

    private static unitPlaneGeom(width: number, height: number, heightmap: Float32Array): THREE.BufferGeometry {
        // buffers
        const indices: Array<number> = [];
        const vertices: Array<number> = [];
        const normals: Array<number> = [];
        const uvs: Array<number> = [];

        const width1 = width;// + 1;
        const height1 = height;// + 1;

        const widthHalf = width / 2;
        const heightHalf = height / 2;

        const segWidth = 1;
        const segHeight = 1;

        // generate vertices, normals and uvs
        for (let iz = 0; iz < height1; iz++) {
            const z = iz * segHeight - heightHalf;
            for (let ix = 0; ix < width1; ix++) {
                const x = ix * segWidth - widthHalf;
                // TODO: also apply heightmap here
                let y = heightmap[(iz * width) + ix];
                if (!y) y = heightmap[((iz - 1) * width) + ix];
                if (!y) y = heightmap[((iz - 1) * width) + (ix - 1)];
                if (!y) console.log('NaN in heightmap:', ix, iz, y);

                vertices.push(x, y, z);

                normals.push(0, 1, 0); // TODO: maybe normal shouldnt alwasy be up bc this is a heightmap

                uvs.push(ix / width); // might need to be width - 1
                uvs.push(1 - (iz / height)); // might need to be height - 1, also might not need negation?
            }
        }

        // indices
        for (let iz = 0; iz < height - 1; iz++) {
            for (let ix = 0; ix < width - 1; ix++) {
                const a = ix + width1 * iz;
                const b = ix + width1 * (iz + 1);
                const c = (ix + 1) + width1 * (iz + 1);
                const d = (ix + 1) + width1 * iz;

                // faces
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setIndex(indices);
        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        return geom;
    }

    public static async load(heightMapSrc: string, groundTextureSrc: string): Promise<Terrain> {
        return new Promise((resolve) => {
            const heightmap = new Image();
            heightmap.src = heightMapSrc;
            heightmap.onload = () => {
                const data = this.getHeightData(heightmap, heightMapScale);
                const geometry = this.unitPlaneGeom(heightmap.width, heightmap.height, data);
                const loader = new THREE.TextureLoader();
                loader.load(groundTextureSrc, (texture) => {
                    const material = new THREE.MeshLambertMaterial({ map: texture });
                    const plane = new THREE.Mesh(geometry, material);
                    plane.receiveShadow = true;
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
