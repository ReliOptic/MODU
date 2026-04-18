import type { AssetCopyKey, CopyBlock, Proximity, RoleId, TimeOfDay } from './types';
import { FERTILITY_COPY } from './copy-fertility';
import { CANCER_COPY } from './copy-cancer';
import { PET_COPY } from './copy-pet';

export type CopyTable = Readonly<
  Record<
    AssetCopyKey,
    Readonly<
      Partial<
        Record<
          RoleId,
          Readonly<
            Partial<Record<Proximity, Readonly<Partial<Record<TimeOfDay, CopyBlock>>>>>
          >
        >
      >
    >
  >
>;

export const COPY: CopyTable = {
  fertility: FERTILITY_COPY,
  cancer:    CANCER_COPY,
  pet:       PET_COPY,
};
