export default function TableHeaderColumn({ children }) {
    return (
        <s-table-header>
            <div style={{ padding: "6px 0" }}>
                {children}
            </div>
        </s-table-header>
    )
}