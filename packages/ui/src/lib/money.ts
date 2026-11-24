/** halalas → SAR decimal */
export const sar = (halalas: number) => Math.round(halalas) / 100;
/** SAR decimal input → halalas integer */
export const toHalalas = (sarValue: string | number) => Math.round(Number(sarValue) * 100);
