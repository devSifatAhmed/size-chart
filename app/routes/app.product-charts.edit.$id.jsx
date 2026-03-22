import { useEffect, useState } from "react";
import { Form, useNavigate, redirect, useActionData, useSubmit, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request, params }) {
    const { id } = params;
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(
        `#graphql
            query {
                shop {
                    name
                    id
                }
            }`,
    );
    const shopData = await response.json();
    const chart = await prisma.chart.findUnique({
        where: {
            id,
            shop: shopData.data.shop.id,
        },
    });
    if (!chart) {
        return redirect("/app/product-charts");
    }
    return { chart, id };
}

export async function action({ request }) {
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(
        `#graphql
            query {
                shop {
                    name
                    id
                }
            }`,
    );
    const shopData = await response.json();

    const formData = await request.formData();
    const payloadStr = formData.get("tableData");
    if (!payloadStr) return { error: "Table data is missing" };

    const payload = JSON.parse(payloadStr);

    if (!payload.assignId || payload.assignId.length === 0) {
        return { error: "Please select at least 1 product." };
    }

    try {
        const chart = await prisma.chart.update({
            where: {
                id: payload.id,
            },
            data: {
                shop: shopData.data.shop.id,
                name: payload.name || "Product Table",
                title: payload.title || "",
                tableData: JSON.stringify(payload),
                assignType: payload.assignType || "product",
                rowCount: payload.rowCount !== undefined ? payload.rowCount : true,
                rowCountText: payload.rowCountText || "Vehicles",
            }
        });

        // Handle assignments
        if (payload.assignId) {
            // 1. Delete existing assignments
            await prisma.chartAssignment.deleteMany({
                where: {
                    chartId: chart.id,
                }
            });

            // 2. Insert new ones (if any)
            if (payload.assignId.length > 0) {
                await prisma.chartAssignment.createMany({
                    data: payload.assignId.map((id) => ({
                        chartId: chart.id,
                        targetId: id
                    }))
                });
            }
        }

        return { success: "Chart updated successfully" };

    } catch (e) {
        console.error("Action error:", e);
        return { error: "Database error: " + e.message };
    }
}
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

function SortableColumnItem({
    column,
    rowId,
    handleInput,
    handleHide,
    handleDelete,
    handleDuplicate
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: column.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style}>
            {/* column start */}
            <s-stack>
                <div style={{ position: "relative", display: "flex", border: "1px solid #d8d8d8", borderRadius: "5px", overflow: "hidden" }}>
                    <input data-id={column.id} data-row-id={rowId} onInput={handleInput} defaultValue={column?.content} type="text" style={{ width: "100%", padding: "0 10px", outline: "none", border: "none" }} />
                    <div style={{ display: "flex", justifyContent: "flex-end", borderLeft: "1px solid #d8d8d8" }}>
                        <s-clickable onClick={() => handleHide(column.id, rowId)} background="strong">
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30px", width: "25px" }}><div style={{ transform: "scale(0.8)" }}><s-icon type="hide" /></div></div>
                        </s-clickable>
                        <s-clickable onClick={() => handleDelete(column.id, rowId)} background="strong">
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30px", width: "25px" }}><div style={{ transform: "scale(0.8)" }}><s-icon type="delete" /></div></div>
                        </s-clickable>
                        <s-clickable onClick={() => handleDuplicate(column.id, rowId)} background="strong">
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30px", width: "25px" }}><div style={{ transform: "scale(0.8)" }}><s-icon type="duplicate" /></div></div>
                        </s-clickable>
                        <s-clickable background="strong" {...attributes} {...listeners}>
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30px", width: "25px", cursor: "grab" }}><div style={{ transform: "scale(0.8)" }}><s-icon type="drag-handle" /></div></div>
                        </s-clickable>
                    </div>
                </div>
            </s-stack>
            {/* column end */}
        </div>
    );
}

