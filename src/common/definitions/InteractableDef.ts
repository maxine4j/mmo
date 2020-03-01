import IDefinition from './IDefinition';
import { Skill } from './CharacterDef';

export default interface InteractableDef extends IDefinition{
    uuid: string;
    nodeType: string;
    skill: Skill;
}
