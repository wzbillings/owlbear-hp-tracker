import { ContextWrapper } from "../ContextWrapper.tsx";
import { useEffect, useRef, useState } from "react";
import { Token } from "../hptracker/Token.tsx";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { Loader } from "../general/Loader.tsx";
import { updateHp } from "../../helper/hpHelpers.ts";
import { getBgColor } from "../../helper/helpers.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import {
    getAcOnMap,
    getCanPlayersSee,
    getHpBar,
    getHpOnMap,
    toggleAcOnMap,
    toggleCanPlayerSee,
    toggleHpBar,
    toggleHpOnMap,
} from "../../helper/multiTokenHelper.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";

export const Popover = () => {
    const [ids, setIds] = useState<Array<string>>([]);
    const { isReady } = SceneReadyContext();

    const initPopover = async () => {
        const selection = await OBR.player.getSelection();
        if (selection) {
            const items = await OBR.scene.items.getItems<Image>(selection);
            setIds(items.map((item) => item.id));
        }
    };

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return (
        <ContextWrapper component={"popover"}>
            {ids.length === 1 ? (
                <Content id={ids[0]} />
            ) : ids.length > 1 ? (
                <MultiContent ids={ids} />
            ) : (
                <Loader className={"popover-spinner"} />
            )}
        </ContextWrapper>
    );
};

const MultiContent = ({ ids }: { ids: Array<string> }) => {
    const [items, setItems] = useState<Array<Item>>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { room } = useMetadataContext();
    const { isReady } = SceneReadyContext();
    const playerContext = usePlayerContext();

    const initPopover = async () => {
        setItems(await OBR.scene.items.getItems(ids));
    };

    const changeHP = async (value: number) => {
        await OBR.scene.items.updateItems(items, (uItems) => {
            uItems.forEach((item) => {
                if (itemMetadataKey in item.metadata) {
                    const itemData = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                    const newHp = itemData.hp + value;
                    if (newHp < itemData.hp && itemData.stats.tempHp && itemData.stats.tempHp > 0) {
                        itemData.stats.tempHp = Math.max(itemData.stats.tempHp - (itemData.hp - newHp), 0);
                    }
                    itemData.hp = Math.min(
                        room?.allowNegativeNumbers ? newHp : Math.max(newHp, 0),
                        itemData.maxHp + (itemData.stats.tempHp || 0)
                    );
                    const uItem = items.find((i) => i.id === item.id);
                    if (uItem && itemMetadataKey in uItem.metadata) {
                        const uItemData = uItem.metadata[itemMetadataKey] as HpTrackerMetadata;
                        updateHp(uItem, {
                            ...uItemData,
                            hp: itemData.hp,
                            stats: { ...uItemData.stats, tempHp: itemData.stats.tempHp },
                        });
                    }
                    item.metadata[itemMetadataKey] = { ...itemData };
                }
            });
        });
    };

    useEffect(() => {
        OBR.scene.items.onChange(async (cItems) => {
            const filteredItems = cItems.filter((item) => ids.includes(item.id));
            let localItems = Array.from(items);

            if (filteredItems.length > 0) {
                filteredItems.forEach((item) => {
                    const index = localItems.findIndex((lItem) => lItem.id === item.id);
                    if (index >= 0) {
                        localItems.splice(index, 1, item);
                    } else {
                        localItems.push(item);
                    }
                });
            }
            setItems(localItems);
        });
    }, []);

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return (
        <div className={"popover multi-selection"}>
            <ul className={"token-names"}>
                {items?.map((item, index) => {
                    if (itemMetadataKey in item.metadata) {
                        const d = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                        return (
                            <li
                                className={"token-entry"}
                                key={index}
                                style={{
                                    background: `linear-gradient(to right, ${getBgColor(
                                        d,
                                        "0.4"
                                    )}, #1C1B22 90%, #1C1B22 )`,
                                }}
                            >
                                {d.name}
                            </li>
                        );
                    }
                })}
            </ul>
            <div className={"changes"}>
                <div className={"hp"}>
                    <input className={"input"} ref={inputRef} type={"number"} defaultValue={0} />
                    <button
                        className={"heal"}
                        title={"heal"}
                        onClick={() => {
                            if (inputRef.current) {
                                changeHP(parseInt(inputRef.current.value));
                            }
                        }}
                    >
                        Heal
                    </button>
                    <button
                        className={"damage"}
                        title={"damage"}
                        onClick={() => {
                            if (inputRef.current) {
                                changeHP(parseInt(inputRef.current.value) * -1);
                            }
                        }}
                    >
                        Damage
                    </button>
                </div>
                {playerContext.role === "GM" ? (
                    <div className={"settings"}>
                        <button
                            title={"Toggle HP Bar visibility for GM and Players"}
                            className={`toggle-button hp ${getHpBar(items) ? "on" : "off"}`}
                            onClick={() => {
                                toggleHpBar(items);
                            }}
                        />
                        <button
                            title={"Toggle HP displayed on Map"}
                            className={`toggle-button map ${getHpOnMap(items) ? "on" : "off"}`}
                            onClick={() => {
                                toggleHpOnMap(items);
                            }}
                        />
                        <button
                            title={"Toggle AC displayed on Map"}
                            className={`toggle-button ac ${getAcOnMap(items) ? "on" : "off"}`}
                            onClick={async () => {
                                toggleAcOnMap(items);
                            }}
                        />
                        <button
                            title={"Toggle HP/AC visibility for players"}
                            className={`toggle-button players ${getCanPlayersSee(items) ? "on" : "off"}`}
                            onClick={() => {
                                toggleCanPlayerSee(items);
                            }}
                        />{" "}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const Content = (props: { id: string }) => {
    const id = props.id;
    const [data, setData] = useState<HpTrackerMetadata | null>(null);
    const [item, setItem] = useState<Item | null>(null);
    const { isReady } = SceneReadyContext();

    const getData = async () => {
        if (id) {
            const items = await OBR.scene.items.getItems([id]);
            if (items.length > 0) {
                const item = items[0];
                if (itemMetadataKey in item.metadata) {
                    setData(item.metadata[itemMetadataKey] as HpTrackerMetadata);
                    setItem(item);
                }
            }
        }

        return null;
    };

    const initPopover = async () => {
        await getData();
    };

    useEffect(() => {
        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter((item) => item.id === id);
            if (filteredItems.length > 0) {
                const item = filteredItems[0];
                if (itemMetadataKey in item.metadata) {
                    setData(item.metadata[itemMetadataKey] as HpTrackerMetadata);
                }
            }
        });
    }, []);

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return id && data && item ? (
        <div className={"popover"}>
            <Token item={item} data={data} popover={true} selected={false} />
        </div>
    ) : null;
};
