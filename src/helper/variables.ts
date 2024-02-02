import { Modal } from "@owlbear-rodeo/sdk/lib/types/Modal";
import { Popover } from "@owlbear-rodeo/sdk";

export const ID = "com.bitperfect-software.hp-tracker";
export const metadataKey = `${ID}/metadata`;
export const itemMetadataKey = `${ID}/data`;
export const infoMetadataKey = `${ID}/text`;

export const modalId = `${ID}/modal`;
export const statblockPopoverId = `${ID}/statblock-popover`;
export const rollLogPopoverId = `${ID}/dice-log`;

export const version = "1.6.0";

export const changelogModal: Modal = {
    id: modalId,
    url: "/modal.html?content=changelog",
};

export const helpModal: Modal = {
    id: modalId,
    url: "/modal.html?content=help",
};

export const settingsModal: Modal = {
    id: modalId,
    url: "/modal.html?content=settings",
};

export const diceModal: Modal = {
    id: modalId,
    url: "/modal.html?content=dddice",
};

export const rollLogPopover: Popover = {
    id: rollLogPopoverId,
    url: "/rolllog.html",
    width: 350,
    height: 200,
    transformOrigin: { vertical: "BOTTOM", horizontal: "RIGHT" },
    marginThreshold: 10,
    anchorReference: "POSITION",
    disableClickAway: true,
    hidePaper: true,
};

export const statblockPopover: Popover = {
    id: statblockPopoverId,
    url: "/statblock.html",
    width: 500,
    height: 600,
    transformOrigin: { vertical: "TOP", horizontal: "RIGHT" },
    marginThreshold: 10,
    anchorReference: "POSITION",
    disableClickAway: true,
};
