import { useEffect, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { DiceRoom } from "./DiceRoom.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { dddiceApiLogin, updateRoomMetadataDiceUser, validateTheme } from "../../../helper/diceHelper.ts";
import { ITheme, ThreeDDiceAPI } from "dddice-js";
import { DiceUser } from "../../../helper/types.ts";
import { getRoomDiceUser } from "../../../helper/helpers.ts";
import { useListThemes } from "../../../api/dddiceApi.ts";
import OBR from "@owlbear-rodeo/sdk";

type DiceTrayProps = {
    classes: string;
};

export const DiceTray = (props: DiceTrayProps) => {
    const [rollerApi, setRollerApi, setInitialized, theme, setTheme] = useDiceRoller((state) => [
        state.rollerApi,
        state.setRollerApi,
        state.setInitialized,
        state.theme,
        state.setTheme,
    ]);
    const playerContext = usePlayerContext();
    const room = useMetadataContext((state) => state.room);
    const [diceUser, setDiceUser] = useState<DiceUser>();
    const [apiKey, setApiKey] = useState<string>();

    const diceThemeQuery = useListThemes(diceUser?.apiKey || "");

    const diceThemes: Array<ITheme> = diceThemeQuery.isSuccess
        ? diceThemeQuery.data.data.filter((t: ITheme) => validateTheme(t))
        : [];

    useEffect(() => {
        const newDiceUser = getRoomDiceUser(room, playerContext.id);
        if (newDiceUser) {
            const newApiKey = newDiceUser.apiKey;
            const diceRendering = newDiceUser.diceRendering;

            if (diceUser) {
                if (
                    (newApiKey !== undefined && newApiKey !== diceUser.apiKey) ||
                    diceRendering !== diceUser.diceRendering
                ) {
                    setDiceUser({ ...newDiceUser });
                }
            } else {
                setDiceUser({ ...newDiceUser });
            }
        }
    }, [room]);

    useEffect(() => {
        const initDice = async () => {
            let api: ThreeDDiceAPI | undefined;
            setInitialized(false);
            if (diceUser?.apiKey !== apiKey && diceUser?.apiKey !== undefined) {
                setApiKey(diceUser?.apiKey);
                api = await dddiceApiLogin(room);
                if (api) {
                    setRollerApi(api);
                }
            }

            setInitialized(true);
        };

        if ((diceUser && diceUser.apiKey !== undefined) || !diceUser) {
            if (!room?.disableDiceRoller && diceUser?.apiKey) {
                initDice();
            }
        }
    }, [diceUser, room?.disableDiceRoller]);

    useEffect(() => {
        const resetDiceTheme = async () => {
            if (diceThemes.length > 0) {
                setTheme(diceThemes[0]);
                if (room) {
                    await updateRoomMetadataDiceUser(room, OBR.player.id, { diceTheme: diceThemes[0].id });
                }
            } else {
                const newTheme = (await rollerApi?.theme.get("dddice-bees"))?.data;
                if (newTheme) {
                    setTheme(newTheme);
                    if (room) {
                        await updateRoomMetadataDiceUser(room, OBR.player.id, { diceTheme: newTheme.id });
                    }
                }
            }
        };
        const initUserTheme = async () => {
            if (!theme) {
                const themeId = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.diceTheme;
                if (themeId && diceThemes.map((t) => t.id).includes(themeId)) {
                    const newTheme = (await rollerApi?.theme.get(themeId))?.data;
                    if (newTheme) {
                        setTheme(newTheme);
                    }
                } else {
                    await resetDiceTheme();
                }
            } else {
                if (!diceThemes.includes(theme)) {
                    await resetDiceTheme();
                }
            }
        };

        if (rollerApi) {
            initUserTheme();
        }
    }, [rollerApi, diceThemeQuery.isSuccess, diceUser?.diceTheme]);

    return <DiceRoom className={props.classes} />;
};
