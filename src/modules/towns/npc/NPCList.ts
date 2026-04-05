import type NPC from './NPC';

const NPCList: Record<string, NPC> = new Proxy({}, {
    get(target, name: string): NPC {
        return target[name];
    },

    set(target, name: string, NPC: NPC) {
    	if (typeof name != 'string' || name == '') {
    		throw new Error(`Cannot assign NPC with invalid name '${name} to NPCList. NPC names must be nonempty strings.`);
    	}
    	if (target[name] != undefined) {
    		throw new Error(`Cannot assign NPC with duplicate name '${name}' to NPCList!`);
    	}
        if (name != NPC.name) {
            throw new Error(`Cannot assign NPC with name '${NPC.name}' to NPCList using differing key '${name}'!`);
        }
    	target[name] = NPC;
        return true;
    },
});

export default NPCList;