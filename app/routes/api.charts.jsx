import { renderToStaticMarkup } from "react-dom/server";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "react-router";
import prisma from "../db.server";

export const loader = async ({ request }) => {
    await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const shopId = "gid://shopify/Shop/" + url.searchParams.get("shopId");
    const productId = "gid://shopify/Product/" + url.searchParams.get("productId");

    const chartAssignment = await prisma.chartAssignment.findFirst({
        where: {
            targetId: productId
        }
    });

    const chartData = await prisma.chart.findFirst({
        where: {
            shop: shopId,
            id: chartAssignment.chartId
        }
    });

    const tableData = JSON.parse(chartData.tableData);
    const html = renderToStaticMarkup(
        <>
            <div class="compatibility_chart">
                <div class="chart_header">
                    {tableData?.title !== "" && <h5>{tableData?.title}</h5>}
                    {tableData?.rowCountText !== "" && <p>{tableData?.rowCount ? <span id="row_quantity">{tableData?.rows?.filter((row) => !row?.hidden)?.length}</span> : ""} {tableData?.rowCountText}</p>}
                </div>
                <table>
                    {!tableData?.header?.hidden && (
                        <thead>
                            <tr>
                                <th>NO</th>
                                {tableData?.header?.columns?.map((column) => (
                                    !column?.hidden && (
                                        <th key={column.id}>{column.content}</th>
                                    )
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {tableData?.rows?.filter((row) => !row?.hidden)?.map((row, index) => (
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
        </>
    );

    return new Response(html, {
        status: 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
        },
    });
};