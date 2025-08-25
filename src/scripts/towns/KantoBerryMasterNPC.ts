@translatable('npcs', null, ['specialDialog'])
class KantoBerryMasterNPC extends NPC {
    static readonly specialDialog: Record<string, TranslationOutput> = {
        'special.KantoBerryMasterNPC.unlockedAllBerries': 'The disciple has surpassed the master. I have nothing more to teach you.',
        'special.KantoBerryMasterNPC.mutationsLocked': 'It seems as though you have hit a roadblock in your Berry progress. Focus on other areas before returning.',
    }

    constructor(
        public readonly name: string,
        displayName: string,
        public dialog: string[]
    ) {
        super(name, displayName, dialog);
    }

    get dialogHTML(): string {
        // Before the player has unlocked the farm
        if (!App.game.farming.canAccess()) {
            return super.dialogHTML;
        }

        // After the farm is unlocked
        return KantoBerryMasterNPC.generateMessage(GameHelper.today());
    }

    public static generateMessage(date: Date): string {
        if (App.game.farming.unlockedBerries.every(berry => berry())) {
            const unlockedAllKey = 'special.KantoBerryMasterNPC.unlockedAllBerries';
            return NPC.translateDialog(unlockedAllKey, KantoBerryMasterNPC.specialDialog[unlockedAllKey]);
        }

        const possibleMutations = App.game.farming.mutations.filter((mut) => mut.unlocked && mut.showHint && !App.game.farming.unlockedBerries[mut.mutatedBerry]());

        if (possibleMutations.length === 0) {
            const lockedKey = 'special.KantoBerryMasterNPC.mutationsLocked';
            return NPC.translateDialog(lockedKey, KantoBerryMasterNPC.specialDialog[lockedKey]);
        }

        SeededRand.seedWithDate(date);
        possibleMutations.forEach(b => SeededRand.boolean());
        const mutationToShow = SeededRand.fromArray(possibleMutations);
        mutationToShow.hintSeen = true;

        const hintText = mutationToShow instanceof EnigmaMutation ? mutationToShow.partialHint : mutationToShow.hint;
        return `<p>${hintText}</p>`;
    }

}