function SortableRowItem({
    row,
    rowCollapse,
    setRowCollapse,
    handleRowHide,
    handleRowDelete,
    handleRowDuplicate,
    handleInput,
    handleHide,
    handleDelete,
    handleDuplicate,
    handleAddColumn,
    sensors,
    handleColumnReorder
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: row.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <s-stack>
                <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 120px", background: "#F3F3F3", borderRadius: "7px", overflow: "hidden" }}>
                    <div>
                        <s-clickable onClick={() => setRowCollapse({ ...rowCollapse, [row.id]: !rowCollapse[row.id] })} background="strong">
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40px", width: "30px" }}>
                                <s-icon type={rowCollapse[row.id] ? "chevron-right" : "chevron-down"} />
                            </div>
                        </s-clickable>
                    </div>
                    <div style={{ display: "flex", height: "40px", alignItems: "center", paddingLeft: "4px" }}>
                        <s-text>Row</s-text>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <s-clickable onClick={() => handleRowHide(row.id)} background="strong">
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40px", width: "30px" }}><s-icon type="hide" /></div>
                        </s-clickable>
                        <s-clickable onClick={() => handleRowDelete(row.id)} background="strong">
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40px", width: "30px" }}><s-icon type="delete" /></div>
                        </s-clickable>
                        <s-clickable onClick={() => handleRowDuplicate(row.id)} background="strong">
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40px", width: "30px" }}><s-icon type="duplicate" /></div>
                        </s-clickable>
                        <s-clickable background="strong" {...attributes} {...listeners}>
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40px", width: "30px", cursor: "grab" }}><s-icon type="drag-handle" /></div>
                        </s-clickable>
                    </div>
                </div>
                {/* columns start */}
                {!rowCollapse[row.id] && (
                    <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", top: "5px", left: "15px", height: "calc(100% - 10px)", borderLeft: "0.04125rem dashed #d8d8d8" }}></div>

                        <div style={{ width: "calc(100% - 30px)", marginLeft: "30px", display: "grid", gap: "10px", padding: "10px 0" }}>
                            {row?.columns?.length > 0 && (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={(e) => {
                                        const { active, over } = e;
                                        if (active && over && active.id !== over.id) {
                                            handleColumnReorder(row.id, active.id, over.id);
                                        }
                                    }}
                                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                                >
                                    <SortableContext
                                        items={row.columns.map(c => c.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {row.columns.map((column, index) => (
                                            <SortableColumnItem
                                                key={column.id}
                                                column={column}
                                                rowId={row.id}
                                                handleInput={handleInput}
                                                handleHide={handleHide}
                                                handleDelete={handleDelete}
                                                handleDuplicate={handleDuplicate}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            )}
                            {/* column add button start */}
                            <s-stack>
                                <div className="custom__adding_button" style={{ position: "relative", zIndex: 2 }}>
                                    <div onClick={() => handleAddColumn(row.id)} className="custom__adding_button__line" style={{ position: "absolute", cursor: "pointer", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: -1, height: "2px", width: "100%" }}></div>
                                    <div onClick={() => handleAddColumn(row.id)} className="custom__adding_button__text" style={{ color: "#0094D5", display: "flex", cursor: "pointer", width: "fit-content", padding: "0 10px 0 7px", flexWrap: "nowrap", alignItems: "center", margin: "0 auto", zIndex: 2, background: "#fff" }}>
                                        <s-icon tone="info" type="plus-circle" />
                                        Add Column
                                    </div>
                                </div>
                            </s-stack>
                            {/* column add button end */}
                        </div>
                    </div>
                )}
                {/* columns end */}
            </s-stack>
        </div>
    );
}

export default function EditChart() {
    const navigate = useNavigate();
    const submit = useSubmit();
    const { chart, id } = useLoaderData();
    const chartData = JSON.parse(chart.tableData);
    chartData.id = id;
    const [table, setTable] = useState(chartData);
    const actionData = useActionData();

    useEffect(() => {
        if (actionData?.error) {
            shopify.toast.show(actionData.error, { isError: true });
        }
        if (actionData?.success) {
            shopify.toast.show(actionData.success, { isError: false });
        }
    }, [actionData]);

    useEffect(() => {
        // const appWindow = document.querySelector("s-app-window");

        // appWindow?.show?.();

        // const appNav = document.querySelector("s-app-nav");
        // appNav?.setAttribute("hidden", "");

        const appBody = document.querySelector("body");
        appBody?.style.setProperty("margin", "0", "important");
        appBody?.style.setProperty("overflow-x", "hidden", "important");
        appBody?.style.setProperty("padding", "0", "important");

        // appWindow.addEventListener("hide", function () {
        //     navigate("/app/product-charts");
        // })
    }, []);
    const [tab, setTab] = useState("design");
    const handleInput = (e) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rows.forEach((row) => {
                row.columns.forEach((column) => {
                    if (column.id === e.target.dataset.id) {
                        column.content = e.target.value;
                    }
                });
            });
            return newTable;
        });
        changedForm();
    }
    const handleHide = (columnId, rowId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rows.forEach((row) => {
                row.columns.forEach((column) => {
                    if (column.id === columnId) {
                        column.hidden = !column.hidden;
                    }
                });
            });
            return newTable;
        });
        changedForm();
    }
    const handleDelete = (columnId, rowId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rows.forEach((row) => {
                row.columns.forEach((column) => {
                    if (column.id === columnId) {
                        row.columns = row.columns.filter((column) => column.id !== columnId);
                    }
                });
            });
            return newTable;
        });
        changedForm();
    }
    const handleDuplicate = (columnId, rowId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rows.forEach((row) => {
                row.columns.forEach((column) => {
                    if (column.id === columnId) {
                        row.columns.push({
                            ...column,
                            id: `column_${Date.now()}`
                        });
                    }
                });
            });
            return newTable;
        });
        changedForm();
    }
    const handleAddColumn = (rowId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rows.forEach((row) => {
                if (row.id === rowId) {
                    row.columns.push({
                        id: `column_${Date.now()}`,
                        content: "",
                        hidden: false
                    });
                }
            });
            return newTable;
        });
        changedForm();
    }
    const handleAddRow = () => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rows.push({
                id: `row_${Date.now()}`,
                columns: [
                    {
                        id: `column_${Date.now()}`,
                        content: "",
                        hidden: false
                    }
                ]
            });
            return newTable;
        });
        changedForm();
    }
    const handleRowHide = (rowId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rows.forEach((row) => {
                if (row.id === rowId) {
                    row.hidden = !row.hidden;
                }
            });
            return newTable;
        });
        changedForm();
    }
    const handleRowDelete = (rowId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rows = newTable.rows.filter((row) => row.id !== rowId);
            return newTable;
        });
        changedForm();
    }
    const handleRowDuplicate = (rowId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rows.forEach((row) => {
                if (row.id === rowId) {
                    newTable.rows.push({
                        ...row,
                        id: `row_${Date.now()}_${Math.random()}`,
                        columns: row.columns.map((column) => {
                            return {
                                ...column,
                                id: `column_${Date.now()}_${Math.random()}`
                            }
                        })
                    });
                }
            });
            return newTable;
        });
        changedForm();
    }
    const [rowCollapse, setRowCollapse] = useState(
        {
            ...table?.rows?.map((row) => {
                return {
                    [row.id]: false
                }
            })
        }
    );

    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const changedForm = () => {
        setUnsavedChanges(true);
    }
    const handleSave = () => {
        if (!table.assignId || table.assignId.length === 0) {
            shopify.toast.show("Please select at least 1 product.", { isError: true });
            return;
        }

        setUnsavedChanges(false);
        const formData = new FormData();
        formData.append("tableData", JSON.stringify(table));
        submit(formData, { method: "post" });
    }

    const handleDiscard = () => {
        navigate("/app/product-charts");
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 100,
                tolerance: 5,
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            setTable((prev) => {
                const newTable = JSON.parse(JSON.stringify(prev));
                const oldIndex = newTable.rows.findIndex(row => row.id === active.id);
                const newIndex = newTable.rows.findIndex(row => row.id === over.id);
                newTable.rows = arrayMove(newTable.rows, oldIndex, newIndex);
                setTimeout(() => changedForm(), 0);
                return newTable;
            });
        }
    }

    const handleColumnReorder = (rowId, activeId, overId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            const rowIndex = newTable.rows.findIndex(r => r.id === rowId);
            if (rowIndex > -1) {
                const oldIndex = newTable.rows[rowIndex].columns.findIndex(c => c.id === activeId);
                const newIndex = newTable.rows[rowIndex].columns.findIndex(c => c.id === overId);
                newTable.rows[rowIndex].columns = arrayMove(newTable.rows[rowIndex].columns, oldIndex, newIndex);
            }
            setTimeout(() => changedForm(), 0);
            return newTable;
        });
    }

    const [headerOpen, setHeaderOpen] = useState(false);
    const [headerCollapse, setHeaderCollapse] = useState(false);
    const Column = () => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.header.hidden = !newTable.header.hidden;
            return newTable;
        });
        changedForm();
    }
    const handleHeaderInput = (e) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.header.columns.forEach((column) => {
                if (column.id === e.target.dataset.id) {
                    column.content = e.target.value;
                }
            });
            return newTable;
        });
        changedForm();
    }
    const handleHeaderHideColumn = (columnId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.header.columns.forEach((column) => {
                if (column.id === columnId) {
                    column.hidden = !column.hidden;
                }
            });
            return newTable;
        });
        changedForm();
    }
    const handleHeaderDelete = (columnId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.header.columns = newTable.header.columns.filter((column) => column.id !== columnId);
            return newTable;
        });
        changedForm();
    }
    const handleHeaderDuplicate = (columnId) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.header.columns.forEach((column) => {
                if (column.id === columnId) {
                    newTable.header.columns.push({
                        ...column,
                        id: `column_${Date.now()}`
                    });
                }
            });
            return newTable;
        });
        changedForm();
    }
    const handleHeaderAddColumn = () => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.header.columns.push({
                id: `column_${Date.now()}`,
                content: "",
                hidden: false
            });
            return newTable;
        });
        changedForm();
    }

    const handleSelectProducts = async () => {
        const selected = await shopify.resourcePicker({
            type: 'product',
            multiple: true,
            selectionIds: [
                ...table.assignId.map((id) => {
                    return {
                        id: id
                    }
                })
            ],
        });
        if (selected) {
            setTable((prev) => {
                const newTable = JSON.parse(JSON.stringify(prev));
                newTable.assignId = selected.map((product) => product.id);
                return newTable;
            });
            changedForm();
        }
    };

    const handleNameChange = (e) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.name = e.target.value;
            return newTable;
        });
        changedForm();
    }
    const handleTitleChange = (e) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.title = e.target.value;
            return newTable;
        });
        changedForm();
    }
    const handleRowCountChange = (e) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rowCount = e.target.checked;
            return newTable;
        });
        changedForm();
    }
    const handleRowCountTextChange = (e) => {
        setTable((prev) => {
            const newTable = JSON.parse(JSON.stringify(prev));
            newTable.rowCountText = e.target.value;
            return newTable;
        });
        changedForm();
    }

    return (
        <>
            {/* <s-app-window id="app-window" src="/app/product-charts/create"></s-app-window> */}
            <div style={{ background: "#fff" }}>
                <s-grid gridTemplateColumns="350px 1fr">
                    {/* left side start */}
                    <s-grid-item border="base" borderColor="base" borderWidth="none base none none">
                        {/* tab buttons start */}
                        <div style={{ display: "flex", justifyContent: "space-evenly", gap: "10px", padding: "10px" }}>
                            <s-clickable onClick={() => setTab("design")} maxInlineSize="120px" borderRadius="base" background={tab === "design" ? "strong" : ""}>
                                <div style={{ padding: "5px 15px", textAlign: "center" }}>
                                    Design
                                </div>
                            </s-clickable>
                            <s-clickable onClick={() => setTab("settings")} maxInlineSize="120px" borderRadius="base" background={tab === "settings" ? "strong" : ""}>
                                <div style={{ padding: "5px 15px", textAlign: "center" }}>
                                    Settings
                                </div>
                            </s-clickable>
                        </div>
                        {/* tab buttons end */}
                        <s-divider color="strong" />
                        {/* Designs start */}
                        {tab === "design" && (
                            <div style={{ minHeight: "calc(100vh - 51px)", maxHeight: "calc(100vh - 51px)", overflowY: "scroll", overflowX: "hidden" }}>
                                <>
                                    {/* design header start */}
                                    <s-stack padding="small base">
                                        <s-clickable onClick={() => setHeaderOpen(!headerOpen)} borderRadius="base" background="strong" padding="small base">
                                            <s-stack direction="inline" gap="small">
                                                <s-icon type={headerOpen ? "arrow-left" : "layout-header"} />
                                                <s-text>{headerOpen ? "Back" : "Header"}</s-text>
                                            </s-stack>
                                        </s-clickable>
                                    </s-stack>
                                    <s-divider />
                                    {/* design header end */}
                                </>

                                {headerOpen ?
                                    <>
                                        {/* design header start */}
                                        <s-stack padding="small base" gap="small">
                                            {/* row start */}
                                            <s-stack>
                                                <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 30px", background: "#F3F3F3", borderRadius: "7px", overflow: "hidden" }}>
                                                    <div>
                                                        <s-clickable onClick={() => setHeaderCollapse(!headerCollapse)} background="strong">
                                                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40px", width: "30px" }}>
                                                                <s-icon type={headerCollapse ? "chevron-right" : "chevron-down"} />
                                                            </div>
                                                        </s-clickable>
                                                    </div>
                                                    <div style={{ display: "flex", height: "40px", alignItems: "center", paddingLeft: "4px" }}>
                                                        <s-text>Header</s-text>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                                        <s-clickable onClick={() => Column()} background="strong">
                                                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40px", width: "30px" }}><s-icon type="hide" /></div>
                                                        </s-clickable>
                                                    </div>
                                                </div>
                                                {/* columns start */}
                                                {!headerCollapse && (
                                                    <div style={{ position: "relative" }}>
                                                        <div style={{ position: "absolute", top: "5px", left: "15px", height: "calc(100% - 10px)", borderLeft: "0.04125rem dashed #d8d8d8" }}></div>

                                                        <div style={{ width: "calc(100% - 30px)", marginLeft: "30px", display: "grid", gap: "10px", padding: "10px 0" }}>
                                                            {table?.header?.columns?.length > 0 && (
                                                                table?.header?.columns?.map((column, index) => (
                                                                    <>
                                                                        {/* column start */}
                                                                        <s-stack>
                                                                            <div key={column.id} style={{ position: "relative", display: "flex", border: "1px solid #d8d8d8", borderRadius: "5px", overflow: "hidden" }}>
                                                                                <input data-id={column.id} onInput={handleHeaderInput} defaultValue={column?.content} type="text" style={{ width: "100%", padding: "0 10px", outline: "none", border: "none" }} />
                                                                                <div style={{ display: "flex", justifyContent: "flex-end", borderLeft: "1px solid #d8d8d8" }}>
                                                                                    <s-clickable onClick={() => handleHeaderHideColumn(column.id)} background="strong">
                                                                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30px", width: "25px" }}><div style={{ transform: "scale(0.8)" }}><s-icon type="hide" /></div></div>
                                                                                    </s-clickable>
                                                                                    <s-clickable onClick={() => handleHeaderDelete(column.id)} background="strong">
                                                                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30px", width: "25px" }}><div style={{ transform: "scale(0.8)" }}><s-icon type="delete" /></div></div>
                                                                                    </s-clickable>
                                                                                    <s-clickable onClick={() => handleHeaderDuplicate(column.id)} background="strong">
                                                                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30px", width: "25px" }}><div style={{ transform: "scale(0.8)" }}><s-icon type="duplicate" /></div></div>
                                                                                    </s-clickable>
                                                                                </div>
                                                                            </div>
                                                                        </s-stack>
                                                                        {/* column end */}
                                                                    </>
                                                                ))
                                                            )}
                                                            {/* column add button start */}
                                                            <s-stack>
                                                                <div className="custom__adding_button" style={{ position: "relative", zIndex: 2 }}>
                                                                    <div onClick={() => handleHeaderAddColumn()} className="custom__adding_button__line" style={{ position: "absolute", cursor: "pointer", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: -1, height: "2px", width: "100%" }}></div>
                                                                    <div onClick={() => handleHeaderAddColumn()} className="custom__adding_button__text" style={{ color: "#0094D5", display: "flex", cursor: "pointer", width: "fit-content", padding: "0 10px 0 7px", flexWrap: "nowrap", alignItems: "center", margin: "0 auto", zIndex: 2, background: "#fff" }}>
                                                                        <s-icon tone="info" type="plus-circle" />
                                                                        Add Column
                                                                    </div>
                                                                </div>
                                                            </s-stack>
                                                            {/* column add button end */}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* columns end */}
                                            </s-stack>
                                            {/* row end */}
                                            <style>
                                                {`
                                                        .custom__adding_button .custom__adding_button__line {
                                                            background: #d8d8d8 !important;
                                                        }
                                                        .custom__adding_button .custom__adding_button__line::after {
                                                            position: absolute;
                                                            content: "";
                                                            top: 0;
                                                            left: 0;
                                                            width: 100%;
                                                            height: 100%;
                                                            background: #0094D5 !important;
                                                            transition: 0.2s ease-in-out;
                                                            transform: scaleX(0);
                                                            transform-origin: center;
                                                        }
                                                        .custom__adding_button:hover .custom__adding_button__line::after {
                                                            transform: scaleX(1);
                                                        }
                                                    `}
                                            </style>
                                        </s-stack>
                                        {/* design header end */}
                                    </>
                                    :
                                    <>
                                        {/* design body start */}
                                        <s-stack padding="small base" gap="small">
                                            {/* i've installed the dnd-kit. now I need to implement the sortable for the rows. implement it */}
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleDragEnd}
                                                modifiers={[restrictToVerticalAxis]}
                                            >
                                                <SortableContext
                                                    items={table?.rows?.map(r => r.id) || []}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {table?.rows?.length > 0 && (
                                                        table?.rows?.map((row, index) => (
                                                            <SortableRowItem
                                                                key={row.id}
                                                                row={row}
                                                                rowCollapse={rowCollapse}
                                                                setRowCollapse={setRowCollapse}
                                                                handleRowHide={handleRowHide}
                                                                handleRowDelete={handleRowDelete}
                                                                handleRowDuplicate={handleRowDuplicate}
                                                                handleInput={handleInput}
                                                                handleHide={handleHide}
                                                                handleDelete={handleDelete}
                                                                handleDuplicate={handleDuplicate}
                                                                handleAddColumn={handleAddColumn}
                                                                sensors={sensors}
                                                                handleColumnReorder={handleColumnReorder}
                                                            />
                                                        ))
                                                    )}
                                                </SortableContext>
                                            </DndContext>
                                            {/* row add button start */}
                                            <s-stack>
                                                <div className="custom__adding_button" style={{ position: "relative", zIndex: 2 }}>
                                                    <div onClick={() => handleAddRow()} className="custom__adding_button__line" style={{ position: "absolute", cursor: "pointer", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: -1, height: "2px", width: "100%" }}></div>
                                                    <div onClick={() => handleAddRow()} className="custom__adding_button__text" style={{ color: "#0094D5", display: "flex", cursor: "pointer", width: "fit-content", padding: "0 10px 0 7px", flexWrap: "nowrap", alignItems: "center", margin: "0 auto", zIndex: 2, background: "#fff" }}>
                                                        <s-icon tone="info" type="plus-circle" />
                                                        Add Row
                                                    </div>
                                                </div>
                                            </s-stack>
                                            {/* row add button end */}
                                            <style>
                                                {`
                                                        .custom__adding_button .custom__adding_button__line {
                                                            background: #d8d8d8 !important;
                                                        }
                                                        .custom__adding_button .custom__adding_button__line::after {
                                                            position: absolute;
                                                            content: "";
                                                            top: 0;
                                                            left: 0;
                                                            width: 100%;
                                                            height: 100%;
                                                            background: #0094D5 !important;
                                                            transition: 0.2s ease-in-out;
                                                            transform: scaleX(0);
                                                            transform-origin: center;
                                                        }
                                                        .custom__adding_button:hover .custom__adding_button__line::after {
                                                            transform: scaleX(1);
                                                        }
                                                    `}
                                            </style>
                                        </s-stack>
                                        {/* design body end */}
                                    </>
                                }

                            </div>
                        )}
                        {/* Designs end */}
                        {/* Settings start */}
                        {tab === "settings" && (
                            <div style={{ minHeight: "calc(100vh - 51px)" }}>
                                <s-stack padding="small base" gap="base">
                                    <s-select label="Choose chart type">
                                        <s-option value="product" selected>Product</s-option>
                                        <s-option value="collection" disabled>Collection</s-option>
                                        <s-option value="global" disabled>Global</s-option>
                                    </s-select>
                                    <s-clickable onClick={handleSelectProducts} background="strong" borderRadius="base" border="base">
                                        <div style={{ padding: "10px", textAlign: "center" }}>
                                            {table?.assignId?.length > 0 ? "Update products" : "Select products"}
                                        </div>
                                    </s-clickable>
                                    {table?.assignId?.length > 0 && (
                                        <s-paragraph>Selected products: {table?.assignId?.length}</s-paragraph>
                                    )}
                                </s-stack>
                                <s-divider />
                                <s-stack padding="small base" gap="base">
                                    <s-text-field onInput={handleNameChange} label="Chart name" value={table?.name} />
                                    <s-text-field onInput={handleTitleChange} label="Chart title" value={table?.title} />
                                </s-stack>
                                <s-divider />
                                <s-stack padding="small base" gap="base">
                                    <s-checkbox onInput={handleRowCountChange} label="Show row count" checked={table?.rowCount} />
                                    <s-text-field onInput={handleRowCountTextChange} label="Row count text" value={table?.rowCountText} />
                                </s-stack>
                            </div>
                        )}
                        {/* Settings end */}
                    </s-grid-item>
                    {/* left side end */}

                    {/* right side start */}
                    <s-grid-item>
                        {/* tab buttons start */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "11px" }}>
                            <div style={{ display: "flex", flexWrap: "nowrap", justifyContent: "flex-end" }}>
                                <s-button-group gap="none">
                                    <s-button slot="secondary-actions">Desktop</s-button>
                                    <s-button slot="secondary-actions">Mobile</s-button>
                                </s-button-group>
                            </div>
                            <div style={{ display: "flex", flexWrap: "nowrap", justifyContent: "flex-end" }}>
                                {unsavedChanges ? (
                                    <s-button-group>
                                        <s-button slot="primary-action" onClick={handleSave}>Save</s-button>
                                        <s-button slot="secondary-actions" onClick={handleDiscard}>Discard</s-button>
                                    </s-button-group>
                                ) : (
                                    <s-box paddingInlineEnd="base">
                                        <s-button onClick={() => navigate("/app/product-charts")} variant="tertiary" icon="x" />
                                    </s-box>
                                )}
                            </div>
                        </div>
                        {/* tab buttons end */}
                        <s-divider color="strong" />
                        <s-stack>
                            <div id="preview">
                                <div class="compatibility_chart">
                                    <div class="chart_header">
                                        {table?.title !== "" && <h5>{table?.title}</h5>}
                                        {table?.rowCountText !== "" && <p>{table?.rowCount ? <span id="row_quantity">{table?.rows?.filter((row) => !row?.hidden)?.length}</span> : ""} {table?.rowCountText}</p>}
                                    </div>
                                    <table>
                                        {!table?.header?.hidden && (
                                            <thead>
                                                <tr>
                                                    <th>NO</th>
                                                    {table?.header?.columns?.map((column) => (
                                                        !column?.hidden && (
                                                            <th key={column.id}>{column.content}</th>
                                                        )
                                                    ))}
                                                </tr>
                                            </thead>
                                        )}
                                        <tbody>
                                            {table?.rows?.filter((row) => !row?.hidden)?.map((row, index) => (
                                                <tr key={row.id}>
                                                    <td>{index + 1}</td>
                                                    {row?.columns?.map((column, index) => (
                                                        !column?.hidden && (
                                                            <td key={column.id}>{column.content}</td>
                                                        )
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <style>
                                {`  
                                        #preview *, #preview :before, #preview :after {
                                            box-sizing: border-box;
                                            border-width: 0;
                                            border-style: solid;
                                            -webkit-tap-highlight-color: rgba(0,0,0,0);
                                            margin: 0;
                                            padding: 0;
                                        }
                                        #preview{
                                            width: 100%;
                                            min-height: calc(100vh - 150px);
                                            max-height: calc(100vh - 150px);
                                            display: flex;
                                            justify-content: center;
                                            padding-top: 49px;
                                            padding-bottom: 50px;
                                        }
                                        .compatibility_chart{
                                            max-width: 1200px;
                                            width: 100%;
                                            background: #F7F7F7;
                                            height: fit-content;
                                            display: flex;
                                            flex-direction: column;
                                            gap: 15px;
                                            padding: 25px !important;
                                        }
                                        .compatibility_chart .chart_header{
                                            display: flex;
                                            justify-content: space-between;
                                            align-items: center;
                                        }
                                        .compatibility_chart .chart_header h5{
                                            font-size: 22px;
                                            font-weight: 600;
                                            color: #B80000;
                                        }
                                        .compatibility_chart .chart_header p{
                                            font-size: 16px;
                                            font-weight: 500;
                                            color: #000000;
                                        }
                                        .compatibility_chart table{
                                            width: 100%;
                                            border-collapse: collapse;
                                        }
                                        .compatibility_chart table thead{
                                            background: #B80000;
                                        }
                                        .compatibility_chart table thead tr th{
                                            padding: 15px;
                                            font-size: 16px;
                                            font-weight: 600;
                                            color: #FFFFFF;
                                            padding: 10px 0 !important;
                                        }
                                        .compatibility_chart table tbody tr td{
                                            padding: 10px !important;
                                            font-size: 16px;
                                            font-weight: 500;
                                        }
                                        .compatibility_chart table th, .compatibility_chart table td {
                                            padding: 6px 10px !important;
                                            border: 1px solid #ddd !important;
                                        }
                                        .compatibility_chart table tbody tr td:first-child {
                                            text-align: center;
                                        }
                                    `}
                            </style>
                        </s-stack>
                    </s-grid-item>
                    {/* right side end */}
                </s-grid>
            </div>
        </>
    );
}