import { Text } from "@shopify/polaris";
import THC from "../components/essentials/TableHeaderColumn";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function ProductCharts() {
    const defaultCharts = [
        {
            id: "xywjhsudhf34543",
            name: "Product Compatibility Chart",
            assignedTo: "12 products",
            type: "Product-specific",
            status: true,
        },
        {
            id: "xywjhsud34543sd",
            name: "Product Compatibility Chart",
            assignedTo: "06 products",
            type: "Product-specific",
            status: true,
        },
        {
            id: "hsudhf34543sd",
            name: "Collection Compatibility Chart",
            assignedTo: "02 collections",
            type: "Collection-specific",
            status: false,
        }
    ]
    const [charts, setCharts] = useState(defaultCharts);
    const [selectedCharts, setSelectedCharts] = useState([]);
    const handleSelectedChart = (event) => {
        const { checked, value } = event.currentTarget;
        if (checked) {
            setSelectedCharts([...selectedCharts, value]);
        } else {
            setSelectedCharts(selectedCharts.filter((chartId) => chartId !== value));
        }
    }
    const [selectedAllChart, setSelectedAllChart] = useState(false);
    const handleSelectedAllChart = (event) => {
        const { checked } = event.currentTarget;
        setSelectedAllChart(checked);
        if (checked) {
            setSelectedCharts(charts.map((chart) => chart.id));
        } else {
            setSelectedCharts([]);
        }
    }
    const [sortBy, setSortBy] = useState("active");
    const handleSortBy = (event) => {
        const selectedSort = event.currentTarget.values[0];
        setSortBy(selectedSort);
    }
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    const navigate = useNavigate();
    console.clear();
    return (
        <s-page>
            {selectedCharts.length > 0 && (
                <>
                    <s-button slot="secondary-actions" variant="secondary">Delete</s-button>
                    <s-button slot="primary-action" variant="primary">Make Draft</s-button>
                </>
            )}
            <s-stack paddingBlock="base" direction="inline" gap="base" justifyContent="space-between" alignItems="center">
                <Text as="h2">Product Charts</Text>
                <s-button variant="primary" onClick={() => navigate("/app/product-charts/create")}>Create new chart</s-button>
            </s-stack>
            {charts.length > 0 && (
                <s-stack borderRadius="base" overflow="hidden" border="base">
                    <div style={{ padding: "12px 10px", gap: "15px", background: "#F7F7F7", borderBottom: "1px solid #E3E3E3", display: "grid", gridTemplateColumns: "1fr 138.36px", paddingRight: "18px" }}>
                        <s-stack>
                            <s-search-field placeholder="Search a chart..." />
                        </s-stack>
                        <s-stack>
                            <s-button variant="secondary" commandFor="sort-actions">
                                <div style={{ display: "flex", gap: "3px", alignItems: "center", padding: 0, margin: 0, maxWidth: "fit-content" }}>
                                    <s-icon type="sort" />
                                    Sorted by: {capitalize(sortBy)}
                                </div>
                            </s-button>
                            <s-popover id="sort-actions">
                                <s-stack gap="none">
                                    <s-box padding="small">
                                        <s-choice-list onChange={handleSortBy} label="Sort by" name="Sort by">
                                            <s-choice value="active" selected>Active</s-choice>
                                            <s-choice value="draft">Draft</s-choice>
                                            <s-choice value="type">Type</s-choice>
                                        </s-choice-list>
                                    </s-box>
                                </s-stack>
                            </s-popover>
                        </s-stack>
                    </div>
                    <s-table>
                        <s-table-header-row>
                            <THC>
                                <s-checkbox checked={selectedAllChart} onChange={handleSelectedAllChart} />
                            </THC>
                            <THC>
                                Name
                            </THC>
                            <THC>
                                Assigned to
                            </THC>
                            <THC>
                                Type
                            </THC>
                            <THC>
                                Status
                            </THC>
                            <THC></THC>
                        </s-table-header-row>
                        <s-table-body>
                            {charts?.map((chart) => (
                                <s-table-row key={chart.id}>
                                    <s-table-cell>
                                        <s-checkbox value={chart.id} onChange={handleSelectedChart} checked={selectedAllChart} />
                                    </s-table-cell>
                                    <s-table-cell>
                                        {chart.name}
                                    </s-table-cell>
                                    <s-table-cell>
                                        {chart.assignedTo}
                                    </s-table-cell>
                                    <s-table-cell>
                                        {chart.type}
                                    </s-table-cell>
                                    <s-table-cell>
                                        <s-switch checked={chart.status} />
                                    </s-table-cell>
                                    <s-table-cell>
                                        <s-button commandFor={`action_for_${chart.id}`} variant="tertiary" icon="menu-horizontal" />
                                        <s-popover id={`action_for_${chart.id}`}>
                                            <s-stack>
                                                <s-clickable onClick={() => { navigate(`/app/product-charts/edit`) }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", minWidth: "70px" }}>
                                                        <s-icon type="edit" />
                                                        <s-text>Edit</s-text>
                                                    </div>
                                                </s-clickable>
                                                <s-clickable>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", minWidth: "70px" }}>
                                                        <s-icon type="delete" />
                                                        <s-text>Delete</s-text>
                                                    </div>
                                                </s-clickable>
                                                <s-clickable>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", minWidth: "70px" }}>
                                                        <s-icon type="duplicate" />
                                                        <s-text>Duplicate</s-text>
                                                    </div>
                                                </s-clickable>
                                            </s-stack>
                                        </s-popover>
                                    </s-table-cell>
                                </s-table-row>
                            ))}
                        </s-table-body>
                    </s-table>
                </s-stack>
            )}
            {charts.length === 0 && (
                <s-section accessibilityLabel="Empty state section">
                    <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
                        <s-box maxInlineSize="200px" maxBlockSize="200px">
                            <s-image
                                src="/empty-state.png"
                                alt=""
                            />
                        </s-box>
                        <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
                            <s-stack alignItems="center">
                                <h3 style={{ padding: 0, margin: 0, paddingBottom: "5px" }}>No chart found!</h3>
                                <s-paragraph>
                                    Create charts to visible on your store.
                                </s-paragraph>
                                <s-paragraph>
                                    Get trust, reduce return and increase conversion.
                                </s-paragraph>
                            </s-stack>
                            <s-button-group>
                                <s-button
                                    slot="secondary-actions"
                                    aria-label="Learn more about creating chart"
                                >
                                    Learn more
                                </s-button>
                                <s-button slot="primary-action" aria-label="Add a new chart">
                                    Create chart
                                </s-button>
                            </s-button-group>
                        </s-grid>
                    </s-grid>
                </s-section>
            )}
        </s-page>
    )
}