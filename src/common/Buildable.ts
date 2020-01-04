export default abstract class Buildable {
    public build(obj: object): Buildable {
        Object.assign(this, obj);
        return this;
    }
}
