import { components } from "../../../api/schema";
import { HpTrackerMetadata, Limit } from "../../../helper/types.ts";
import OBR from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../../helper/variables.ts";

export type LimitType = components["schemas"]["LimitedUse"];
export const LimitComponent = ({
    limit,
    title,
    limitValues,
    itemId,
    hideReset,
}: {
    limit: LimitType;
    title: "name" | "uses" | "none";
    limitValues: Limit;
    itemId: string;
    hideReset?: boolean;
}) => {
    const getTitle = () => {
        if (title === "name") {
            return <h4>{limit.name}</h4>;
        } else if (title === "uses") {
            return <b>uses</b>;
        } else {
            return null;
        }
    };
    return (
        <div className={"limit"}>
            <div className={"limit-heading"}>
                {getTitle()}
                <div className={"limit-uses"}>
                    {Array(limit.uses)
                        .fill(0)
                        .map((_, i) => {
                            const used = i < limitValues.used;
                            return (
                                <div
                                    key={i}
                                    className={`limit-use ${used ? "used" : ""}`}
                                    onClick={() => {
                                        OBR.scene.items.updateItems([itemId], (items) => {
                                            items.forEach((item) => {
                                                if (item) {
                                                    const metadata = item.metadata[
                                                        itemMetadataKey
                                                    ] as HpTrackerMetadata;
                                                    if (metadata) {
                                                        const index = metadata.stats.limits?.findIndex((l) => {
                                                            return l.id === limitValues.id;
                                                        });
                                                        if (index !== undefined) {
                                                            // @ts-ignore
                                                            item.metadata[itemMetadataKey]["stats"]["limits"][index][
                                                                "used"
                                                            ] = used ? limitValues.used - 1 : limitValues.used + 1;
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    }}
                                ></div>
                            );
                        })}
                </div>
            </div>
            {limit.description ? <div>{limit.description}</div> : null}
            {limit.resets && !hideReset ? (
                <div>
                    <b>Resets after:</b> {limit.resets.join(", ")}
                </div>
            ) : null}
        </div>
    );
};
