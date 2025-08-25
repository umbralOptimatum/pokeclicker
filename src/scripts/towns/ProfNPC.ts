@translatable('npcs', ['pokedexCompleteText', 'nextRegionUnlockedText'], ['specialDialog'])
class ProfNPC extends NPC {
    static readonly specialDialog: Record<string, TranslationOutput> = {
        'special.ProfNPC.nextRegionLocked': ['Hello, new Champion, you\'ve come a long way!', 'Come see me once you\'ve beat the Elite Four!'],
        'special.ProfNPC.requiresCompleteDex': 'To progress to the next region, you need to catch all Pokémon native to this region.',
        'special.ProfNPC.dexIncomplete': 'You still have {{ number }} left to catch in this region! You\'re almost there!',
    }

    constructor(
        public readonly name: string,
        displayName: string,
        public region: GameConstants.Region,
        public pokedexCompleteText: string,
        public nextRegionUnlockedText: string,
        image: string = undefined,
        requirement?: Requirement | MultiRequirement | OneFromManyRequirement
    ) {
        super(name, displayName, undefined, { image: image, requirement: requirement});
    }

    get dialogHTML(): string {
        const requiresCompleteDex = App.game.challenges.list.requireCompletePokedex.active();
        const nextRegionUnlocked = TownList[GameConstants.StartingTowns[this.region + 1]]?.isUnlocked() ?? false;
        const completeDexAchievement = AchievementHandler.findByName(`${GameConstants.camelCaseToString(GameConstants.Region[this.region])} Master`);

        if (!nextRegionUnlocked) {
            const lockedKey = 'special.ProfNPC.nextRegionLocked';
            return NPC.translateDialog(lockedKey, ProfNPC.specialDialog[lockedKey]);
        }

        let html = '';

        if (completeDexAchievement.isCompleted()) {
            html += NPC.translateDialog(`${this.translationKey}.pokedexCompleteText`, this.pokedexCompleteText);
        } else {
            if (requiresCompleteDex) {
                const requiresKey = 'special.ProfNPC.requiresCompleteDex';
                html += NPC.translateDialog(requiresKey, ProfNPC.specialDialog[requiresKey]);
            }
            const incompleteKey = 'special.ProfNPC.dexIncomplete';
            html += NPC.translateDialog(incompleteKey, ProfNPC.specialDialog[incompleteKey],
                { number: completeDexAchievement.property.requiredValue - completeDexAchievement.getProgress() });
        }

        if (nextRegionUnlocked && (completeDexAchievement.isCompleted() || !requiresCompleteDex)) {
            html += NPC.translateDialog(`${this.translationKey}.nextRegionUnlockedText`, this.nextRegionUnlockedText);
        }

        return html;
    }
}
