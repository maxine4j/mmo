import * as THREE from 'three';
import Model from './Model';

import manHeadUpper from '../../assets/models/man/man-head-upper.glb';
import manHeadLower from '../../assets/models/man/man-head-lower.glb';
import manTorso from '../../assets/models/man/man-torso.glb';
import manArms from '../../assets/models/man/man-arms.glb';
import manHands from '../../assets/models/man/man-hands.glb';
import manLegs from '../../assets/models/man/man-legs.glb';
import manFeet from '../../assets/models/man/man-feet.glb';

export enum HumanPart {
    HEAD_UPPER,
    HEAD_LOWER,
    TORSO,
    ARMS,
    HANDS,
    LEGS,
    FEET
}

export default class HumanModel extends Model {
    private parts: Model[];

    private scene: THREE.Scene;

    public static async load(): Promise<HumanModel> {
        return new Promise((resolve) => {
            Promise.all([
                Model.loadGLTF(manHeadUpper),
                Model.loadGLTF(manHeadLower),
                Model.loadGLTF(manTorso),
                Model.loadGLTF(manArms),
                Model.loadGLTF(manHands),
                Model.loadGLTF(manLegs),
                Model.loadGLTF(manFeet),
            ]).then((results: Model[]) => {
                const human = new HumanModel(null);
                human.parts = results;
                human.scene = new THREE.Scene();
                human.parts.forEach((r) => human.scene.add(r.obj));
                resolve(human);
            });
        });
    }

    public setPart(part: HumanPart, model: Model) {
        // remove the old part
        this.scene.remove(this.parts[part].obj);
        // update the parts list
        this.parts[part] = model;
        // add the new part
        this.scene.add(this.parts[part].obj);
    }

    private updateScene() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.parts.forEach((r) => this.scene.add(r.obj));
    }

    public get obj(): THREE.Object3D {
        return this.scene;
    }
}
