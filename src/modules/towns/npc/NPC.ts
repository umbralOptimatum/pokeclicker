import NPCType from './NPCType';
import GameHelper from '../../GameHelper';
import { Region } from '../../GameConstants';
import SubRegions from '../../subRegion/SubRegions';
import TextMerger from '../../utilities/TextMerger';
import type Requirement from '../../requirements/Requirement';
import type MultiRequirement from '../../requirements/MultiRequirement';
import type OneFromManyRequirement from '../../requirements/OneFromManyRequirement';
import type { TmpTownType } from '../../TemporaryScriptTypes';
import type { TranslationOutput, TranslationVars } from '../../translation/Translation';
import translatable from '../../translation/Translatable';

export type NPCOptionalArgument = {
    requirement?: Requirement | MultiRequirement | OneFromManyRequirement,
    image?: string,
    saveKey?: string,
};

@translatable('npcs', ['dialog, _displayName'])
export default class NPC {
    public talkedTo = ko.observable<boolean>(false); // Used for custom quests
    public saveKey = 0;
    private _displayName: string;
    public parent: TmpTownType;

    constructor(
        public readonly name: string,
        displayName: string,
        public dialog: string[],
        public options: NPCOptionalArgument = {},
        public type: NPCType = NPCType.Default,
    ) {
        this._displayName = displayName;
        if (this.options.saveKey) {
            this.saveKey = GameHelper.hash(this.options.saveKey);
        }
    }

    get translationKey() {
        if (!this.parent) {
            return `no location.${this.name}`;
        }
        const subRegionString = SubRegions.getSubRegions(this.parent.region).length > 1 ? `.${SubRegions.getSubRegionById(this.parent.region, this.parent.subRegion)}` : '';
        return `${Region[this.parent.region]}${subRegionString}.${this.parent.name}.${this.name}`;
    }

    public get displayName(): string {
        return App.translation.getHashed(
            `${this.translationKey}.displayName`,
            'npcs',
            this._displayName,
        )();
    }

    public get dialogHTML(): string {
        return NPC.translateDialog(`${this.translationKey}.dialog`, this.dialog);
    }

    protected static translateDialog(key: string, defaultValue: TranslationOutput, vars?: TranslationVars) {
        const translateOptions = {};
        if (Array.isArray(defaultValue)) {
            Object.assign(translateOptions, { returnObjects: true });
        }
        if (vars) {
            Object.assign(translateOptions, { vars });
        }
        const translated = App.translation.getHashed(
            key,
            'npcs',
            defaultValue,
            translateOptions,
        )();
        return Array.isArray(translated) ? translated.map(line => `<p>${TextMerger.mergeText(line)}</p>`).join('\n') : `<p>${translated}</p>`;
    }

    public addParent(town: TmpTownType) {
        if (this.parent) {
            throw new Error(`Tried to add multiple parent Towns to NPC ${this.name}!`);
        }
        this.parent = town;
    }

    public isVisible() {
        return this.options.requirement?.isCompleted() ?? true;
    }

    public setTalkedTo() {
        this.talkedTo(true);
        if (this.saveKey && !this.hasTalkedTo()) {
            GameHelper.incrementObservable(App.game.statistics.npcTalkedTo[this.saveKey]);
        }
    }

    public hasTalkedTo(): boolean {
        return this.saveKey ? App.game.statistics.npcTalkedTo[this.saveKey]() > 0 : false;
    }
}
