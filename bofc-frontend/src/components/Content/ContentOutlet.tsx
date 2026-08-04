import { Outlet } from "react-router-dom";

export default function ContentOutlet() {
    return (
        <div style={{ padding: "8px 8px 8px" }}>
            <Outlet />
        </div>
    );
}
