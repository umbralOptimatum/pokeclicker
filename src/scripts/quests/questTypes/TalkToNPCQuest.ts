class TalkToNPCQuest extends Quest implements QuestInterface {
    npc: NPC;

    constructor(npc: string, description: string, reward = 0) {
        super(1, reward);
        this.npc = NPCList[npc];
        this.customDescription = description;
        this.focus = this.npc.talkedTo;
    }

    begin() {
        this.npc.talkedTo(false);
        super.begin();
    }
}
