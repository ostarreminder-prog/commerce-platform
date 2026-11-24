let blockSeq = 0;

/** Unique-enough id for fixture sections/blocks (`blk_…`, `sec_…`). */
export const uid = (p: string) => `${p}_${Date.now().toString(36)}${(blockSeq++).toString(36)}`;
