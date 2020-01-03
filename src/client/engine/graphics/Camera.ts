import Vec2 from './Vec2';
import Graphics from './Graphics';

export default class Camera {
    public translation: Vec2;
    public zoom: Vec2;

    public worldToScreen(world: Vec2): Vec2 {
        const screen = world.copy();
        screen.sub(this.translation); // apply translation
        // translate vector so we zoom based on center of screen
        screen.x += Graphics.viewportWidth / 2 / this.zoom.x;
        screen.y += Graphics.viewportHeight / 2 / this.zoom.y;
        screen.mulV(this.zoom); // scale the vector by zoom
        return screen;
    }

    public screenToWorld(screen: Vec2): Vec2 {
        const world = screen.copy();
        world.divV(this.zoom); // undo zoom scale
        // undo zoom translation so we zoom based on center of screen
        world.x -= Graphics.viewportWidth / 2 / this.zoom.x;
        world.y -= Graphics.viewportHeight / 2 / this.zoom.y;
        world.add(this.translation); // undo translation
        return world;
    }
}
